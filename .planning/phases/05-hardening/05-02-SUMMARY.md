# Plan 05-02 Summary: Message Size Validation (HARD-02)

**Phase:** 05-hardening
**Commit:** 4abb9d6
**Requirements addressed:** HARD-02

## Context

From `05-CONTEXT.md` decisions:
- **D-06:** Threshold source: read from `HelloOk.policy.maxPayload` — no hardcoded constant
- **D-07:** Storage: `maxPayload` stored in `ConnectionManager` after `hello-ok` received; passed to `WebSocketTransport` via config
- **D-08:** Check location: in `WebSocketTransport.send()` before passing data to WebSocket
- **D-09:** Over-limit behavior: throw `ConnectionError` with code `MESSAGE_TOO_LARGE`

## Tasks Completed

### Task 1: Add MESSAGE_TOO_LARGE to ConnectionErrorCode
- **File:** `src/errors.ts`
- **Change:** Added `'MESSAGE_TOO_LARGE'` to the `ConnectionErrorCode` union type

### Task 2: Add maxPayload to WebSocketTransportConfig
- **File:** `src/transport/websocket.ts`
- **Change:** Added optional `maxPayload?: number` property to `WebSocketTransportConfig` interface

### Task 3: Add setMaxPayload to IWebSocketTransport Interface
- **File:** `src/transport/websocket.ts`
- **Change:** Added `setMaxPayload(maxPayload: number): void` to `IWebSocketTransport` interface and implementation

### Task 4: Add Size Check in WebSocketTransport.send()
- **File:** `src/transport/websocket.ts`
- **Change:** Added payload size validation before `ws.send()`:
  - Calculates byte length using `TextEncoder` for strings, `byteLength` for ArrayBuffer
  - Throws `ConnectionError` with code `MESSAGE_TOO_LARGE` if exceeded
  - Skips check when `maxPayload` is `undefined`

### Task 5: Wire maxPayload from ConnectionManager into Transport
- **File:** `src/managers/connection.ts`
- **Change:**
  - Added `_maxPayload?: number` private field
  - After `hello-ok` received, stores `helloOk.policy?.maxPayload` and calls `transport.setMaxPayload()`
  - Uses optional method call to support mock transports in tests

## Must-Haves Verification

- [x] `MESSAGE_TOO_LARGE` in `ConnectionErrorCode`
- [x] `send()` throws `ConnectionError(MESSAGE_TOO_LARGE)` when data exceeds `maxPayload`
- [x] `send()` skips check when `maxPayload` is `undefined`
- [x] `npm run build` succeeds
- [x] `npm test -- --run` passes (867 tests)

## Files Modified

- `src/errors.ts` — Added MESSAGE_TOO_LARGE to ConnectionErrorCode
- `src/transport/websocket.ts` — Added maxPayload config, setMaxPayload method, size validation
- `src/managers/connection.ts` — Added _maxPayload field and wiring to transport
