from __future__ import annotations

from collections.abc import Sequence
from enum import StrEnum
from uuid import UUID

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import Select, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.eot.auth import AuthenticatedOperatorContext, get_authenticated_operator_context
from app.db.session import get_db_session
from app.models.case import Case
from app.models.tenant_membership import TenantMembership, TenantMembershipStatus
from app.models.user_profile import UserProfile


class OperatorRole(StrEnum):
    OPERATOR = "operator"
    MANAGER = "manager"
    ADMIN = "admin"


class Permission(StrEnum):
    VIEW_CASE = "case:view"
    CREATE_CASE = "case:create"
    EDIT_CASE = "case:edit"
    MANAGE_EVIDENCE = "evidence:manage"
    MANAGE_ISSUES = "issues:manage"
    MANAGE_RECOMMENDATIONS = "recommendations:manage"
    GENERATE_CLAIM_OUTPUT = "claim:generate"
    REASSIGN_CASE = "case:reassign"
    VIEW_REPORTING = "reporting:view"
    MANAGE_SETTINGS = "settings:manage"
    MANAGE_USERS = "users:manage"


ROLE_ALIASES = {
    "operator": OperatorRole.OPERATOR,
    "agent": OperatorRole.OPERATOR,
    "caseworker": OperatorRole.OPERATOR,
    "manager": OperatorRole.MANAGER,
    "property_manager": OperatorRole.MANAGER,
    "case_manager": OperatorRole.MANAGER,
    "admin": OperatorRole.ADMIN,
    "administrator": OperatorRole.ADMIN,
    "owner": OperatorRole.ADMIN,
    "super_admin": OperatorRole.ADMIN,
}

ROLE_PRIORITY: dict[OperatorRole, int] = {
    OperatorRole.OPERATOR: 1,
    OperatorRole.MANAGER: 2,
    OperatorRole.ADMIN: 3,
}

PERMISSION_MINIMUM_ROLE: dict[Permission, OperatorRole] = {
    Permission.VIEW_CASE: OperatorRole.OPERATOR,
    Permission.CREATE_CASE: OperatorRole.OPERATOR,
    Permission.EDIT_CASE: OperatorRole.OPERATOR,
    Permission.MANAGE_EVIDENCE: OperatorRole.OPERATOR,
    Permission.MANAGE_ISSUES: OperatorRole.OPERATOR,
    Permission.MANAGE_RECOMMENDATIONS: OperatorRole.OPERATOR,
    Permission.GENERATE_CLAIM_OUTPUT: OperatorRole.OPERATOR,
    Permission.REASSIGN_CASE: OperatorRole.MANAGER,
    Permission.VIEW_REPORTING: OperatorRole.MANAGER,
    Permission.MANAGE_SETTINGS: OperatorRole.ADMIN,
    Permission.MANAGE_USERS: OperatorRole.ADMIN,
}


class AuthorizedOperatorContext(BaseModel):
    user_id: UUID
    tenant_id: UUID
    membership_id: UUID
    membership_status: TenantMembershipStatus
    role: OperatorRole
    profile_id: UUID | None = None


class AuthorizationError(PermissionError):
    pass


def normalize_operator_role(value: str | None) -> OperatorRole | None:
    if value is None:
        return None

    normalized = value.strip().lower()
    if not normalized:
        return None

    return ROLE_ALIASES.get(normalized)


def has_role(current_role: OperatorRole, minimum_role: OperatorRole) -> bool:
    return ROLE_PRIORITY[current_role] >= ROLE_PRIORITY[minimum_role]


def has_permission(current_role: OperatorRole, permission: Permission) -> bool:
    return has_role(current_role, PERMISSION_MINIMUM_ROLE[permission])


def _select_active_membership(
    memberships: Sequence[TenantMembership],
    *,
    expected_membership_id: UUID | None,
) -> tuple[TenantMembership, OperatorRole]:
    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated operator is not a member of the tenant.",
        )

    active_memberships = [
        membership
        for membership in memberships
        if membership.deleted_at is None and membership.status == TenantMembershipStatus.ACTIVE
    ]

    if len(active_memberships) != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated operator does not have exactly one active tenant membership.",
        )

    membership = active_memberships[0]

    if expected_membership_id is not None and membership.id != expected_membership_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated operator membership does not match the selected tenant context.",
        )

    role = normalize_operator_role(membership.role.value if isinstance(membership.role, StrEnum) else str(membership.role))

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated operator membership has an unknown role.",
        )

    return membership, role


async def _get_memberships_for_user(
    session: AsyncSession,
    *,
    tenant_id: UUID,
    user_id: UUID,
) -> list[TenantMembership]:
    return list(
        await session.scalars(
            select(TenantMembership)
            .where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.user_id == user_id,
                TenantMembership.deleted_at.is_(None),
            )
            .order_by(TenantMembership.created_at.desc())
        )
    )


async def get_operator_membership_context(
    trusted_context: AuthenticatedOperatorContext,
    session: AsyncSession,
) -> AuthorizedOperatorContext:
    memberships = await _get_memberships_for_user(
        session,
        tenant_id=trusted_context.tenant_id,
        user_id=trusted_context.user_id,
    )
    membership, role = _select_active_membership(
        memberships,
        expected_membership_id=trusted_context.membership_id,
    )

    profile = await session.scalar(
        select(UserProfile).where(
            UserProfile.auth_user_id == trusted_context.user_id,
            UserProfile.deleted_at.is_(None),
        )
    )

    if profile is not None and profile.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator access is disabled for this account.",
        )

    return AuthorizedOperatorContext(
        user_id=trusted_context.user_id,
        tenant_id=trusted_context.tenant_id,
        membership_id=membership.id,
        membership_status=membership.status,
        role=role,
        profile_id=profile.id if profile is not None else None,
    )


async def get_authorized_operator_context(
    trusted_context: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> AuthorizedOperatorContext:
    return await get_operator_membership_context(trusted_context, session)


async def require_active_tenant_membership(
    trusted_context: AuthenticatedOperatorContext = Depends(get_authenticated_operator_context),
    session: AsyncSession = Depends(get_db_session),
) -> AuthorizedOperatorContext:
    return await get_operator_membership_context(trusted_context, session)


def require_permission(context: AuthorizedOperatorContext, permission: Permission) -> None:
    if not has_permission(context.role, permission):
        raise AuthorizationError("Operator is not authorized for this action.")


def require_membership_permission(
    context: AuthorizedOperatorContext, permission: Permission
) -> None:
    require_permission(context, permission)


def can_access_case(context: AuthorizedOperatorContext, assigned_to: UUID | None) -> bool:
    if context.role in {OperatorRole.MANAGER, OperatorRole.ADMIN}:
        return True

    return assigned_to is None or assigned_to == context.user_id


def require_case_access(context: AuthorizedOperatorContext, assigned_to: UUID | None) -> None:
    if not can_access_case(context, assigned_to):
        raise AuthorizationError("Operator is not authorized to access this case.")


def apply_case_visibility(stmt: Select, context: AuthorizedOperatorContext) -> Select:
    if context.role in {OperatorRole.MANAGER, OperatorRole.ADMIN}:
        return stmt

    return stmt.where(or_(Case.assigned_to == context.user_id, Case.assigned_to.is_(None)))
