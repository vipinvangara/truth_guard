# ADR 0001: Rebuild natively in Kotlin/Compose, archive the Expo prototype

Date: 2026-07-23 · Status: Accepted

## Context

The original prototype was React Native/Expo. A full technical audit found:
~48% of its source files were dead code; the "AI" layer largely keyword-matched
six hardcoded demo scenarios; the backend had two guaranteed crash bugs; and the
product's core acquisition flow — receiving an Android share intent from
WhatsApp — did not exist and is awkward to build well in managed Expo. The
project's engineering standards target production-quality native Android.

## Decision

Rebuild as a native Kotlin + Jetpack Compose app (multi-module Clean
Architecture). `master` hosts the rebuild; the Expo prototype was retired
once the native rebuild reached feature parity with it.

## Consequences

- First-class share-target/`ACTION_PROCESS_TEXT` integration, ML Kit and
  on-device inference access, Room/DataStore persistence.
- The old UI had to be rewritten (Compose), but the logic layer needed a
  rewrite regardless.
- Contributors need Android/Kotlin familiarity rather than React Native.
