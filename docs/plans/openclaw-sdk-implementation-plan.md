# OpenClaw TypeScript SDK Implementation Plan

**Date**: 2026-03-17
**Based on**: `/Users/linyang/workspace/my-projects/openclaw-sdk-typescript/docs/specs/2026-03-17-openclaw-sdk-design.md`

## Overview

This plan covers the complete implementation of the OpenClaw TypeScript SDK across 6 phases. The SDK provides a cross-platform (Node.js + browser) client for connecting to OpenClaw Gateway via WebSocket.

### Project State
- **Current**: Minimal skeleton with placeholder `OpenClawClient` in `src/index.ts`
- **Dependencies**: `openclaw` package (for protocol types), `vitest` for testing
- **Target**: Full-featured SDK with authentication, reconnection, and platform support

---

## Phase 1: Core Foundation

**Objective**: Establish the project structure, core types, and basic WebSocket connectivity.

### Tasks

#### 1.1 Project Structure and Exports Configuration
- **File**: `package.json`
- **Description**: Configure package.json with proper exports for Node.js, browser, and ESM/CJS
- **Dependencies**: None
- **Acceptance Criteria**:
  - Package exports configured for `.`, `./protocol`
  - Browser condition points to browser-specific builds
  - TypeScript build outputs to `dist/`
- **Tests**: None (configuration only)

#### 1.2 Protocol Types
- **File**: `src/protocol/types.ts`
- **Description**: Define all protocol types (frames, payloads) using types from `openclaw` package
- **Dependencies**: 1.1
- **Acceptance Criteria**:
  - Exports `Frame`, `RequestFrame`, `ResponseFrame`, `EventFrame` types
  - Exports `ConnectionState` type
  - Exports all error code constants
- **Tests**: Type checking only

#### 1.3 Protocol Validation
- **File**: `src/protocol/validation.ts`
- **Description**: Implement validation functions for incoming frames
- **Dependencies**: 1.2
- **Acceptance Criteria**:
  - `validateFrame(data)` returns parsed frame or throws
  - `validateRequestId(id)` checks request ID format
  - `validateEvent(event)` validates event frame structure
- **Tests**: Unit tests for validation functions

#### 1.4 WebSocket Transport Abstraction
- **File**: `src/transport/websocket.ts`
- **Description**: Define WebSocket transport interface and base implementation
- **Dependencies**: 1.2
- **Acceptance Criteria**:
  - `WebSocketTransport` interface defined
  - Methods: `connect(url)`, `send(data)`, `close(code, reason)`, `on*` event handlers
  - Emits: `open`, `close`, `error`, `message`, `binary`
- **Tests**: Interface tests, mock-based tests

#### 1.5 Request Manager
- **File**: `src/managers/request.ts`
- **Description**: Track pending requests and correlate responses
- **Dependencies**: 1.2, 1.4
- **Acceptance Criteria**:
  - `addRequest(id, options)` tracks pending request with timeout
  - `resolveRequest(id, response)` resolves the promise
  - `rejectRequest(id, error)` rejects with error
  - `abortRequest(id)` aborts pending request
  - `clear()` clears all pending requests
- **Tests**: Unit tests for request tracking, timeout handling

#### 1.6 Connection Manager
- **File**: `src/managers/connection.ts`
- **Description**: Manage WebSocket connection lifecycle
- **Dependencies**: 1.4, 1.5
- **Acceptance Criteria**:
  - Manages connection state transitions
  - Handles connect/disconnect
  - Emits state change events
- **Tests**: Unit tests for state transitions

#### 1.7 Main Client Class (Facade)
- **File**: `src/client.ts`
- **Description**: Main `OpenClawClient` class exposing public API
- **Dependencies**: 1.3, 1.6
- **Acceptance Criteria**:
  - Implements `connect()`, `disconnect()`, `request()` methods
  - Exposes `isConnected`, `connectionState` properties
  - Basic request/response flow working
- **Tests**: Integration tests for connect/disconnect

---

## Phase 2: Authentication

**Status**: ✅ COMPLETE
**Completed**: 2026-03-18
**Commit**: `29b7d24`

**Objective**: Implement all authentication methods and challenge handling.

### Tasks

#### 2.1 Credentials Provider Interface
- **File**: `src/auth/provider.ts`
- **Description**: Define `CredentialsProvider` interface and built-in implementations
- **Dependencies**: Phase 1 complete
- **Acceptance Criteria**:
  - `CredentialsProvider` interface with `getToken()`, `getDeviceCredentials()`, `getBootstrapToken()`, `getPassword()` methods
  - `StaticCredentialsProvider` implementation
  - `DeviceCredentials` type defined
- **Tests**: Unit tests for provider implementations

#### 2.1a Browser Secure Credentials Provider
- **File**: `src/auth/provider.browser.ts`
- **Description**: Browser-specific secure credentials storage using Web Crypto API
- **Dependencies**: 2.1
- **Acceptance Criteria**:
  - `BrowserSecureCredentialsProvider` uses `crypto.subtle` for key generation/signing
  - Keys never leave secure storage
  - Works with HTTPS contexts only
- **Tests**: Unit tests for browser credential storage

#### 2.2 Token Authentication
- **File**: `src/auth/token.ts`
- **Description**: Implement token-based authentication flow
- **Dependencies**: 2.1
- **Acceptance Criteria**:
  - `TokenAuth` class handles token-based connect
  - Includes token in connect payload
- **Tests**: Unit tests for token auth

#### 2.3 Device Pairing Authentication
- **File**: `src/auth/device.ts`
- **Description**: Implement device/keypair authentication with challenge signing
- **Dependencies**: 2.1
- **Acceptance Criteria**:
  - `DeviceAuth` class handles device authentication
  - Uses private key to sign challenge nonce
  - Exports device key generation utilities
- **Tests**: Unit tests for device auth flow

#### 2.4 Password Authentication
- **File**: `src/auth/password.ts`
- **Description**: Implement username/password authentication
- **Dependencies**: 2.1
- **Acceptance Criteria**:
  - `PasswordAuth` class handles password-based connect
  - Sends username/password in connect payload
- **Tests**: Unit tests for password auth

#### 2.5 Connect Challenge Handler
- **File**: `src/auth/challenge.ts`
- **Description**: Handle incoming connect challenge and generate response
- **Dependencies**: 2.2, 2.3, 2.4
- **Acceptance Criteria**:
  - `handleChallenge(challenge)` signs nonce and returns response
  - Handles timestamp in challenge payload
- **Tests**: Unit tests for challenge signing

#### 2.6 Auth Factory and Integration
- **File**: `src/auth/index.ts`
- **Description**: Auth module entry point with factory function
- **Dependencies**: 2.1, 2.2, 2.3, 2.4, 2.5
- **Acceptance Criteria**:
  - `createAuthHandler(credentials, config)` returns appropriate auth handler
  - Handles auth method priority (bootstrapToken > deviceToken > token > password)
- **Tests**: Integration tests for auth flow

#### 2.7 Auth Error Handling
- **File**: `src/errors.ts`
- **Description**: Define `AuthError` and all auth-related error codes
- **Dependencies**: 2.6
- **Acceptance Criteria**:
  - `AuthError` class with codes: `CHALLENGE_EXPIRED`, `CHALLENGE_FAILED`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_MISMATCH`, `AUTH_RATE_LIMITED`, `AUTH_DEVICE_REJECTED`, `AUTH_PASSWORD_INVALID`
  - Error is retryable based on code
- **Tests**: Unit tests for error codes and retry logic

---

## Phase 3: Connection Reliability

**Status**: ✅ COMPLETE
**Completed**: 2026-03-18
**Commit**: `953f03e`

**Objective**: Implement protocol negotiation, TLS validation, heartbeat, and gap detection.

### Tasks

#### 3.1 Connection Handshake Flow
- **File**: `src/connection/handshake.ts`
- **Description**: Implement full connection handshake sequence
- **Dependencies**: Phase 2 complete
- **Acceptance Criteria**:
  - Send connect frame after TLS handshake
  - Handle connect.challenge from server
  - Send signed connect response
  - Receive hello-ok and transition to ready
- **Tests**: Integration tests for handshake flow
- **Implementation Status**: ⏳ Pending

#### 3.1a Protocol Version Negotiation ⚠️ IN PROGRESS
- **File**: `src/connection/protocol.ts`
- **Description**: Handle protocol version negotiation with server
- **Dependencies**: 3.1
- **Acceptance Criteria**:
  - Client sends minProtocol/maxProtocol in connect
  - Server returns negotiated protocol in hello-ok
  - Client handles version mismatch gracefully
  - Exposes `protocolVersion` property
- **Tests**: Unit tests for version negotiation
- **Implementation Status**: ✅ Mostly complete - verify and enhance

#### 3.2 Connection State Machine ⚠️ IN PROGRESS
- **File**: `src/connection/state.ts`
- **Description**: Implement connection state machine with transitions
- **Dependencies**: 3.1
- **Acceptance Criteria**:
  - States: `disconnected`, `connecting`, `handshaking`, `authenticating`, `ready`, `reconnecting`, `closed`
  - Valid state transitions enforced
  - Events emitted on state change
- **Tests**: Unit tests for state transitions
- **Implementation Status**: ✅ Mostly complete - verify and enhance

#### 3.3 Policy Handling ⭐ PRIORITY
- **File**: `src/connection/policies.ts`
- **Description**: Handle policies received in hello-ok
- **Dependencies**: 3.1
- **Acceptance Criteria**:
  - `PolicyManager` class with methods:
    - `setPolicies(policy)` - Store policies from hello-ok (replace operation)
    - `getMaxPayload()` - Returns max payload size
    - `getMaxBufferedBytes()` - Returns max buffered bytes
    - `getTickIntervalMs()` - Returns tick interval in ms
    - `getTickIntervalSeconds()` - Returns tick interval in seconds
    - `hasPolicy()` - Check if policy is set
  - Type `Policy` extracted from HelloOk policy field
  - **Default Values** (used when server doesn't send policy):
    - `maxPayload`: 1048576 (1MB)
    - `maxBufferedBytes`: 65536 (64KB)
    - `tickIntervalMs`: 30000 (30 seconds)
- **Tests**: Unit tests for policy parsing and defaults
- **Implementation Status**: ⏳ Pending

#### 3.4 TLS Fingerprint Validation
- **File**: `src/connection/tls.ts`
- **Description**: Implement TLS certificate fingerprint validation
- **Dependencies**: 3.1
- **Acceptance Criteria**:
  - `TlsValidator` class with:
    - `constructor(config)` - Accept expected fingerprints
    - `validate(socket)` - Validate certificate (Node.js only)
    - `addExpectedFingerprint(fingerprint)` - Add expected fingerprint
    - `clearExpectedFingerprints()` - Clear all expected fingerprints
    - `isSupported` - Static property indicating platform support
  - SHA-256 SPKI fingerprint format
  - Constant-time comparison for security (timing-attack resistant)
  - **Platform handling**:
    - Node.js: Full validation with socket inspection
    - Browser: TLS handled by browser - `isSupported` returns false, validation skipped
  - Throws `ConnectionError` with code `TLS_FINGERPRINT_MISMATCH` on mismatch
- **Tests**: Unit tests with mock TLS sockets + browser platform test (mock)
- **Implementation Status**: ⏳ Pending

#### 3.5 Tick/Heartbeat Monitor ⭐ PRIORITY
- **File**: `src/events/tick.ts`
- **Description**: Implement tick (heartbeat) monitoring
- **Dependencies**: 3.1 (handshake completion), tickIntervalMs from hello-ok or defaults
- **Acceptance Criteria**:
  - `TickMonitor` class with:
    - `constructor(config)` - Configure monitor
    - `start()` / `stop()` - Start/stop monitoring
    - `recordTick(ts)` - Record incoming tick timestamp (client time)
    - `isStale()` - Check if connection is stale
    - `getTimeSinceLastTick()` - Get ms since last tick
    - `getStaleDuration()` - Get ms in stale state
  - Configurable stale multiplier (default: **2** - matching design doc)
  - `onStale` / `onRecovered` callbacks
  - Stale detection: lastTickTime + (tickIntervalMs * staleMultiplier) < now
- **Tests**: Unit tests for tick monitoring
- **Implementation Status**: ⏳ Pending

#### 3.6 Sequence Gap Detection ⭐ PRIORITY
- **File**: `src/events/gap.ts`
- **Description**: Detect gaps in event sequence numbers
- **Dependencies**: 3.5
- **Acceptance Criteria**:
  - `GapDetector` class with:
    - `recordSequence(seq)` - Record incoming sequence number
    - `hasGap()` - Check if gaps exist
    - `getGaps()` - Get list of detected gaps
    - `getLastSequence()` - Get last recorded sequence
    - `reset()` - Reset sequence tracking
  - `GapInfo` interface: expected, received, detectedAt
  - `GapRecoveryMode`: 'reconnect' | 'snapshot' | 'skip'
- **Coordination with TickMonitor**:
  - Both emit events rather than triggering actions directly
  - Gap detection has higher priority than stale detection
  - Consumer coordinates recovery actions via event handlers
- **Tests**: Unit tests for gap detection
- **Implementation Status**: ⏳ Pending

#### 3.6a Gap Recovery Modes
- **File**: `src/events/gap.ts` (extend)
- **Description**: Implement gap recovery strategies
- **Dependencies**: 3.6
- **Acceptance Criteria**:
  - `reconnect` mode: auto-reconnect and resync
  - `snapshot` mode: request state from server
  - `skip` mode: continue with gaps logged
  - Configurable via `gapRecovery.mode` option
- **Tests**: Unit tests for recovery modes

#### 3.7 Graceful Shutdown
- **File**: `src/client.ts` (extend)
- **Description**: Implement `stopAndWait()` for graceful shutdown
- **Dependencies**: 3.3, 3.6
- **Acceptance Criteria**:
  - `stopAndWait({ timeoutMs })` closes connection with timeout
  - Waits for pending requests to complete
  - Clears all timers
- **Tests**: Integration tests for graceful shutdown

#### 3.8 Security: URL Validation (PRIORITY: HIGH)
- **File**: `src/utils/env.ts`
- **Description**: Validate WebSocket URLs for security - MUST happen before any connection attempt
- **Dependencies**: 1.7 (Main Client) - This is a security gate that must be available before connect
- **Acceptance Criteria**:
  - Allow `ws://localhost` and `ws://127.0.0.1` based on config
  - Block `ws://` to public IPs unless allowed
  - Respect `allowPlaintextPrivate` config
  - Called at the start of `connect()` before WebSocket creation
- **Tests**: Unit tests for URL validation

---

## Phase 4: Enhanced Features

**Objective**: Implement reconnection strategy, event subscriptions, and advanced request handling.

**Status**: ✅ COMPLETED (Task 4.5, 4.6 implemented)

### Tasks

#### 4.1 Fibonacci Backoff with Jitter
- **Status**: ✅ COMPLETE
- **File**: `src/utils/backoff.ts`
- **Description**: Implement Fibonacci backoff algorithm
- **Dependencies**: Phase 3 complete
- **Acceptance Criteria**:
  - `calculateBackoff(attempt, config)` returns delay in ms
  - Fibonacci sequence: 1s, 2s, 3s, 5s, 8s, 13s (with base=1000)
  - Capped at `maxInterval`
  - Jitter applied (±10% default)
- **Tests**: Unit tests verifying Fibonacci sequence, capping, jitter
- **Note**: Implemented in `src/managers/reconnect.ts` (lines 146-166)

#### 4.2 Auth-Aware Reconnection
- **Status**: ✅ COMPLETE
- **File**: `src/managers/reconnect.ts`
- **Description**: Implement reconnection with auth error handling
- **Dependencies**: 4.1, 2.7
- **Acceptance Criteria**:
  - `ReconnectManager` class handles reconnection logic
  - Separate retry limits for auth errors
  - Terminal auth errors stop reconnection immediately
  - Retryable auth errors pause then retry
  - Configurable: `maxAttempts`, `maxAuthRetries`, `pauseOnAuthError`
- **Tests**: Unit tests for reconnection flow
- **Note**: Fully implemented in `src/managers/reconnect.ts`

#### 4.3 Event Subscription System
- **Status**: ✅ COMPLETE
- **File**: `src/managers/event.ts`
- **Description**: Implement event subscription/unsubscription
- **Dependencies**: 4.2
- **Acceptance Criteria**:
  - `subscribe(event, handler)` registers event handler
  - `unsubscribe(event, handler)` removes handler
  - `unsubscribe(event)` removes all handlers for event
  - `unsubscribe()` removes all handlers
  - Returns unsubscribe function for convenience
- **Tests**: Unit tests for subscription management
- **Note**: Fully implemented in `src/managers/event.ts` with additional wildcard support

#### 4.4 Event Emitter
- **Status**: ✅ COMPLETE
- **File**: `src/events/emitter.ts`
- **Description**: Implement event emitter for client events
- **Dependencies**: 4.3
- **Acceptance Criteria**:
  - `EventEmitter` class with `on()`, `off()`, `emit()` methods
  - Wildcard `*` event for all events
  - Support multiple event names in `on()`
- **Tests**: Unit tests for event emission
- **Note**: Implemented in `src/managers/event.ts` with enhanced features (prefix wildcards, namespace support)

#### 4.5 Request Cancellation
- **Status**: ✅ COMPLETED
- **File**: `src/client.ts` (extend), `src/errors.ts`
- **Description**: Support AbortController for request cancellation
- **Dependencies**: 4.4
- **Acceptance Criteria**:
  - `request(method, params, { signal })` accepts AbortSignal
  - Request cancelled when signal aborted
  - Throws `AbortError` (new type to add)
- **Implementation Notes**:
  - Add `AbortError` class extending `RequestError` with code `REQUEST_ABORTED`
  - Integrate with existing `RequestManager.abortRequest()`
  - Use standard `AbortController` pattern
- **Tests**: Unit tests for cancellation (19 tests passed)

#### 4.6 Async Operation Handling
- **Status**: ✅ COMPLETED
- **File**: `src/client.ts` (extend)
- **Description**: Support `expectFinal` option for async operations
- **Dependencies**: 4.5
- **Acceptance Criteria**:
  - `request(method, params, { expectFinal: true })` waits for final response
  - Configurable timeout via `expectFinalTimeoutMs`
  - If protocol doesn't support progress: behave as standard request
- **Implementation Notes**:
  - Protocol currently has no progress indicator in ResponseFrame
  - Implement as timeout wrapper: waits for response or timeout
  - Log warning if used but protocol doesn't support
- **Tests**: Unit tests for expectFinal handling (9 tests added)

---

## Phase 5: Platform Support

**Objective**: Ensure compatibility with Node.js and browser environments.

**Status**: ✅ COMPLETE

### Tasks

#### 5.1 Node.js WebSocket Implementation
- **Status**: ✅ COMPLETE
- **File**: `src/transport/node.ts`
- **Description**: Node.js-specific WebSocket using `ws` package
- **Dependencies**: Phase 4 complete
- **Acceptance Criteria**:
  - Uses `ws` package for WebSocket
  - TLS validation hook available via `tlsValidator?: (socket: TLSSocket) => boolean`
  - Proper binary data handling (Buffer -> ArrayBuffer conversion)
  - Implements `IWebSocketTransport` interface
  - Minimum 10 unit tests
- **Implementation Notes**:
  - Add `ws` as dependency in package.json
  - TLS validator integrates via `https.Agent` with custom `rejectUnauthorized`
  - Binary data conversion: `Buffer.from(data)` for sending

#### 5.2 Browser WebSocket Implementation
- **Status**: ✅ COMPLETE
- **File**: `src/transport/browser.ts`
- **Description**: Browser-specific WebSocket using native API
- **Dependencies**: 5.1
- **Acceptance Criteria**:
  - Uses native browser `WebSocket` API
  - TLS handled by browser (no custom hook)
  - Proper binary data handling (native ArrayBuffer)
  - Implements `IWebSocketTransport` interface
  - Minimum 8 unit tests
- **Implementation Notes**:
  - Use `WebSocket` constructor directly
  - Browser TLS is managed by the browser

#### 5.3 Platform Detection and Export
- **Status**: ✅ COMPLETE
- **File**: `src/transport/index.ts`
- **Description**: Auto-detect and export appropriate transport
- **Dependencies**: 5.2
- **Acceptance Criteria**:
  - Platform detection uses `typeof window !== 'undefined'` (runtime)
  - Node.js exports `NodeWebSocketTransport`
  - Browser exports `BrowserWebSocketTransport`
  - Supports `FORCE_PLATFORM` environment variable override for testing
  - Backward compatible: re-exports `WebSocketTransport` from old location
- **Implementation Notes**:
  - Runtime detection: `typeof window !== 'undefined'` check
  - Override: `process.env.FORCE_PLATFORM = 'node' | 'browser'`
  - Note: This is runtime detection, not build-time optimization

#### 5.4 Bundle Testing
- **Status**: ✅ COMPLETE
- **File**: Build verification
- **Description**: Verify builds work correctly
- **Dependencies**: 5.3
- **Acceptance Criteria**:
  - `npm run build` succeeds
  - `npm test` passes
  - `npm run lint` passes
  - No circular dependency warnings
- **Implementation Notes**:
  - Uses runtime detection (not build-time)
  - Full bundle optimization would require conditional exports (Phase 6)

---

## Phase 6: Polish

**Status**: ✅ COMPLETE
**Completed**: 2026-03-18

**Objective**: Complete type exports, add reserved logger type, create documentation, set up CI, and maintain 80%+ test coverage.

### Tasks

#### 6.1 Comprehensive Type Exports
- **Status**: ✅ COMPLETE
- **File**: `src/index.ts`
- **Estimated Time**: 30 minutes (Actual: 30 min)
- **Description**: Export all error classes and types from main entry point
- **Dependencies**: None
- **Acceptance Criteria**:
  - ✅ All error classes exported: `ConnectionError`, `AuthError`, `ProtocolError`, `TimeoutError`, `GatewayError`, `ReconnectError`, `AbortError`, `RequestError`, `CancelledError`, `OpenClawError`
  - ✅ All error code types exported: `AuthErrorCode`, `ConnectionErrorCode`, `ProtocolErrorCode`, `RequestErrorCode`, `GatewayErrorCode`, `ReconnectErrorCode`
  - ✅ All error guards exported: `isOpenClawError`, `isAuthError`, `isConnectionError`, `isTimeoutError`, `isCancelledError`, `isAbortError`
  - ✅ Error factory exported: `createErrorFromResponse`
  - ✅ Type checking passes: `npm run typecheck`
  - ✅ Build succeeds: `npm run build`

#### 6.2 Logger Interface (Reserved Type Only)
- **Status**: ✅ COMPLETE
- **File**: `src/types/logger.ts` (new)
- **Estimated Time**: 30 minutes (Actual: 30 min)
- **Description**: Define `Logger` interface as reserved type only - NO implementation
- **Dependencies**: None
- **Scope Limitation**: NO implementation class, NO level filtering, NO ClientConfig integration, NO console call replacement
- **Acceptance Criteria**:
  - ✅ `Logger` interface defined in `src/types/logger.ts`
  - ✅ `LogLevel` enum defined with `@beta` tag
  - ✅ Types exported from `src/index.ts` with JSDoc indicating future use
  - ✅ JSDoc clearly states "reserved for future use"
  - ✅ NO logger implementation class
  - ✅ NO integration with ClientConfig
  - ✅ Type checking passes

#### 6.3 ReconnectManager Documentation
- **Status**: ✅ COMPLETE
- **Files**: `README.md`, `src/index.ts` (JSDoc)
- **Estimated Time**: 15 minutes (Actual: 15 min)
- **Description**: Document ReconnectManager as "advanced/standalone" to clarify relationship with ConnectionManager
- **Dependencies**: None
- **Decision**: Keep export, document as advanced use
- **Acceptance Criteria**:
  - ✅ ReconnectManager export has explanatory JSDoc in `src/index.ts`
  - ✅ README has reconnection section documenting both approaches
  - ✅ Decision guide: "Use X if you need Y" format for both approaches

#### 6.4 Documentation
- **Status**: ✅ COMPLETE
- **Files**: `README.md`, `typedoc.json`, `docs/examples/`
- **Estimated Time**: 2.5 hours (Actual: 2.5 hours)
- **Description**: Create comprehensive documentation
- **Dependencies**: 6.1, 6.2, 6.3
- **Acceptance Criteria**:
  - ✅ README.md with all sections (installation, quick start, config, auth, events, reconnection, errors, platform)
  - ✅ `typedoc.json` configuration file
  - ✅ `npm run docs` script generates API docs
  - ✅ Examples: quickstart, authentication, events, reconnection, errors, browser
  - ✅ Reconnection documented per Task 6.3

#### 6.5 CI Setup (GitHub Actions)
- **Status**: ✅ COMPLETE
- **File**: `.github/workflows/ci.yml` (new)
- **Estimated Time**: 30 minutes (Actual: 30 min)
- **Description**: Create GitHub Actions CI workflow
- **Dependencies**: None
- **Acceptance Criteria**:
  - ✅ `.github/workflows/ci.yml` created
  - ✅ Tests on Node.js 18, 20, 22
  - ✅ Type checking, linting, testing, build all run
  - ✅ Workflow passes on main branch

#### 6.6 Test Coverage Enhancement
- **Status**: ✅ COMPLETE
- **Files**: `src/errors.test.ts` (new)
- **Estimated Time**: 1.5 hours (Actual: 1.5 hours)
- **Description**: Targeted test additions for low-coverage areas
- **Dependencies**: 6.1, 6.2, 6.3, 6.4, 6.5
- **Previous Coverage**: 82.67% overall, `errors.ts` at 31.11%
- **Final Coverage**: 87.59% overall, `errors.ts` at 100%
- **Acceptance Criteria**:
  - ✅ New `src/errors.test.ts` with 50+ tests
  - ✅ Coverage for `errors.ts` = 100%
  - ✅ Overall coverage = 87.59% (exceeds 80% target)
  - ✅ All tests pass (289 tests)

**Total Estimated Time**: ~5.5 hours

**Key Decisions**:
- Logger: Interface only (deferred implementation per YAGNI - only 2 console calls exist)
- ReconnectManager: Documented as "advanced/standalone" (not integrated)
- CI: GitHub Actions workflow for quality checks

---

## Dependencies Summary

```
Phase 1: Core Foundation
├── 1.1 package.json exports ──────────┐
├── 1.2 protocol/types ─────────────────┼──> 1.4 WebSocket transport
├── 1.3 protocol/validation ────────────┼       │
├── 1.4 WebSocket transport ────────────┼──> 1.5 request manager
├── 1.5 request manager ────────────────┼       │
├── 1.6 connection manager ─────────────┤       │
└── 1.7 client.ts ─────────────────────┘       │
                                                 v
Phase 2: Authentication <───────────────────────┘
├── 2.1 credentials provider ───────────────────┐
├── 2.2 token auth ──────────────────────────────┤
├── 2.3 device auth ─────────────────────────────┤
├── 2.4 password auth ────────────────────────────┤
├── 2.5 challenge handler ───────────────────────┤
├── 2.6 auth factory ─────────────────────────────┤
└── 2.7 auth errors ─────────────────────────────┘

Phase 3: Connection Reliability
├── 3.1 handshake flow ──────────────────────────┐
├── 3.2 state machine ─────────────────────────────┤
├── 3.3 policy handling ───────────────────────────┤
├── 3.4 TLS validation ─────────────────────────────┤
├── 3.5 tick monitor ──────────────────────────────┤
├── 3.6 gap detection ──────────────────────────────┤
├── 3.7 graceful shutdown ─────────────────────────┤
└── 3.8 URL validation ─────────────────────────────┘

Phase 4: Enhanced Features
├── 4.1 fibonacci backoff ────────────────────────┐
├── 4.2 reconnection manager ──────────────────────┤
├── 4.3 subscription manager ───────────────────────┤
├── 4.4 event emitter ──────────────────────────────┤
├── 4.5 request cancellation ───────────────────────┤
└── 4.6 async operations ───────────────────────────┘

Phase 5: Platform Support
├── 5.1 node transport ─────────────────────────────┐
├── 5.2 browser transport ───────────────────────────┤
├── 5.3 transport export ─────────────────────────────┤
└── 5.4 bundle testing ──────────────────────────────┘

Phase 6: Polish
├── 6.1 type exports ───────────────────────────────┐
├── 6.2 logger (reserved type) ─────────────────────┤
├── 6.3 reconnect manager docs ────────────────────┤
├── 6.4 documentation ────────────────────────────────┤
├── 6.5 ci setup ────────────────────────────────────┤
└── 6.6 test coverage ───────────────────────────────┘
```

---

## File Structure Summary

```
openclaw-sdk-typescript/
├── src/
│   ├── index.ts                      # Main entry point
│   ├── client.ts                     # OpenClawClient class
│   ├── errors.ts                     # Error types
│   ├── protocol/
│   │   ├── types.ts                  # Protocol types
│   │   └── validation.ts              # Validation functions
│   ├── transport/
│   │   ├── index.ts                  # Platform detection
│   │   ├── websocket.ts              # Transport interface
│   │   ├── node.ts                    # Node.js WebSocket
│   │   └── browser.ts                 # Browser WebSocket
│   ├── managers/
│   │   ├── connection.ts              # Connection lifecycle
│   │   ├── request.ts                 # Pending requests
│   │   ├── subscription.ts            # Event subscriptions
│   │   └── reconnect.ts               # Reconnection logic
│   ├── auth/
│   │   ├── index.ts                   # Auth factory
│   │   ├── provider.ts                # Credentials providers
│   │   ├── token.ts                   # Token auth
│   │   ├── device.ts                  # Device auth
│   │   ├── password.ts                # Password auth
│   │   └── challenge.ts               # Challenge handling
│   ├── connection/
│   │   ├── handshake.ts               # Connection handshake
│   │   ├── state.ts                   # State machine
│   │   ├── policies.ts                # Policy handling
│   │   └── tls.ts                     # TLS validation
│   ├── events/
│   │   ├── emitter.ts                 # Event emitter
│   │   ├── tick.ts                    # Tick monitor
│   │   └── gap.ts                     # Gap detection
│   └── utils/
│       ├── types/
│       │   └── logger.ts                  # Logger interface (reserved type)
│       ├── env.ts                     # Environment utils
│       └── backoff.ts                 # Fibonacci backoff
├── tests/                             # Test files (mirrors src/)
├── package.json                       # Package configuration
├── tsconfig.json                      # TypeScript config
└── vitest.config.ts                   # Vitest config
```

---

## Test Requirements Summary

| Phase | Unit Tests | Integration Tests | Coverage Target |
|-------|------------|-------------------|-----------------|
| 1     | 15         | 5                 | 60%             |
| 2     | 20         | 5                 | 65%             |
| 3     | 15         | 10                | 70%             |
| 4     | 15         | 5                 | 75%             |
| 5     | 5          | 10                | 78%             |
| 6     | 10         | 5                 | 80%             |
| **Total** | **80** | **40** | **80%+** |

### Test Types Required
1. **Unit Tests**: Individual functions, classes, utilities
2. **Integration Tests**: Full connection flow, auth flow
3. **Mock Tests**: WebSocket, timers, network
4. **Bundle Tests**: Webpack, Vite builds

---

## Success Criteria

- [ ] All 6 phases implemented
- [ ] TypeScript compiles without errors
- [ ] 80%+ test coverage achieved
- [ ] Both Node.js and browser builds work
- [ ] Documentation complete
- [ ] All public APIs have type definitions

---

## Change Log

### 2026-03-18

#### Phase 6 Completed ✅
- **Status**: ✅ COMPLETE
- **Commit**: `34a3ee2` - feat: implement Phase 6 Polish
- **Summary**: Final polish phase with type exports, reserved logger type, comprehensive documentation, CI setup, and test coverage enhancement.
- **Tasks Completed**:
  - 6.1 Type Exports: All error classes, types, and guards exported
  - 6.2 Logger Interface: Reserved type only (per YAGNI)
  - 6.3 ReconnectManager Documentation: Documented as "advanced/standalone"
  - 6.4 Documentation: README, TypeDoc config, examples
  - 6.5 CI Setup: GitHub Actions workflow
  - 6.6 Test Coverage: 87.59% overall (87.59% > 80% target)
- **Actual Time**: 5.5 hours (matched estimate)

#### Phase 5 Completed ✅
- **Status**: ✅ COMPLETE
- **Commit**: `4fbe243` - feat: implement Phase 5 Platform Support
- **Summary**: Platform-specific WebSocket transports with runtime detection

#### Phase 4 Completed ✅
- **Status**: ✅ COMPLETE
- **Commit**: `cc08d0d` - feat: implement Phase 4 enhanced features (4.5, 4.6)
- **Summary**: Request cancellation and async operation handling

#### Phase 3 Completed ✅
- **Status**: ✅ COMPLETE
- **Commit**: `953f03e` - feat: implement Phase 3 connection reliability
- **Summary**: Protocol negotiation, state machine, policies, TLS validation, tick monitor, gap detection

#### Phase 2 Completed ✅
- **Status**: ✅ COMPLETE
- **Commit**: `29b7d24` - feat: implement Phase 2 authentication, events, and reconnection
- **Summary**: Authentication providers, event system, and reconnection manager
- **Plan**: `.omc/plans/phase-6-polish.md`
- **Summary**: Final polish phase with type exports, reserved logger type, comprehensive documentation, CI setup, and test coverage enhancement. After 3 iterations of Planner/Architect/Critic review, plan focuses on YAGNI principles - logger deferred (only 2 console calls exist), ReconnectManager documented as advanced use, minimal approach for fastest publication path.
- **Key Decisions**:
  - Logger: Interface only (no implementation) - violates YAGNI for current codebase
  - ReconnectManager: Keep export, document as "advanced/standalone"
  - CI: GitHub Actions workflow for quality automation
- **Estimated Time**: 5.5 hours (reduced from 7.5 hours)

#### Phase 1 Completed
- **Status**: ✅ COMPLETE
- **Commit**: `bad4d07` - feat: implement Phase 1 core SDK architecture
- **Summary**: Core foundation implemented including protocol types, validation, WebSocket transport, request/connection managers, and main client facade

#### Phase 2 Planning Revisions (Ralplan Workflow)

**Original Plan**:
- Phase 2: Authentication only

**Revised Plan** (based on Planner/Architect/Critic loop):
- Phase 2: Authentication + Event System + Reconnection Enhancement

**Key Changes**:

1. **Authentication System** (Priority: HIGH)
   - CredentialsProvider interface with async methods
   - Added `refreshToken()` method for token refresh on reconnection
   - Challenge handling with retry logic
   - Error types: AuthError, ConnectionError

2. **Event System** (Priority: HIGH)
   - EventManager with wildcard support (`*` and `prefix:*`)
   - Two-tier lookup for O(1) exact matches, O(n) prefix matches
   - Event name length validation (max 256 chars)
   - Namespace isolation for handler groups
   - Extends existing event handlers (not replaces)

3. **Auto-Reconnection Enhancement** (Priority: HIGH)
   - Fibonacci backoff algorithm with jitter
   - Auth-aware reconnection (terminal vs retryable errors)
   - Token refresh before reconnect
   - Max attempts and pause configuration

4. **Typed Request Methods** (Priority: MEDIUM - Deferred)
   - Code generator from protocol types
   - Namespace classes (AgentsNamespace, CronNamespace, etc.)
   - Deferred to later phase

**Critic-identified Issues Addressed**:
- ✅ EventManager: Added event name length limit (256 chars) to prevent ReDoS
- ✅ CredentialsProvider: Added `refreshToken()` for token refresh on reconnection
- ✅ Challenge Handler: Defined integration point with ConnectionManager.performHandshake()
- ✅ EventManager vs existing: Decided to extend (not replace) existing event handlers
- ✅ Naming: Unified `reconnectDelayMs` (not `baseInterval`)

**Open Questions**:
- Server-side `connect.challenge` support status (may affect ChallengeHandler implementation)
- Whether to implement event subscription persistence for post-reconnect recovery
