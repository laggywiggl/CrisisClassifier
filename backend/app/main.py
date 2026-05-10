from __future__ import annotations

from contextlib import asynccontextmanager

def _missing_deps_hint(missing: str) -> str:
    return (
        f"Missing dependency: {missing}. "
        "Install backend requirements first:\n"
        "  pip install -r backend/requirements.txt\n"
        "Then run:\n"
        "  uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"
    )


try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
except ModuleNotFoundError as e:  # pragma: no cover
    raise RuntimeError(_missing_deps_hint(str(e.name))) from e

try:
    from sqlalchemy import create_engine  # noqa: F401
except ModuleNotFoundError as e:  # pragma: no cover
    raise RuntimeError(_missing_deps_hint(str(e.name))) from e

from .core.config import settings
from .db.database import Base, engine
from .routers import classify, health, history, news_feed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure DB tables exist (dev-friendly; for production use Alembic)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

@app.get("/")
def root():
    return {
        "message": "CrisisClassifier API is running.",
        "health": "/api/health",
        "docs": "/docs",
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(classify.router)
app.include_router(history.router)
app.include_router(news_feed.router)
