from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TenantScopedModel

if TYPE_CHECKING:
    from app.models.claim import Claim
    from app.models.document import Document
    from app.models.evidence import Evidence
    from app.models.issue import Issue
    from app.models.message import Message
    from app.models.tenancy import Tenancy
    from app.models.tenant import Tenant


class CaseStatus(StrEnum):
    DRAFT = "draft"
    COLLECTING_EVIDENCE = "collecting_evidence"
    ANALYSIS = "analysis"
    REVIEW = "review"
    READY_FOR_CLAIM = "ready_for_claim"
    SUBMITTED = "submitted"
    DISPUTED = "disputed"
    RESOLVED = "resolved"


class CasePriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Case(TenantScopedModel, Base):
    __tablename__ = "cases"
    __table_args__ = (
        Index("ix_cases_tenant_status_priority", "tenant_id", "status", "priority"),
        Index("ix_cases_tenant_last_activity_at", "tenant_id", "last_activity_at"),
        Index(
            "uq_cases_tenancy_active",
            "tenancy_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    tenancy_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenancies.id", ondelete="RESTRICT"),
        nullable=False,
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CaseStatus] = mapped_column(
        Enum(
            CaseStatus,
            name="case_status",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
        default=CaseStatus.DRAFT,
    )
    assigned_to: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    priority: Mapped[CasePriority] = mapped_column(
        Enum(
            CasePriority,
            name="case_priority",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
        default=CasePriority.MEDIUM,
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="cases")
    tenancy: Mapped["Tenancy"] = relationship(back_populates="case")
    evidence: Mapped[list["Evidence"]] = relationship(
        back_populates="case",
        cascade="all, delete-orphan",
    )
    issues: Mapped[list["Issue"]] = relationship(
        back_populates="case",
        cascade="all, delete-orphan",
    )
    claim: Mapped["Claim | None"] = relationship(
        back_populates="case",
        uselist=False,
        cascade="all, delete-orphan",
    )
    messages: Mapped[list["Message"]] = relationship(
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="Message.created_at.asc()",
    )
    documents: Mapped[list["Document"]] = relationship(
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="Document.created_at.asc()",
    )
