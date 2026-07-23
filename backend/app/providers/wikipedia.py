"""Wikipedia evidence provider: search + page summaries. Keyless and free."""

import logging
import urllib.parse

import httpx

from ..config import Settings
from ..models import Evidence, EvidenceKind

logger = logging.getLogger(__name__)

# Wikimedia's robot policy (https://w.wiki/4wJS) requires a descriptive UA with
# contact information; requests without one get 403'd at the edge.
_USER_AGENT = (
    "TruthGuard/2.0 (https://github.com/vipinvangara/truth_guard; "
    "vipin.vangara@gmail.com) python-httpx"
)


async def search(client: httpx.AsyncClient, settings: Settings, query: str) -> list[Evidence]:
    try:
        resp = await client.get(
            f"{settings.wikipedia_base_url}/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srlimit": 3,
                "format": "json",
                "utf8": 1,
            },
            headers={"User-Agent": _USER_AGENT},
            timeout=settings.provider_timeout_seconds,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Wikipedia search failed: %s", exc)
        return []

    # Re-slice defensively even though srlimit=3 above already asked for at
    # most 3 — an API that ignored the param shouldn't blow the evidence budget.
    hits = resp.json().get("query", {}).get("search", [])[:3]
    evidence: list[Evidence] = []
    for hit in hits:
        title = hit.get("title", "")
        if not title:
            continue
        summary = await _summary(client, settings, title)
        if not summary:
            continue
        evidence.append(
            Evidence(
                source_name=f"Wikipedia: {title}",
                url=f"{settings.wikipedia_base_url}/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
                snippet=summary[:500],
                kind=EvidenceKind.ENCYCLOPEDIC,
            )
        )
    return evidence


async def _summary(client: httpx.AsyncClient, settings: Settings, title: str) -> str:
    try:
        resp = await client.get(
            f"{settings.wikipedia_base_url}/api/rest_v1/page/summary/{urllib.parse.quote(title)}",
            headers={"User-Agent": _USER_AGENT},
            timeout=settings.provider_timeout_seconds,
        )
        resp.raise_for_status()
        return resp.json().get("extract", "")
    except httpx.HTTPError as exc:
        logger.warning("Wikipedia summary failed for %r: %s", title, exc)
        return ""
