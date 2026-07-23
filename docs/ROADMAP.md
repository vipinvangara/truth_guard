# Roadmap

Current phase: **P3 — Share-back + polish** (P0-P2 shipped 2026-07-23).

Full context for every row: [ARCHITECTURE.md](ARCHITECTURE.md).

| Phase | Status | Objective | Key work | Exit criterion |
|---|---|---|---|---|
| **P0 — Skeleton + front door** | ✅ Done | Installable app that receives shares | Multi-module scaffold (Hilt, CI, ktlint/detekt), `ShareActivity` + intent filters, ingest screen, Room/DataStore, theme | Share text/image from WhatsApp → it lands in TruthGuard and persists — **verified on device** |
| **P1 — Text pipeline, free lane** | ✅ Done | Real verdicts on text claims | Backend (`/v1/verify`: Fact Check Tools + Wikipedia + Gemini free tier, caching, rate limits, pytest), direct-call verification (not WorkManager — see ADRs/lessons), verdict screen, grounding gate | A never-before-seen text claim gets a cited, honest verdict — **verified on device** |
| **P2 — Images** | ✅ Done (core loop) | The meme/screenshot flow | ML Kit OCR (Latin+Devanagari) + language ID/translate, EXIF provenance, pHash, verdict screen shows image/extracted text/provenance. C2PA and Gemini Nano image description deferred — heavier lifts not needed to close the core gap. | Shared meme → extracted claim → verdict — **verified on device**; provenance shown honestly incl. "no data" |
| **P3 — Share-back + polish** | 🔨 Next | Close the social loop | Verdict share card (image), vault/history UI, accessibility pass (TalkBack, contrast, font scaling) | Verdict card shared back into WhatsApp reads clearly |
| **P4 — Premium lane** | Planned | Paid quality tier | Play Billing entitlement, paid Gemini/search providers behind existing interfaces, per-scan cloud-image opt-in, server-side cost caps | Premium scan measurably better on eval set; hard monthly cost cap enforced |
| **P5 — Hardening & beta** | Planned | Real users | Play Integrity, cert pinning, opt-in crash reporting, quota dashboards, Play Store internal → closed beta | Closed beta live with real users |
| **P6+ — Video/audio, deeper on-device** | Later | Extend modality & privacy | Frame sampling + ASR feeding the same claim pipeline; on-device judgment experiments (Gemma via MediaPipe LLM API) | — |

Future enhancements parked for after v1: localized UI (Hindi first), video/audio
analysis, on-device judgment, shared pHash lookup for known-viral media, C2PA
provenance, Gemini Nano on-device image description.

## Known gap: statistical/count claims ("over 40 X between Y and Z")

Real-device testing during P2 surfaced a category the current evidence stack
can't resolve: claims asserting a specific count or tally (e.g. "21 incidents
tied to government institutions"). Wikipedia/Wikidata are encyclopedic, not
statistical registries — they cover individual incidents, not aggregate counts.
The grounding gate correctly returns UNVERIFIED rather than letting the LLM
"compute" a plausible-sounding number from its own memory (exactly the
overconfident-fabrication failure mode this app exists to prevent). Closing
this gap needs either (a) a **Fact Check Tools API key** (not yet configured —
professional fact-checkers often publish claim-by-claim pieces on viral
statistics like this) or (b) general web search (Brave/SearXNG, planned but
not built) surfacing primary sources like government data or news archives.
