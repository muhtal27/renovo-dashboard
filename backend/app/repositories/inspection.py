from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inspection import Inspection
from app.repositories.base import TenantScopedRepository


class InspectionRepository(TenantScopedRepository[Inspection]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session=session, model_type=Inspection)
