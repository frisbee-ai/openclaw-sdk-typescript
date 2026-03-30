---
phase: 03-bug-fixes
plan: "03-01"
subsystem: sdk-core
tags: [event-manager, token-cleanup, bug-fix, subscriptions]

# Dependency graph
requires: []
provides:
  - "EventManager once() token-based cleanup (BUG-01)"
  - "Redundant cleanupAbortHandler removed (BUG-02)"
affects: [Phase 03-bug-fixes plans 03-02 through 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "onceToken reference equality pattern for subscription cleanup"
    - "Array copy iteration in emit() to prevent iteration corruption during off()"

key-files:
  modified:
    - src/managers/event.ts
    - src/client.ts

key-decisions:
  - "onceToken is a unique object reference created per once() subscription"
  - "off(token: object) overload matches by onceToken === token reference equality"
  - "emit() iterates over array copies to avoid corruption when safeCall invokes wrapped handlers that call off()"

patterns-established:
  - "onceToken pattern: once() returns { token, unsubscribe } for explicit cleanup"
  - "Subscription cleanup must not corrupt iteration state"

requirements-completed: [BUG-01, BUG-02]

# Metrics
duration: 17min
completed: 2026-03-30
---

# Phase 03 Plan 01: Bug Fixes (BUG-01, BUG-02) Summary

**EventManager once() token-based cleanup and redundant abort handler removal completed**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-30T02:59:57Z
- **Completed:** 2026-03-30T11:17:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- BUG-01: EventManager once() now returns `{ token, unsubscribe }` for explicit token-based cleanup
- BUG-01: off(token) overload matches subscription by onceToken reference equality
- BUG-02: Removed redundant cleanupAbortHandler registration, finally block handles all cleanup

## Task Commits

1. **BUG-01: EventManager once() token-based cleanup** - `74c1b37` (fix)

**Plan metadata:** `74c1b37` (fix: complete BUG-01 and BUG-02)

## Files Created/Modified
- `src/managers/event.ts` - once() returns { token, unsubscribe }, off(token) overload, emit() uses array copy iteration
- `src/client.ts` - client.once() updated to return new API shape, cleanupAbortHandler removed from request()

## Decisions Made
- Used onceToken reference equality (not handler comparison) to match off() calls to once() subscriptions
- emit() iterates over `[...entries]` copies to prevent iteration corruption when off() removes entries during safeCall

## Deviations from Plan

**None - plan executed exactly as written**

## Auto-fixed Issues

**1. [Rule 1 - Bug] emit() iteration corruption when off() removes entries during safeCall**
- **Found during:** Task 1 (BUG-01 implementation)
- **Issue:** When once() wrapped handler called off() during emit(), splice() removed entries from live array causing next handler to be skipped
- **Fix:** emit() now iterates over array copies `[...exactHandlers]`, `[...entries]`, `[...wildcardSubscriptions]`
- **Files modified:** src/managers/event.ts
- **Verification:** Integration test "should work with regular handlers" passes (['once', 'regular', 'regular'])
- **Committed in:** 74c1b37 (BUG-01 task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - iteration corruption bug)
**Impact on plan:** Auto-fix was essential for correctness. No scope creep - all changes within BUG-01 scope.

## Issues Encountered
- None

## Next Phase Readiness
- BUG-01 and BUG-02 complete, ready for plans 03-02 through 03-05
- All 869 tests passing

---
*Phase: 03-bug-fixes*
*Completed: 2026-03-30*
