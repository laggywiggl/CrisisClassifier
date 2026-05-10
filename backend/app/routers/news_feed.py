from __future__ import annotations

import asyncio

from fastapi import APIRouter, Query

from ..core.config import settings
from ..models.feed_schemas import LiveFeedItem, LiveFeedResponse
from ..services.classifier import classify
from ..services.rss_feed import fetch_feed

router = APIRouter(prefix="/api", tags=["live-feed"])


@router.get("/live-feed", response_model=LiveFeedResponse)
async def live_feed(limit: int = Query(default=0, ge=0, le=50)):
    urls = settings.rss_feed_urls
    if not urls:
        return LiveFeedResponse(items=[])

    effective_limit = limit or settings.live_feed_limit
    feeds = await asyncio.gather(*[fetch_feed(u) for u in urls], return_exceptions=True)

    merged = []
    for v in feeds:
        if isinstance(v, Exception):
            continue
        merged.extend(v)

    # Deduplicate by URL
    seen = set()
    deduped = []
    for item in merged:
        if item.url in seen:
            continue
        seen.add(item.url)
        deduped.append(item)

    deduped = deduped[:effective_limit]
    enriched: list[LiveFeedItem] = []
    for item in deduped:
        text = f"{item.title}\n\n{item.summary}".strip()
        r = classify(text)
        enriched.append(
            LiveFeedItem(
                title=item.title,
                url=item.url,
                summary=item.summary,
                published=item.published,
                source=item.source,
                isEmergency=r.is_emergency,
                confidence=r.confidence,
                categories=r.categories,
                classificationSummary=r.summary,
            )
        )

    return LiveFeedResponse(items=enriched)

