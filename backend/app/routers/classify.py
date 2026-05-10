from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.config import settings
from ..db import models
from ..db.database import get_db
from ..models.schemas import ClassifyRequest, ClassifyResponse, ExplainToken
from ..services.classifier import classify
from ..services.news_scraper import scrape_url

router = APIRouter(prefix="/api", tags=["classify"])


@router.post("/classify", response_model=ClassifyResponse)
async def classify_endpoint(
    payload: ClassifyRequest,
    backend: str | None = Query(default=None, description="Override classifier backend (keywords|zero_shot)"),
    persist: bool = Query(default=True, description="If false, do not save this classification to history"),
    db: Session = Depends(get_db),
):
    text = payload.text.strip()
    if len(text) > settings.max_text_chars:
        raise HTTPException(status_code=413, detail="Text too large")

    input_url = None
    if payload.url is not None:
        input_url = str(payload.url)
        try:
            article = await scrape_url(input_url)
        except Exception as e:
            raise HTTPException(
                status_code=424,
                detail="URL could not be scraped (site may require JavaScript / block bots). Try pasting text instead.",
            ) from e
        # If user gave both url+text, append; otherwise use scraped article.
        if text:
            text = f"{article.title}\n\n{article.text}\n\nUserNotes:\n{text}".strip()
        else:
            text = f"{article.title}\n\n{article.text}".strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    t0 = time.perf_counter()
    result = classify(text, backend_override=backend)
    latency_ms = (time.perf_counter() - t0) * 1000.0

    if persist:
        record = models.ClassificationRecord(
            input_text=text,
            input_url=input_url,
            is_emergency=result.is_emergency,
            confidence=float(result.confidence),
            categories_csv=",".join(result.categories),
            summary=result.summary,
            latency_ms=float(latency_ms),
            model_backend=result.model.backend,
            model_id=result.model.model_id,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return ClassifyResponse(
        isEmergency=result.is_emergency,
        confidence=float(result.confidence),
        categories=result.categories,
        summary=result.summary,
        explanation=[ExplainToken(token=t, score=s) for (t, s) in result.explanation],
        model={"backend": result.model.backend, "id": result.model.model_id},
        latencyMs=float(latency_ms),
    )
