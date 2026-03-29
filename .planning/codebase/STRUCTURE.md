# Codebase Structure

**Analysis Date:** 2026-03-29

## Directory Layout

```
openclaw-sdk-typescript/
├── src/                          # Main source code
│   ├── index.ts                  # Public API exports (493 lines)
│   ├── client.ts                 # OpenClawClient facade (1037 lines)
│   ├── errors.ts                 # Error taxonomy (558 lines)
│   ├── api/                      # API namespace wrappers
│   ├── auth/                     # Credentials and auth
│   ├── connection/               # Connection sub-system
│   ├── events/                   # Connection events
│   ├── managers/                 # Core managers
│   ├── protocol/                 # Protocol types and validation
│   ├── transport/                # WebSocket transports
│   ├── types/                    # Shared type definitions
│   └── utils/                    # Utilities
├── tests/                        # Integration tests
├── docs/                         # Generated documentation
├── dist/                         # Build output (ESM + CJS)
├── coverage/                     # Test coverage reports
├── package.json
├── tsconfig.json
├── tsconfig.cjs.json
├── tsconfig.examples.json
├── eslint.config.js
├── .prettierrc
├── typedoc.json
└── .planning/codebase/           # GSD planning documents (this file's sibling)
```

## Directory Purposes

**src/api/ (15 files):**
- Purpose: Typed API namespace wrappers for Gateway methods
- Contains: `chat.ts`, `agents.ts`, `sessions.ts`, `config.ts`, `cron.ts`, `nodes.ts`, `skills.ts`, `devicePairing.ts`, `browser.ts`, `push.ts`, `execApprovals.ts`, `system.ts`, `channels.ts`, `secrets.ts`, `usage.ts` + `index.ts`, `shared.ts`
- Key files: `src/api/index.ts` (barrel), `src/api/shared.ts` (RequestFn type), `src/api/chat.ts` (example pattern)
- Pattern: Each file exports a class receiving `private request: RequestFn` in constructor, wrapping it with method names

**src/auth/ (3 files):**
- Purpose: Credential management and authentication flows
- Contains: `provider.ts` (CredentialsProvider interface, StaticCredentialsProvider, AuthHandler)
- Key files: `src/auth/provider.ts`

**src/connection/ (7 files):**
- Purpose: Connection-level protocol concerns
- Contains: `protocol.ts` (ProtocolNegotiator), `state.ts` (ConnectionStateMachine), `policies.ts` (PolicyManager), `tls.ts` (TlsValidator) + test files
- Key files: Each file exports a class + factory function + default export

**src/events/ (4 files):**
- Purpose: Connection health monitoring events
- Contains: `tick.ts` (TickMonitor), `gap.ts` (GapDetector)
- Key files: `src/events/tick.ts`, `src/events/gap.ts`

**src/managers/ (8 files):**
- Purpose: Core SDK orchestration managers
- Contains: `connection.ts` (ConnectionManager), `request.ts` (RequestManager), `event.ts` (EventManager), `reconnect.ts` (ReconnectManager)
- Key files: Each exports a class, factory function, and default export

**src/protocol/ (8 files):**
- Purpose: Protocol types, validation, and auto-generated API types
- Contains: `frames.ts` (frame types), `validation.ts` (validators), `connection-state.ts` (ConnectionState type), `connection.ts` (ConnectParams, HelloOk, Snapshot), `errors.ts` (ErrorShape), `api-params.ts` (150+ API param types), `api-common.ts` (shared result types), `events.ts` (event type exports)
- Key files: `src/protocol/frames.ts`, `src/protocol/validation.ts`, `src/protocol/api-params.ts`

**src/transport/ (8 files):**
- Purpose: WebSocket transport across environments
- Contains: `websocket.ts` (main unified transport), `node.ts` (NodeWebSocketTransport), `browser.ts` (BrowserWebSocketTransport), `base.ts` (shared type re-exports), `index.ts` (barrel)
- Key files: `src/transport/websocket.ts`, `src/transport/node.ts`, `src/transport/browser.ts`

**src/types/ (2 files):**
- Purpose: Shared type definitions reserved for future use
- Contains: `logger.ts` (Logger interface, LogLevel enum, ConsoleLogger)
- Key files: `src/types/logger.ts`

**src/utils/ (1 file):**
- Purpose: Shared utility classes
- Contains: `timeoutManager.ts` (TimeoutManager with named timeouts, promise delays)
- Key files: `src/utils/timeoutManager.ts`

## Key File Locations

**Entry Points:**
- `src/index.ts`: Public SDK surface - what consumers import
- `src/client.ts`: `OpenClawClient` class and `createClient()` factory - main SDK logic
- `src/errors.ts`: All error class definitions and factory

**Configuration:**
- `package.json`: Dependencies, scripts, dual output (ESM + CJS)
- `tsconfig.json`: Base TypeScript config (strict mode)
- `tsconfig.cjs.json`: CJS output config
- `tsconfig.examples.json`: Example TypeScript config
- `eslint.config.js`: ESLint configuration
- `.prettierrc`: Prettier formatting config
- `typedoc.json`: TypeDoc generation config

**Core Logic:**
- `src/managers/connection.ts`: WebSocket lifecycle, handshake
- `src/managers/request.ts`: Pending request tracking
- `src/managers/event.ts`: Server-sent event routing with wildcards
- `src/managers/reconnect.ts`: Fibonacci backoff reconnection
- `src/transport/websocket.ts`: Unified WebSocket transport
- `src/protocol/frames.ts`: Frame type definitions
- `src/protocol/validation.ts`: Frame validation and type guards
- `src/api/chat.ts`: Example API namespace pattern

**Testing:**
- Tests are co-located with source: `src/**/*.test.ts`, `src/**/*.integration.test.ts`
- Transport tests in `src/transport/__tests__/`
- `tests/` directory contains higher-level integration tests

## Naming Conventions

**Files:**
- kebab-case for multi-word names: `timeoutManager.ts`, `connectionManager.ts`
- Single words when unambiguous: `client.ts`, `errors.ts`
- Test files: same name as source + `.test.ts` or `.integration.test.ts` suffix
- Barrel files: `index.ts`
- Transport environment-specific: `node.ts`, `browser.ts`

**Classes:**
- PascalCase: `OpenClawClient`, `ConnectionManager`, `RequestManager`, `EventManager`, `ReconnectManager`, `WebSocketTransport`, `NodeWebSocketTransport`, `BrowserWebSocketTransport`, `ChatAPI`, `AgentsAPI`, `TickMonitor`, `GapDetector`, `ProtocolNegotiator`, `ConnectionStateMachine`, `PolicyManager`, `TlsValidator`, `CredentialsProvider`, `StaticCredentialsProvider`, `AuthHandler`, `TimeoutManager`, `ConsoleLogger`

**Functions:**
- camelCase: `createClient()`, `createConnectionManager()`, `createEventManager()`, `createReconnectManager()`, `createWebSocketTransport()`, `createTickMonitor()`, `createGapDetector()`, `createProtocolNegotiator()`, `createConnectionStateMachine()`, `createPolicyManager()`, `createAuthHandler()`, `createTimeoutManager()`, `createErrorFromResponse()`
- Type guards: `isXxx()` pattern: `isOpenClawError()`, `isAuthError()`, `isConnectionError()`, `isTimeoutError()`, `isCancelledError()`, `isAbortError()`, `isRequestFrame()`, `isResponseFrame()`, `isEventFrame()`, `isSuccessfulResponse()`, `isErrorResponse()`, `isLogger()`

**Types and Interfaces:**
- PascalCase: `GatewayFrame`, `RequestFrame`, `ResponseFrame`, `EventFrame`, `ConnectionState`, `ConnectParams`, `HelloOk`, `Snapshot`, `ClientConfig`, `RequestOptions`, `IWebSocketTransport`, `CredentialsProvider`, `RequestFn`

**Variables and Properties:**
- camelCase: `requestId`, `pendingRequests`, `eventManager`, `connectionManager`
- Private properties prefixed with `_` when needed: `_serverInfo`, `_snapshot`, `_config`, `_normalizedConfig`, `_chatAPI`, `_agentsAPI`
- Constants: SCREAMING_SNAKE_CASE for module-level constants: `FrameTypes`, `DEFAULT_RECONNECT_CONFIG`, `FIBONACCI_TABLE`, `DEFAULT_POLICY`, `MAX_MESSAGE_SIZE`, `DEFAULT_STALE_MULTIPLIER`, `DEFAULT_CONNECT_TIMEOUT_MS`, `VALID_TRANSITIONS`

**Enums and Const Objects:**
- PascalCase enum name, SCREAMING_SNAKE_CASE members: `ReadyState.CONNECTING`, `FrameTypes.REQUEST`, `LogLevel.Debug`

## Where to Add New Code

**New API Namespace:**
1. Primary implementation: `src/api/{name}.ts` - Create class wrapping `RequestFn`
2. Export from: `src/api/index.ts` - Add class export
3. Re-export from: `src/index.ts` - Add class export
4. Import types from: `src/protocol/api-params.ts` (auto-generated) or `src/protocol/api-common.ts`
5. Tests: `src/api/{name}.test.ts` (co-located unit test)

**New Manager:**
1. Primary implementation: `src/managers/{name}.ts`
2. Pattern: Export class + factory function + default export
3. Tests: `src/managers/{name}.test.ts`, `src/managers/{name}.integration.test.ts`
4. Import from: `src/index.ts` (if public) or `src/client.ts` (if internal)

**New Transport Implementation:**
1. Location: `src/transport/{environment}.ts`
2. Implement: `IWebSocketTransport` interface (from `src/transport/websocket.ts`)
3. Re-export: `src/transport/index.ts` (barrel)
4. Tests: `src/transport/__tests__/{environment}.test.ts`

**New Error Class:**
1. Location: `src/errors.ts`
2. Extend: `OpenClawError` or appropriate subclass
3. Define error code type if needed
4. Add type guard function if needed
5. Update `createErrorFromResponse()` factory to handle new code

**New Protocol Type:**
1. Frame types: `src/protocol/frames.ts`
2. Validation: `src/protocol/validation.ts`
3. API params: `src/protocol/api-params.ts` (regenerated from Gateway spec)
4. Connection types: `src/protocol/connection.ts`

**Utilities:**
1. Shared utilities: `src/utils/{name}.ts`
2. Pattern: Export class/factory + default export
3. Tests: `src/utils/{name}.test.ts`, `src/utils/{name}.integration.test.ts`

## Special Directories

**src/transport/__tests__/:**
- Purpose: Co-located tests for transport layer
- Contains: Browser and Node WebSocket transport tests
- Generated: No
- Committed: Yes

**tests/:**
- Purpose: Higher-level integration tests
- Contains: Integration tests for managers and clients
- Generated: No
- Committed: Yes

**dist/:**
- Purpose: Build output
- Generated: Yes (via `npm run build`)
- Committed: No (in .gitignore)

**coverage/:**
- Purpose: Vitest coverage reports
- Generated: Yes (via `npm test`)
- Committed: No (in .gitignore)

**docs/:**
- Purpose: TypeDoc generated API documentation
- Generated: Yes (via `npm run docs`)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-03-29*
