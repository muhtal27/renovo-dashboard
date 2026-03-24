from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TenantScopedModel

if TYPE_CHECKING:
    from app.models.inspection import Inspection
    from app.models.tenant import Tenant


class Property(TenantScopedModel, Base):
    __tablename__ = "properties"
    __table_args__ = (
        Index("ix_properties_tenant_created_at", "tenant_id", "created_at"),
        Index(
            "uq_properties_tenant_reference_active",
            "tenant_id",
            "reference",
            unique=True,
            postgresql_where=text("deleted_at IS NULL AND reference IS NOT NULL"),
        ),
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)
    reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    address_line_1: Mapped[str | None] = mapped_column(Text, nullable=True)
    address_line_2: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(Text, nullable=True)
    postcode: Mapped[str | None] = mapped_column(Text, nullable=True)
    country_code: Mapped[str | None] = mapped_column(String(length=2), nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="properties")
    inspections: Mapped[list["Inspection"]] = relationship(
        back_populates="property",
        cascade="all, delete-orphan",
    )
