---
phase: 04-transport-consolidation
plan: "01"
subsystem: transport
tags: [refactor, transport, websocket, abstract-base-class]
dependency_graph:
  requires: []
  provides:
    - TRANS-01
  affects:
    - ConnectionManager
    - RequestManager
tech_stack:
  added: []
  patterns:
    - Abstract base class with thin subclasses
    - Template method pattern for createWebSocketInstance and serialize
key_files:
  created: []
  modified:
    - src/transport/websocket.ts
    - src/transport/node.ts
    - src/transport/browser.ts
    - src/transport/index.ts
decisions:
  - D-01 through D-14 documented in 04-CONTEXT.md
  - "websocket.ts becomes abstract base class with shared connect/send/close/handleError/cleanup"
  - "node.ts and browser.ts become thin subclasses with only createWebSocketInstance() and serialize() overrides"
  - "WebSocketOpenEvent unified to { url: string, timestamp: number } shape"
  - "send() throws ConnectionError in both transports"
  - "Factory returns IWebSocketTransport (not unknown)"
metrics:
  duration: ~2 minutes
  completed: "2026-03-30T15:36:11Z"
---

# Phase 04 Plan 01: Transport Consolidation Summary

## One-liner

Extracted shared WebSocket transport logic into abstract base class with thin Node.js and browser subclasses, eliminating code duplication between platform-specific implementations.

## What Was Built

**WebSocketTransport abstract base class** (`src/transport/websocket.ts`):
- Abstract `createWebSocketInstance()` factory method for platform-specific WebSocket instantiation
- Virtual `serialize()` method for platform-specific binary data handling
- Shared `connect()`, `send()`, `close()`, `handleError()`, `cleanup()` methods
- Unified event handlers: `onopen`, `onclose`, `onerror`, `onmessage`, `onbinary`
- WebSocketOpenEvent uses unified `{ url: string, timestamp: number }` shape

**NodeWebSocketTransport thin subclass** (`src/transport/node.ts`):
- Only 2 overrides: `createWebSocketInstance()` and `serialize()`
- `createWebSocketInstance()`: `new WS(url, options)` with TLS options
- `serialize()`: `Buffer.from()` for ArrayBuffer data
- Keeps `tlsValidator` and `NodeWebSocketTransportConfig`

**BrowserWebSocketTransport thin subclass** (`src/transport/browser.ts`):
- Only 2 overrides: `createWebSocketInstance()` and `serialize()`
- `createWebSocketInstance()`: `new WebSocket(url)` (native browser)
- `serialize()`: returns data as-is (native ArrayBuffer support)
- All shared logic delegated to base class

**Transport factory** (`src/transport/index.ts`):
- `createWebSocketTransport()` returns `Promise<IWebSocketTransport>`
- `createNodeWebSocketTransport()` returns `Promise<IWebSocketTransport>` (fixed)
- `createBrowserWebSocketTransport()` returns `Promise<IWebSocketTransport>` (fixed)

## Verification

- Build: PASSED (ESM + CJS)
- All 67 transport tests pass: node.test.ts, browser.test.ts, websocket.test.ts
- All 867 project tests pass (full suite)
- No circular dependencies
- TypeScript strict mode compliant

## Deviation from Original Plan

The plan described refactoring existing standalone classes into the base+subclass pattern. Upon inspection, **the base class and subclasses were already correctly structured** from a prior refactor (commit `25c7e3e`). The only remaining issue was that `createNodeWebSocketTransport()` and `createBrowserWebSocketTransport()` in the factory returned `Promise<unknown>` instead of `Promise<IWebSocketTransport>`. This was fixed in this execution.

## Success Criteria Met

- [x] Shared behavior lives in WebSocketTransport abstract base class
- [x] Node and browser transports are thin wrappers (only 2 overrides each)
- [x] No logic divergence between the two transports
- [x] All transport tests pass
- [x] IWebSocketTransport is the only type exposed by factory
- [x] WebSocketOpenEvent unified shape in both subclasses
- [x] send() throws ConnectionError in both transports

## Commits

- `c109f7a`: fix(transport): return IWebSocketTransport from createNodeWebSocketTransport and createBrowserWebSocketTransport

---

*Plan: 04-01 | Phase: 04-transport-consolidation | Completed: 2026-03-30*
