from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum, Index, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TenantScopedModel

if TYPE_CHECKING:
    from app.models.tenant import Tenant


class TenantMembershipRole(StrEnum):
    OPERATOR = "operator"
    MANAGER = "manager"
    ADMIN = "admin"


class TenantMembershipStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class TenantMembership(TenantScopedModel, Base):
    __tablename__ = "tenant_memberships"
    __table_args__ = (
        Index(
            "uq_tenant_memberships_tenant_user_active",
            "tenant_id",
            "user_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL AND status = 'active'"),
        ),
        Index("ix_tenant_memberships_user_status", "user_id", "status"),
        Index("ix_tenant_memberships_tenant_status_role", "tenant_id", "status", "role"),
    )

    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    role: Mapped[TenantMembershipRole] = mapped_column(
        Enum(
            TenantMembershipRole,
            name="tenant_membership_role",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
    )
    status: Mapped[TenantMembershipStatus] = mapped_column(
        Enum(
            TenantMembershipStatus,
            name="tenant_membership_status",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
        default=TenantMembershipStatus.ACTIVE,
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="memberships")
