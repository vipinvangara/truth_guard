"""Gemini provider: claim extraction and evidence-grounded judgment.

The API key travels in the X-Goog-Api-Key header, never in the URL (query-string
keys leak into server/proxy logs). The judgment prompt forbids outside knowledge;
the grounding gate in pipeline.py enforces it mechanically afterwards.
"""

import json
import logging

import httpx

from ..config import Settings
from ..models import Evidence

logger = logging.getLogger(__name__)


class GeminiError(Exception):
    """Raised when Gemini is unavailable or returns an unusable response."""


async def _generate(client: httpx.AsyncClient, settings: Settings, prompt: str) -> str:
    if not settings.gemini_api_key:
        raise GeminiError("No Gemini API key configured")
    try:
        resp = await client.post(
            f"{settings.gemini_base_url}/models/{settings.gemini_model}:generateContent",
            headers={"X-Goog-Api-Key": settings.gemini_api_key},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
            },
            timeout=30.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise GeminiError(f"Gemini request failed: {exc}") from exc

    try:
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise GeminiError("Gemini returned an unexpected response shape") from exc


async def extract_claims(
    client: httpx.AsyncClient, settings: Settings, text: str
) -> list[str]:
    """Split a forwarded message into up to N check-worthy factual claims."""
    prompt = (
        "You extract check-worthy factual claims from forwarded messages.\n"
        "A check-worthy claim asserts something about the world that could be "
        "verified or refuted with evidence. Opinions, greetings, and questions "
        "are not check-worthy.\n\n"
        f"Return JSON only: {{\"claims\": [\"...\"]}} with at most "
        f"{settings.max_claims_per_request} claims, each a single self-contained "
        "sentence in English (translate if needed). If nothing is check-worthy, "
        "return {\"claims\": []}.\n\n"
        f"Message:\n<<<\n{text}\n>>>"
    )
    raw = await _generate(client, settings, prompt)
    try:
        claims = json.loads(raw).get("claims", [])
    except json.JSONDecodeError as exc:
        raise GeminiError("Claim extraction returned invalid JSON") from exc
    return [c.strip() for c in claims if isinstance(c, str) and c.strip()][
        : settings.max_claims_per_request
    ]


async def judge_claim(
    client: httpx.AsyncClient, settings: Settings, claim: str, evidence: list[Evidence]
) -> dict:
    """Judge one claim strictly against the supplied evidence.

    Returns {"verdict": ..., "confidence": float, "reasoning": str,
    "citations": [evidence indices]}. Callers must run the grounding gate on it.
    """
    numbered = "\n".join(
        f"[{i}] {e.source_name} ({e.kind.value}, stance={e.stance.value}): {e.snippet}"
        for i, e in enumerate(evidence)
    )
    prompt = (
        "You are a strict fact-checking judge. Judge the claim below using ONLY "
        "the numbered evidence provided. You must not use any outside knowledge "
        "or memory — if the evidence is insufficient to decide, the verdict is "
        "UNVERIFIED. That is a good, honest outcome; never guess.\n\n"
        "Verdicts: TRUE (evidence clearly supports), FALSE (evidence clearly "
        "refutes), MISLEADING (technically partial truth presented deceptively), "
        "UNVERIFIED (insufficient evidence), OPINION (not a factual claim).\n"
        "FACTCHECK evidence from professional fact-checkers outweighs other kinds.\n\n"
        'Return JSON only: {"verdict": "...", "confidence": 0.0-1.0, '
        '"reasoning": "2-3 sentences citing evidence as [n]", '
        '"citations": [list of evidence numbers actually relied on]}\n\n'
        f"Claim: {claim}\n\nEvidence:\n{numbered if numbered else '(none found)'}"
    )
    raw = await _generate(client, settings, prompt)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise GeminiError("Judgment returned invalid JSON") from exc
