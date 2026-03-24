from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant
from app.repositories.base import Repository


class TenantRepository(Repository[Tenant]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session=session, model_type=Tenant)
