from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.associations import issue_evidence_links
from app.models.base import TenantScopedModel

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.evidence import Evidence
    from app.models.recommendation import Recommendation


class IssueSeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class IssueStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"
    DISPUTED = "disputed"


class Issue(TenantScopedModel, Base):
    __tablename__ = "issues"
    __table_args__ = (
        Index("ix_issues_case_status", "case_id", "status"),
        Index("ix_issues_tenant_severity", "tenant_id", "severity"),
    )

    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[IssueSeverity] = mapped_column(
        Enum(
            IssueSeverity,
            name="issue_severity",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
        default=IssueSeverity.MEDIUM,
    )
    status: Mapped[IssueStatus] = mapped_column(
        Enum(
            IssueStatus,
            name="issue_status",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
        default=IssueStatus.OPEN,
    )

    case: Mapped["Case"] = relationship(back_populates="issues")
    evidence_items: Mapped[list["Evidence"]] = relationship(
        back_populates="issues",
        secondary=issue_evidence_links,
    )
    recommendation: Mapped["Recommendation | None"] = relationship(
        back_populates="issue",
        uselist=False,
        cascade="all, delete-orphan",
    )
