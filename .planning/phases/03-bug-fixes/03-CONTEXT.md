# Phase 3: Bug Fixes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 5 bugs identified in codebase analysis — most are one-liners but critical for correctness.

- BUG-01: EventManager once() off() cleanup bug
- BUG-02: Redundant cleanupAbortHandler in client.ts
- BUG-03: Add reconnect delay before first attempt
- BUG-04: WebSocketTransport.send() throws raw Error instead of typed ConnectionError
- BUG-05: RequestManager.resolveRequest() throws on duplicate response

</domain>

<decisions>
## Implementation Decisions

### BUG-01: EventManager once() off() Reference Bug

**Problem:** `once()` stores a wrapper function, but `off(handler)` matches by the original handler reference — so `client.off('event', originalHandler)` never unsubscribes a `once()` subscription.

**Fix approach: onceToken pattern**

- **D-01:** `once()` returns `{ token, unsubscribe }` where `token` is an object reference
- **D-02:** `off()` accepts `token` as first parameter — new overload: `off(token)` matches subscription by `onceToken === token`
- **D-03:** `once()` stores the `onceToken` in `SubscriptionEntry` at registration time
- **D-04:** Existing `on()` behavior unchanged — `onceToken` field only set for once() subscriptions

**API shape:**
```ts
// once() usage
const { token, unsubscribe } = events.once('tick', handler);
// Later: pass token to off()
events.off(token);  // removes subscription by token reference
// Or use unsubscribe() as before
unsubscribe();
```

### BUG-02: Redundant Abort Handler Cleanup

**Problem:** `cleanupAbortHandler` registered as `once: true` listener AND finally block manually removes `abortHandler` — double cleanup.

**Fix:**
- **D-05:** Remove `cleanupAbortHandler` registration (`options.signal.addEventListener('abort', cleanupAbortHandler, { once: true })`)
- **D-06:** Keep only the finally block cleanup (`options.signal.removeEventListener('abort', abortHandler)`)
- This is a pure simplification — no behavioral change, just removing dead code

### BUG-03: Reconnect Initial Delay (Thundering Herd)

**Problem:** First `connectFn()` in `ReconnectManager.reconnect()` is called with no delay — mass reconnect after outage causes thundering herd.

**Fix:**
- **D-07:** Before the first `connectFn()` call, wait `initialDelayMs * jitterFactor` milliseconds
- This adds randomness to the first attempt, consistent with the jitter approach already used between attempts
- Formula: `delay = initialDelayMs * jitterFactor * Math.random()` — same jitter pattern as `calculateDelay()`

### BUG-04: WebSocketTransport.send() Typed Error

**Problem:** `ws.send()` errors propagate as raw `Error`/`WebSocketError` instead of typed `ConnectionError` subclass.

**Fix:**
- **D-08:** Catch `ws.send()` errors and wrap in `ConnectionError` with code `CONNECTION_SEND_FAILED`
- `ConnectionError` already exists in the error hierarchy — reuse it
- `handleError(error)` should still be called for the `onerror` callback before throwing

### BUG-05: RequestManager Duplicate Response Handling

**Problem:** `resolveRequest()` throws when called with an ID that has already been resolved (server retry scenario).

**Fix:**
- **D-09:** Return silently on duplicate — log a debug-level warning and return without throwing
- **D-10:** Log message: `"Duplicate response received for request ID "${id}" — ignoring"`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Constraints
- `.planning/ROADMAP.md` — Phase 3 goals and success criteria
- `.planning/PROJECT.md` — Core value, constraints (strict TypeScript, backward compat)
- `.planning/REQUIREMENTS.md` — BUG-01 through BUG-05 definitions

### Phase 1 & 2 Context (carried forward)
- `.planning/phases/01-critical-reliability/01-CONTEXT.md` — Factory functions pattern, separation of concerns
- `.planning/phases/02-code-health/02-CONTEXT.md` — Builder pattern, breaking changes accepted

### Source Files (bug locations)
- `src/managers/event.ts` — SubscriptionEntry interface (lines 38-47), once() (lines 161-171), off() (lines 176-226)
- `src/client.ts` — cleanupAbortHandler (lines 676-725), request() method
- `src/managers/reconnect.ts` — reconnect() loop (lines 237-332), calculateDelay() (lines 192-203)
- `src/transport/websocket.ts` — send() method (lines 416-432), WebSocketError interface (lines 60-67)
- `src/managers/request.ts` — resolveRequest() (lines 95-112)
- `src/errors.ts` — ConnectionError, error code constants

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- **ConnectionError class** — exists in `src/errors.ts`, used throughout — BUG-04 wraps ws errors in this
- **SubscriptionEntry interface** — already has `onceToken?: object` field (line 45-46) — unused until BUG-01 fix
- **FIBONACCI_TABLE** — already computed in reconnect.ts for backoff — BUG-03 uses jitterFactor from config

### Established Patterns
- Factory functions: all managers use `createXxx()` pattern
- Error hierarchy: `OpenClawError` → `ConnectionError`/`AuthError`/`ReconnectError` with typed codes
- Logger injection: optional Logger with console fallback

### Integration Points
- `client.ts:request()` — where BUG-02 cleanup lives
- `event.ts` — BUG-01 affects public API of EventManager (once, off)
- `websocket.ts` — BUG-04 is self-contained within send() method
- `request.ts` — BUG-05 is self-contained within resolveRequest()
- `reconnect.ts` — BUG-03 affects the reconnect loop structure

</codebase_context>

<specifics>
## Specific Ideas

- BUG-01: The returned `unsubscribe()` function from `once()` should still call `off(wrapped)` internally — existing behavior for that path preserved
- BUG-04: When `send()` throws, the `onerror` callback should still be called (via `handleError`) before throwing — preserves existing diagnostic behavior
- BUG-05: Warning level should be DEBUG — these are expected in retry scenarios and should not appear in normal logs

</specifics>

<deferred>
## Deferred Ideas

None — all 5 bugs are scoped and discussed.

</deferred>

---

*Phase: 03-bug-fixes*
*Context gathered: 2026-03-30*
