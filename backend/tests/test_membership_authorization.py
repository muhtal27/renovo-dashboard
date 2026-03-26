from types import SimpleNamespace
from uuid import uuid4
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.api.eot.auth import AuthenticatedOperatorContext
from app.api.eot.authorization import (
    AuthorizedOperatorContext,
    OperatorRole,
    get_operator_membership_context,
)
from app.models.tenant_membership import (
    TenantMembership,
    TenantMembershipRole,
    TenantMembershipStatus,
)
from app.models.user_profile import UserProfile
from app.services.eot import EOTService


class FakeSession:
    def __init__(self, memberships: list[TenantMembership], profile: UserProfile | None = None):
        self._memberships = memberships
        self._profile = profile

    async def scalars(self, _stmt):
        return self._memberships

    async def scalar(self, _stmt):
        return self._profile


def build_membership(
    *,
    tenant_id,
    user_id,
    role: TenantMembershipRole = TenantMembershipRole.OPERATOR,
    status: TenantMembershipStatus = TenantMembershipStatus.ACTIVE,
):
    return TenantMembership(
        id=uuid4(),
        tenant_id=tenant_id,
        user_id=user_id,
        role=role,
        status=status,
    )


@pytest.mark.asyncio
async def test_membership_role_is_canonical_over_profile_role() -> None:
    tenant_id = uuid4()
    user_id = uuid4()
    membership = build_membership(
        tenant_id=tenant_id,
        user_id=user_id,
        role=TenantMembershipRole.OPERATOR,
    )
    profile = UserProfile(
        id=uuid4(),
        auth_user_id=user_id,
        is_active=True,
        role="admin",
    )
    context = await get_operator_membership_context(
        AuthenticatedOperatorContext(user_id=user_id, tenant_id=tenant_id),
        FakeSession([membership], profile),
    )

    assert context.role == OperatorRole.OPERATOR
    assert context.membership_id == membership.id
    assert context.membership_status == TenantMembershipStatus.ACTIVE


@pytest.mark.asyncio
async def test_missing_membership_fails_closed() -> None:
    tenant_id = uuid4()
    user_id = uuid4()

    with pytest.raises(HTTPException) as exc_info:
        await get_operator_membership_context(
            AuthenticatedOperatorContext(user_id=user_id, tenant_id=tenant_id),
            FakeSession([]),
        )

    assert exc_info.value.status_code == 403
    assert "not a member" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_inactive_membership_is_denied() -> None:
    tenant_id = uuid4()
    user_id = uuid4()
    membership = build_membership(
        tenant_id=tenant_id,
        user_id=user_id,
        status=TenantMembershipStatus.INACTIVE,
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_operator_membership_context(
            AuthenticatedOperatorContext(user_id=user_id, tenant_id=tenant_id),
            FakeSession([membership]),
        )

    assert exc_info.value.status_code == 403
    assert "active tenant membership" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_selected_membership_mismatch_is_denied() -> None:
    tenant_id = uuid4()
    user_id = uuid4()
    membership = build_membership(
        tenant_id=tenant_id,
        user_id=user_id,
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_operator_membership_context(
            AuthenticatedOperatorContext(
                user_id=user_id,
                tenant_id=tenant_id,
                membership_id=uuid4(),
            ),
            FakeSession([membership]),
        )

    assert exc_info.value.status_code == 403
    assert "does not match" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_profile_can_disable_access_even_with_active_membership() -> None:
    tenant_id = uuid4()
    user_id = uuid4()
    membership = build_membership(tenant_id=tenant_id, user_id=user_id)
    profile = UserProfile(
        id=uuid4(),
        auth_user_id=user_id,
        is_active=False,
        role="operator",
    )

    with pytest.raises(HTTPException) as exc_info:
        await get_operator_membership_context(
            AuthenticatedOperatorContext(user_id=user_id, tenant_id=tenant_id),
            FakeSession([membership], profile),
        )

    assert exc_info.value.status_code == 403
    assert "disabled" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_operator_cannot_assign_arbitrary_uuid() -> None:
    operator_user_id = uuid4()
    service = EOTService(SimpleNamespace())
    context = AuthorizedOperatorContext(
        user_id=operator_user_id,
        tenant_id=uuid4(),
        membership_id=uuid4(),
        membership_status=TenantMembershipStatus.ACTIVE,
        role=OperatorRole.OPERATOR,
    )

    with pytest.raises(PermissionError):
        await service._resolve_case_assignee(context, uuid4())


@pytest.mark.asyncio
async def test_manager_assignment_requires_active_same_tenant_membership() -> None:
    manager_context = AuthorizedOperatorContext(
        user_id=uuid4(),
        tenant_id=uuid4(),
        membership_id=uuid4(),
        membership_status=TenantMembershipStatus.ACTIVE,
        role=OperatorRole.MANAGER,
    )
    session = SimpleNamespace(
        scalar=AsyncMock(return_value=None),
    )
    service = EOTService(session)

    with pytest.raises(ValueError) as exc_info:
        await service._resolve_case_assignee(manager_context, uuid4())

    assert "active member of the same tenant" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_manager_can_assign_to_active_same_tenant_member() -> None:
    tenant_id = uuid4()
    assignee_user_id = uuid4()
    manager_context = AuthorizedOperatorContext(
        user_id=uuid4(),
        tenant_id=tenant_id,
        membership_id=uuid4(),
        membership_status=TenantMembershipStatus.ACTIVE,
        role=OperatorRole.MANAGER,
    )
    session = SimpleNamespace(
        scalar=AsyncMock(
            return_value=build_membership(
                tenant_id=tenant_id,
                user_id=assignee_user_id,
                role=TenantMembershipRole.OPERATOR,
            )
        ),
    )
    service = EOTService(session)

    resolved_assignee = await service._resolve_case_assignee(manager_context, assignee_user_id)

    assert resolved_assignee == assignee_user_id
