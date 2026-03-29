# Phase 1: Critical Reliability - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the SDK self-healing — it must automatically recover from token expiry, connection stalls, and message gaps. Three specific requirements: wire AuthHandler into reconnect path (REL-01), activate TickMonitor timer loop (REL-02), implement GapDetector recovery actions (REL-03).
</domain>

<decisions>
## Implementation Decisions

### REL-01: AuthHandler Token Refresh Triggering

- **D-01:** Token refresh is triggered **only after retryable auth errors** — not on every reconnect attempt. Refresh is called when ReconnectManager encounters `AUTH_TOKEN_EXPIRED`, `CHALLENGE_EXPIRED`, or `AUTH_RATE_LIMITED`.
- **D-02:** **ReconnectManager owns the refresh callback** — `ReconnectManager.reconnect(connectFn, refreshTokenFn)` already supports this pattern. ConnectionManager passes the refresh function to ReconnectManager. No changes to client.ts orchestration needed.

### REL-02: TickMonitor Timer Loop

- **D-03:** **TimeoutManager is extended to support repeated intervals** — add a `setInterval()` method (or `startRepeat` / `scheduleRepeat`) to the existing TimeoutManager in `src/utils/timeoutManager.ts`. This unifies all timer management in one place rather than scattering setInterval calls across the codebase.
- **D-04:** **TickMonitor uses TimeoutManager for its polling loop** — when `start()` is called, TickMonitor schedules periodic `checkStale()` calls via the new TimeoutManager interval method. `stop()` clears the interval. This satisfies the STATE.md concern about memory leaks (timer cleanup) while reusing existing infrastructure.

### REL-03: GapDetector Recovery Actions

- **D-05:** **client.ts handles gap recovery** — client.ts listens to `gapDetector.on('gap', ...)` and dispatches recovery based on the configured `mode`:
  - `'reconnect'` mode → calls `ConnectionManager.reconnect()` (or equivalent client reconnect method)
  - `'snapshot'` mode → calls the configured `snapshotEndpoint` via HTTP
  - `'skip'` mode → no action, just logs
- **D-06:** GapDetector itself remains a **pure detector** — it only emits events and calls the `onGap` notification callback. It does not trigger recovery actions directly. This separation of concerns keeps GapDetector simple and testable.

### Claude's Discretion

The following are left to downstream agents (researcher/planner) to decide:
- Exact `setInterval` API shape on TimeoutManager (method name, signature, handle return type)
- How client.ts detects reconnect completion to re-wire event handlers after reconnect
- HTTP call implementation for snapshot mode (use built-in fetch? a new HTTP client utility?)
- How to prevent infinite reconnect loops when gap detection triggers reconnect which triggers another gap

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Files (relevant to Phase 1)
- `src/auth/provider.ts` — AuthHandler, CredentialsProvider, StaticCredentialsProvider, refreshToken interface
- `src/events/tick.ts` — TickMonitor, checkStale(), recordTick(), isStale() — note: checkStale() is never called automatically currently
- `src/events/gap.ts` — GapDetector, GapRecoveryMode, GapInfo — note: onGap callback is notification-only, no recovery action taken
- `src/managers/reconnect.ts` — ReconnectManager, reconnect(connectFn, refreshTokenFn), RETRYABLE_AUTH_ERRORS — already has refreshTokenFn parameter
- `src/managers/connection.ts` — ConnectionManager, connect(), scheduleReconnect() — currently does NOT call refreshToken on reconnect
- `src/client.ts` — OpenClawClient, wires TickMonitor and GapDetector, currently missing timer loop and recovery action wiring
- `src/utils/timeoutManager.ts` — TimeoutManager — needs `setInterval` extension

### Requirements Traceability
- `ROADMAP.md` — Phase 1: Critical Reliability (REL-01, REL-02, REL-03) with success criteria
- `REQUIREMENTS.md` — REL-01, REL-02, REL-03 definitions
- `STATE.md` — Open issues: "TickMonitor timer loop must be stopped on client disconnect to prevent memory leaks"

### No external specs — requirements fully captured above
</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- **ReconnectManager already has `refreshTokenFn` parameter** — `reconnect(connectFn, refreshTokenFn)` at line 237-239. The infrastructure is already there, just not wired from ConnectionManager.
- **TimeoutManager** — centralized timeout management with automatic cleanup, named timeouts, delay() API. Already used by ReconnectManager, WebSocketTransport. Needs `setInterval` extension.
- **GapDetector already has `onGap` callback and `mode` enum** — `'reconnect' | 'snapshot' | 'skip'` at line 15. Recovery config exists but is never invoked.

### Established Patterns
- Factory functions: `createAuthHandler()`, `createTickMonitor()`, `createGapDetector()`, `createReconnectManager()`
- Event-driven: ConnectionManager → EventManager → TickMonitor/GapDetector
- Logger injection: Optional Logger in constructors with console fallback
- Error hierarchy: OpenClawError → AuthError/ConnectionError/ReconnectError with typed error codes

### Integration Points
- `client.ts:670-676` — tick handler subscription: `this.eventManager.on('tick', frame => this.tickMonitor?.recordTick(ts))` — where timer loop should feed checkStale()
- `client.ts:655-684` — gapDetector and tickMonitor initialization in connect() — where recovery event handlers should be wired
- `client.ts:714-719` — disconnect cleanup — where tickMonitor.stop() is already called (good anchor point for interval cleanup)
- `ConnectionManager:408-423` — scheduleReconnect() — where refreshTokenFn should be passed through
</codebase_context>

<specifics>
## Specific Ideas

- GapDetector recovery actions (D-05) should NOT trigger on the first event after connect — there is always a gap between expected seq 1 and first received seq. Need to track "initialized" state.
- The snapshot endpoint call for 'snapshot' mode should be an HTTP POST to the configured URL, with the gap info as JSON body. Need to decide if it runs async (fire-and-forget) or blocks.
- Reconnect loop protection: if gap-triggered reconnect results in another gap within N seconds, escalate to error rather than infinite loop. This is a planner decision.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-critical-reliability*
*Context gathered: 2026-03-29*
