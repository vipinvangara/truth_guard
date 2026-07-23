# ADR 0003: Free-tier-first evidence stack, Premium lane behind the same interfaces

Date: 2026-07-23 · Status: Accepted

## Context

The verdict pipeline needs fact-check lookups, encyclopedic grounding, web
search, and LLM judgment. Paid APIs improve quality but the project should be
usable (and hostable) at near-zero cost, and a paid tier should not fork the
pipeline into two codepaths.

## Decision

The default ("free") lane uses only free services: Google Fact Check Tools API
(aggregates IFCN fact-checkers incl. India-focused ones — BOOM, Alt News,
Factly, Vishvas News), Wikipedia/Wikidata REST, ClaimBuster, Brave Search free
tier, and Gemini Flash free tier via a server-held key. A "Premium" lane (paid
Gemini, paid search, opt-in cloud image analysis) implements the same
`EvidenceProvider` / `JudgmentProvider` interfaces; nothing else in the
pipeline knows which lane is active.

API keys live server-side only (extractable from any shipped APK otherwise);
the backend adds per-device rate limiting and normalized-claim caching, which
also stretches shared free quotas — viral forwards are the high-cache-hit case.

## Consequences

- Prototype-scale usage costs ≈ nothing; quality upgrades are a config change.
- Free-lane quality is bounded by free quotas; the honest-UNVERIFIED posture
  and fact-checker-first ranking absorb this rather than faking confidence.
- Provider integrations must stay behind the two interfaces; adding a source
  means adding a provider, never branching the pipeline.
