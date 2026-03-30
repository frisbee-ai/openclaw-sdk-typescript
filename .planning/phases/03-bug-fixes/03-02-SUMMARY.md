---
phase: 03-bug-fixes
plan: "03-02"
subsystem: sdk-core
tags: [websocket, reconnect, error-handling, request-manager]

# Dependency graph
requires:
  - phase: 02-code-health
    provides: Clean client architecture, factory functions
provides:
  - "Initial jittered delay before reconnect to prevent thundering herd"
  - "ConnectionError with CONNECTION_SEND_FAILED code on send() failure"
  - "Silent duplicate response handling in RequestManager"
affects: [03-bug-fixes, 04-transport-consolidation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Initial delay pattern: initialDelayMs * jitterFactor * Math.random()"
    - "ConnectionError wrapping for typed error propagation"

key-files:
  created: []
  modified:
    - src/managers/reconnect.ts - Initial delay before first reconnect
    - src/managers/reconnect.test.ts - Updated tests for initial delay
    - src/transport/websocket.ts - ConnectionError wrapping on send()
    - src/errors.ts - CONNECTION_SEND_FAILED error code
    - src/managers/request.ts - Silent duplicate response handling
    - tests/managers/request.test.ts - Updated test for silent return

key-decisions:
  - "BUG-03: Initial delay uses same jitter formula as calculateDelay() but without Fibonacci multiplier"
  - "BUG-04: handleError() called before throwing to preserve onerror callback"
  - "BUG-05: Debug-level logging for duplicate responses (expected in retry scenarios)"

patterns-established:
  - "Initial delay before thundering herd: delay = initialDelayMs * jitterFactor * random()"
  - "Typed ConnectionError wrapping preserves error semantics"

requirements-completed:
  - BUG-03
  - BUG-04
  - BUG-05

# Metrics
duration: 28min
completed: 2026-03-30
---

# Phase 03 Bug Fixes Plan 03-02 Summary

**Three isolated bug fixes: reconnect initial delay, typed WebSocket send errors, and silent duplicate response handling**

## Performance

- **Duration:** 28 min
- **Started:** 2026-03-30T02:59:38Z
- **Completed:** 2026-03-30T11:27:20Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- BUG-03: ReconnectManager now waits `initialDelayMs * jitterFactor * Math.random()` before first connectFn() call to prevent thundering herd
- BUG-04: WebSocketTransport.send() now throws ConnectionError with code CONNECTION_SEND_FAILED instead of raw WebSocketError
- BUG-05: RequestManager.resolveRequest() returns silently on duplicate response instead of throwing (expected in retry scenarios)

## Task Commits

Each task was committed atomically:

1. **BUG-03: Reconnect initial delay** - `6d94a31` (fix)
2. **BUG-04: WebSocket send typed error** - `74c1b37` (fix, another agent)
3. **BUG-05: RequestManager silent duplicate** - `7b8e5a3` (fix)

## Files Created/Modified

- `src/managers/reconnect.ts` - Added initial delay before first reconnect attempt
- `src/managers/reconnect.test.ts` - Updated tests to account for initial delay (vi.setConfig testTimeout: 20000)
- `src/transport/websocket.ts` - Import ConnectionError, throw ConnectionError on send() failure
- `src/errors.ts` - Added CONNECTION_SEND_FAILED to ConnectionErrorCode union
- `src/managers/request.ts` - Added logger, return silently on duplicate response
- `tests/managers/request.test.ts` - Updated test to expect no throw on duplicate

## Decisions Made

- BUG-03: Initial delay uses `initialDelayMs * jitterFactor * Math.random()` matching the jitter pattern in calculateDelay() but without Fibonacci multiplier
- BUG-04: handleError() called before throwing ConnectionError to preserve existing diagnostic behavior (onerror callback still fires)
- BUG-05: Debug-level logging for duplicates since these are expected in retry scenarios and should not appear in normal logs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Test timing issues: BUG-03 initial delay caused existing tests to timeout. Fixed by using `vi.setConfig({ testTimeout: 20000 })` and `initialDelayMs: 1, jitterFactor: 0` for fast test execution, plus `await new Promise(setTimeout, 50)` to wait for async delay.

## Next Phase Readiness

- All three bug fixes complete and verified
- 869 tests passing
- Ready for transport consolidation (phase 04) or remaining bug fixes (BUG-01, BUG-02 already completed by parallel agent)

---
*Phase: 03-bug-fixes*
*Completed: 2026-03-30*
