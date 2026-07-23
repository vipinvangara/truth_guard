# Backlog

Task-level tracker. [ROADMAP.md](ROADMAP.md) says which *phase* we're in;
this says which *task* to actually pick up.

**How to use this**: pick an unchecked item, open a PR against it (mention
the item in the PR description), and check it off in that same PR. If two
people might collide on something, leave a comment on the PR referencing this
file, or open a GitHub Discussion — there's no separate claiming mechanism
yet. Difficulty tags: 🟢 good first issue (self-contained, a few hours) · 🟡
medium (touches multiple files/layers) · 🔴 needs design discussion first
(open an issue/Discussion before starting).

---

## P3 — Share-back + polish (current phase)

Objective: close the social loop — verdict card shareable back into the
chat, real history, accessible to everyone. See [ROADMAP.md](ROADMAP.md) and
[ARCHITECTURE.md §1](ARCHITECTURE.md#1-product-definition-v1-scope) for
why the share-back step matters as much as share-in.

- [ ] 🟡 Design + implement a shareable verdict card (Compose composable
      rendered to a bitmap → `ACTION_SEND` as an image). Must be
      screenshot-proof: no truncated verdict text at any font size, works for
      all five verdict colors, includes the source count.
- [ ] 🟢 Wire a "Share verdict" button on the verdict screen using the card
      above.
- [ ] 🟡 Build the Vault/history screen: list past scans (reuse
      `ObserveScansUseCase`), tap a row to reopen its verdict. `VaultScreen`
      doesn't exist yet — this is a new `feature:vault` module, mirroring
      `feature:verdict`'s structure.
- [ ] 🟢 Empty state for Vault ("Nothing checked yet") and a per-row status
      badge (reuse the one in `IngestScreen.kt`, consider extracting it to
      `core:designsystem` since it'll be used in 3 places).
- [ ] 🟢 Accessibility: TalkBack content descriptions audit across
      `feature:intake` and `feature:verdict` — several icon-only buttons are
      missing them (start with `IngestScreen`'s clipboard-paste button).
- [ ] 🟢 Accessibility: verify all text/background pairs meet WCAG AA
      contrast in both light and dark theme (`core:designsystem/Theme.kt`).
- [ ] 🟡 Accessibility: test the whole app at 200% system font scale: nothing
      should clip or overlap (`VerdictScreen`'s verdict chip + confidence
      row is the most likely place to break first).

## Known gaps (pick up anytime, not phase-gated)

- [ ] 🟢 Configure `TRUTHGUARD_FACTCHECK_API_KEY` (Google Fact Check Tools)
      on the dev backend and confirm real fact-checker hits surface for a
      known claim (e.g. something BOOM/Alt News/Factly has already covered).
      Currently unset — evidence is Wikipedia-only. See
      [ADR 0003](decisions/0003-free-first-evidence-tiers.md).
- [ ] 🔴 Statistical/count claims ("over 40 X between Y and Z") can't be
      verified — no source in the current stack aggregates counts (see the
      "Known gap" section in [ROADMAP.md](ROADMAP.md)). Needs a design
      discussion before starting: likely a general web-search provider
      (Brave Search free tier / SearXNG), not a Wikipedia fix.
- [ ] 🟡 Deploy the backend to Cloud Run (pulls forward P5 prep) so testing
      doesn't require running `backend/` on a laptop on the same LAN. No
      Dockerfile or deploy script exists for the v2 backend yet — this is
      greenfield (see `backend/README.md` for local-run instructions to
      build from).
- [ ] 🔴 `adb reverse tcp:8000 tcp:8000` accepts connections on-device but
      never forwards them to the host — root cause not found; the
      LAN-IP workaround (`data/verification/build.gradle.kts`) works but
      means every dev machine needs its IP hardcoded or passed via
      `-PtruthguardApiBaseUrl=`. Worth a proper fix if someone can reproduce
      and diagnose it.
- [ ] 🟡 Eval harness v0: a labeled set of ~100 real, resolved claims run
      against the pipeline, reporting accuracy / UNVERIFIED-rate /
      hallucinated-citation-rate. See
      [ARCHITECTURE.md §9](ARCHITECTURE.md#9-testing--ci). Nothing exists
      for this yet — greenfield.

## Later (P4+, don't start without discussion — see ROADMAP.md)

- [ ] 🔴 Play Billing entitlement + Premium evidence/judgment providers
      behind the existing `EvidenceProvider`/`JudgmentProvider` shape
      (P4).
- [ ] 🔴 Play Integrity device attestation before issuing rate-limit tokens
      (P5).
- [ ] 🔴 Certificate pinning for the backend host (P5).
- [ ] 🔴 Video/audio analysis — frame sampling + ASR feeding the same claim
      pipeline (P6+).
- [ ] 🔴 Localized (Hindi-first) UI — the pipeline already handles
      non-English *content* via ML Kit; this is the app UI itself.
