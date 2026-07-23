"""Environment-driven configuration. No secrets in code, ever."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API keys are optional: the service degrades honestly without them
    # (keyless = Wikipedia evidence only, verdicts capped at UNVERIFIED).
    gemini_api_key: str = ""
    factcheck_api_key: str = ""

    # "-latest" alias tracks the current free-tier Flash model; pinned versions
    # get retired for new accounts (gemini-2.5-flash 404s on keys created mid-2026).
    gemini_model: str = "gemini-flash-latest"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    factcheck_base_url: str = "https://factchecktools.googleapis.com/v1alpha1"
    wikipedia_base_url: str = "https://en.wikipedia.org"

    cache_path: str = "verify_cache.db"
    cache_ttl_seconds: int = 7 * 24 * 3600

    # Per-device-token limits (in-memory; Cloud Run single instance is fine for P1).
    rate_limit_per_hour: int = 30

    max_claims_per_request: int = 3
    provider_timeout_seconds: float = 8.0

    model_config = {"env_prefix": "TRUTHGUARD_"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
