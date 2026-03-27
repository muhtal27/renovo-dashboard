from __future__ import annotations

from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index, Numeric, Text, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TenantScopedModel
from app.models.enum_values import enum_values

if TYPE_CHECKING:
    from app.models.issue import Issue


class RecommendationDecision(StrEnum):
    CHARGE = "charge"
    NO_CHARGE = "no_charge"
    PARTIAL = "partial"


class Recommendation(TenantScopedModel, Base):
    __tablename__ = "recommendations"
    __table_args__ = (
        Index(
            "uq_recommendations_issue_active",
            "issue_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    issue_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision: Mapped[RecommendationDecision | None] = mapped_column(
        Enum(
            RecommendationDecision,
            name="recommendation_decision",
            values_callable=enum_values,
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=True,
    )
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    issue: Mapped["Issue"] = relationship(back_populates="recommendation")
