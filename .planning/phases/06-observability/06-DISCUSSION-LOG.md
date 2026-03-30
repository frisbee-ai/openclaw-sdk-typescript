# Phase 6: Observability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 06-observability
**Areas discussed:** Hook Design, What to Emit, Disabled Overhead

---

## Gray Area 1: Hook Design

| Option | Description | Selected |
|--------|-------------|----------|
| Callback interface | Consumer provides any object with onRequestLatency, onConnectionStateChange, onMessageThroughput methods | ✓ |
| Abstract class | OOP class hierarchy with instanceof checks — adds coupling | |

**User's choice:** Callback interface
**Notes:** Simpler, no class coupling. Follows Logger pattern from Phase 1.

---

## Gray Area 2: What to Emit

| Option | Description | Selected |
|--------|-------------|----------|
| All 3 signals | Request latency + Connection uptime + Message throughput | ✓ |
| Request latency only | Simpler, but incomplete against OBS-01 spec | |
| Request + Connection | Two signals, message throughput deferred | |

**User's choice:** All 3 signals
**Notes:** One-shot delivery of full OBS-01 scope.

---

## Gray Area 3: Disabled Overhead

| Option | Description | Selected |
|--------|-------------|----------|
| no-op guard | `if (!collector) return` before every emit call | ✓ |
| Optional chaining | `collector?.onRequestLatency(...)` — still dispatches | |
| Existing code paths only | Only call inside already-traversed paths | |

**User's choice:** no-op guard
**Notes:** V8 can inline the check; zero allocation, zero dispatch when disabled.

---

## Claude's Discretion

None — all decisions made by user.

## Deferred Ideas

None.

