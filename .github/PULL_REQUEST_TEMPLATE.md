## What & why

<!-- What does this PR change, and what problem does it solve? Link the issue. -->

Closes #

## How it was tested

<!-- Commands run, devices/emulators used, screenshots for UI changes. -->

## Checklist

- [ ] `./gradlew ktlintCheck detekt test` passes locally
- [ ] New logic has tests in this PR
- [ ] No fabricated output: every user-visible number/status is computed (see CONTRIBUTING.md ground rules)
- [ ] `domain` module has no Android imports
- [ ] Room schema change? Exported schema in `data/vault/schemas/` is committed
- [ ] New dependency? PR description justifies it (need, maintenance status, alternatives)
