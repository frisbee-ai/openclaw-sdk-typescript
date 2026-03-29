# Codebase Concerns

**Analysis Date:** 2026-03-29

## Tech Debt

### Large Monolithic Files

**`src/client.ts` (1037 lines)**
- Issue: The main `OpenClawClient` class exceeds 1000 lines, violating the project's own file-size guidance (~200-400 lines typical, 800 max per CLAUDE.md).
- Impact: Harder to test, harder to navigate, longer compile times for incremental changes.
- Fix approach: Extract the `setupConnectionHandlers()` logic, API namespace initialization, and event handler registration into separate modules. The 8 API namespaces (`ChatAPI`, `AgentsAPI`, etc.) are already in separate files but are instantiated inline.

**`src/protocol/api-params.ts` (809 lines)**
- Issue: One massive file containing all 15 Gateway API parameter types. Growing with each new API sync.
- Impact: Any PR touching this file will have large diffs. Hard to review. Merge conflicts are likely.
- Fix approach: Split by API domain: `api/params/chat.ts`, `api/params/agents.ts`, `api/params/sessions.ts`, etc.

### Protocol Version Lock-in

**`src/connection/protocol.ts`** and `src/client.ts` (lines 258, 626-627)
- Issue: Protocol version is hardcoded to `{min: 3, max: 3}`. The negotiator always expects exactly version 3, and throws on any mismatch (`src/connection/protocol.ts:86-89`).
- Impact: The SDK cannot gracefully fall back to older protocol versions. If a server runs an older version, the SDK will fail on connect instead of attempting compatibility.
- Fix approach: Make protocol version configurable with sensible fallbacks. Update the range to allow version 2 and implement necessary behavior differences.

### AuthHandler is Created but Not Wired to Reconnection

**`src/client.ts:267-269`** and `src/managers/reconnect.ts`
- Issue: `AuthHandler` is created in `client.ts` and used to prepare auth for the initial connect, but the `ReconnectManager` (used by `ConnectionManager`) is not connected to `AuthHandler.refreshToken()`. The reconnect logic in `ReconnectManager` accepts a `refreshTokenFn` parameter, but `OpenClawClient` never passes it. The `client.ts` `connect()` method (line 618) calls `authHandler.prepareAuth()` but on reconnect, the `ConnectionManager.scheduleReconnect()` (line 416) reuses `connectParams` -- it does not call `authHandler.prepareAuth()` again.
- Impact: Token refresh on reconnect does not happen. Expired tokens will cause repeated auth failures up to `maxAuthRetries` then permanent failure.
- Fix approach: Wire `AuthHandler.refreshToken()` into the reconnect path, either via the connection manager or by re-preparing auth on each reconnect attempt.

### TickMonitor Passive-Only Design

**`src/events/tick.ts`**
- Issue: `TickMonitor` passively records tick timestamps via `recordTick()` but provides no active polling or timer-based checking. The `checkStale()` method exists but nothing in the SDK calls it on a timer. The `isStale()` method is purely query-based.
- Impact: Stale connections are never automatically detected and acted upon. The `onStale` callback is dead code unless consumers manually call `checkStale()`.
- Fix approach: Add a timer loop (using `setInterval` or the existing `TimeoutManager`) that periodically calls `checkStale()` so the stale callback fires automatically.

### GapDetector Does Not Auto-Trigger Recovery

**`src/events/gap.ts`**
- Issue: `GapDetector` detects sequence gaps and can call `onGap` callbacks, but the recovery mode (`'reconnect'`, `'snapshot'`, `'skip'`) is stored in config but the actual recovery action is never executed. The `'reconnect'` mode means "trigger a reconnect" but no reconnect is initiated. The `snapshotEndpoint` is stored but never called.
- Impact: Gap detection is observation-only. Missing events will never be recovered automatically.
- Fix approach: Implement the recovery actions for each mode. `'reconnect'` should signal the reconnect path, `'snapshot'` should call the snapshot endpoint, etc.

### NodesAPI Pairing Sub-Namespace Has Untyped Responses

**`src/api/nodes.ts:125-163`**
- Issue: The `pairing` getter returns an object with multiple methods (`request`, `list`, `approve`, `reject`, `verify`) all typed as `Promise<unknown>` or `Promise<void>`. No parameter types beyond `NodePairApproveParams`/`NodePairRejectParams` are used for the approve/reject methods.
- Impact: Consumers get no type safety for pairing operations.
- Fix approach: Add `NodePairResult`, `NodePairListResult` types and use them in the pairing sub-namespace.

### EventManager once() Uses Reference Equality for Cleanup

**`src/managers/event.ts:161-171`**
- Issue: The `once()` implementation uses a closure over `wrapped` for unsubscribe, but the `off()` method uses `e.handler === handler` reference equality. When `once()` wraps a handler and passes the wrapped version to `on()`, the unwrapped handler passed to `off()` will never match the stored wrapped handler.
- Impact: Calling `off(pattern, originalHandler)` after `once(pattern, originalHandler)` will not remove the subscription. The handler will still fire on the next emit.
- Fix approach: Store the original handler alongside the wrapped handler in `SubscriptionEntry`, and match by original in `off()`.

## Known Bugs

### client.ts cleanupAbortHandler is Redundant

**`src/client.ts:766-786`**
- Issue: The `cleanupAbortHandler` is stored and set up with `once: true`, meaning it removes the abort handler on the next abort. But the `finally` block (line 810) also removes the abort handler. This means `cleanupAbortHandler` never actually runs its logic -- the `finally` block always cleans up first. The `abortHandler` variable is also stored unnecessarily at module scope.
- Symptoms: The abort handler is always removed twice (once by `finally`, zero times by `cleanupAbortHandler`).
- Fix approach: Remove `cleanupAbortHandler` and the second `addEventListener` call entirely. Keep only the `finally` block cleanup.

### WebSocketTransport send() Throws Non-OpenClaw Errors

**`src/transport/websocket.ts:421-431`**
- Issue: When `ws.send()` throws, the code creates a `WebSocketError` object and passes it to `handleError()`, then immediately `throw`s the raw `WebSocketError` (not an Error subclass). This means callers cannot use `instanceof ConnectionError` or any typed error guard.
- Symptoms: Untyped errors propagate to consumers. Error handling code expecting typed SDK errors will break.
- Fix approach: Wrap in `ConnectionError` or at minimum a standard `Error`.

### Node.js and Browser Transports Have Duplicate Logic

**`src/transport/node.ts`** and `src/transport/browser.ts`
- Issue: Both transport implementations have nearly identical code for `connect()`, `send()`, `close()`, and error handling. Any bug fix or feature change must be applied to both files manually.
- Impact: High risk of divergence. Bug fixes applied to one transport may not appear in the other.
- Fix approach: Consolidate shared logic into the base `WebSocketTransport` class in `src/transport/websocket.ts`, making Node and Browser transports thin wrappers that only differ in `getDefaultWebSocket()`.

## Security Considerations

### Private Key Handling in StaticCredentialsProvider

**`src/auth/provider.ts:144-149`**
- Issue: The `signChallenge()` method imports the private key as a UTF-8 string (`Buffer.from(this.config.device.privateKey, 'utf-8')`) and attempts to zero-fill it after use (`keyBuffer.fill(0)`). However, Node.js V8 strings are immutable -- the fill operation does NOT securely erase the key from memory.
- Risk: Private keys remain in memory indefinitely. A memory dump or side-channel attack could extract the key.
- Current mitigation: The class has a comment warning it is "not suitable for production for device keys."
- Recommendations: Use a crypto key object (`crypto.KeyObject`) for the private key, or use a hardware security module (HSM) / key management service. The zero-fill approach gives false confidence.

### TLS Constant-Time Comparison May Not Be Constant-Time

**`src/connection/tls.ts:188-196`**
- Issue: The `constantTimeEqual` function uses `Math.max(a.length, b.length)` and a loop that XORs characters. While the loop runs over all characters, JavaScript engines may optimize short-circuit evaluation, and `result |= aChar ^ bChar` may be compiled in ways that leak timing information.
- Risk: Timing side-channel could leak fingerprint information (unlikely to be valuable) or, more broadly, establishes a pattern of manual constant-time comparison that may be copy-pasted for more sensitive data.
- Current mitigation: The function runs over all characters.
- Recommendations: Use `crypto.timingSafeEqual()` (Node.js) for byte buffers, or document this as a best-effort browser-compatible fallback.

### MAX_MESSAGE_SIZE Only in ConnectionManager

**`src/managers/connection.ts:23`**
- Issue: The 1MB `MAX_MESSAGE_SIZE` check only exists in `ConnectionManager`. The base `WebSocketTransport` in `src/transport/websocket.ts` has no size limit -- it passes raw data to the message handler.
- Risk: Large payloads could cause memory exhaustion before the size check in `ConnectionManager` is reached. A malicious or misbehaving server could send multi-GB payloads.
- Current mitigation: Size check exists before JSON parsing.
- Recommendations: Add size validation in `WebSocketTransport.onmessage` before buffering, or use streaming JSON parsing.

### StaticCredentialsProvider Stores Passwords in Memory

**`src/auth/provider.ts:96-151`**
- Issue: The `StaticCredentialsProvider` accepts `password` in constructor and stores it directly. This means passwords live in heap memory for the lifetime of the object.
- Risk: Passwords could be read from memory dumps, profiler snapshots, or error logs.
- Recommendations: Document this limitation clearly. Consider requiring a callback-based credentials provider for passwords in production.

## Performance Bottlenecks

### JSON.parse on Every Message Without Streaming

**`src/managers/connection.ts:335`** and `src/transport/websocket.ts:377-397`
- Issue: Every incoming WebSocket message is parsed with `JSON.parse()`. For high-frequency event streams (e.g., `tick` events at sub-second intervals), this creates GC pressure. There is no support for streaming JSON or message batching.
- Impact: Applications with many concurrent clients or high message rates will experience increased GC pauses.
- Improvement path: Implement message batching on the server side (server sends array of frames) and batch parsing in the SDK. Consider using a faster JSON parser (simdjson) for high-throughput use cases.

### EventManager Emits to All Handlers Synchronously

**`src/managers/event.ts:231-267`**
- Issue: When a single event fires (e.g., `tick`), all matching handlers are called synchronously in a loop. If a handler is slow (network call, disk I/O), it blocks subsequent handlers in the same event batch.
- Impact: Slow event handlers delay all subsequent handlers on the same event type.
- Improvement path: Use `Promise.resolve().then()` to schedule handler execution asynchronously, or add a queue with configurable concurrency.

### GapDetector Grows Unboundedly

**`src/events/gap.ts:87-92`**
- Issue: `GapDetector.gaps` is an array that grows with each detected gap, trimmed to `maxGaps` (default 100). But in a misbehaving environment where gaps are detected on every event, this array will grow to 100 and then trim -- still up to 100 gap objects at any time. On a reconnect, `reset()` clears the array, but if reconnects happen frequently, the array is perpetually at max size.
- Improvement path: Use a fixed-size ring buffer instead of an array that grows then trims.

### ReconnectManager Does Delay Before First Attempt

**`src/managers/reconnect.ts:249-321`**
- Issue: On the first reconnect attempt after a disconnect, `ReconnectManager.reconnect()` immediately transitions to `connecting` (line 248-249) but waits for `connectFn()` to fail before calculating any delay (line 319-320). The delay is only applied between retry attempts, not before the first retry.
- Impact: When `autoReconnect` triggers on an initial disconnect, there is zero delay before the first reconnection attempt. If the server is temporarily unavailable (e.g., brief network blip), this can cause a thundering herd.
- Improvement path: Apply the Fibonacci delay before all reconnect attempts, including the first, or add a minimum delay between disconnect and first reconnect attempt.

## Fragile Areas

### ConnectionManager send() and JSON.stringify Coupling

**`src/managers/connection.ts:508-513`** and `src/transport/websocket.ts:421`
- Why fragile: `ConnectionManager.send()` assumes the frame is already a plain object and calls `JSON.stringify(frame)` before passing to transport. If the transport ever needs to send binary frames, this design breaks. The binary handling in `WebSocketTransport.send()` accepts `ArrayBuffer` but `ConnectionManager` only ever passes strings.
- Safe modification: Keep sending strings. Do not attempt binary frame support without refactoring this coupling.
- Test coverage: The `managers/connection.test.ts` tests mostly cover the handshake; `managers/connection.integration.test.ts` covers disconnect behavior.

### State Machine and ConnectionManager State Are Duplicated

**`src/connection/state.ts`** and `src/managers/connection.ts:96`
- Why fragile: `ConnectionManager` maintains its own `state: ConnectionState` (line 96 of `connection.ts`) AND `OpenClawClient` creates a separate `ConnectionStateMachine` (line 264 of `client.ts`). The state machine is used for validation in `client.ts:306-311` but is advisory only -- the state machine throws on invalid transitions but the error is silently caught. The actual connection state lives in `ConnectionManager.state`.
- Safe modification: Do not rely on the state machine for actual flow control. Any state-dependent logic should use `ConnectionManager.getState()`.
- Test coverage: `connection/state.test.ts` has good coverage of the machine; `managers/connection.test.ts` tests the manager's state.

### RequestManager Throws on Duplicate resolveRequest

**`src/managers/request.ts:95-112`**
- Why fragile: `resolveRequest()` throws if no pending request exists (`throw new Error(...)`). If a server sends a duplicate response (network retry, server-side retry), the SDK throws an untyped error. This is especially risky because the `ConnectionManager` already resolves its own internal requests first (line 344), so duplicate responses at that layer are handled. But `RequestManager` handles client-facing requests, and the same risk exists.
- Safe modification: Return silently on duplicate resolve/reject instead of throwing.
- Test coverage: `managers/request.ts` tests exist but do not cover duplicate response scenarios.

## Dependencies at Risk

**`ws@8.20.0` (package.json line 59)**
- Risk: This is the only runtime dependency. It is a critical transitive dependency used by the WebSocket transport.
- Impact: Any security vulnerability in `ws` directly affects this SDK. The `ws` library has had security issues in the past (CVE-2024-37890, CVE-2024-44455).
- Migration plan: The codebase already has a browser transport (`src/transport/browser.ts`) that uses native `WebSocket`. The Node.js transport (`src/transport/node.ts`) uses `ws`. Consider making the transport more pluggable so alternative WebSocket implementations (e.g., `ws` with a custom WebSocket class) can be injected. Monitor `ws` security advisories and upgrade promptly.

## Missing Critical Features

### No Automatic Reconnection in ConnectionManager by Default

**`src/managers/connection.ts:148`** and `src/client.ts:229`
- Problem: `ConnectionManager` defaults `autoReconnect` to `false`. But `OpenClawClient` passes `autoReconnect: normalizedConfig.autoReconnect` (default `true`). The `ConnectionManager`'s own reconnect scheduling (`scheduleReconnect()`) is only triggered if `autoReconnect` is true. However, the `ReconnectManager` class exists separately and is NOT used by `ConnectionManager`. `OpenClawClient` creates a `ReconnectManager` (implicitly via `ConnectionManager` config) but the reconnect logic in `ConnectionManager.scheduleReconnect()` uses simple `setTimeout` with fixed delay, not the sophisticated Fibonacci backoff in `ReconnectManager`.
- Blocks: Production-grade reconnection with proper backoff is not available through the standard `ConnectionManager` path.
- Priority: High

### No Binary Frame Encoding/Decoding Support

**`src/protocol/frames.ts`** and `src/transport/websocket.ts`
- Problem: The protocol defines only JSON (text) frames. While the transport accepts `ArrayBuffer`, no code currently sends or receives binary frames. If the Gateway protocol adds binary frame support, the SDK cannot handle it.
- Priority: Low (not currently needed)

### No Metrics/Observability SDK

- Problem: No built-in support for metrics (request latency histograms, connection uptime, message throughput). Consumers cannot easily integrate with Prometheus, OpenTelemetry, or similar.
- Priority: Medium

## Test Coverage Gaps

### No E2E/Integration Tests for Full Connection Lifecycle

- What's not tested: The full `connect() -> request() -> disconnect()` lifecycle with a real WebSocket server is not covered by the test suite. Integration tests (`*.integration.test.ts`) test individual managers in isolation with mock transports, but no test spins up a real server.
- Files: `managers/connection.integration.test.ts`, `client.request.integration.test.ts`
- Risk: Protocol version mismatches, TLS validation, and auth handshakes are tested only with mocks.
- Priority: High

### No Test Coverage for Binary WebSocket Messages

- What's not tested: The `WebSocketTransport` binary message handling (`onbinary` callback, `ArrayBuffer` slicing logic at line 387-393) is not exercised by any test.
- Files: `transport/__tests__/websocket.test.ts`, `transport/__tests__/node.test.ts`, `transport/__tests__/browser.test.ts`
- Risk: Binary frame support is untested. Memory issues in buffer slicing could cause data corruption.
- Priority: Low (binary frames not currently used)

### No Fault Injection Tests

- What's not tested: Network partitions, server crashes mid-request, TLS certificate errors, auth challenge timeouts, and other failure scenarios are tested only with simple mock returns.
- Risk: Error handling paths may not behave correctly under realistic failure conditions (e.g., partial writes, connection resets).
- Priority: Medium

### Missing API Test Coverage

- What's not tested: Several API methods have no test files: `api/cron.ts`, `api/skills.ts`, `api/browser.ts`, `api/push.ts`, `api/nodes.ts` (pairing sub-namespace), `api/usage.ts`.
- Files: `src/api/*.test.ts` -- coverage is incomplete across the 15 API namespaces.
- Risk: Type mismatches between SDK params and Gateway API contract go undetected.
- Priority: Medium

---

*Concerns audit: 2026-03-29*
