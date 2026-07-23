# Contributing to TruthGuard

Thanks for helping fight forwarded misinformation. This guide gets you from
clone to merged PR.

## Project context (read first)

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — what we're building and how the
  pieces fit. **Ten minutes here saves hours of misdirected work.**
- [docs/ROADMAP.md](docs/ROADMAP.md) — current phase and what's up next.
- [docs/decisions/](docs/decisions/) — why the big choices were made (native
  Kotlin, hybrid inference, free-first evidence tiers). Please read before
  proposing to change one of these.

## Setup

1. Install [Android Studio](https://developer.android.com/studio) (bundles the
   JDK and Android SDK).
2. Clone and open the project; Gradle sync uses the committed wrapper.
3. CLI builds work too:

```bash
./gradlew :app:assembleDebug        # build
./gradlew test                      # unit tests (debug + release variants)
./gradlew ktlintCheck detekt        # lint + static analysis
./gradlew :app:installDebug         # install on a connected device
```

Everything CI checks is runnable locally with those commands — a green local
run means a green PR build.

## Workflow

1. Pick or open a GitHub issue; comment that you're taking it.
2. Branch from `master`: `feature/<short-name>` or `fix/<short-name>`.
3. Make focused commits — one responsibility per commit, imperative subject
   line ("Add evidence cache TTL", not "added stuff").
4. Run `./gradlew ktlintFormat` before committing; CI enforces `ktlintCheck`,
   `detekt`, and all tests at zero tolerance.
5. Open a PR against `master` using the template. CI must be green; the PR
   should say what changed, why, and how it was tested.

## Ground rules (project-specific)

These come from the project's history — an earlier prototype failed because
it violated them (see [ADR 0001](docs/decisions/0001-native-kotlin-rebuild.md)
for the cautionary tale):

1. **No fabricated output, ever.** Every number, score, or status shown to a
   user must trace to a real computation. No `Math.random()` telemetry, no
   hardcoded demo answers, no always-green signals. PRs that fake output are
   rejected regardless of how good the UI looks.
2. **UNVERIFIED is a respectable verdict.** When evidence is thin, the app
   says so. Never let a code path escalate uncertainty into false confidence.
3. **Privacy is architectural.** Raw media stays on-device by default; cloud
   calls send extracted claim text only, behind explicit user consent. Don't
   add network calls outside this model without an ADR.
4. **`domain` stays pure Kotlin.** No Android imports there — it's what keeps
   the core logic trivially testable.
5. **Tests accompany implementation.** New logic lands with its tests in the
   same PR. Room schema changes commit the exported schema
   (`data/vault/schemas/`).
6. **Dependencies are justified.** Adding a library needs a sentence in the PR
   on why it's needed, its maintenance status, and what alternatives were
   considered. Prefer official AndroidX/Google libraries.

## Where help is most valuable right now

See [docs/ROADMAP.md](docs/ROADMAP.md) for the current phase. Issues labeled
`good-first-issue` are scoped for newcomers; `help-wanted` marks the areas
where an extra pair of hands matters most.

## Questions

Open a GitHub Discussion or an issue — design questions are welcome; the ADR
folder shows the kind of reasoning that gets a decision changed.
