"""Google Fact Check Tools API (ClaimSearch) provider.

Free API aggregating ClaimReview markup from IFCN fact-checkers, including the
India-focused ones (BOOM, Alt News, Factly, Vishvas News) most relevant to
WhatsApp-forward misinformation. A hit here outranks LLM judgment downstream.
"""

import logging

import httpx

from ..config import Settings
from ..models import Evidence, EvidenceKind, Stance

logger = logging.getLogger(__name__)

# ClaimReview textual ratings mapped to stances. Unknown ratings stay CONTEXT.
_REFUTING_RATINGS = {"false", "fake", "pants on fire", "incorrect", "mostly false", "misleading"}
_SUPPORTING_RATINGS = {"true", "correct", "mostly true", "accurate"}


async def search(client: httpx.AsyncClient, settings: Settings, query: str) -> list[Evidence]:
    if not settings.factcheck_api_key:
        return []
    try:
        resp = await client.get(
            f"{settings.factcheck_base_url}/claims:search",
            params={"query": query, "pageSize": 5, "languageCode": "en"},
            headers={"X-Goog-Api-Key": settings.factcheck_api_key},
            timeout=settings.provider_timeout_seconds,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Fact Check Tools search failed: %s", exc)
        return []

    evidence: list[Evidence] = []
    for claim in resp.json().get("claims", []):
        for review in claim.get("claimReview", []):
            rating = (review.get("textualRating") or "").lower()
            if any(r in rating for r in _REFUTING_RATINGS):
                stance = Stance.REFUTES
            elif any(r in rating for r in _SUPPORTING_RATINGS):
                stance = Stance.SUPPORTS
            else:
                stance = Stance.MIXED
            publisher = (review.get("publisher") or {}).get("name", "Fact-checker")
            url = review.get("url", "")
            if not url:
                continue
            claimed = claim.get("text", "")
            evidence.append(
                Evidence(
                    source_name=publisher,
                    url=url,
                    snippet=f'Rated "{review.get("textualRating", "?")}" — claim reviewed: {claimed}'[:500],
                    kind=EvidenceKind.FACTCHECK,
                    stance=stance,
                )
            )
    return evidence
