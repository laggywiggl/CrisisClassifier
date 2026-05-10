from __future__ import annotations

from dataclasses import dataclass

import httpx
from bs4 import BeautifulSoup


@dataclass(frozen=True)
class ScrapedArticle:
    url: str
    title: str
    text: str


def _extract_text_from_html(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "lxml")

    title = ""
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    # Lightweight extraction: collect <p> tags; ignore nav/footer by sheer density.
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    text = "\n".join([p for p in paragraphs if p])
    return title, text


async def scrape_url(url: str, timeout_s: float = 15.0) -> ScrapedArticle:
    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout_s) as client:
        resp = await client.get(url, headers={"User-Agent": "CrisisClassifier/1.0"})

    body_head = (resp.text or "")[:600]

    # Common anti-bot / JS challenges. We can't execute JS server-side.
    if "Client Challenge" in body_head or "cf-browser-verification" in body_head or "Just a moment" in body_head:
        raise httpx.HTTPStatusError("Blocked by anti-bot challenge (JS required)", request=resp.request, response=resp)

    resp.raise_for_status()

    title, text = _extract_text_from_html(resp.text)
    return ScrapedArticle(url=url, title=title, text=text)
