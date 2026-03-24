from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inspection import Inspection, InspectionStatus
from app.repositories.inspection import InspectionRepository
from app.repositories.property import PropertyRepository
from app.repositories.tenant import TenantRepository


class InspectionService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = InspectionRepository(session)
        self.property_repository = PropertyRepository(session)
        self.tenant_repository = TenantRepository(session)

    async def create_inspection(
        self,
        *,
        tenant_id: UUID,
        property_id: UUID,
        title: str,
        scheduled_for: datetime | None = None,
        notes: str | None = None,
    ) -> Inspection:
        tenant = await self.tenant_repository.get(tenant_id)
        if tenant is None:
            raise ValueError("Tenant does not exist.")

        property_record = await self.property_repository.get_for_tenant(
            tenant_id=tenant_id,
            entity_id=property_id,
        )
        if property_record is None:
            raise ValueError("Property does not exist for the tenant.")

        inspection = Inspection(
            tenant_id=tenant_id,
            property_id=property_id,
            title=title,
            status=InspectionStatus.SCHEDULED,
            scheduled_for=scheduled_for,
            notes=notes,
        )
        await self.repository.add(inspection)
        await self.session.commit()
        await self.session.refresh(inspection)
        return inspection

    async def list_inspections(self, tenant_id: UUID) -> list[Inspection]:
        return await self.repository.list_for_tenant(tenant_id)
