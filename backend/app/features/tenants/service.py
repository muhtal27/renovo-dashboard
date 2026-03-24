from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant
from app.repositories.tenant import TenantRepository


class TenantService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = TenantRepository(session)

    async def create_tenant(self, *, name: str, slug: str) -> Tenant:
        tenant = Tenant(name=name, slug=slug)
        await self.repository.add(tenant)
        await self.session.commit()
        await self.session.refresh(tenant)
        return tenant

    async def list_tenants(self) -> list[Tenant]:
        return await self.repository.list()
