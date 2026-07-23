"""API schemas. The verdict vocabulary is fixed and honest: UNVERIFIED is a
first-class outcome, never an error."""

from enum import Enum

from pydantic import BaseModel, Field


class Verdict(str, Enum):
    TRUE = "TRUE"
    FALSE = "FALSE"
    MISLEADING = "MISLEADING"
    UNVERIFIED = "UNVERIFIED"
    OPINION = "OPINION"


class Stance(str, Enum):
    SUPPORTS = "SUPPORTS"
    REFUTES = "REFUTES"
    MIXED = "MIXED"
    CONTEXT = "CONTEXT"


class EvidenceKind(str, Enum):
    FACTCHECK = "FACTCHECK"
    ENCYCLOPEDIC = "ENCYCLOPEDIC"
    # No provider produces this yet (reserved for a future general web-search
    # provider) — kept in sync with the Kotlin client's EvidenceKind, where it
    # doubles as the safe fallback for any kind string the client doesn't
    # recognize. Do not remove without checking data/verification's ResultMappers.kt.
    SEARCH = "SEARCH"


class Evidence(BaseModel):
    source_name: str
    url: str
    snippet: str
    kind: EvidenceKind
    stance: Stance = Stance.CONTEXT


class ClaimResult(BaseModel):
    text: str
    verdict: Verdict
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    evidence: list[Evidence]


class VerifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=8000)


class VerifyResponse(BaseModel):
    claims: list[ClaimResult]
    cached: bool = False
    # True when judgment ran without an LLM (no key / quota) — the client must
    # present this as "evidence only, no automated judgment".
    limited: bool = False


class HealthResponse(BaseModel):
    status: str
    providers: dict[str, bool]
