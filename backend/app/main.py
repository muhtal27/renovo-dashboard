from fastapi import FastAPI

from app.api.eot.router import router as eot_router
from app.api.router import api_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name,
        debug=settings.debug,
        version="0.1.0",
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    app.include_router(eot_router, prefix="/api/eot", tags=["eot"])
    return app


app = create_app()
