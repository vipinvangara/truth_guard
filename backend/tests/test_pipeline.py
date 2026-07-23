"""Pipeline integration tests with all external HTTP mocked via respx."""

import json

import httpx
import pytest
import respx

from app.models import Verdict
from app.pipeline import verify_text

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
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
        httpx.Response(
            200,
            json=_gemini_reply(
                {
                    "claims": [
                        {"text": "The Allies lost World War II", "search_query": "World War II Allies"}
                    ]
                }
            ),
        ),
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
async def test_evidence_retrieval_uses_search_query_not_full_claim_sentence(settings_with_keys):
    """Regression test: a long claim sentence must never be sent verbatim to
    Wikipedia/Fact Check search — that's what previously returned an unrelated
    'Rape' article for an exam-paper-leak claim (noisy MediaWiki relevance
    ranking on long, generic-word-heavy sentences)."""
    long_sentence = "Over 40 national exam paper leaks and irregularities were reported across India between 2021 and mid-2026."
    gemini_route = respx.post(GEMINI_URL)
    gemini_route.side_effect = [
        httpx.Response(
            200,
            json=_gemini_reply(
                {"claims": [{"text": long_sentence, "search_query": "exam paper leaks India"}]}
            ),
        ),
        httpx.Response(
            200,
            json=_gemini_reply(
                {"verdict": "UNVERIFIED", "confidence": 0.9, "reasoning": "no evidence", "citations": []}
            ),
        ),
    ]
    wiki_route = respx.get(WIKI_SEARCH).respond(json=_wiki_search_reply())
    factcheck_route = respx.get(FACTCHECK_URL).respond(json={"claims": []})
    respx.get(url__regex=WIKI_SUMMARY_PATTERN).respond(json=_wiki_summary_reply())

    async with httpx.AsyncClient() as client:
        await verify_text(client, settings_with_keys, "some forwarded message")

    assert wiki_route.calls.last.request.url.params["srsearch"] == "exam paper leaks India"
    assert factcheck_route.calls.last.request.url.params["query"] == "exam paper leaks India"


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
        httpx.Response(
            200, json=_gemini_reply({"claims": [{"text": "Some claim", "search_query": "Some claim"}]})
        ),
        httpx.Response(429),  # judgment quota exhausted
    ]
    respx.get(FACTCHECK_URL).respond(status_code=500)
    respx.get(WIKI_SEARCH).respond(status_code=503)

    async with httpx.AsyncClient() as client:
        result = await verify_text(client, settings_with_keys, "Some claim")

    claim = result.claims[0]
    assert claim.verdict == Verdict.UNVERIFIED
    assert claim.confidence == 0.0
