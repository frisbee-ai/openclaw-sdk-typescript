# Phase 4: Transport Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 04-transport-consolidation
**Areas discussed:** Architecture, TLS Validator, Factory Function, Binary Data Handling

---

## Area 1: Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| A: Base Class Inheritance | websocket.ts becomes abstract base class; node.ts/browser.ts as thin subclasses | ✓ |
| B: Single Transport | Merge all into websocket.ts, delete node.ts/browser.ts | |

**User's choice:** A — Base Class Inheritance Pattern
**Notes:** websocket.ts becomes abstract base class containing all shared logic. node.ts and browser.ts become thin subclasses overriding only `createWebSocketInstance()` and `serialize()`.

---

## Area 2: TLS Validator

| Option | Description | Selected |
|--------|-------------|----------|
| B1: Stay in Node Subclass | tlsValidator defined only in NodeWebSocketTransport | ✓ |
| B2: Move to Base Class | tlsValidator in base WebSocketTransportConfig (TS type pollution) | |
| B3: Abstract Method | validateSocket() as abstract method in base | |

**User's choice:** B1 — TLS Validator stays in Node Subclass
**Notes:** TLS is a Node-specific concept. Browser transport does not need or want this configuration.

---

## Area 3: Factory Function

| Option | Description | Selected |
|--------|-------------|----------|
| C1: Platform-Aware Factory | createWebSocketTransport() returns IWebSocketTransport, synchronous | ✓ |
| C2: Union Type Return | Returns concrete NodeWebSocketTransport \| BrowserWebSocketTransport | |

**User's choice:** C1 — Platform-Aware Factory
**Notes:** Factory returns IWebSocketTransport interface. ConnectionManager continues to use IWebSocketTransport — no changes needed in ConnectionManager.

---

## Area 4: Binary Data Handling

| Option | Description | Selected |
|--------|-------------|----------|
| D1: Protected Serialize Method | Base has protected serialize(); subclasses override | ✓ |
| D2: Type Guard Dispatch | send() branches on typeof, protected sendBinary() for subclasses | |

**User's choice:** D1 — Protected Serialize Method
**Notes:** Base class uses `this.ws.send(this.serialize(data))`. Node subclass wraps ArrayBuffer in Buffer.from(). Browser subclass returns data as-is.

---

## Additional Issues Resolved

### WebSocketError Interface Unification
**Decision:** Use browser.ts shape `{ message, original?: Error | Event, recoverable?: boolean }` — more complete than node.ts `{ message, error: Error }`

### ConnectionManager Impact
**Decision:** ConnectionManager uses IWebSocketTransport interface — no code changes needed. Factory returns IWebSocketTransport.

---

## Deferred Ideas

None — all decisions were within Phase 4 scope.

---

*Phase: 04-transport-consolidation*
*Discussion: 2026-03-30*
