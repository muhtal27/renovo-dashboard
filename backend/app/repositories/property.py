from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property
from app.repositories.base import TenantScopedRepository


class PropertyRepository(TenantScopedRepository[Property]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session=session, model_type=Property)
