from __future__ import annotations

import os

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore
except Exception:  # pragma: no cover
    BaseSettings = object  # type: ignore
    SettingsConfigDict = None  # type: ignore


class Settings(BaseSettings):
    if SettingsConfigDict is not None:
        model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "CrisisClassifier API"
    env: str = "development"
    log_level: str = "info"

    allowed_origins: str = "http://localhost:3000"

    database_url: str = "sqlite:///./data/app.db"

    classifier_backend: str = "zero_shot"
    zero_shot_model_id: str = "typeform/distilbert-base-uncased-mnli"
    hf_model_id: str = ""

    max_text_chars: int = 20000
    rss_feeds: str = "https://rss.nytimes.com/services/xml/rss/nyt/World.xml,https://feeds.bbci.co.uk/news/world/rss.xml"
    live_feed_limit: int = 12

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def rss_feed_urls(self) -> list[str]:
        return [u.strip() for u in self.rss_feeds.split(",") if u.strip()]


def _fallback_env_settings() -> Settings:
    s = Settings()  # type: ignore[call-arg]
    # Only used when pydantic-settings is not installed; keep minimal, safe defaults.
    s.app_name = os.getenv("APP_NAME", s.app_name)
    s.env = os.getenv("ENV", s.env)
    s.log_level = os.getenv("LOG_LEVEL", s.log_level)
    s.allowed_origins = os.getenv("ALLOWED_ORIGINS", s.allowed_origins)
    s.database_url = os.getenv("DATABASE_URL", s.database_url)
    s.classifier_backend = os.getenv("CLASSIFIER_BACKEND", s.classifier_backend)
    s.zero_shot_model_id = os.getenv("ZERO_SHOT_MODEL_ID", s.zero_shot_model_id)
    s.hf_model_id = os.getenv("HF_MODEL_ID", s.hf_model_id)
    s.max_text_chars = int(os.getenv("MAX_TEXT_CHARS", str(s.max_text_chars)))
    s.rss_feeds = os.getenv("RSS_FEEDS", s.rss_feeds)
    s.live_feed_limit = int(os.getenv("LIVE_FEED_LIMIT", str(s.live_feed_limit)))
    return s


settings = _fallback_env_settings() if SettingsConfigDict is None else Settings()
