# Roadmap

Current phase: **P1 — Text pipeline, free lane** (P0 shipped 2026-07-23).

Full context for every row: [ARCHITECTURE.md](ARCHITECTURE.md).

| Phase | Status | Objective | Key work | Exit criterion |
|---|---|---|---|---|
| **P0 — Skeleton + front door** | ✅ Done | Installable app that receives shares | Multi-module scaffold (Hilt, CI, ktlint/detekt), `ShareActivity` + intent filters, ingest screen, Room/DataStore, theme | Share text/image from WhatsApp → it lands in TruthGuard and persists — **verified on device** |
| **P1 — Text pipeline, free lane** | 🔨 Next | Real verdicts on text claims | Backend v2 (`/v1/verify`: Fact Check Tools + Wikipedia + Gemini free tier, caching, rate limits, pytest), app pipeline stages, verdict screen, grounding gate, eval harness v0 | A never-before-seen text claim gets a cited, honest verdict; zero hallucinated citations on the eval set |
| **P2 — Images** | Planned | The meme/screenshot flow | ML Kit OCR + language ID/translate, EXIF/C2PA extraction, pHash dedupe, Gemini Nano image description (capability-gated), inspector screen | Shared meme → extracted claim → verdict; provenance shown honestly incl. "no data" |
| **P3 — Share-back + polish** | Planned | Close the social loop | Verdict share card (image), vault/history UI, accessibility pass (TalkBack, contrast, font scaling) | Verdict card shared back into WhatsApp reads clearly |
| **P4 — Premium lane** | Planned | Paid quality tier | Play Billing entitlement, paid Gemini/search providers behind existing interfaces, per-scan cloud-image opt-in, server-side cost caps | Premium scan measurably better on eval set; hard monthly cost cap enforced |
| **P5 — Hardening & beta** | Planned | Real users | Play Integrity, cert pinning, opt-in crash reporting, quota dashboards, Play Store internal → closed beta | Closed beta live with real users |
| **P6+ — Video/audio, deeper on-device** | Later | Extend modality & privacy | Frame sampling + ASR feeding the same claim pipeline; on-device judgment experiments (Gemma via MediaPipe LLM API) | — |

Future enhancements parked for after v1: localized UI (Hindi first), video/audio
analysis, on-device judgment, shared pHash lookup for known-viral media.
