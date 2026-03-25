from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Index, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TenantScopedModel

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.property import Property
    from app.models.tenant import Tenant


class Tenancy(TenantScopedModel, Base):
    __tablename__ = "tenancies"
    __table_args__ = (
        Index("ix_tenancies_tenant_property_created_at", "tenant_id", "property_id", "created_at"),
    )

    property_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="RESTRICT"),
        nullable=False,
    )
    tenant_name: Mapped[str] = mapped_column(Text, nullable=False)
    tenant_email: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deposit_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="tenancies")
    property: Mapped["Property"] = relationship(back_populates="tenancies")
    case: Mapped["Case | None"] = relationship(
        back_populates="tenancy",
        uselist=False,
    )
