# TruthGuard

An Android app for checking "WhatsApp University" forwards: share a suspicious
message or image from any app into TruthGuard and get an honest, cited verdict on
the claims it makes — grounded in fact-checkers and verifiable sources, never
fabricated confidence.

> Full design: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · phases:
> [docs/ROADMAP.md](docs/ROADMAP.md) · tasks:
> [docs/BACKLOG.md](docs/BACKLOG.md) · key decisions:
> [docs/decisions/](docs/decisions/).

## Status

**Phase P3** in progress (P0–P2 done — see [docs/ROADMAP.md](docs/ROADMAP.md)
for the full picture, [docs/BACKLOG.md](docs/BACKLOG.md) for open tasks).

What works today, confirmed on a physical device:
- Share text or an image from any app (WhatsApp, browser, gallery) to
  TruthGuard, or select text anywhere → "TruthGuard" in the selection
  toolbar, or paste directly on the home screen.
- Text claims: extracted, checked against Wikipedia/Wikidata evidence, judged
  by Gemini with a mechanical grounding gate, shown with cited sources.
- Image claims: on-device OCR (Latin + Devanagari scripts) extracts text,
  translates it if non-English, then follows the same verification path.
  Basic EXIF provenance is shown honestly (including "no metadata found").
- Cloud verification is opt-in; nothing leaves the device until you consent.

What's next (P3): a shareable verdict card, scan history (Vault), and an
accessibility pass.

## Architecture

Clean Architecture, multi-module Gradle build, UI → Presentation → Domain ← Data:

| Module | Purpose |
|---|---|
| `app` | Compose host, `ShareActivity` (share target), DI wiring |
| `feature:intake` | Ingest screen + ViewModel |
| `feature:verdict` | Verdict screen (claims, evidence, image/provenance display) |
| `domain` | Pure Kotlin: models, repository interfaces, use cases. No Android deps. |
| `data:vault` | Room (scan/claim/evidence history), DataStore (settings/consent), shared-media store |
| `data:verification` | Retrofit client to the backend's `/v1/verify` |
| `data:extraction` | On-device OCR, language ID/translate, EXIF, perceptual hash (ML Kit + AndroidX) |
| `core:designsystem` | Material 3 theme (light/dark/dynamic), verdict color semantics |
| `core:common` | Small shared utilities (e.g. injectable clock) |
| `core:testing` | Shared test rules and fakes |
| `backend/` | FastAPI verification service (Fact Check Tools + Wikipedia evidence, Gemini judgment, grounding gate) — see [backend/README.md](backend/README.md) |

Key stack: Kotlin, Jetpack Compose, Material 3, Hilt, Coroutines/Flow, Room,
DataStore, Retrofit, ML Kit, Coil. `minSdk 26`, `targetSdk 35`.

## Building

Prerequisites: JDK 17 and the Android SDK (easiest via
[Android Studio](https://developer.android.com/studio)).

```bash
./gradlew :app:assembleDebug     # build debug APK
./gradlew test                   # unit tests
./gradlew ktlintCheck detekt     # lint + static analysis
```

Install on a device/emulator: `./gradlew :app:installDebug`, then share any text
or image to **TruthGuard** from another app.

The app needs the backend running to produce real verdicts (otherwise it
degrades honestly to "cloud verification is off"). See
[backend/README.md](backend/README.md) to run it locally, and
`data/verification/build.gradle.kts` for how the debug build points at it
(defaults to a LAN IP — `adb reverse` has proven unreliable for this; override
with `-PtruthguardApiBaseUrl=http://<your-ip>:8000/`).

## Privacy principles

- Raw media never leaves the device by default; scans live only in the local vault.
- Cloud verification is opt-in and sends extracted claim *text*, not media.
- No accounts, no analytics, no fabricated output: every number shown is computed,
  and "unverified" is an honest, first-class verdict.

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the
workflow, and the project's ground rules (the short version: no fabricated
output, honest verdicts, privacy by architecture, tests with every change).
Start with [docs/BACKLOG.md](docs/BACKLOG.md) — items tagged 🟢 are scoped for
newcomers.
