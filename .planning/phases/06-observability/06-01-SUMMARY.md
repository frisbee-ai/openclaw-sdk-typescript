---
phase: 06-observability
plan: "01"
subsystem: observability
tags: [metrics, telemetry, observability, typescript]

# Dependency graph
requires: []
provides:
  - "MetricsCollector callback interface with onRequestLatency, onConnectionStateChange, onMessageThroughput"
  - "metricsCollector field in ClientConfig"
  - "MetricsCollector type export from SDK index"
affects: [phase-06-observability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional callback interface (no-op guard pattern for zero overhead)"
    - "isX type guard following Logger pattern"

key-files:
  created:
    - src/metrics/collector.ts
  modified:
    - src/client-config.ts
    - src/index.ts

key-decisions:
  - "MetricsCollector is callback interface with optional methods (not required methods)"
  - "Three signals: request latency, connection state changes, message throughput"
  - "Zero overhead when not provided — SDK checks method existence before calling"
  - "metricsCollector placed in ClientConfig alongside logger"

patterns-established:
  - "Optional hook interface with isX type guard (same pattern as Logger)"

requirements-completed: [OBS-01]

# Metrics
duration: 1min
completed: 2026-03-31
---

# Phase 06, Plan 01: Observability — MetricsCollector Interface

**MetricsCollector callback interface for request latency, connection state changes, and message throughput with zero overhead when disabled**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-30T17:25:21Z
- **Completed:** 2026-03-30T17:26:29Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created `src/metrics/collector.ts` with `MetricsCollector` interface and `isMetricsCollector` type guard
- Added `metricsCollector?: MetricsCollector` to `ClientConfig` in `src/client-config.ts`
- Exported `MetricsCollector` and `isMetricsCollector` from `src/index.ts`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MetricsCollector interface** - `3f4b6f0` (feat)
2. **Task 2: Add metricsCollector to ClientConfig** - `a416a7c` (feat)
3. **Task 3: Export MetricsCollector from index.ts** - `4f68fb5` (feat)

## Files Created/Modified
- `src/metrics/collector.ts` - MetricsCollector interface with 3 optional callbacks and type guard
- `src/client-config.ts` - Added metricsCollector?: MetricsCollector field
- `src/index.ts` - Added MetricsCollector and isMetricsCollector exports

## Decisions Made

- MetricsCollector is a callback interface with optional methods — SDK calls only methods that are defined, ensuring zero overhead when not provided
- Three signals: `onRequestLatency(method, latencyMs)`, `onConnectionStateChange(state, durationMs?)`, `onMessageThroughput(count, periodMs)`
- `metricsCollector` placed alongside `logger` in ClientConfig for consistency
- Follows the same optional-hook + type-guard pattern as the Logger interface

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Plan 06-01 (interface definition) complete — plan 06-02 will wire MetricsCollector into the SDK
- OBS-01 requirement split into two plans: interface (plan 01) and wiring (plan 02)

---
*Phase: 06-observability*
*Completed: 2026-03-31*
