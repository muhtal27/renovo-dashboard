from functools import lru_cache

from supabase import AsyncClient
from supabase import acreate_client

from app.core.config import settings


@lru_cache(maxsize=1)
def get_storage_bucket_name() -> str:
    return settings.supabase_storage_bucket_inspections


async def get_supabase_admin_client() -> AsyncClient:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase admin credentials are not configured.")

    return await acreate_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
