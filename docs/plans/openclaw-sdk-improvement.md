# OpenClaw SDK Improvement Plan

## Context

The OpenClaw Gateway exposes ~90+ WebSocket API methods across 15 categories (chat, agent, sessions, config, cron, node, etc.) plus 12+ server event types. The current SDK has solid transport/connection infrastructure but the `OpenClawClient` class does not use most of it. This plan bridges that gap.

## Phase 1: Wire Existing Infrastructure into Client

### 1.1 Error Mapping (Quick Win)
**File:** `src/client.ts` (lines ~392-396)
- Replace `throw new Error(...)` with `throw createErrorFromResponse(response.error!)` when `response.ok === false`
- Import `createErrorFromResponse` from `./errors.js`

### 1.2 Integrate EventManager
**Files:** `src/client.ts`
- Create `EventManager` instance in constructor
- In `setupConnectionHandlers().onMessage`, when `frame.type === 'event'`, call `eventManager.emitFrame(frame)`
- Expose `client.on(pattern, handler)` and `client.once(pattern, handler)` methods that delegate to EventManager
- Wire tick events to TickMonitor, sequence numbers to GapDetector
- Keep existing `onMessage` handler for backward compat

### 1.3 Integrate ProtocolNegotiator
**Files:** `src/client.ts`, `src/managers/connection.ts`
- Create `ProtocolNegotiator` in client, pass to connection manager
- Update `minProtocol: 1, maxProtocol: 1` -> `minProtocol: 1, maxProtocol: 3` in `connect()`
- Use negotiator's `negotiate(helloOk)` in handshake instead of inline version check

### 1.4 Integrate PolicyManager
**Files:** `src/managers/connection.ts`
- Create `PolicyManager`, populate from `helloOk.policy` during handshake
- Expose `client.policy` getter returning PolicyManager state

### 1.5 Integrate AuthHandler
**Files:** `src/client.ts`
- If `config.auth` has multiple methods, create `AuthHandler` with `StaticCredentialsProvider`
- Use `authHandler.prepareAuth()` for connect params
- Use `authHandler.refreshToken()` during reconnect

### 1.6 Integrate TickMonitor + GapDetector
**Files:** `src/client.ts`
- Create `TickMonitor` with tick interval from policy
- Start monitoring after handshake, stop on disconnect
- Wire `tick` events from EventManager -> `tickMonitor.recordTick(ts)`
- Create `GapDetector`, wire `seq` from EventFrame -> `gapDetector.recordSequence(seq)`
- Expose `client.tick` and `client.gapDetector` getters
- Emit stale/recovered events on client

### 1.7 Integrate ConnectionStateMachine
**Files:** `src/managers/connection.ts`
- Replace internal `state: ConnectionState` string with `ConnectionStateMachine`
- Delegate state queries to state machine
- Enforce valid transitions

## Phase 2: Typed API Methods

### 2.1 Add Typed Convenience Methods
**New file:** `src/api/` directory with domain modules

Create typed methods on `OpenClawClient` for all 90+ gateway methods:

```
client.health() -> health
client.status() -> status
client.chat.send(params) / client.chat.history(params) / client.chat.abort(params) / client.chat.inject(params)
client.agents.list() / client.agents.create(p) / client.agents.update(p) / client.agents.delete(p)
client.agents.files.list(p) / client.agents.files.get(p) / client.agents.files.set(p)
client.sessions.list() / client.sessions.preview(p) / client.sessions.resolve(p) / client.sessions.patch(p) / client.sessions.reset(p) / client.sessions.delete(p) / client.sessions.compact() / client.sessions.usage()
client.config.get(p?) / client.config.set(p) / client.config.apply(p) / client.config.patch(p) / client.config.schema(p?)
client.cron.list() / client.cron.status(p) / client.cron.add(p) / client.cron.update(p) / client.cron.remove(p) / client.cron.run(p) / client.cron.runs()
client.node.list() / client.node.invoke(p) / client.node.event(p)
client.node.pair.request(p) / client.node.pair.approve(p) / client.node.pair.reject(p)
client.device.pair.list() / client.device.pair.approve(p) / client.device.pair.reject(p) / client.device.pair.remove(p)
client.wizard.start(p) / client.wizard.next(p) / client.wizard.cancel(p) / client.wizard.status(p)
client.skills.status(p?) / client.skills.install(p) / client.skills.update(p)
client.tools.catalog()
client.exec.approvals.get() / client.exec.approvals.set(p)
client.logs.tail(p)
client.tts.status() / client.tts.enable() / client.tts.disable() / client.tts.convert(p)
client.browser.request(p)
client.push.test(p)
client.usage.status() / client.usage.cost()
client.wake()
```

Implementation approach:
- Add namespace getters on `OpenClawClient` (e.g., `get chat()`) that return proxy objects
- Each proxy method calls `this.client.request(method, params)`
- All param/result types already exist in `protocol/types.ts`

### 2.2 Feature Negotiation
- After handshake, store `helloOk.features` on client
- Add `client.supportsMethod(method)` and `client.supportsEvent(event)` helpers

## Phase 3: Advanced Features

### 3.1 Streaming/Progress Responses
- Add `onProgress?: (partial: unknown) => void` to `RequestOptions`
- In request handler, if `onProgress` is set, don't resolve on first `res` — accumulate progress until final marker

### 3.2 Server-Side Cancellation
- When client aborts a request, send a `cancel` frame to server: `{ type: 'req', method: 'cancel', params: { requestId } }`

### 3.3 Snapshot Recovery
- When GapDetector fires `'gap'` with mode `'snapshot'`, fetch snapshot from gateway
- Replay missed state from snapshot

### 3.4 Logger Implementation
- Implement `Logger` interface (types already exist in `src/types/logger.ts`)
- Replace all `console.error` with logger calls
- Allow users to inject custom logger via `ClientConfig`

## Verification

After each phase:
1. `npm run typecheck` — no type errors
2. `npm test` — all tests pass
3. `npm run lint` — no lint errors
4. `npm run build` — builds ESM + CJS successfully

## File Change Summary

| File | Changes |
|---|---|
| `src/client.ts` | Integrate managers, add typed methods, add event API |
| `src/managers/connection.ts` | Use state machine, protocol negotiator, policy manager |
| `src/index.ts` | Export new types, re-export platform transports |
| `src/api/*.ts` (new) | Typed API proxy modules for each domain |
| `src/protocol/types.ts` | Add missing types if any gaps found |
| `src/types/logger.ts` | Implement Logger interface |
