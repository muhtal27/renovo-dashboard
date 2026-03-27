from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    project_name: str = Field(default="Renovo Backend", validation_alias="PROJECT_NAME")
    app_env: str = Field(default="local", validation_alias="APP_ENV")
    debug: bool = Field(default=False, validation_alias="DEBUG")
    api_v1_prefix: str = Field(default="/api/v1", validation_alias="API_V1_PREFIX")
    database_url: str = Field(validation_alias="DATABASE_URL")

    supabase_url: str | None = Field(default=None, validation_alias="SUPABASE_URL")
    supabase_service_role_key: str | None = Field(
        default=None,
        validation_alias="SUPABASE_SERVICE_ROLE_KEY",
    )
    vercel_env: str | None = Field(default=None, validation_alias="VERCEL_ENV")
    vercel_git_commit_sha: str | None = Field(
        default=None,
        validation_alias="VERCEL_GIT_COMMIT_SHA",
    )
    vercel_url: str | None = Field(default=None, validation_alias="VERCEL_URL")
    eot_internal_auth_secret: str | None = Field(
        default=None,
        validation_alias="EOT_INTERNAL_AUTH_SECRET",
    )
    eot_internal_auth_ttl_seconds: int = Field(
        default=300,
        validation_alias="EOT_INTERNAL_AUTH_TTL_SECONDS",
    )
    supabase_storage_bucket_inspections: str = Field(
        default="inspection-files",
        validation_alias="SUPABASE_STORAGE_BUCKET_INSPECTIONS",
    )

    @computed_field(return_type=str)
    @property
    def alembic_database_url(self) -> str:
        return make_url(self.database_url).set(drivername="postgresql+asyncpg").render_as_string(
            hide_password=False
        )

    @computed_field(return_type=bool)
    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() in {"prod", "production"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
