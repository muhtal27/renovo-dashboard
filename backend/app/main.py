import logging

from fastapi import FastAPI

from app.api.eot.router import router as eot_router
from app.api.router import api_router
from app.core.config import settings

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    if not settings.eot_internal_auth_secret:
        logger.error(
            "EOT backend internal auth is not configured. Set EOT_INTERNAL_AUTH_SECRET in backend/.env before using /api/eot/* routes."
        )

    app = FastAPI(
        title=settings.project_name,
        debug=settings.debug,
        version="0.1.0",
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
        openapi_url=None if settings.is_production else "/openapi.json",
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    app.include_router(eot_router, prefix="/api/eot", tags=["eot"])
    return app


app = create_app()
