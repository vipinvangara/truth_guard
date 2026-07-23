"""Pipeline integration tests with all external HTTP mocked via respx."""

import json

import httpx
import pytest
import respx

from app.models import Verdict
from app.pipeline import verify_text

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
FACTCHECK_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
WIKI_SEARCH = "https://en.wikipedia.org/w/api.php"
WIKI_SUMMARY_PATTERN = r"https://en\.wikipedia\.org/api/rest_v1/page/summary/.*"


def _gemini_reply(payload: dict) -> dict:
    return {"candidates": [{"content": {"parts": [{"text": json.dumps(payload)}]}}]}


def _wiki_search_reply():
    return {"query": {"search": [{"title": "World War II"}]}}


def _wiki_summary_reply():
    return {"extract": "World War II ended with the victory of the Allies in 1945."}


def _factcheck_reply():
    return {
        "claims": [
            {
                "text": "The Allies lost WW2",
                "claimReview": [
                    {
                        "publisher": {"name": "ExampleCheck"},
                        "url": "https://examplecheck.org/ww2",
                        "textualRating": "False",
                    }
                ],
            }
        ]
    }


@pytest.mark.asyncio
@respx.mock
async def test_full_pipeline_false_claim(settings_with_keys):
    gemini_route = respx.post(GEMINI_URL)
    gemini_route.side_effect = [
        httpx.Response(200, json=_gemini_reply({"claims": ["The Allies lost World War II"]})),
        httpx.Response(
            200,
            json=_gemini_reply(
                {
                    "verdict": "FALSE",
                    "confidence": 0.95,
                    "reasoning": "Refuted by [0] and [1].",
                    "citations": [0, 1],
                }
            ),
        ),
    ]
    respx.get(FACTCHECK_URL).respond(json=_factcheck_reply())
    respx.get(WIKI_SEARCH).respond(json=_wiki_search_reply())
    respx.get(url__regex=WIKI_SUMMARY_PATTERN).respond(json=_wiki_summary_reply())

    async with httpx.AsyncClient() as client:
        result = await verify_text(client, settings_with_keys, "Fwd: the allies LOST ww2!!")

    assert len(result.claims) == 1
    claim = result.claims[0]
    assert claim.verdict == Verdict.FALSE
    assert claim.confidence == 0.95
    assert not result.limited
    # Every evidence item shown to the user really came from the providers.
    urls = {e.url for e in claim.evidence}
    assert urls <= {"https://examplecheck.org/ww2", "https://en.wikipedia.org/wiki/World_War_II"}


@pytest.mark.asyncio
@respx.mock
async def test_keyless_mode_is_honest(settings_keyless):
    respx.get(WIKI_SEARCH).respond(json=_wiki_search_reply())
    respx.get(url__regex=WIKI_SUMMARY_PATTERN).respond(json=_wiki_summary_reply())

    async with httpx.AsyncClient() as client:
        result = await verify_text(client, settings_keyless, "The allies lost ww2")

    claim = result.claims[0]
    assert claim.verdict == Verdict.UNVERIFIED
    assert claim.confidence == 0.0
    assert result.limited is True
    assert claim.evidence, "keyless mode still surfaces evidence for manual review"


@pytest.mark.asyncio
@respx.mock
async def test_no_checkworthy_claims_yields_opinion(settings_with_keys):
    respx.post(GEMINI_URL).respond(json=_gemini_reply({"claims": []}))

    async with httpx.AsyncClient() as client:
        result = await verify_text(client, settings_with_keys, "Good morning! Have a blessed day")

    assert result.claims[0].verdict == Verdict.OPINION


@pytest.mark.asyncio
@respx.mock
async def test_provider_failures_never_crash_the_pipeline(settings_with_keys):
    gemini_route = respx.post(GEMINI_URL)
    gemini_route.side_effect = [
        httpx.Response(200, json=_gemini_reply({"claims": ["Some claim"]})),
        httpx.Response(429),  # judgment quota exhausted
    ]
    respx.get(FACTCHECK_URL).respond(status_code=500)
    respx.get(WIKI_SEARCH).respond(status_code=503)

    async with httpx.AsyncClient() as client:
        result = await verify_text(client, settings_with_keys, "Some claim")

    claim = result.claims[0]
    assert claim.verdict == Verdict.UNVERIFIED
    assert claim.confidence == 0.0
