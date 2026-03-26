from __future__ import annotations

from uuid import UUID

from sqlalchemy import Boolean, Index, Text, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import BaseModel


class UserProfile(BaseModel, Base):
    __tablename__ = "users_profiles"
    __table_args__ = (
        Index(
            "uq_users_profiles_auth_user_id_active",
            "auth_user_id",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
    )

    auth_user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    role: Mapped[str | None] = mapped_column(Text, nullable=True)
