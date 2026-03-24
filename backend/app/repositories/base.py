from __future__ import annotations

from datetime import datetime, timezone
from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import BaseModel, TenantScopedModel

ModelT = TypeVar("ModelT", bound=BaseModel)
TenantScopedModelT = TypeVar("TenantScopedModelT", bound=TenantScopedModel)


class Repository(Generic[ModelT]):
    def __init__(self, session: AsyncSession, model_type: type[ModelT]) -> None:
        self.session = session
        self.model_type = model_type

    def _base_select(self, *, include_deleted: bool = False) -> Select[tuple[ModelT]]:
        stmt = select(self.model_type)
        if not include_deleted:
            stmt = stmt.where(self.model_type.deleted_at.is_(None))
        return stmt

    async def get(self, entity_id: UUID, *, include_deleted: bool = False) -> ModelT | None:
        stmt = self._base_select(include_deleted=include_deleted).where(
            self.model_type.id == entity_id
        )
        return await self.session.scalar(stmt)

    async def list(
        self,
        *,
        include_deleted: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ModelT]:
        stmt = self._base_select(include_deleted=include_deleted).limit(limit).offset(offset)
        result = await self.session.scalars(stmt)
        return list(result)

    async def add(self, instance: ModelT) -> ModelT:
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def soft_delete(self, instance: ModelT) -> ModelT:
        instance.deleted_at = datetime.now(timezone.utc)
        await self.session.flush()
        return instance


class TenantScopedRepository(Repository[TenantScopedModelT], Generic[TenantScopedModelT]):
    async def get_for_tenant(
        self,
        tenant_id: UUID,
        entity_id: UUID,
        *,
        include_deleted: bool = False,
    ) -> TenantScopedModelT | None:
        stmt = self._base_select(include_deleted=include_deleted).where(
            self.model_type.tenant_id == tenant_id,
            self.model_type.id == entity_id,
        )
        return await self.session.scalar(stmt)

    async def list_for_tenant(
        self,
        tenant_id: UUID,
        *,
        include_deleted: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> list[TenantScopedModelT]:
        stmt = (
            self._base_select(include_deleted=include_deleted)
            .where(self.model_type.tenant_id == tenant_id)
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.scalars(stmt)
        return list(result)
