from __future__ import annotations

import re
from dataclasses import dataclass

from ..core.config import settings


@dataclass(frozen=True)
class ModelInfo:
    backend: str
    model_id: str


@dataclass(frozen=True)
class ClassificationResult:
    is_emergency: bool
    confidence: float  # 0-100
    categories: list[str]
    summary: str
    explanation: list[tuple[str, float]]
    model: ModelInfo


EMERGENCY_LABELS = [
    "natural disaster",
    "earthquake",
    "flood",
    "hurricane",
    "wildfire",
    "storm",
    "conflict/violence",
    "terror attack",
    "public health emergency",
    "chemical spill",
    "explosion",
    "evacuation",
]


def _keywords_backend(text: str) -> ClassificationResult:
    emergency_keywords = [
        "earthquake",
        "tsunami",
        "hurricane",
        "tornado",
        "flood",
        "wildfire",
        "fire",
        "explosion",
        "shooting",
        "attack",
        "disaster",
        "emergency",
        "crisis",
        "accident",
        "evacuation",
        "outbreak",
        "pandemic",
        "spill",
        "hazmat",
    ]

    t = text.lower()
    matches = [k for k in emergency_keywords if k in t]
    is_emergency = len(matches) >= 2 or bool(re.search(r"\b(evacuate|evacuation|casualties|killed|injured)\b", t))
    # Deterministic confidence
    confidence = min(98.0, 30.0 + (len(matches) * 8.5) + (15.0 if is_emergency else 0.0))

    categories: list[str] = []
    if re.search(r"\b(earthquake|tsunami|landslide)\b", t):
        categories.append("Natural Disaster")
    if re.search(r"\b(shooting|attack|terrorism|bomb|missile)\b", t):
        categories.append("Violence")
    if re.search(r"\b(flood|hurricane|tornado|storm|blizzard)\b", t):
        categories.append("Weather")
    if re.search(r"\b(fire|wildfire|explosion|collapse|spill|hazmat)\b", t):
        categories.append("Accident")
    if re.search(r"\b(virus|disease|outbreak|pandemic)\b", t):
        categories.append("Health")
    if not categories:
        categories.append("Other Emergency" if is_emergency else "Non-Emergency")

    summary = (
        f"Detected emergency-related signals ({', '.join(matches[:8])}). Categories: {', '.join(categories)}."
        if is_emergency
        else "No strong emergency-related signals were detected in the provided text."
    )

    explanation = [(m, 1.0) for m in matches[:20]]
    return ClassificationResult(
        is_emergency=is_emergency,
        confidence=confidence,
        categories=categories,
        summary=summary,
        explanation=explanation,
        model=ModelInfo(backend="keywords", model_id="builtin-keywords-v1"),
    )


class ZeroShotClassifier:
    def __init__(self, model_id: str):
        from transformers import pipeline

        self.model_id = model_id
        self.pipe = pipeline(
            "zero-shot-classification",
            model=model_id,
            device=-1,
        )

    def classify(self, text: str) -> ClassificationResult:
        # Multi-label probabilities over emergency labels
        out = self.pipe(text, candidate_labels=EMERGENCY_LABELS, multi_label=True)
        labels = list(out["labels"])
        scores = list(out["scores"])

        top = sorted(zip(labels, scores), key=lambda x: x[1], reverse=True)
        picked = [(l, s) for (l, s) in top if s >= 0.35][:5]
        categories = []
        if any(l in {"natural disaster", "earthquake", "flood", "hurricane", "wildfire", "storm"} for l, _ in picked):
            categories.append("Natural Disaster")
        if any(l in {"conflict/violence", "terror attack"} for l, _ in picked):
            categories.append("Violence")
        if any(l in {"public health emergency"} for l, _ in picked):
            categories.append("Health")
        if any(l in {"chemical spill", "explosion"} for l, _ in picked):
            categories.append("Accident")
        if any(l in {"evacuation"} for l, _ in picked):
            categories.append("Evacuation")
        if not categories:
            categories.append("Non-Emergency")

        emergency_score = max([s for _, s in picked], default=0.0)
        is_emergency = emergency_score >= 0.5 and "Non-Emergency" not in categories
        confidence = float(min(98.0, max(30.0, emergency_score * 100.0)))

        summary = (
            f"Top signals: {', '.join([f'{l} ({s:.2f})' for l, s in picked])}."
            if picked
            else "No strong crisis-related labels were detected."
        )
        explanation = [(l, float(s)) for l, s in picked]
        return ClassificationResult(
            is_emergency=is_emergency,
            confidence=confidence,
            categories=categories,
            summary=summary,
            explanation=explanation,
            model=ModelInfo(backend="zero_shot", model_id=self.model_id),
        )


_zero_shot: ZeroShotClassifier | None = None


def classify(text: str, backend_override: str | None = None) -> ClassificationResult:
    backend = (backend_override or settings.classifier_backend).lower().strip()
    if backend == "keywords":
        return _keywords_backend(text)

    if backend == "zero_shot":
        global _zero_shot
        if _zero_shot is None:
            _zero_shot = ZeroShotClassifier(settings.zero_shot_model_id)
        return _zero_shot.classify(text)

    # Fallback for unknown backend
    return _keywords_backend(text)
