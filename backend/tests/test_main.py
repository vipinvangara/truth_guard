"""Endpoint-layer tests: header validation, caching, and rate limiting around
the pipeline. The pipeline's own claim-extraction/judgment/grounding-gate
logic is tested directly in test_pipeline.py and test_grounding_gate.py —
this file only exercises what main.py adds on top of it."""

import pytest
import respx
from fastapi.testclient import TestClient

import app.main as main_module
from app.config import Settings

WIKI_SEARCH = "https://en.wikipedia.org/w/api.php"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"


@pytest.fixture
def client(tmp_path, monkeypatch):
    settings = Settings(cache_path=str(tmp_path / "cache.db"), rate_limit_per_hour=2)
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    with TestClient(main_module.app) as test_client:
        yield test_client


@pytest.fixture
def client_with_gemini(tmp_path, monkeypatch):
    settings = Settings(
        cache_path=str(tmp_path / "cache.db"),
        rate_limit_per_hour=2,
        gemini_api_key="test-gemini-key",
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    with TestClient(main_module.app) as test_client:
        yield test_client


def test_health_reports_keyless_providers(client):
    resp = client.get("/health")

    assert resp.status_code == 200
    assert resp.json() == {
        "status": "healthy",
        "providers": {"gemini": False, "factcheck": False, "wikipedia": True},
    }


def test_verify_requires_device_token_header(client):
    resp = client.post("/v1/verify", json={"text": "some claim"})

    assert resp.status_code == 422


@respx.mock
def test_repeated_identical_claim_is_served_from_cache(client_with_gemini):
    # cache.py deliberately never caches "limited" (no-LLM) responses, so this
    # needs a configured Gemini key to produce a cacheable response — a
    # not-check-worthy message short-circuits to OPINION before any judgment
    # call, keeping the mock to a single Gemini response.
    respx.post(GEMINI_URL).respond(
        json={"candidates": [{"content": {"parts": [{"text": '{"claims": []}'}]}}]}
    )
    headers = {"X-Device-Token": "device-12345"}

    first = client_with_gemini.post("/v1/verify", json={"text": "Good morning!"}, headers=headers)
    second = client_with_gemini.post(
        "/v1/verify", json={"text": "good morning!"}, headers=headers
    )

    assert first.status_code == 200
    assert first.json()["cached"] is False
    assert first.json()["claims"][0]["verdict"] == "OPINION"
    assert second.json()["cached"] is True
    # Normalization (case/whitespace) means these hit the same cache key.
    assert first.json()["claims"] == second.json()["claims"]


@respx.mock
def test_rate_limit_blocks_after_configured_requests(client):
    respx.get(WIKI_SEARCH).respond(json={"query": {"search": []}})
    headers = {"X-Device-Token": "device-throttled"}

    responses = [
        client.post("/v1/verify", json={"text": f"claim {i}"}, headers=headers) for i in range(3)
    ]

    assert [r.status_code for r in responses] == [200, 200, 429]
