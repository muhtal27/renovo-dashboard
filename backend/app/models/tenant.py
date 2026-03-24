from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Index, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.inspection import Inspection
    from app.models.property import Property


class Tenant(BaseModel, Base):
    __tablename__ = "tenants"
    __table_args__ = (
        Index(
            "uq_tenants_slug_active",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False)

    properties: Mapped[list["Property"]] = relationship(
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    inspections: Mapped[list["Inspection"]] = relationship(
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
