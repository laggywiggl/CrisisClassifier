from __future__ import annotations

from pydantic import BaseModel, Field, HttpUrl, model_validator


class ClassifyRequest(BaseModel):
    text: str = Field(default="", max_length=20000)
    url: HttpUrl | None = None

    @model_validator(mode="after")
    def _require_text_or_url(self):
        if (self.text or "").strip() or self.url is not None:
            return self
        raise ValueError("Either 'text' or 'url' must be provided")


class ExplainToken(BaseModel):
    token: str
    score: float


class ClassifyResponse(BaseModel):
    isEmergency: bool
    confidence: float = Field(ge=0, le=100)
    categories: list[str]
    summary: str
    explanation: list[ExplainToken] = []
    model: dict[str, str] = {}
    latencyMs: float = Field(default=0, ge=0)


class HistoryRecord(BaseModel):
    id: str
    timestamp: str
    content: str
    isEmergency: bool
    confidence: float
    categories: list[str]


class StatsDistributionItem(BaseModel):
    name: str
    value: int


class TrendPoint(BaseModel):
    date: str
    emergency: int
    nonEmergency: int


class ConfidenceBucket(BaseModel):
    range: str
    count: int


class DashboardStats(BaseModel):
    totalClassified: int
    emergencyCount: int
    nonEmergencyCount: int
    avgLatencyMs: float = Field(default=0, ge=0)
    categoryDistribution: list[StatsDistributionItem]
    weeklyTrends: list[TrendPoint]
    confidenceDistribution: list[ConfidenceBucket]

