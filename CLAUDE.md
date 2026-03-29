# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

- **Project Name**: OpenClaw SDK (TypeScript)
- **Type**: TypeScript SDK/Library (WebSocket client for OpenClaw Gateway)
- **License**: Apache 2.0
- **Node**: >=22.0.0

## Commands

```bash
# Install dependencies
npm install

# Build (ESM + CJS)
npm run build
npm run build:esm
npm run build:cjs

# Test
npm test                    # Run all tests
npm test -- src/foo.test.ts # Run single test file
npm test -- --run          # Run once (not watch)

# Lint & Format
npm run lint
npm run format

# Type checking
npm run typecheck

# Other
npm run check:circular     # Check circular dependencies
npm run docs               # Generate TypeDoc
```

## Architecture

### Module Structure

```
src/
├── index.ts              # Public API exports (260+ lines)
├── client.ts             # Main OpenClawClient class
├── errors.ts             # Error hierarchy (OpenClawError, AuthError, etc.)
├── managers/
│   ├── connection.ts     # ConnectionManager (lifecycle, WebSocket)
│   ├── request.ts       # RequestManager (pending requests, timeouts)
│   ├── event.ts         # EventManager (pub/sub with error handling)
│   └── reconnect.ts     # ReconnectManager (Fibonacci backoff)
├── transport/
│   ├── websocket.ts     # WebSocketTransport (connection, timeouts)
│   ├── node.ts          # Node.js WebSocket implementation
│   └── browser.ts       # Browser WebSocket implementation
├── protocol/
│   ├── types.ts         # GatewayFrame, RequestFrame, ResponseFrame, etc.
│   └── validation.ts    # Frame validation & type guards
├── connection/
│   ├── protocol.ts      # ProtocolNegotiator (version negotiation)
│   ├── state.ts         # ConnectionStateMachine
│   ├── policies.ts      # PolicyManager
│   └── tls.ts           # TlsValidator
├── events/
│   ├── tick.ts          # TickMonitor (heartbeat)
│   └── gap.ts           # GapDetector (message gap detection)
├── auth/
│   └── provider.ts      # CredentialsProvider, AuthHandler
└── utils/
    └── timeoutManager.ts # TimeoutManager (Promise-based timeouts)
```

### Public API Surface

All public exports are in `src/index.ts`:
- **Client**: `OpenClawClient`, `createClient`, `ClientConfig`, `ConnectionConfig`
- **Errors**: 9 error classes + type guards + factory
- **Protocol**: Frame types, validation, type guards
- **Managers**: EventManager, ReconnectManager
- **Connection**: ProtocolNegotiator, ConnectionStateMachine, PolicyManager, TlsValidator
- **Events**: TickMonitor, GapDetector
- **Auth**: CredentialsProvider, StaticCredentialsProvider, AuthHandler

### Key Design Patterns

1. **Factory Functions**: Most modules export `createXxx()` functions (e.g., `createClient()`, `createConnectionManager()`)
2. **Event-Driven**: Connection state changes, errors, messages flow via handlers
3. **Promise-Based**: Requests return Promises; timeouts use Promise race patterns

## Development Notes

- Strict TypeScript (`strict: true`)
- TypeDoc required for all public APIs (use `@module`, `@category`, `@example`, etc.)
- All documentation in English (README.md, docs/, comments)
- Vitest for testing
- Dual output: ESM (`dist/esm/`) + CJS (`dist/cjs/`)
- Node.js >=22.0.0 required

<!-- GSD:project-start source:PROJECT.md -->
## Project

**OpenClaw SDK TypeScript — v2.0 Quality & Resilience**

A production-grade WebSocket client SDK for the OpenClaw Gateway, written in TypeScript. The v2.0 milestone focuses on fixing critical reliability bugs, resolving technical debt, and hardening the SDK for production workloads. All 15 Gateway API namespaces are already implemented and tested.

**Core Value:** **The SDK must reliably maintain a WebSocket connection with the Gateway, automatically recovering from all common failure modes — token expiry, network drops, protocol mismatches, and server unavailability.**

### Constraints

- **TypeScript strict mode**: All code must pass `tsc --strict`
- **No breaking API changes**: v2.0 is backward-compatible — existing public APIs cannot change signatures
- **Test coverage**: All bug fixes must include test cases; 80% minimum coverage maintained
- **ESM + CJS**: Refactoring must preserve dual compilation output
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - All source code, tests, and examples
- JavaScript - Build output (ESM + CJS dual compilation)
## Runtime
- Node.js >=22.0.0 (required)
- npm (with `package-lock.json` for reproducible installs)
- Lockfile: `package-lock.json` (present, committed)
## Frameworks
- None (pure TypeScript library, no framework dependency)
- Vitest 4.1.1 - Unit and integration test runner
- @vitest/coverage-v8 4.1.1 - Coverage reporting via V8 inspector
- TypeScript 5.9.3 - Compilation (tsc), dual output (ESM + CJS)
- esbuild 0.27.4 - Bundler for build tooling
- TypeDoc 0.28.18 - API documentation generation
- typedoc-plugin-markdown 4.11.0 - Markdown output for TypeDoc
- ESLint 10.1.0 - Linting
- @typescript-eslint/eslint-plugin 8.57.1 - TypeScript ESLint rules
- @typescript-eslint/parser 8.57.2 - TypeScript parser for ESLint
- Prettier 3.8.1 - Code formatting
- madge 8.0.0 - Circular dependency detection
- Husky 9.1.7 - Git hooks (pre-commit via `prepare` script)
- lint-staged 16.4.0 - Run linters on staged files
- git-cliff - Conventional commit changelog generation
## Key Dependencies
- `ws` 8.20.0 - WebSocket client library (only runtime dependency)
- `@types/node` 24.12.0 - Node.js type definitions
- `@types/ws` 8.18.1 - WebSocket type definitions
## Configuration
- `tsconfig.json` - ESM build config (target ES2020, module ESNext, bundler resolution)
- `tsconfig.cjs.json` - CJS build config (CommonJS output)
- `tsconfig.examples.json` - Type checking for example files
- ESM: `dist/esm/` (TypeScript with `module: ESNext`, declarations)
- CJS: `dist/cjs/` (TypeScript with `module: CommonJS`, no declarations)
- Browser: `dist/browser/` (entry at `openclaw/browser`)
- `eslint.config.js` - Flat config with TypeScript support
- Separate configs for: test files, source files, example files
- Vitest globals declared (describe, it, expect, vi, etc.)
- Browser + Node.js globals declared per config
- `.prettierrc` - Semi-colons, single quotes, 2-space tabs, trailing commas (es5), 100 char print width
- `typedoc.json` - Generates API docs in `docs/api/` from `src/index.ts`
- `cliff.toml` - Conventional commits parsing for changelog generation
## Path Aliases
- References the `openclaw` npm package's plugin SDK protocol types
## Platform Requirements
- Node.js >=22.0.0
- npm for dependency management
- Node.js >=22.0.0 (for CJS/ESM consumption)
- Browser environments (for `openclaw/browser` entry point)
- No native dependencies required (pure JavaScript runtime)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- TypeScript source: `camelCase.ts` (e.g., `eventManager.ts`, `timeoutManager.ts`)
- Test files: Same as source with `.test.ts` suffix (e.g., `event.test.ts`)
- Integration test files: Same as source with `.integration.test.ts` suffix
- Alternative test location: `__tests__/` subdirectory with `*.test.ts` files (e.g., `src/transport/__tests__/browser.test.ts`)
- kebab-case (e.g., `connection-manager`, `api-methods`)
- PascalCase (e.g., `OpenClawError`, `EventManager`, `ConnectionConfig`)
- Interface names do NOT use `I` prefix (e.g., `CredentialsProvider`, not `ICredentialsProvider`)
- Type aliases for unions/enums use PascalCase (e.g., `AuthErrorCode`, `ReconnectState`)
- camelCase (e.g., `createClient`, `requestTimeoutMs`, `maxAttempts`)
- Unused function parameters: prefix with `_` (e.g., `function foo(_unused: string)`)
- `UPPER_SNAKE_CASE` for exported constants (e.g., `DEFAULT_RECONNECT_CONFIG`, `MAX_EVENT_NAME_LENGTH`)
- `UPPER_SNAKE_CASE` for named groups in source (e.g., `// ============================================================================`)
- Plain camelCase for private class-level constants
- SCREAMING_SNAKE_CASE for error code string literals (e.g., `'AUTH_TOKEN_EXPIRED'`, `'MAX_RECONNECT_ATTEMPTS'`)
## Code Style
- Tool: Prettier (configured in `.prettierrc`)
- Settings:
- Tool: ESLint flat config (`eslint.config.js`)
- Plugin: `@typescript-eslint` with `recommended` rules
- Key rules enforced:
- Test files: Separate ESLint config block with relaxed rules and full Vitest/Node.js globals
- Tool: husky + lint-staged
- On commit, runs: `prettier --write` then `eslint --fix` on `*.ts` files
- `strict: true` - Full strict mode enabled
- `moduleResolution: "bundler"` - Bundler-style resolution
- ESM output (`module: "ESNext"`, `moduleResolution: "bundler"`)
- Dual build: ESM (`dist/esm/`) + CJS (`dist/cjs/`)
- Path alias: `openclaw/protocol` maps to `node_modules/openclaw/dist/plugin-sdk/gateway/protocol/index`
- Use `private` keyword on class members (not `#` private fields)
- Combine with `readonly` when applicable
## Import Organization
## Error Handling
## Logging
- Accept optional `Logger` in constructor, fall back to inline noop logger or console-based logger
- Use structured metadata as second parameter: `logger.error('message', { key: value })`
## JSDoc / Documentation
- `@module` - Marks file-level module documentation
- `@example` - Code examples within JSDoc (wrapped in ` ```ts `)
- `@see` - Reference to related docs
- `@param` - Parameter descriptions
- `@returns` - Return value description
## Module Design
- One class per file (or tightly related classes)
- Keep files focused: typically under 400 lines
- Extract utilities into separate files when appropriate
## Function Design
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- `OpenClawClient` acts as a central facade, wiring together specialized managers
- Each manager handles a single responsibility (connection lifecycle, pending requests, event routing)
- Transport layer abstracts WebSocket differences between Node.js and browser
- API namespaces provide typed convenience methods over a generic `request()` method
- Factory functions (`createXxx()`) wrap direct class instantiation everywhere
## Layers
- Purpose: Single entry point exposing all SDK capabilities
- Location: `src/client.ts`
- Contains: `OpenClawClient` class (1037 lines), factory `createClient()`
- Depends on: ConnectionManager, RequestManager, EventManager, ProtocolNegotiator, PolicyManager, ConnectionStateMachine, AuthHandler, TickMonitor, GapDetector, all API namespaces
- Used by: Consumer applications
- Purpose: Typed convenience wrappers around generic request/response
- Location: `src/api/` (15 API files: chat.ts, agents.ts, sessions.ts, config.ts, cron.ts, nodes.ts, skills.ts, devicePairing.ts, browser.ts, push.ts, execApprovals.ts, system.ts, channels.ts, secrets.ts, usage.ts)
- Contains: One class per API (e.g., `ChatAPI`, `AgentsAPI`)
- Depends on: Generic `RequestFn` typed as `<T>(method: string, params?: unknown) => Promise<T>`
- Used by: `OpenClawClient` (initialized with closure over `request()` method)
- Purpose: Orchestrate specific subsystems
- Location: `src/managers/`
- Depends on: Transport (connection.ts), protocol types (all)
- Used by: OpenClawClient
- Purpose: Abstract WebSocket connectivity across environments
- Location: `src/transport/`
- Contains: `IWebSocketTransport` interface, `ReadyState` enum, WebSocketTransport implementations
- Depends on: `ws` package (Node.js), native WebSocket (browser), TimeoutManager
- Used by: ConnectionManager
- Purpose: Frame definitions, validation, connection state types
- Location: `src/protocol/`
- Used by: All layers
- Purpose: Connection-level concerns (protocol negotiation, state machine, policies, TLS)
- Location: `src/connection/`
- Used by: OpenClawClient, ConnectionManager
- Purpose: Connection-level event monitoring
- Location: `src/events/`
- Used by: OpenClawClient
- Purpose: Credential management and auth flows
- Location: `src/auth/provider.ts`
- Contains: `CredentialsProvider` interface, `StaticCredentialsProvider`, `AuthHandler`
- Depends on: Protocol types, errors
- Used by: OpenClawClient
- Purpose: Shared infrastructure utilities
- Location: `src/utils/timeoutManager.ts`
- Contains: `TimeoutManager` (named timeouts, promise delays, automatic cleanup)
- Used by: WebSocketTransport, ConnectionManager, ReconnectManager, NodeWebSocketTransport, BrowserWebSocketTransport
- Purpose: Centralized error taxonomy
- Location: `src/errors.ts`
- Contains: 9 error classes (OpenClawError base, AuthError, ConnectionError, ProtocolError, RequestError, TimeoutError, CancelledError, AbortError, GatewayError, ReconnectError), error factory `createErrorFromResponse()`, type guards
## Data Flow
## Key Abstractions
- Purpose: Environment-agnostic WebSocket contract
- Examples: `src/transport/websocket.ts`, `src/transport/node.ts`, `src/transport/browser.ts`
- Pattern: Interface with `connect()`, `send()`, `close()` methods and event handler properties (`onopen`, `onclose`, `onerror`, `onmessage`, `onbinary`)
- Purpose: Generic typed request function signature used by all API namespaces
- Definition: `src/api/shared.ts` - type `RequestFn = <T>(method: string, params?: unknown) => Promise<T>`
- Pattern: Each API namespace receives `RequestFn` in constructor, wraps it with method name
- Purpose: Pluggable credential retrieval (token, device keypair, bootstrap, password)
- Examples: `StaticCredentialsProvider` for simple cases
- Pattern: Optional methods with async return; AuthHandler chains through fallback methods
- Every manager class has a corresponding `createXxx()` factory function
- Examples: `createConnectionManager()`, `createRequestManager()`, `createEventManager()`, `createReconnectManager()`, `createProtocolNegotiator()`, `createConnectionStateMachine()`, `createPolicyManager()`, `createAuthHandler()`, `createTickMonitor()`, `createGapDetector()`, `createTimeoutManager()`, `createWebSocketTransport()`
## Entry Points
- Location: `src/index.ts` (493 lines)
- Triggers: Consumer imports from 'openclaw-sdk'
- Responsibilities: Re-export all public types, classes, and factory functions; organize by category with section comments; re-export default from client.ts
- Exposes: OpenClawClient, createClient, 9 error classes, 15 API namespaces, all managers, protocol types
- Location: `src/client.ts` - `createClient(config: ClientConfig)`
- Triggers: Consumer calls `createClient({ url, clientId, ... })`
- Responsibilities: Instantiate all managers and wire them together; validate URL; normalize config; set up event handler chains; initialize API namespaces
## Error Handling
- All SDK errors extend `OpenClawError` (extends Error, has `code`, `retryable`, `details`, `toJSON()`)
- `createErrorFromResponse()` factory maps server error codes to appropriate subclasses
- Type guards (`isOpenClawError`, `isAuthError`, `isConnectionError`, `isTimeoutError`, `isCancelledError`, `isAbortError`) for error categorization
- Listener errors (event handlers, reconnect handlers, state change handlers) are caught in try/catch with `listenerErrorHandler` callback and fallback to console.error
- Request errors: thrown from `OpenClawClient.request()`, caught by consumer
- Validation errors: throw `ValidationError` (extends Error, not OpenClawError -- these are client-side programming errors)
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
