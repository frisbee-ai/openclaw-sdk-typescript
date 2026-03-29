# Phase 1: Critical Reliability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 01-critical-reliability
**Areas discussed:** REL-01 token refresh triggering, REL-02 timer loop ownership, REL-03 gap recovery dispatch

---

## REL-01: Token Refresh Triggering — When to Refresh

| Option | Description | Selected |
|--------|-------------|----------|
| Only after retryable auth errors | ReconnectManager calls refreshTokenFn only on AUTH_TOKEN_EXPIRED etc. — error-driven, minimal refresh calls | ✓ |
| Refresh on every reconnect | Always call refreshTokenFn before every reconnect attempt — conservative but adds Gateway load | |

**User's choice:** Only after retryable auth errors
**Notes:** Minimal approach, error-driven. Gateway负载不需要每次重连都刷新。

---

## REL-01 (continued): Who Owns the Refresh Callback

| Option | Description | Selected |
|--------|-------------|----------|
| ReconnectManager holds refresh callback | ReconnectManager.reconnect(connectFn, refreshTokenFn) — existing pattern, minimal changes | ✓ |
| client.ts holds refresh logic | client.ts listens for auth errors and coordinates refresh — more centralized | |

**User's choice:** ReconnectManager holds refresh callback
**Notes:** 与现有架构一致，最小改动。

---

## REL-02: Timer Loop Ownership

| Option | Description | Selected |
|--------|-------------|----------|
| TickMonitor self-manages setInterval | Internal setInterval in start(), cleared in stop() — cohesive, symmetric lifecycle | |
| client.ts manages | client.ts creates setInterval, clears in disconnect() — more scattered | |
| Reuse TimeoutManager with interval extension | Extend TimeoutManager with setInterval, TickMonitor uses it — unified timer management | ✓ |

**User's choice:** Extend TimeoutManager to support setInterval
**Notes:** 用户强调要统一管理，不要散落的 setInterval。TimeoutManager 当前只有 delay() 和 set()，需要增加 `setInterval()` 或 `startRepeat()` 方法。

---

## REL-03: Gap Recovery Action Dispatch

| Option | Description | Selected |
|--------|-------------|----------|
| client.ts handles gap events | client.ts listens to gapDetector.on('gap'), dispatches reconnect or snapshot based on mode — keeps GapDetector pure | ✓ |
| GapDetector self-triggers | GapDetector directly calls reconnect/snapshot — role confusion | |

**User's choice:** client.ts handles gap events
**Notes:** GapDetector 保持纯检测器角色，client.ts 作为编排层。

---

## Claude's Discretion

- GapDetector 的"第一次事件后的gap不触发"：需要 planner 实现时处理
- Snapshot HTTP 调用的实现方式（fetch vs HTTP client）
- Infinite reconnect loop 的防护机制

## Deferred Ideas

None — discussion stayed within phase scope.
