from __future__ import annotations

from dataclasses import dataclass

import feedparser
import httpx


@dataclass(frozen=True)
class FeedItem:
    title: str
    url: str
    summary: str
    published: str | None
    source: str | None


async def fetch_feed(url: str, timeout_s: float = 15.0) -> list[FeedItem]:
    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout_s) as client:
        resp = await client.get(url, headers={"User-Agent": "CrisisClassifier/1.0"})
        resp.raise_for_status()

    parsed = feedparser.parse(resp.text)
    items: list[FeedItem] = []
    for entry in parsed.entries[:50]:
        link = getattr(entry, "link", None) or ""
        title = getattr(entry, "title", "") or ""
        summary = getattr(entry, "summary", "") or getattr(entry, "description", "") or ""
        published = getattr(entry, "published", None)
        source = None
        if hasattr(entry, "source") and entry.source:
            source = getattr(entry.source, "title", None)

        if link and title:
            items.append(
                FeedItem(
                    title=title.strip(),
                    url=str(link).strip(),
                    summary=str(summary).strip(),
                    published=str(published).strip() if published else None,
                    source=source.strip() if source else None,
                )
            )

    return items

