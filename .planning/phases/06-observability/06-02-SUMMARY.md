---
phase: 06-observability
plan: "02"
subsystem: observability
tags: [metrics, telemetry, observability, typescript]

# Dependency graph
requires:
  - "06-01 (MetricsCollector interface)"
provides:
  - "Request latency tracking via onRequestLatency"
  - "Connection state change reporting via onConnectionStateChange"
  - "Message throughput reporting via onMessageThroughput"
  - "Zero-overhead metrics when disabled"
affects: [phase-06-observability]

# Tech tracking
tech-stack:
  added:
    - "performance.now() for sub-millisecond timing"
  patterns:
    - "setMetricsCollector() wiring pattern across managers"
    - "setInterval-based rolling counter for throughput"

key-files:
  modified:
    - src/client.ts
    - src/connection/state.ts
    - src/transport/websocket.ts
    - src/managers/connection.ts
    - src/client-builder.ts

key-decisions:
  - "WebSocketTransport.setMetricsCollector() starts interval on first call (lazy init)"
  - "ConnectionManager wires metricsCollector to transport via any-cast (avoids circular deps)"
  - "OpenClawClient wires metricsCollector to stateMachine after _internal assignment"
  - "ClientBuilder withMetrics() fluent method for chainable API"

requirements-completed: [OBS-01]

# Metrics
duration: 5min
completed: 2026-03-31
---

# Phase 06, Plan 02: Observability — MetricsCollector Wiring

**Wire MetricsCollector into request latency tracking, connection state change reporting, and message throughput counting**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-31T01:35:00Z
- **Completed:** 2026-03-31T01:40:00Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Added `onRequestLatency` tracking in `OpenClawClient.request()` using `performance.now()`
- Added `setMetricsCollector()` and `lastStateAt` tracking to `ConnectionStateMachine`
- Added `messageCount` counter and 1-second `setInterval` throughput reporting to `WebSocketTransport`
- Threaded `metricsCollector` through `ConnectionManager` to transport and state machine
- Added `withMetrics()` builder method to `ClientBuilder`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add latency tracking to client.ts** - `290a4c5` (feat)
2. **Task 2: ConnectionStateMachine observer** - `a6198cf` (feat)
3. **Task 3: WebSocketTransport throughput** - `d725901` (feat)
4. **Task 4: Thread through ConnectionManager** - `8e6a542` (feat)
5. **ClientBuilder withMetrics()** - `ef4f09d` (feat)

## Files Created/Modified

- `src/client.ts` - Added metricsCollector field, latency tracking in request()
- `src/connection/state.ts` - Added setMetricsCollector(), lastStateAt, emit observer
- `src/transport/websocket.ts` - Added messageCount, throughputInterval, setMetricsCollector()
- `src/managers/connection.ts` - Accept and wire metricsCollector to transport
- `src/client-builder.ts` - Added withMetrics() builder method

## Decisions Made

- WebSocketTransport.setMetricsCollector() starts the interval lazily on first call to avoid overhead when not needed
- ConnectionManager uses `as any` cast to call transport.setMetricsCollector() without creating circular imports
- OpenClawClient wires metricsCollector to stateMachine after _internal managers are assigned
- All metrics emissions use optional chaining (`?.`) for zero overhead when collector is registered but methods are undefined

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript strict mode: `npm run typecheck` passes
- All 893 tests pass: `npm test -- --run` passes

## Next Phase Readiness

- OBS-01 fully implemented: interface (plan 01) + wiring (plan 02)
- All three signals operational: request latency, connection state changes, message throughput
- Zero-overhead when metricsCollector is undefined (no-op guard pattern throughout)

---
*Phase: 06-observability*
*Completed: 2026-03-31*
