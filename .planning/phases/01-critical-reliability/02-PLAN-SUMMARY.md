---
phase: 01-critical-reliability
plan: 02
subsystem: events
tags: [tick-monitor, timeout-manager, staleness, heartbeat, connection-health]

# Dependency graph
requires:
  - phase: 01-critical-reliability-01
    provides: AuthHandler wired into reconnect path, TimeoutManager class
provides:
  - TimeoutManager.setInterval() for repeating timer execution
  - TickMonitor automatic staleness detection via periodic checkStale() calls
  - TimerHandle interface for interval management
affects:
  - 01-critical-reliability-03
  - 02-code-health
  - connection-lifecycle

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TimeoutManager as centralized timer registry (setInterval/clearInterval)
    - TickMonitor timer loop pattern for automatic health checking

key-files:
  created: []
  modified:
    - src/utils/timeoutManager.ts
    - src/events/tick.ts

key-decisions:
  - "Using TimeoutManager.setInterval() instead of raw setInterval - keeps all timers trackable in one place"
  - "TickMonitor stores optional TimeoutManager in config - enables injection for testing"
  - "checkIntervalMs equals tickIntervalMs - periodic checks fire at same rate as expected ticks"

patterns-established:
  - "Pattern: Timer loop via TimeoutManager.setInterval() for periodic health checks"

requirements-completed:
  - REL-02

# Metrics
duration: 377s
completed: 2026-03-29T12:41:01Z
---

# Phase 01, Plan 02: TickMonitor Automatic Staleness Detection

**TimeoutManager.setInterval() wired into TickMonitor for automatic periodic checkStale() calls**

## Performance

- **Duration:** 6 min 17 sec
- **Started:** 2026-03-29T12:35:44Z
- **Completed:** 2026-03-29T12:41:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added setInterval/clearInterval support to TimeoutManager
- Wired automatic staleness detection into TickMonitor via periodic timer loop
- TimerHandle interface exported for interval management
- TickMonitor.start() schedules checkStale() via TimeoutManager.setInterval()
- TickMonitor.stop() clears the interval timer (fixes potential memory leak)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add setInterval method to TimeoutManager** - `6677cf6` (feat)
2. **Task 2: Wire setInterval into TickMonitor for automatic checkStale()** - `9938e59` (feat)

## Files Created/Modified
- `src/utils/timeoutManager.ts` - Added TimerHandle interface, setInterval(), clearInterval(), intervals Map, modified clearAll() and has()
- `src/events/tick.ts` - Added TimeoutManager import, timeoutManager/timerHandle/checkIntervalMs fields, wired timer loop in start()/stop()

## Decisions Made
- Used TimeoutManager.setInterval() instead of raw setInterval (keeps all timers trackable)
- Timer loop fires at tickIntervalMs rate, staleness threshold uses staleMultiplier (2x by default)
- Optional timeoutManager in TickMonitorConfig for testability (creates internal instance if not provided)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Git stash conflict with plan-01 changes when restoring - resolved by restoring unrelated files and re-applying Task 2 changes

## Next Phase Readiness
- Timer loop infrastructure in place for future phases
- GapDetector and other components can use similar pattern for periodic health checks
- Requirement REL-02 satisfied

---
*Phase: 01-critical-reliability-02*
*Completed: 2026-03-29*
