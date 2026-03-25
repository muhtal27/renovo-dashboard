import asyncio
from app.db import models  # noqa: F401
from app.db.base import Base
from app.db.session import engine

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("Tables created successfully")

asyncio.run(main())
