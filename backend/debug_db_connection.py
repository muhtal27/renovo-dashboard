import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.db.session import engine


async def main() -> int:
    url = make_url(settings.database_url)
    print(f"driver={url.drivername}")
    print(f"host={url.host}")
    print(f"port={url.port}")
    print(f"database={url.database}")

    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("select 1"))
            print(f"connection=success value={result.scalar()}")
    except Exception as exc:
        print(f"connection=failure error={type(exc).__name__}: {exc}")
        return 1
    finally:
        await engine.dispose()

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
