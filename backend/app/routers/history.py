from __future__ import annotations

import datetime as dt
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..db.models import ClassificationRecord
from ..models.schemas import ConfidenceBucket, DashboardStats, HistoryRecord, StatsDistributionItem, TrendPoint

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=list[HistoryRecord])
def get_history(
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    rows = db.query(ClassificationRecord).order_by(desc(ClassificationRecord.created_at)).limit(limit).all()
    return [
        HistoryRecord(
            id=str(r.id),
            timestamp=r.created_at.isoformat(),
            content=r.input_text,
            isEmergency=r.is_emergency,
            confidence=float(r.confidence),
            categories=r.categories(),
        )
        for r in rows
    ]


@router.delete("/history/{record_id}")
def delete_history_record(record_id: int, db: Session = Depends(get_db)):
    row = db.query(ClassificationRecord).filter(ClassificationRecord.id == record_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    deleted = db.query(ClassificationRecord).delete()
    db.commit()
    return {"ok": True, "deleted": int(deleted or 0)}


def _bucket(conf: float) -> str:
    lo = int(conf // 10) * 10
    hi = lo + 9
    if lo < 30:
        lo, hi = 30, 40
    if hi > 100:
        lo, hi = 91, 100
    if lo >= 90:
        return "91-100%"
    if lo == 30:
        return "30-40%"
    return f"{lo+1}-{hi+1}%"


@router.get("/stats", response_model=DashboardStats)
def get_stats(days: int = Query(default=7, ge=1, le=90), db: Session = Depends(get_db)):
    total = db.query(func.count(ClassificationRecord.id)).scalar() or 0
    emergency = db.query(func.count(ClassificationRecord.id)).filter(ClassificationRecord.is_emergency == True).scalar() or 0
    non_emergency = int(total) - int(emergency)
    avg_latency = db.query(func.avg(ClassificationRecord.latency_ms)).scalar() or 0.0

    # Category distribution (based on stored categories_csv)
    cat_counter: Counter[str] = Counter()
    conf_counter: Counter[str] = Counter()

    rows = db.query(ClassificationRecord.categories_csv, ClassificationRecord.confidence).all()
    for cats_csv, conf in rows:
        for c in (x.strip() for x in (cats_csv or "").split(",")):
            if c:
                cat_counter[c] += 1
        conf_counter[_bucket(float(conf or 0))] += 1

    category_distribution = [StatsDistributionItem(name=k, value=v) for k, v in cat_counter.most_common(10)]
    if not category_distribution:
        category_distribution = [StatsDistributionItem(name="Other", value=0)]

    # Weekly trends
    today = dt.date.today()
    start = today - dt.timedelta(days=days - 1)
    per_day = defaultdict(lambda: {"emergency": 0, "nonEmergency": 0})

    recent_rows = (
        db.query(ClassificationRecord.created_at, ClassificationRecord.is_emergency)
        .filter(ClassificationRecord.created_at >= dt.datetime.combine(start, dt.time.min, tzinfo=dt.UTC))
        .all()
    )
    for created_at, is_emergency in recent_rows:
        d = created_at.date()
        if is_emergency:
            per_day[d]["emergency"] += 1
        else:
            per_day[d]["nonEmergency"] += 1

    weekly_trends: list[TrendPoint] = []
    for i in range(days):
        d = start + dt.timedelta(days=i)
        weekly_trends.append(
            TrendPoint(
                date=d.strftime("%b %d"),
                emergency=per_day[d]["emergency"],
                nonEmergency=per_day[d]["nonEmergency"],
            )
        )

    # Confidence buckets in stable order
    bucket_order = ["30-40%", "41-50%", "51-60%", "61-70%", "71-80%", "81-90%", "91-100%"]
    confidence_distribution = [
        ConfidenceBucket(range=b, count=int(conf_counter.get(b, 0)))
        for b in bucket_order
    ]

    return DashboardStats(
        totalClassified=int(total),
        emergencyCount=int(emergency),
        nonEmergencyCount=int(non_emergency),
        avgLatencyMs=float(avg_latency),
        categoryDistribution=category_distribution,
        weeklyTrends=weekly_trends,
        confidenceDistribution=confidence_distribution,
    )

