from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TenantScopedModel

if TYPE_CHECKING:
    from app.models.case import Case


class Claim(TenantScopedModel, Base):
    __tablename__ = "claims"
    __table_args__ = (
        Index(
            "uq_claims_case_active",
            "case_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    breakdown: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    case: Mapped["Case"] = relationship(back_populates="claim")
