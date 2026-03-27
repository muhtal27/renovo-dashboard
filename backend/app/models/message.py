from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TenantScopedModel
from app.models.enum_values import enum_values

if TYPE_CHECKING:
    from app.models.case import Case


class MessageSenderType(StrEnum):
    MANAGER = "manager"
    LANDLORD = "landlord"
    TENANT = "tenant"


class Message(TenantScopedModel, Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_case_created_at", "case_id", "created_at"),
    )

    case_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_type: Mapped[MessageSenderType] = mapped_column(
        Enum(
            MessageSenderType,
            name="message_sender_type",
            values_callable=enum_values,
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        nullable=False,
    )
    sender_id: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)

    case: Mapped["Case"] = relationship(back_populates="messages")
