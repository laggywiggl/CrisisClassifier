from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from ..core.config import settings


class Base(DeclarativeBase):
    pass


connect_args = {}
if settings.database_url.startswith("sqlite:"):
    connect_args = {"check_same_thread": False}

def _ensure_sqlite_dir(url: str) -> None:
    # Expected formats:
    # - sqlite:///./data/app.db  (relative)
    # - sqlite:////abs/path/app.db (absolute)
    if not url.startswith("sqlite:"):
        return
    if url.startswith("sqlite:///"):
        path_part = url[len("sqlite:///") :]
        if not path_part:
            return
        db_path = Path(path_part)
        if not db_path.is_absolute():
            db_path = Path.cwd() / db_path
    elif url.startswith("sqlite:////"):
        db_path = Path(url[len("sqlite:////") :])
    else:
        return

    parent = db_path.parent
    parent.mkdir(parents=True, exist_ok=True)

_ensure_sqlite_dir(settings.database_url)

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
