from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.associations import issue_evidence_links
from app.models.base import TenantScopedModel

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.issue import Issue


class EvidenceType(StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"


class Evidence(TenantScopedModel, Base):
    __tablename__ = "evidence"
    __table_args__ = (
        Index("ix_evidence_case_created_at", "case_id", "created_at"),
        Index("ix_evidence_tenant_area", "tenant_id", "area"),
    )

    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[EvidenceType] = mapped_column(
        Enum(
            EvidenceType,
            name="evidence_type",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
    )
    area: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    case: Mapped["Case"] = relationship(back_populates="evidence")
    issues: Mapped[list["Issue"]] = relationship(
        back_populates="evidence_items",
        secondary=issue_evidence_links,
    )
