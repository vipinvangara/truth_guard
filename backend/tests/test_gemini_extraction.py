"""extract_claims must never let a long claim sentence leak into search retrieval
unlabeled — see pipeline.py's use of ExtractedClaim.search_query vs .text."""

import json

import httpx
import pytest
import respx

from app.providers.gemini import ExtractedClaim, extract_claims

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"


def _reply(payload: dict) -> dict:
    return {"candidates": [{"content": {"parts": [{"text": json.dumps(payload)}]}}]}


@pytest.mark.asyncio
@respx.mock
async def test_extracts_text_and_search_query_separately(settings_with_keys):
    respx.post(GEMINI_URL).respond(
        json=_reply(
            {"claims": [{"text": "A very long natural-language claim sentence.", "search_query": "short query"}]}
        )
    )

    async with httpx.AsyncClient() as client:
        claims = await extract_claims(client, settings_with_keys, "some message")

    assert claims == [
        ExtractedClaim(text="A very long natural-language claim sentence.", search_query="short query")
    ]


@pytest.mark.asyncio
@respx.mock
async def test_missing_search_query_falls_back_to_claim_text(settings_with_keys):
    respx.post(GEMINI_URL).respond(json=_reply({"claims": [{"text": "claim with no query"}]}))

    async with httpx.AsyncClient() as client:
        claims = await extract_claims(client, settings_with_keys, "some message")

    assert claims[0].search_query == "claim with no query"


@pytest.mark.asyncio
@respx.mock
async def test_malformed_entries_are_dropped_not_crashed_on(settings_with_keys):
    respx.post(GEMINI_URL).respond(
        json=_reply(
            {
                "claims": [
                    "a bare string, not an object",
                    {"text": "", "search_query": "empty text is dropped"},
                    {"search_query": "no text field at all"},
                    {"text": "the only valid one", "search_query": "valid"},
                ]
            }
        )
    )

    async with httpx.AsyncClient() as client:
        claims = await extract_claims(client, settings_with_keys, "some message")

    assert claims == [ExtractedClaim(text="the only valid one", search_query="valid")]


@pytest.mark.asyncio
@respx.mock
async def test_respects_max_claims_setting(settings_with_keys):
    settings_with_keys.max_claims_per_request = 2
    respx.post(GEMINI_URL).respond(
        json=_reply({"claims": [{"text": f"claim {i}", "search_query": f"q{i}"} for i in range(5)]})
    )

    async with httpx.AsyncClient() as client:
        claims = await extract_claims(client, settings_with_keys, "some message")

    assert len(claims) == 2
