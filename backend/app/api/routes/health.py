from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Health check")
async def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.app_env,
    }


@router.get("/release", summary="Release metadata")
async def release_info() -> dict[str, object]:
    deployment_url = (
        f"https://{settings.vercel_url}"
        if settings.vercel_url and not settings.vercel_url.startswith(("http://", "https://"))
        else settings.vercel_url
    )

    return {
        "service": "renovo-backend",
        "status": "ok",
        "environment": settings.app_env,
        "vercel_env": settings.vercel_env,
        "git_sha": settings.vercel_git_commit_sha,
        "deployment_url": deployment_url,
        "capabilities": {
            "eot_case_list": True,
            "eot_report_summary": True,
            "eot_case_workspace_summary": True,
            "eot_paged_sections": True,
        },
    }
