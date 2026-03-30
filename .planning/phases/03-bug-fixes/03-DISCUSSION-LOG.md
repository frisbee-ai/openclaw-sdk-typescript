# Phase 3: Bug Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 03-bug-fixes
**Areas discussed:** BUG-01 (once off cleanup), BUG-02 (cleanup abort), BUG-03 (reconnect delay), BUG-04 (send error), BUG-05 (duplicate response)

---

## BUG-01: EventManager once() off() Reference Bug

| Option | Description | Selected |
|--------|-------------|----------|
| A. Store original handler | Add `originalHandler` to `SubscriptionEntry`; `off()` matches by original ref | |
| B. Use onceToken pattern | Use existing `onceToken?: object` field; return token from `once()` for `off(token)` to use | ✓ |

**User's choice:** B. Use onceToken pattern

### Token API Design

| Option | Description | Selected |
|--------|-------------|----------|
| B1. Return {token, unsubscribe} | `once()` returns `{token, unsubscribe}`; `off(token)` new overload | |
| B2. Token as Symbol | `once()` returns `UnsubscribeFn & {token}`; token is a symbol | |
| B3. off() with token param | `off()` gets new overload: `off(token)`; `once()` stores token at registration time | ✓ |

**User's choice:** B3. off() with token param

---

## BUG-02: Redundant Abort Handler Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Remove cleanupAbortHandler listener, keep finally block only | Simplification — remove dead code | ✓ (no decision needed — pure simplification) |

**User's choice:** Proceed with simplification

---

## BUG-03: Reconnect Initial Delay (Thundering Herd)

| Option | Description | Selected |
|--------|-------------|----------|
| A. initialDelayMs | Use existing config.initialDelayMs (default 1000ms) | |
| B. initialDelayMs + Fibonacci | Use Fibonacci table like subsequent attempts | |
| C. Separate config field | Add new config.firstAttemptDelayMs | |
| D. initialDelayMs * jitter | Custom: initialDelayMs * jitterFactor * random | ✓ |

**User's choice:** D. initialDelayMs * jitterFactor

---

## BUG-04: WebSocketTransport.send() Typed Error

| Option | Description | Selected |
|--------|-------------|----------|
| A. CONNECTION_SEND_FAILED | Wrap in ConnectionError with CONNECTION_SEND_FAILED code | ✓ |
| B. ConnectionError base | Use generic ConnectionError without specific sub-code | |

**User's choice:** A. CONNECTION_SEND_FAILED

---

## BUG-05: RequestManager Duplicate Response

| Option | Description | Selected |
|--------|-------------|----------|
| A. Return silently | Just return — no-op on duplicate | |
| B. Log warning | Log a debug-level warning about duplicate response | ✓ |

**User's choice:** B. Log warning

**Notes:** Warning level should be DEBUG — these are expected in retry scenarios and should not appear in normal logs

---

## Claude's Discretion

All 5 bugs discussed with concrete decisions. No areas left to Claude.

