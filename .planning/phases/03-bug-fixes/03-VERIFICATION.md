---
phase: 03-bug-fixes
verified: 2026-03-30T11:42:49Z
status: passed
score: 5/5 must-haves verified
gaps: []
---

# Phase 03: Bug Fixes Verification Report

**Phase Goal:** Fix all critical reliability bugs (BUG-01 through BUG-05) -- EventManager once/off token cleanup, redundant abort handler removal, reconnect initial delay, WebSocket send typed error, duplicate response handling.

**Verified:** 2026-03-30T11:42:49Z
**Status:** passed
**Re-verification:** No (initial verification)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --|-------|--------|----------|
| 1 | `client.once()` returns `{ token, unsubscribe }` for token-based cleanup | VERIFIED | `src/managers/event.ts` lines 198-201: returns `{ token: onceToken, unsubscribe: () => this.off(onceToken) }` |
| 2 | `client.off(token)` removes a once() subscription by reference equality | VERIFIED | `src/managers/event.ts` lines 207-246: `off(token: object)` overload matches by `onceToken === token`, searches all subscription maps |
| 3 | Abort handler cleanup exists in exactly one place (finally block only) | VERIFIED | `src/client.ts` lines 706-711: `cleanupAbortHandler` variable absent; only `finally { removeEventListener }` remains; `grep cleanupAbortHandler` returns no results |
| 4 | First reconnect attempt waits `initialDelayMs * jitterFactor * random()` before connecting | VERIFIED | `src/managers/reconnect.ts` lines 246-250: initial delay calculated and `await this.delay(initialDelay)` called before while loop |
| 5 | Duplicate server responses handled silently without throwing | VERIFIED | `src/managers/request.ts` lines 111-115: `if (!entry) { logger.debug(...); return; }` -- no throw |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/managers/event.ts` | once() token pattern, off(token) overload, min 60 lines | VERIFIED | 464 lines; once() at 163-202, off(token) at 207-246, emit() uses array-copy iteration |
| `src/client.ts` | Single finally-block abort cleanup, min 15 lines | VERIFIED | finally block at 706-711, 47 lines of abort handling context; cleanupAbortHandler absent |
| `src/managers/reconnect.ts` | Initial delay before first reconnect, min 10 lines | VERIFIED | 407 lines; initial delay at 246-250 (5 lines of delay logic) |
| `src/transport/websocket.ts` | ConnectionError wrapping on ws.send() failure, min 12 lines | VERIFIED | 508 lines; send() at 417-441, ConnectionError thrown at 433-439 (7 lines) |
| `src/managers/request.ts` | Silent duplicate response handling with logger, min 8 lines | VERIFIED | 278 lines; duplicate return at 111-115 (5 lines, including logger.debug) |
| `src/errors.ts` | CONNECTION_SEND_FAILED in ConnectionErrorCode union | VERIFIED | Line 129: `\| 'CONNECTION_SEND_FAILED'` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/transport/websocket.ts` | `src/errors.ts` | `ConnectionError` import (line 11) | WIRED | `ConnectionError` imported and used in send() catch block to throw typed error |
| `src/managers/request.ts` | `src/types/logger.js` | `Logger` type, `LogLevel` import (line 12) | WIRED | `logger.debug()` called at line 114 for duplicate response |
| `src/managers/event.ts` | `SubscriptionEntry` | `onceToken` field in entry (line 46, 182) | WIRED | onceToken is set on registration (line 182) and used for lookup (line 227) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `src/managers/event.ts` | SubscriptionEntry.onceToken | Created fresh per once() call (line 168: `const onceToken = {}`) | Yes | FLOWING |
| `src/managers/request.ts` | pendingRequests map | Added via addRequest(), resolved via resolveRequest() | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite | `npm test -- --run` | 869 passed, 47 test files | PASS |
| CONNECTION_SEND_FAILED exists | `grep -n "CONNECTION_SEND_FAILED" src/errors.ts` | Line 129 present | PASS |
| cleanupAbortHandler removed | `grep -n "cleanupAbortHandler" src/client.ts` | No output (absent) | PASS |
| Initial delay in reconnect | `grep -n "initialDelay" src/managers/reconnect.ts` | Lines 24-25, 246-250 | PASS |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | - |

No TODO/FIXME/PLACEHOLDER comments, no stub implementations, no hardcoded empty data.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BUG-01 | 03-01-PLAN.md | EventManager once() token-based cleanup | SATISFIED | once() returns `{ token, unsubscribe }`, off(token) by reference equality |
| BUG-02 | 03-01-PLAN.md | Redundant abort handler removal | SATISFIED | cleanupAbortHandler variable and registration removed; finally block only |
| BUG-03 | 03-02-PLAN.md | Reconnect initial delay | SATISFIED | `initialDelayMs * jitterFactor * Math.random()` before first connectFn() |
| BUG-04 | 03-02-PLAN.md | WebSocket send typed error | SATISFIED | ConnectionError with CONNECTION_SEND_FAILED thrown on ws.send() failure |
| BUG-05 | 03-02-PLAN.md | Silent duplicate response handling | SATISFIED | resolveRequest() returns silently on missing entry with debug log |

### Human Verification Required

None -- all bug fixes are programmatically verifiable.

### Gaps Summary

No gaps found. All 5 bug fixes verified:
- **BUG-01**: once() returns `{ token, unsubscribe }`, off(token) uses reference equality against onceToken
- **BUG-02**: cleanupAbortHandler removed; only finally-block cleanup remains in client.ts request()
- **BUG-03**: ReconnectManager waits jittered initial delay before first connectFn() call (thundering herd prevention)
- **BUG-04**: WebSocketTransport.send() wraps errors in ConnectionError with code CONNECTION_SEND_FAILED
- **BUG-05**: RequestManager.resolveRequest() silently returns on duplicate response (expected in retry scenarios)

869 tests pass across 47 test files. All artifacts are substantive (not stubs), wired to their dependencies, and free of anti-patterns.

---

_Verified: 2026-03-30T11:42:49Z_
_Verifier: Claude (gsd-verifier)_
