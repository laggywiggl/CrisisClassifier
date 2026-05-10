from __future__ import annotations

from pydantic import BaseModel


class LiveFeedItem(BaseModel):
    title: str
    url: str
    summary: str
    published: str | None = None
    source: str | None = None

    isEmergency: bool
    confidence: float
    categories: list[str]
    classificationSummary: str


class LiveFeedResponse(BaseModel):
    items: list[LiveFeedItem]

