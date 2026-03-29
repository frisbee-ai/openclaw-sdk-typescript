---
phase: 01-critical-reliability
plan: 01
subsystem: auth
tags: [websocket, reconnect, token-refresh, auth-handler]

# Dependency graph
requires: []
provides:
  - ReconnectManager wired into ConnectionManager
  - AuthHandler.refreshToken() called on retryable auth errors during reconnect
  - Public reconnect() method on ConnectionManager for GapDetector recovery
affects: [02-critical-reliability, 03-critical-reliability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ReconnectManager as auth-aware retry orchestrator
    - Token refresh callback pattern (refreshTokenFn)

key-files:
  created: []
  modified:
    - src/managers/connection.ts
    - src/client.ts

key-decisions:
  - "ReconnectManager created in client.ts after authHandler, then passed to createConnectionManager"
  - "ConnectionManager stores reconnectManager and authHandler as optional fields"
  - "scheduleReconnect() uses ReconnectManager when both are wired, falls back to basic setTimeout"

patterns-established:
  - "Pattern: ReconnectManager.reconnect(connectFn, refreshTokenFn) where refreshTokenFn is authHandler.refreshToken()"
  - "Pattern: Token refresh only triggered for AUTH_TOKEN_EXPIRED, CHALLENGE_EXPIRED, AUTH_RATE_LIMITED errors"

requirements-completed: [REL-01]

# Metrics
duration: 8min
completed: 2026-03-29
---

# Phase 01 Critical Reliability: Plan 01 Summary

**AuthHandler.refreshToken() wired into ReconnectManager for automatic token refresh on retryable auth errors**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-29T12:35:44Z
- **Completed:** 2026-03-29T12:43:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- ConnectionManager accepts optional ReconnectManager and AuthHandler in constructor
- ReconnectManager.reconnect(connectFn, refreshTokenFn) pattern implemented for token refresh
- When reconnect encounters AUTH_TOKEN_EXPIRED, CHALLENGE_EXPIRED, or AUTH_RATE_LIMITED, authHandler.refreshToken() is called
- After successful token refresh, the new token is used for the next reconnect attempt
- Public reconnect() method added to ConnectionManager for GapDetector recovery (Plan 03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Modify ConnectionManager to accept ReconnectManager and AuthHandler** - `58a9e6d` (feat)
2. **Task 2: Wire ReconnectManager and AuthHandler in client.ts** - `6c65573` (feat)

**Plan metadata:** `6c65573` (included planning docs update)

## Files Created/Modified
- `src/managers/connection.ts` - Added reconnectManager/authHandler fields, public reconnect() method, private doReconnect(), updated scheduleReconnect() to use ReconnectManager when wired
- `src/client.ts` - Added createReconnectManager call with auth-aware config, passed to createConnectionManager alongside authHandler

## Decisions Made

- ReconnectManager is created in client.ts after authHandler is initialized, ensuring authHandler is available to pass as refreshTokenFn
- The `null ?? undefined` pattern (`this.authHandler ?? undefined`) used to satisfy TypeScript's strict null checking since authHandler field is `AuthHandler | null` but factory expects `AuthHandler | undefined`

## Deviations from Plan

**None - plan executed exactly as written**

## Issues Encountered

- ESLint flagging unused `ReconnectManager` type import in client.ts - resolved by changing to named import of `createReconnectManager` only
- TypeScript error `AuthHandler | null` not assignable to `AuthHandler | undefined` - resolved with `this.authHandler ?? undefined`

## Next Phase Readiness

- REL-01 complete: token refresh during reconnect now wired
- Plan 02 (TickMonitor setInterval) is independent and already committed
- Plan 03 (GapDetector recovery) will use the new public reconnect() method on ConnectionManager

---
*Phase: 01-critical-reliability*
*Completed: 2026-03-29*
