"""The verification pipeline: extract -> retrieve -> judge -> grounding gate.

Design rules enforced here (see docs/ARCHITECTURE.md §5):
- The LLM may only cite retrieved evidence; the gate drops anything else.
- Thin evidence caps the verdict at UNVERIFIED — uncertainty never escalates
  into a confident verdict.
- Professional fact-checker hits outrank LLM judgment.
"""

import asyncio
import logging

import httpx

from .config import Settings
from .models import ClaimResult, Evidence, EvidenceKind, Stance, Verdict, VerifyResponse
from .providers import factcheck, gemini, wikipedia
from .providers.gemini import ExtractedClaim

logger = logging.getLogger(__name__)

_VALID_VERDICTS = {v.value for v in Verdict}
# Cap on how many evidence items are shown for one claim, whether they came
# from the LLM's citations or (when nothing was cited) the raw retrieval set.
_MAX_EVIDENCE_SHOWN = 5


async def verify_text(client: httpx.AsyncClient, settings: Settings, text: str) -> VerifyResponse:
    try:
        claims = await gemini.extract_claims(client, settings, text)
        llm_available = True
    except gemini.GeminiError as exc:
        logger.info("Claim extraction unavailable (%s); treating text as one claim", exc)
        # No LLM to shorten the query; the raw text is the best we have, and the
        # keyless path already degrades to UNVERIFIED-with-evidence-for-review.
        fallback_text = text.strip()[:500]
        claims = [ExtractedClaim(text=fallback_text, search_query=fallback_text)]
        llm_available = False

    if not claims:
        # Nothing check-worthy (e.g. pure opinion/greeting). Honest OPINION result.
        return VerifyResponse(
            claims=[
                ClaimResult(
                    text=text.strip()[:500],
                    verdict=Verdict.OPINION,
                    confidence=0.6,
                    reasoning="No check-worthy factual claim was found in this message.",
                    evidence=[],
                )
            ]
        )

    results = await asyncio.gather(
        *(_verify_claim(client, settings, claim, llm_available) for claim in claims)
    )
    # _limited_result (used for every claim whenever llm_available is False)
    # always sets UNVERIFIED, and `claims` is non-empty here, so "any claim is
    # UNVERIFIED because the LLM was unavailable" reduces to just `not llm_available`.
    return VerifyResponse(claims=list(results), limited=not llm_available)


async def _verify_claim(
    client: httpx.AsyncClient, settings: Settings, claim: ExtractedClaim, llm_available: bool
) -> ClaimResult:
    factcheck_ev, wiki_ev = await asyncio.gather(
        factcheck.search(client, settings, claim.search_query),
        wikipedia.search(client, settings, claim.search_query),
    )
    evidence = factcheck_ev + wiki_ev

    if not llm_available:
        return _limited_result(claim.text, evidence)

    try:
        raw = await gemini.judge_claim(client, settings, claim.text, evidence)
    except gemini.GeminiError as exc:
        logger.warning("Judgment unavailable for claim: %s", exc)
        return _limited_result(claim.text, evidence)

    return _grounding_gate(claim.text, raw, evidence)


def _grounding_gate(claim: str, raw: dict, evidence: list[Evidence]) -> ClaimResult:
    """Mechanically enforce evidence-grounded judgment on the LLM's output."""
    verdict_str = str(raw.get("verdict", "")).upper()
    verdict = Verdict(verdict_str) if verdict_str in _VALID_VERDICTS else Verdict.UNVERIFIED

    try:
        confidence = max(0.0, min(1.0, float(raw.get("confidence", 0.0))))
    except (TypeError, ValueError):
        confidence = 0.0

    citations = raw.get("citations", [])
    valid_citations = sorted(
        {c for c in citations if isinstance(c, int) and 0 <= c < len(evidence)}
    )
    cited_evidence = [evidence[i] for i in valid_citations]

    # Gate 1: a definitive verdict with zero valid citations is not grounded.
    if verdict in (Verdict.TRUE, Verdict.FALSE, Verdict.MISLEADING) and not cited_evidence:
        verdict = Verdict.UNVERIFIED
        confidence = min(confidence, 0.3)

    # Gate 2: a definitive verdict that contradicts every professional
    # fact-checker in evidence defers to the fact-checkers.
    factcheck_stances = {e.stance for e in cited_evidence if e.kind == EvidenceKind.FACTCHECK}
    if verdict == Verdict.TRUE and factcheck_stances == {Stance.REFUTES}:
        verdict = Verdict.FALSE
    elif verdict == Verdict.FALSE and factcheck_stances == {Stance.SUPPORTS}:
        verdict = Verdict.TRUE

    reasoning = str(raw.get("reasoning", "")).strip() or "No reasoning provided."

    return ClaimResult(
        text=claim,
        verdict=verdict,
        confidence=confidence,
        reasoning=reasoning,
        evidence=cited_evidence if cited_evidence else evidence[:_MAX_EVIDENCE_SHOWN],
    )


def _limited_result(claim: str, evidence: list[Evidence]) -> ClaimResult:
    """Honest no-LLM result: present evidence, judge nothing."""
    return ClaimResult(
        text=claim,
        verdict=Verdict.UNVERIFIED,
        confidence=0.0,
        reasoning=(
            "Automated judgment is currently unavailable. The sources below were "
            "found for this claim — review them directly."
        ),
        evidence=evidence[:_MAX_EVIDENCE_SHOWN],
    )
