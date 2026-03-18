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
