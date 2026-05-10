from __future__ import annotations

import datetime as dt

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class ClassificationRecord(Base):
    __tablename__ = "classification_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=lambda: dt.datetime.now(dt.UTC))

    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    input_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    is_emergency: Mapped[bool] = mapped_column(Boolean, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    categories_csv: Mapped[str] = mapped_column(String(1024), nullable=False, default="")
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    model_backend: Mapped[str] = mapped_column(String(64), nullable=False, default="unknown")
    model_id: Mapped[str] = mapped_column(String(256), nullable=False, default="")

    def categories(self) -> list[str]:
        if not self.categories_csv:
            return []
        return [c for c in (x.strip() for x in self.categories_csv.split(",")) if c]

