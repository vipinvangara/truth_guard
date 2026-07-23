"""TruthGuard verification service."""

import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Header, HTTPException

from .cache import VerifyCache
from .config import get_settings
from .models import HealthResponse, VerifyRequest, VerifyResponse
from .pipeline import verify_text
from .ratelimit import RateLimiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.client = httpx.AsyncClient()
    app.state.cache = VerifyCache(settings.cache_path, settings.cache_ttl_seconds)
    app.state.limiter = RateLimiter(settings.rate_limit_per_hour)
    yield
    await app.state.client.aclose()
    app.state.cache.close()


app = FastAPI(title="TruthGuard Verify API", version="2.0.0", lifespan=lifespan)


@app.post("/v1/verify", response_model=VerifyResponse)
async def verify(
    request: VerifyRequest,
    x_device_token: str = Header(min_length=8, max_length=128),
) -> VerifyResponse:
    if not app.state.limiter.allow(x_device_token):
        raise HTTPException(status_code=429, detail="Rate limit exceeded; try again later")

    cached = app.state.cache.get(request.text)
    if cached is not None:
        return cached

    settings = get_settings()
    response = await verify_text(app.state.client, settings, request.text)
    app.state.cache.put(request.text, response)
    return response


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        providers={
            "gemini": bool(settings.gemini_api_key),
            "factcheck": bool(settings.factcheck_api_key),
            "wikipedia": True,
        },
    )
