# Architecture

**Analysis Date:** 2026-03-29

## Pattern Overview

**Overall:** Facade + Manager Pattern with Event-Driven Pipeline

**Key Characteristics:**
- `OpenClawClient` acts as a central facade, wiring together specialized managers
- Each manager handles a single responsibility (connection lifecycle, pending requests, event routing)
- Transport layer abstracts WebSocket differences between Node.js and browser
- API namespaces provide typed convenience methods over a generic `request()` method
- Factory functions (`createXxx()`) wrap direct class instantiation everywhere

## Layers

**Client Facade (Top Layer):**
- Purpose: Single entry point exposing all SDK capabilities
- Location: `src/client.ts`
- Contains: `OpenClawClient` class (1037 lines), factory `createClient()`
- Depends on: ConnectionManager, RequestManager, EventManager, ProtocolNegotiator, PolicyManager, ConnectionStateMachine, AuthHandler, TickMonitor, GapDetector, all API namespaces
- Used by: Consumer applications

**API Namespace Layer:**
- Purpose: Typed convenience wrappers around generic request/response
- Location: `src/api/` (15 API files: chat.ts, agents.ts, sessions.ts, config.ts, cron.ts, nodes.ts, skills.ts, devicePairing.ts, browser.ts, push.ts, execApprovals.ts, system.ts, channels.ts, secrets.ts, usage.ts)
- Contains: One class per API (e.g., `ChatAPI`, `AgentsAPI`)
- Depends on: Generic `RequestFn` typed as `<T>(method: string, params?: unknown) => Promise<T>`
- Used by: `OpenClawClient` (initialized with closure over `request()` method)

**Manager Layer (Coordination):**
- Purpose: Orchestrate specific subsystems
- Location: `src/managers/`
  - `connection.ts` - WebSocket lifecycle, handshake, send/receive
  - `request.ts` - Pending request tracking, timeout, resolve/reject
  - `event.ts` - Server-sent event subscription with wildcard support
  - `reconnect.ts` - Fibonacci backoff reconnection, auth-aware retries
- Depends on: Transport (connection.ts), protocol types (all)
- Used by: OpenClawClient

**Transport Layer:**
- Purpose: Abstract WebSocket connectivity across environments
- Location: `src/transport/`
  - `websocket.ts` - Main unified WebSocketTransport class (auto-detects Node.js vs browser)
  - `node.ts` - NodeWebSocketTransport using `ws` package
  - `browser.ts` - BrowserWebSocketTransport using native WebSocket API
  - `base.ts` - Shared type re-exports
- Contains: `IWebSocketTransport` interface, `ReadyState` enum, WebSocketTransport implementations
- Depends on: `ws` package (Node.js), native WebSocket (browser), TimeoutManager
- Used by: ConnectionManager

**Protocol Layer:**
- Purpose: Frame definitions, validation, connection state types
- Location: `src/protocol/`
  - `frames.ts` - GatewayFrame, RequestFrame, ResponseFrame, EventFrame unions
  - `validation.ts` - Frame validators, type guards, ValidationError
  - `connection-state.ts` - ConnectionState type (7 states)
  - `connection.ts` - ConnectParams, HelloOk, Snapshot types
  - `errors.ts` - ErrorShape type
  - `api-params.ts` - 150+ API parameter and result types (auto-generated from Gateway spec)
  - `api-common.ts` - Shared API result types
- Used by: All layers

**Connection Sub-Layer:**
- Purpose: Connection-level concerns (protocol negotiation, state machine, policies, TLS)
- Location: `src/connection/`
  - `protocol.ts` - ProtocolNegotiator (version range negotiation)
  - `state.ts` - ConnectionStateMachine (valid transition enforcement)
  - `policies.ts` - PolicyManager (server policies from hello-ok)
  - `tls.ts` - TlsValidator (TLS certificate validation)
- Used by: OpenClawClient, ConnectionManager

**Events Sub-Layer:**
- Purpose: Connection-level event monitoring
- Location: `src/events/`
  - `tick.ts` - TickMonitor (heartbeat staleness detection, extends Node EventEmitter)
  - `gap.ts` - GapDetector (event sequence gap detection, extends Node EventEmitter)
- Used by: OpenClawClient

**Authentication Layer:**
- Purpose: Credential management and auth flows
- Location: `src/auth/provider.ts`
- Contains: `CredentialsProvider` interface, `StaticCredentialsProvider`, `AuthHandler`
- Depends on: Protocol types, errors
- Used by: OpenClawClient

**Utilities Layer:**
- Purpose: Shared infrastructure utilities
- Location: `src/utils/timeoutManager.ts`
- Contains: `TimeoutManager` (named timeouts, promise delays, automatic cleanup)
- Used by: WebSocketTransport, ConnectionManager, ReconnectManager, NodeWebSocketTransport, BrowserWebSocketTransport

**Error Layer:**
- Purpose: Centralized error taxonomy
- Location: `src/errors.ts`
- Contains: 9 error classes (OpenClawError base, AuthError, ConnectionError, ProtocolError, RequestError, TimeoutError, CancelledError, AbortError, GatewayError, ReconnectError), error factory `createErrorFromResponse()`, type guards

## Data Flow

**Outgoing Request:**
1. Consumer calls `client.chat.list(params)` (or any API namespace method)
2. API namespace calls `request<T>('chat.list', params)` on the closure
3. `OpenClawClient.request()` generates unique `requestId` (UUID or fallback)
4. Wraps in `RequestFrame` (`{ type: 'req', id, method, params }`)
5. Calls `connectionManager.send(frame)` (validates state is 'ready')
6. WebSocketTransport serializes and sends JSON over WebSocket
7. Adds pending request to RequestManager with timeout timer
8. Promise is returned to consumer, awaiting response

**Incoming Response:**
1. WebSocket message arrives at WebSocketTransport
2. ConnectionManager receives text data via `onmessage` handler
3. Validates message (empty check, size limit), parses JSON
4. If `frame.type === 'res'`:
   - If internal request (handshake): resolved in ConnectionManager
   - If client request: dispatched to RequestManager.resolveRequest()
5. RequestManager resolves the pending Promise
6. OpenClawClient checks `response.ok`, throws via `createErrorFromResponse()` or returns `response.payload`
7. Consumer gets typed response

**Incoming Event:**
1. WebSocket message arrives at WebSocketTransport
2. ConnectionManager parses, identifies `frame.type === 'event'`
3. Emits to `onMessage` handlers in OpenClawClient
4. Client emits frame through EventManager via `emitFrame()`
5. EventManager dispatches to matching subscriptions (exact, prefix wildcard, global wildcard)
6. TickMonitor/GapDetector record sequence if applicable
7. Consumer handlers are invoked

**Connection Lifecycle:**
1. Consumer calls `client.connect()`
2. AuthHandler prepares auth data (if credentialsProvider configured)
3. ConnectionManager builds ConnectParams and calls `transport.connect(url)`
4. Transport opens WebSocket connection (with timeout)
5. On open: ConnectionManager transitions to 'handshaking', sends connect request
6. Server responds with hello-ok: ConnectionManager stores serverInfo, transitions to 'ready'
7. OpenClawClient stores negotiated protocol, policies; creates TickMonitor and GapDetector
8. Connection is ready for requests

## Key Abstractions

**IWebSocketTransport Interface:**
- Purpose: Environment-agnostic WebSocket contract
- Examples: `src/transport/websocket.ts`, `src/transport/node.ts`, `src/transport/browser.ts`
- Pattern: Interface with `connect()`, `send()`, `close()` methods and event handler properties (`onopen`, `onclose`, `onerror`, `onmessage`, `onbinary`)

**RequestFn:**
- Purpose: Generic typed request function signature used by all API namespaces
- Definition: `src/api/shared.ts` - type `RequestFn = <T>(method: string, params?: unknown) => Promise<T>`
- Pattern: Each API namespace receives `RequestFn` in constructor, wraps it with method name

**CredentialsProvider Interface:**
- Purpose: Pluggable credential retrieval (token, device keypair, bootstrap, password)
- Examples: `StaticCredentialsProvider` for simple cases
- Pattern: Optional methods with async return; AuthHandler chains through fallback methods

**Manager Factory Pattern:**
- Every manager class has a corresponding `createXxx()` factory function
- Examples: `createConnectionManager()`, `createRequestManager()`, `createEventManager()`, `createReconnectManager()`, `createProtocolNegotiator()`, `createConnectionStateMachine()`, `createPolicyManager()`, `createAuthHandler()`, `createTickMonitor()`, `createGapDetector()`, `createTimeoutManager()`, `createWebSocketTransport()`

## Entry Points

**Public SDK Entry:**
- Location: `src/index.ts` (493 lines)
- Triggers: Consumer imports from 'openclaw-sdk'
- Responsibilities: Re-export all public types, classes, and factory functions; organize by category with section comments; re-export default from client.ts
- Exposes: OpenClawClient, createClient, 9 error classes, 15 API namespaces, all managers, protocol types

**Client Factory:**
- Location: `src/client.ts` - `createClient(config: ClientConfig)`
- Triggers: Consumer calls `createClient({ url, clientId, ... })`
- Responsibilities: Instantiate all managers and wire them together; validate URL; normalize config; set up event handler chains; initialize API namespaces

## Error Handling

**Strategy:** Centralized error taxonomy with domain-specific subclasses

**Patterns:**
- All SDK errors extend `OpenClawError` (extends Error, has `code`, `retryable`, `details`, `toJSON()`)
- `createErrorFromResponse()` factory maps server error codes to appropriate subclasses
- Type guards (`isOpenClawError`, `isAuthError`, `isConnectionError`, `isTimeoutError`, `isCancelledError`, `isAbortError`) for error categorization
- Listener errors (event handlers, reconnect handlers, state change handlers) are caught in try/catch with `listenerErrorHandler` callback and fallback to console.error
- Request errors: thrown from `OpenClawClient.request()`, caught by consumer
- Validation errors: throw `ValidationError` (extends Error, not OpenClawError -- these are client-side programming errors)

## Cross-Cutting Concerns

**Logging:** Currently uses `console` directly. Logger interface (`src/types/logger.ts`) and `ConsoleLogger` are defined but only partially used. Most modules default to no-op logger if none provided. Reserved for future full logging implementation.

**Validation:** All incoming frames are validated before processing. Message size is bounded (1MB limit). Event names are length-limited (128 chars) to prevent ReDoS. Type guards enable safe narrowing of union types.

**Authentication:** Handled by AuthHandler with CredentialsProvider interface. Supports token refresh on retryable auth errors. Fallback chain: bootstrapToken > deviceToken > token > password. Challenge signing for device auth.

**State Management:** ConnectionStateMachine validates all state transitions. 7 states with explicit allowed transitions map. Advisory (validation errors are caught and logged, not fatal). Two state machines exist: ConnectionManager's simple state tracking AND ConnectionStateMachine's validated state machine.

---

*Architecture analysis: 2026-03-29*
