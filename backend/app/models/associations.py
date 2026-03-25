from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.db.base import Base

issue_evidence_links = Table(
    "issue_evidence_links",
    Base.metadata,
    Column(
        "issue_id",
        PGUUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "evidence_id",
        PGUUID(as_uuid=True),
        ForeignKey("evidence.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
