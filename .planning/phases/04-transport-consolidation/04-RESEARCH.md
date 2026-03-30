# Phase 4: Transport Consolidation - Research

**Researched:** 2026-03-30
**Domain:** TypeScript inheritance, WebSocket transport, Node/browser abstraction
**Confidence:** HIGH (decisions already made, this is verification)

## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 through D-14)

- **D-01:** `websocket.ts` becomes the **abstract base class** containing all shared logic (`connect`, `send`, `close`, `handleError`, `cleanup`)
- **D-02:** `node.ts` and `browser.ts` become **thin subclasses** that only override two abstract methods:
  - `createWebSocketInstance(url)` — how WebSocket is instantiated
  - `serialize(data)` — how binary data is formatted for sending
- **D-03:** `ConnectionManager` continues to use `IWebSocketTransport` interface — **no changes needed** in ConnectionManager
- **D-04:** WebSocketError interface **unified**: use `browser.ts` shape `{ message, original?: Error | Event, recoverable?: boolean }` — more complete than `node.ts` `{ message, error: Error }`
- **D-05:** `tlsValidator` configuration **stays in `NodeWebSocketTransport`** — it is a Node-specific TLS concept, not part of the shared interface
- **D-06:** `TlsValidator` type and `tlsValidator` config field are defined **only in `node.ts`**, not in the base class
- **D-07:** `transport/index.ts` factory returns `IWebSocketTransport` — **no changes to `ConnectionManager` needed**
- **D-08:** Factory is **NOT async** — it synchronously returns the correct transport instance (platform detection is already done at module load time via `isBrowser` check)
- **D-09:** Type-safe: `createWebSocketTransport(config)` returns `IWebSocketTransport`, callers never see `unknown` or concrete subclass types
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

### Key Integration Points

- **ConnectionManager** (`src/managers/connection.ts:235`) — uses `new WebSocketTransport({...})` directly → change to `new NodeWebSocketTransport({...})` or `new BrowserWebSocketTransport({...})` via factory
- **transport/index.ts** — `createWebSocketTransport()` factory → returns `IWebSocketTransport`, platform-selected
- **Existing tests** — `src/transport/__tests__/node.test.ts`, `browser.test.ts`, `websocket.test.ts` must all pass after refactor

### WebSocketError Unified Shape

```ts
interface WebSocketError {
  message: string;
  original?: Error | Event;
  recoverable?: boolean;
}
```

### Specific Ideas

- Base class `serialize()` should return `string | ArrayBuffer` (not `Buffer`) so browser compiles — Buffer is Node-specific
- Factory function should be **synchronous** — platform detection happens at module load, not at call time
- `WebSocketTransportConfig` base interface should be renamed to avoid confusion — current name is used by all three files

### Deferred Ideas

None — all decisions captured.

## Verification Findings

### D-01: Abstract Base Class Pattern

| Aspect | Finding | Status |
|--------|---------|--------|
| TypeScript support | `abstract class` with `public` and `protected` members fully supported | VERIFIED |
| Abstract method syntax | `protected abstract createWebSocketInstance(url: string): WebSocket;` is valid TypeScript | VERIFIED |
| Concrete methods in abstract class | `connect`, `send`, `close`, `handleError`, `cleanup` can be `public` concrete in abstract class | VERIFIED |
| Compiler target | ES2020 (from tsconfig) supports abstract classes without issues | VERIFIED |

**Confidence: HIGH** — TypeScript abstract class pattern is well-established and works for this use case.

### D-02: Thin Subclass Overrides

| Method | node.ts behavior | browser.ts behavior | Base class needed |
|--------|------------------|---------------------|-------------------|
| `createWebSocketInstance(url)` | `new WS(url, options)` | `new WebSocket(url)` | `protected abstract` |
| `serialize(data)` | `Buffer.from(data)` for ArrayBuffer | returns data as-is | `protected` virtual (not abstract) |

**Confidence: HIGH** — The two-method override pattern is clean and maintainable.

### D-03: IWebSocketTransport Interface Compatibility

**Finding:** `IWebSocketTransport` in `websocket.ts:141-199` already defines the full interface ConnectionManager uses:

```typescript
interface IWebSocketTransport {
  readonly url: string;
  readonly readyState: ReadyState;
  readonly readyStateString: ReadyStateString;
  connect(url: string): Promise<void>;
  send(data: string | ArrayBuffer): void;
  close(code?: number, reason?: string): void;
  onopen?: ((event: WebSocketOpenEvent) => void) | null;
  onclose?: ((event: WebSocketClose) => void) | null;
  onerror?: ((error: WebSocketError) => void) | null;
  onmessage?: ((data: string) => void) | null;
  onbinary?: ((data: ArrayBuffer) => void) | null;
}
```

Both `NodeWebSocketTransport` and `BrowserWebSocketTransport` already implement this interface.

**Confidence: HIGH** — No changes needed to ConnectionManager.

### D-04: WebSocketError Unified Shape

**Current state:**
- `browser.ts` uses `{ message: string, original?: Error | Event, recoverable?: boolean }` — richer
- `node.ts` uses `{ message: string, error: Error }` — simpler but less complete

**Decision:** Adopt browser.ts shape. The `original?: Error | Event` union type accommodates both Node Error and browser Event. The `recoverable?: boolean` flag adds useful semantic information.

**Conflict to resolve:** node.ts `WebSocketOpenEvent` uses `{ target: string }` while base/websocket.ts uses `{ url: string, timestamp: number }`. The CONTEXT.md does not address this discrepancy. The `onopen` event shape differs between transports.

**Confidence: MEDIUM** — Unified WebSocketError shape is feasible. Open question on WebSocketOpenEvent discrepancy.

### D-05/D-06: TLS Validator Stays in Node Subclass

**Finding:** `TlsValidator` type in `node.ts:51`:
```typescript
export type TlsValidator = (socket: TLSSocket) => boolean | void;
```

This is Node-specific (`tls` module import) and correctly stays in `node.ts`.

**Confidence: HIGH** — No cross-environment concerns.

### D-07/D-08/D-09: Factory Return Type

**Current state:** `transport/index.ts` factory is **async** and returns `Promise<unknown>`:
```typescript
export async function createWebSocketTransport(
  config: NodeWebSocketTransportConfig | BrowserWebSocketTransportConfig
): Promise<unknown> {
  if (platform === 'node') {
    const { createNodeWebSocketTransport } = await import('./node.js');
    return createNodeWebSocketTransport(config as NodeWebSocketTransportConfig);
  } else {
    const { createBrowserWebSocketTransport } = await import('./browser.js');
    return createBrowserWebSocketTransport(config as BrowserWebSocketTransportConfig);
  }
}
```

**Decision conflict:** CONTEXT.md says factory is "NOT async" but current implementation IS async due to dynamic imports. The dynamic import pattern (`await import()`) is used to avoid bundling both transport implementations into a single bundle.

**Recommendation:** Keep the async pattern but change return type from `Promise<unknown>` to `Promise<IWebSocketTransport>`. The platform detection at module load time is synchronous (`isBrowser` check), but the dynamic import must remain async.

**Confidence: MEDIUM** — Current code needs adjustment; async nature is structural, not incidental.

### D-10/D-11/D-12/D-13/D-14: Buffer in Base Class Type Signature

**Finding:** `Buffer` is a Node.js global (`require('buffer').Buffer`) and does NOT exist in browser environments. The base class `serialize()` method must NOT return `Buffer` in its type signature.

**Decision D-10:** Base class returns `string | ArrayBuffer` — correct, browser-compatible.

**Decision D-12:** `NodeWebSocketTransport.serialize()` returns `Buffer | string` internally but the base class type is `string | ArrayBuffer`. The actual return is narrower than the declared return, which is valid (subclass can return a subtype).

**Decision D-13:** Browser implementation returns `data` as-is (`string | ArrayBuffer`), which matches the base class.

**Confidence: HIGH** — No Buffer in base class type signature. Node subclass can use Buffer internally.

### ws Package API Compatibility

**Version in use:** `ws` 8.20.0 (from package.json)

**NodeWebSocketTransport** uses:
- `new WS(url, options)` — constructor with options object
- `ws.on('open', ...)`, `ws.on('close', ...)`, `ws.on('error', ...)`, `ws.on('message', ...)` — event emitter API
- `ws.close(code, reason)` — close method
- `ws.send(data)` — send method (Buffer or string)

**Verification:** `ws` 8.x supports all these APIs. The `options` object with `rejectUnauthorized: false` is valid for TLS configuration.

**Confidence: HIGH** — ws 8.20.0 API is compatible with current usage.

## Runtime State Inventory (refactor phase)

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — pure code refactor, no data persistence | None |
| Live service config | None — no external services configured | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | `dist/esm/` and `dist/cjs/` — will be regenerated | `npm run build` after refactor |

## Existing Code Evidence

### Methods 100% Identical Between node.ts and browser.ts

| Method | Shared Logic |
|--------|--------------|
| `connect()` | Promise-based, timeout management via TimeoutManager, event handler wiring, state transitions |
| `close()` | Timeout cleanup, state transitions to CLOSING, `ws.close()` call |
| `handleError()` | Calls `onerror` callback if set |
| `cleanup()` | Sets `_readyState = ReadyState.CLOSED`, nulls `ws` reference |
| State getters | `url`, `readyState`, `readyStateString` — identical implementations |

### Differences Between node.ts and browser.ts

| Aspect | node.ts | browser.ts |
|--------|---------|------------|
| WebSocket constructor | `new WS(url, options)` | `new WebSocket(url)` |
| Event API | `ws.on('open', ...)`, etc. (emitter) | `ws.onopen = ...`, etc. (handler properties) |
| Binary serialization | `Buffer.from(data)` for ArrayBuffer | passes ArrayBuffer directly |
| Close event | `ws.on('close', (code, reason) => ...)` | `ws.onclose = (event: CloseEvent) => ...` |
| Error event | `ws.on('error', (error: Error) => ...)` | `ws.onerror = (_event: Event) => ...` |
| Message event | `ws.on('message', (data: Buffer, isBinary: boolean) => ...)` | `ws.onmessage = (event: MessageEvent) => ...` |
| `tlsValidator` | Present in config | Not present |
| WebSocketOpenEvent shape | `{ target: string }` | `{ url: string, timestamp: number }` |

### Discrepancies NOT Addressed in CONTEXT.md

1. **WebSocketOpenEvent shape mismatch:** `node.ts` uses `{ target: string }` while `websocket.ts` (and `browser.ts`) use `{ url: string, timestamp: number }`. The base class connect() currently uses the richer shape from websocket.ts. This is a semantic difference that needs resolution.

2. **send() error type mismatch:** `node.ts` send() throws raw `WebSocketError` object, `websocket.ts` send() throws `ConnectionError`. Per CONTEXT.md, this was "already fixed" in BUG-04, but node.ts still throws the raw error object (line 246).

3. **Factory async pattern:** CONTEXT.md says factory is "NOT async" but current implementation uses `async` with dynamic imports. This is a structural requirement for dual bundle support.

### Critical Code Evidence

**websocket.ts send() (BUG-04 fix already applied):**
```typescript
// Throws ConnectionError — correct per CONTEXT.md
const connError = new ConnectionError({...});
throw connError;
```

**node.ts send() (needs updating):**
```typescript
// Throws raw WebSocketError — needs to match base class behavior
this.handleError(error);
throw error;  // line 246 — raw error object
```

**browser.ts send() (needs updating):**
```typescript
// Throws raw WebSocketError — needs to match base class behavior
this.handleError(error);
throw error;  // line 206 — raw error object
```

The base class `WebSocketTransport.send()` (websocket.ts) correctly throws `ConnectionError`. Both subclasses need to be updated to match.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRANS-01 | Extract shared logic from Node and Browser transports into base WebSocketTransport | Abstract class pattern verified feasible; all shared methods identified |

## Sources

### Primary (HIGH confidence)
- TypeScript 5.9.3 abstract class specification — standard language feature
- `ws` 8.20.0 package — npm registry verified
- Actual source files verified locally

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions — user-locked requirements

## Open Questions

1. **WebSocketOpenEvent discrepancy:** `node.ts` uses `{ target: string }` but base class uses `{ url: string, timestamp: number }`. Which shape should be canonical after refactoring?
   - **Recommendation:** Adopt the richer shape from `websocket.ts` (`{ url, timestamp }`) and update `node.ts` to transform the event.

2. **Factory async pattern:** Current implementation is async due to dynamic imports. CONTEXT.md says factory is "NOT async." Should dynamic imports be replaced with a different bundling strategy?
   - **Recommendation:** Keep async factory, change return type from `Promise<unknown>` to `Promise<IWebSocketTransport>` for type safety.

3. **send() error throwing in subclasses:** node.ts and browser.ts both throw raw `WebSocketError` instead of `ConnectionError`. Should they be updated to throw `ConnectionError` like the base class, or should they re-use the base class `send()` implementation directly?
   - **Recommendation:** The base class `send()` already throws `ConnectionError`. Subclasses should use `this.serialize()` and `this.ws.send(this.serialize(data))` pattern, delegating to the base implementation rather than duplicating the send logic.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — TypeScript abstract classes, ws 8.20.0 well-understood
- Architecture: HIGH — Pattern is sound, minor discrepancies to resolve
- Pitfalls: MEDIUM — Open questions on event shapes and factory pattern

**Research date:** 2026-03-30
**Valid until:** 2026-04-29 (30 days — stable domain)
