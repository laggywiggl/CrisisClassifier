from __future__ import annotations

from fastapi import APIRouter

from ..core.config import settings

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name, "env": settings.env}

