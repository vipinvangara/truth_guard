# TruthGuard

An Android app for checking "WhatsApp University" forwards: share a suspicious
message or image from any app into TruthGuard and get an honest, cited verdict on
the claims it makes — grounded in fact-checkers and verifiable sources, never
fabricated confidence.

> The previous React Native/Expo prototype lives on the [`legacy`](../../tree/legacy)
> branch. This branch is the native rebuild. Full design:
> [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · phases:
> [docs/ROADMAP.md](docs/ROADMAP.md) · key decisions:
> [docs/decisions/](docs/decisions/).

## Status

**Phase P0** — project skeleton and the share-target front door.

What works today:
- Share text or an image from any app (WhatsApp, browser, gallery) to TruthGuard;
  it is validated, persisted, and appears as a queued scan.
- Select text anywhere → "TruthGuard" appears in the text-selection toolbar
  (`ACTION_PROCESS_TEXT`).
- Paste a message directly on the home screen.

What's next (P1): the verification pipeline — claim extraction, evidence retrieval
(Google Fact Check Tools, Wikipedia/Wikidata), evidence-grounded LLM judgment, and
the verdict screen.

## Architecture

Clean Architecture, multi-module Gradle build, UI → Presentation → Domain ← Data:

| Module | Purpose |
|---|---|
| `app` | Compose host, `ShareActivity` (share target), DI wiring |
| `feature:intake` | Ingest screen + ViewModel |
| `domain` | Pure Kotlin: models, repository interfaces, use cases. No Android deps. |
| `data:vault` | Room (scan history), DataStore (settings/consent), shared-media store |
| `core:designsystem` | Material 3 theme (light/dark/dynamic), verdict color semantics |
| `core:common` | Small shared utilities (e.g. injectable clock) |
| `core:testing` | Shared test rules |

Key stack: Kotlin, Jetpack Compose, Material 3, Hilt, Coroutines/Flow, Room,
DataStore. `minSdk 26`, `targetSdk 35`.

## Building

Prerequisites: JDK 17 and the Android SDK (easiest via
[Android Studio](https://developer.android.com/studio)).

```bash
# First time only: generate the Gradle wrapper (not committed), or open in Android Studio
gradle wrapper

./gradlew :app:assembleDebug     # build debug APK
./gradlew test                   # unit tests
./gradlew ktlintCheck detekt     # lint + static analysis
```

Install on a device/emulator: `./gradlew :app:installDebug`, then share any text
or image to **TruthGuard** from another app.

## Privacy principles

- Raw media never leaves the device by default; scans live only in the local vault.
- Cloud verification (P1+) is opt-in and sends extracted claim *text*, not media.
- No accounts, no analytics, no fabricated output: every number shown is computed,
  and "unverified" is an honest, first-class verdict.

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the
workflow, and the project's ground rules (the short version: no fabricated
output, honest verdicts, privacy by architecture, tests with every change).
Start with issues labeled `good-first-issue`.
