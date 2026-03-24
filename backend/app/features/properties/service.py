from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property
from app.repositories.property import PropertyRepository
from app.repositories.tenant import TenantRepository


class PropertyService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = PropertyRepository(session)
        self.tenant_repository = TenantRepository(session)

    async def create_property(
        self,
        *,
        tenant_id: UUID,
        name: str,
        reference: str | None = None,
        address_line_1: str | None = None,
        address_line_2: str | None = None,
        city: str | None = None,
        postcode: str | None = None,
        country_code: str | None = None,
    ) -> Property:
        tenant = await self.tenant_repository.get(tenant_id)
        if tenant is None:
            raise ValueError("Tenant does not exist.")

        property_record = Property(
            tenant_id=tenant_id,
            name=name,
            reference=reference,
            address_line_1=address_line_1,
            address_line_2=address_line_2,
            city=city,
            postcode=postcode,
            country_code=country_code,
        )
        await self.repository.add(property_record)
        await self.session.commit()
        await self.session.refresh(property_record)
        return property_record

    async def list_properties(self, tenant_id: UUID) -> list[Property]:
        return await self.repository.list_for_tenant(tenant_id)
