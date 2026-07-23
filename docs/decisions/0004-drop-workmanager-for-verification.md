# ADR 0004: Drop WorkManager for verification; call it directly from the ViewModel

Date: 2026-07-23 · Status: Accepted

## Context

Verification (P1) was first built as a `WorkManager` job: `ShareActivity` enqueued
an `AnalysisWorker` via a scheduler interface, on the assumption that
verification is exactly the kind of work `WorkManager` is designed for —
survive process death, run in the background, notify when done.

In practice this caused scans to spin in "Analyzing…" indefinitely with no
visible error. The root cause: WorkManager batches and delays work under
OS-driven "flexibility" constraints intended for deferrable background tasks
(periodic sync, deferred uploads) — not for work a user is actively watching
a screen and waiting on. Even after forcing the job to run immediately
(`setExpedited`), scheduling indirection added debugging surface (job IDs
rotating on retry, `adb shell cmd jobscheduler` inspection) for no benefit,
since the thing driving the whole flow — the verdict screen being open — was
already the perfect natural scope for the work's lifetime.

## Decision

Verification is a direct suspend-function call (`VerifyScanUseCase`) invoked
from `VerdictViewModel`'s `init` block, in `viewModelScope`. No scheduler, no
job, no background-execution indirection. `AnalysisWorker`,
`WorkManagerAnalysisScheduler`, the `AnalysisScheduler` domain interface, and
`RequeuePendingScansUseCase` (which existed to recover jobs stranded by the
scheduling layer) were all deleted.

## Consequences

- Verification starts the instant the verdict screen opens, with ordinary
  coroutine cancellation semantics (leaving the screen cancels it) instead of
  OS-managed background-job semantics.
- No "survives process death" guarantee — acceptable here because the scan is
  already persisted (Room) before verification runs; reopening the verdict
  screen re-triggers verification if it didn't finish.
- If a future feature genuinely needs deferrable background work (e.g. a
  periodic "recheck saved scans" sync), that is a legitimate WorkManager use
  case and should be added back deliberately for that feature — not reused
  from this deleted code, which was scoped to the wrong problem.
