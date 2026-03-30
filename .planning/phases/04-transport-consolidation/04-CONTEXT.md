# Phase 4: Transport Consolidation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate code duplication between Node.js and browser WebSocket transports by extracting shared logic into a base `WebSocketTransport` class, with `NodeWebSocketTransport` and `BrowserWebSocketTransport` as thin subclasses.

**TRANS-01:** Extract shared logic from Node and Browser transports into base WebSocketTransport

</domain>

<decisions>
## Implementation Decisions

### Architecture: Base Class Inheritance Pattern

- **D-01:** `websocket.ts` becomes the **abstract base class** containing all shared logic (`connect`, `send`, `close`, `handleError`, `cleanup`)
- **D-02:** `node.ts` and `browser.ts` become **thin subclasses** that only override two abstract methods:
  - `createWebSocketInstance(url)` — how WebSocket is instantiated
  - `serialize(data)` — how binary data is formatted for sending
- **D-03:** `ConnectionManager` continues to use `IWebSocketTransport` interface — **no changes needed** in ConnectionManager
- **D-04:** WebSocketError interface **unified**: use `browser.ts` shape `{ message, original?: Error | Event, recoverable?: boolean }` — more complete than `node.ts` `{ message, error: Error }`

### TLS Validator: Stays in Node Subclass

- **D-05:** `tlsValidator` configuration **stays in `NodeWebSocketTransport`** — it is a Node-specific TLS concept, not part of the shared interface
- **D-06:** `TlsValidator` type and `tlsValidator` config field are defined **only in `node.ts`**, not in the base class

### Factory Function: Platform-Aware with Interface Return

- **D-07:** `transport/index.ts` factory returns `IWebSocketTransport` — **no changes to `ConnectionManager` needed**
- **D-08:** Factory is **NOT async** — it synchronously returns the correct transport instance (platform detection is already done at module load time via `isBrowser` check)
- **D-09:** Type-safe: `createWebSocketTransport(config)` returns `IWebSocketTransport`, callers never see `unknown` or concrete subclass types

### Binary Data: Protected Serialize Method

- **D-10:** Base class has `protected serialize(data: string | ArrayBuffer): string | ArrayBuffer` method
- **D-11:** `send()` method in base uses: `this.ws.send(this.serialize(data))` — unified send path
- **D-12:** `NodeWebSocketTransport.serialize()`: `typeof data === 'string' ? data : Buffer.from(data)`
- **D-13:** `BrowserWebSocketTransport.serialize()`: returns `data` as-is (ArrayBuffer is natively supported)
- **D-14:** Both subclasses **override `serialize()`** — this is the only binary handling change needed

### Inheritance Structure

```
src/transport/websocket.ts (BASE CLASS - abstract)
├── protected abstract createWebSocketInstance(url: string): WebSocket
├── protected serialize(data: string | ArrayBuffer): string | ArrayBuffer  ← virtual, not abstract
├── public connect(url: string): Promise<void>        ← shared
├── public send(data: string | ArrayBuffer): void    ← shared
├── public close(code?, reason?): void               ← shared
├── protected handleError(error: WebSocketError): void ← shared
├── protected cleanup(): void                         ← shared
└── WebSocketError interface (unified shape)

src/transport/node.ts (SUBCLASS)
├── extends WebSocketTransport
├── protected createWebSocketInstance(url): WebSocket  ← new WS(url, options)
├── protected serialize(data): Buffer | string        ← Buffer.from() for binary
├── tlsValidator: TlsValidator (Node-specific)
└── NodeWebSocketTransportConfig (extends base + tlsValidator)

src/transport/browser.ts (SUBCLASS)
├── extends WebSocketTransport
├── protected createWebSocketInstance(url): WebSocket  ← new WebSocket(url)
├── protected serialize(data): ArrayBuffer | string   ← returns data as-is
└── BrowserWebSocketTransportConfig (no additions)
```

### WebSocketError Unified Shape

```ts
interface WebSocketError {
  message: string;
  original?: Error | Event;
  recoverable?: boolean;
}
```

### Key Integration Points

- **ConnectionManager** (`src/managers/connection.ts:235`) — uses `new WebSocketTransport({...})` directly → change to `new NodeWebSocketTransport({...})` or `new BrowserWebSocketTransport({...})` via factory
- **transport/index.ts** — `createWebSocketTransport()` factory → returns `IWebSocketTransport`, platform-selected
- **Existing tests** — `src/transport/__tests__/node.test.ts`, `browser.test.ts`, `websocket.test.ts` must all pass after refactor

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Files (transport layer)
- `src/transport/websocket.ts` — current unified transport (becomes base class)
- `src/transport/node.ts` — Node-specific transport (becomes subclass)
- `src/transport/browser.ts` — Browser-specific transport (becomes subclass)
- `src/transport/index.ts` — factory exports (must be updated to return IWebSocketTransport)
- `src/transport/base.ts` — shared type re-exports (ReadyState, readyStateToString)

### Manager Layer Integration
- `src/managers/connection.ts` — uses `IWebSocketTransport`, line 16 imports WebSocketTransport directly

### Test Files
- `src/transport/__tests__/node.test.ts`
- `src/transport/__tests__/browser.test.ts`
- `src/transport/__tests__/websocket.test.ts`

### Prior Phase Context
- `.planning/phases/01-critical-reliability/01-CONTEXT.md` — factory function patterns, separation of concerns
- `.planning/phases/02-code-health/02-CONTEXT.md` — ClientBuilder fluent API, REF-01/REF-02 decisions
- `.planning/phases/03-bug-fixes/03-CONTEXT.md` — BUG-04 WebSocketTransport.send() typed error (already fixed)

### Project Constraints
- `.planning/ROADMAP.md` — Phase 4 goal and success criteria
- `.planning/PROJECT.md` — Core value (reliable WebSocket connection), constraints (strict TypeScript, backward compat)
- `.planning/REQUIREMENTS.md` — TRANS-01 definition

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Shared Logic (duplicated → will be in base class)
- `connect()` — Promise-based, timeout management, event handler wiring, state transitions — 100% identical in node.ts and browser.ts
- `close()` — timeout cleanup, state transitions, ws.close() — 100% identical
- `handleError()` — calls onerror callback — 100% identical
- `cleanup()` — sets state to CLOSED, nulls ws reference — 100% identical
- State management (`_readyState`, `url` getter, `readyState` getter) — 100% identical

### Differences (subclass-specific)
- `createWebSocketInstance()` — `new WS(url, options)` vs `new WebSocket(url)`
- Binary serialization — `Buffer.from()` vs native ArrayBuffer
- `tlsValidator` — Node only

### Interface Already Exists
- `IWebSocketTransport` in `websocket.ts:141-199` — already defines the interface ConnectionManager uses

### TypeScript Considerations
- Abstract class pattern: `abstract class WebSocketTransport`
- `Buffer` is Node-only — must not appear in base class `serialize()` return type (or browser subclass can't compile)

</codebase_context>

<specifics>
## Specific Ideas

- Base class `serialize()` should return `string | ArrayBuffer` (not `Buffer`) so browser compiles — Buffer is Node-specific
- Factory function should be **synchronous** — platform detection happens at module load, not at call time
- `WebSocketTransportConfig` base interface should be renamed to avoid confusion — current name is used by all three files

</specifics>

<deferred>
## Deferred Ideas

None — all decisions captured.

</deferred>

---

*Phase: 04-transport-consolidation*
*Context gathered: 2026-03-30*
