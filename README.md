# OpenClaw SDK (TypeScript)
[![OpenClaw SDK](https://img.shields.io/badge/OpenClaw-SDK-orange?logo=github)](https://openclaw.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?logo=typescript&color=yellow)](https://www.typescriptlang.org/)
[![Codecov](https://codecov.io/gh/frisbee-ai/openclaw-sdk-typescript/branch/main/graph/badge.svg)](https://codecov.io/gh/frisbee-ai/openclaw-sdk-typescript)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> Feature-complete WebSocket SDK for TypeScript with automatic reconnection, event handling, and request/response correlation.

TypeScript SDK for connecting to OpenClaw Gateway via WebSocket, providing a fully-featured WebSocket client with connection management, event handling, request/response patterns, and automatic reconnection.

## Installation

```bash
npm install openclaw-sdk
```

## Quick Start

```typescript
import { createClient } from "openclaw-sdk";

const client = createClient({
  url: "wss://gateway.openclaw.example.com",
  clientId: "your-client-id",
  auth: {
    token: "your-auth-token",
  },
});

await client.connect();
console.log("Connected to OpenClaw Gateway");
```

## Features

- **WebSocket Transport**: Cross-platform support (Node.js and Browser)
- **Automatic Reconnection**: Configurable reconnection with exponential backoff
- **Type-Safe**: Full TypeScript support with comprehensive type exports
- **Error Handling**: Rich error types with error codes and type guards
- **Event System**: Subscribe to gateway events with wildcard support
- **Request Cancellation**: AbortController support for long-running requests
- **High-Level APIs**: Chat, Agents, Sessions, Config, Cron, Nodes, Skills, DevicePairing
- **Event Monitoring**: TickMonitor (heartbeat) and GapDetector (sequence gap detection)

## Configuration

The `ClientConfig` interface provides all configuration options:

```typescript
interface ClientConfig {
  // Required
  url: string;                    // WebSocket URL
  clientId: string;                // Client identifier

  // Optional - authentication
  auth?: {
    token?: string;                // Auth token
    bootstrapToken?: string;      // Bootstrap token
    deviceToken?: string;          // Device token
    password?: string;             // Password
  };
  device?: DevicePairingCredentials;  // Device pairing credentials
  credentialsProvider?: CredentialsProvider; // Advanced auth flows

  // Optional - connection
  autoReconnect?: boolean;        // Auto-reconnect on disconnect (default: false)
  maxReconnectAttempts?: number;  // Max reconnection attempts (default: 5)
  reconnectDelayMs?: number;      // Initial reconnection delay (default: 1000)
  defaultRequestTimeout?: number; // Request timeout in ms (default: 30000)

  // TLS (Node.js only)
  tls?: TlsValidatorConfig;       // TLS validation options
}
```

## Authentication

The SDK supports multiple authentication methods through `CredentialsProvider`:

### Static Credentials

```typescript
import { createClient, StaticCredentialsProvider } from "openclaw-sdk";

const client = createClient({
  url: "wss://gateway.openclaw.example.com",
  clientId: "your-client-id",
  auth: {
    token: "your-auth-token",
  },
});
```

### Custom Credentials Provider

For dynamic token refresh or custom auth flows:

```typescript
import { type CredentialsProvider } from "openclaw-sdk";

const customProvider: CredentialsProvider = {
  async getToken() {
    return getAuthToken();
  },

  async refreshToken(currentToken) {
    const result = await refreshAuthToken();
    return { token: result.newToken, success: true };
  },

  async getDeviceCredentials() {
    return null; // For keypair authentication
  },
};

const client = createClient({
  url: "wss://gateway.openclaw.example.com",
  clientId: "my-client-id",
  credentialsProvider: customProvider,
});
```

## Security Considerations

### In-Memory Credentials

When passing credentials directly via `ClientConfig.auth`, the credentials are stored in memory for the lifetime of the client instance. This applies to:

- `auth.token`
- `auth.bootstrapToken`
- `auth.deviceToken`
- `auth.password`

**For high-security environments**, use the `CredentialsProvider` pattern instead:

```typescript
const client = createClient({
  url: "wss://gateway.openclaw.example.com",
  clientId: "my-client-id",
  credentialsProvider: new CustomCredentialsProvider(),
});
```

This allows you to:

- Retrieve credentials from secure storage (e.g., keychain, vault)
- Implement dynamic token refresh without storing static credentials
- Clear credentials from memory when not needed

See [Custom Credentials Provider](#custom-credentials-provider) for implementation details.

## Events

Subscribe to gateway events using the client's event system:

```typescript
// Subscribe to specific event
const unsubscribe = client.on("agent:status", (event) => {
  console.log("Agent status changed:", event.payload);
});

// Wildcard subscription
const unsubscribeAll = client.on("agent:*", (event) => {
  console.log("Agent event:", event.type, event.payload);
});

// Unsubscribe when done
unsubscribe();
unsubscribeAll();
```

## Platform Support

### Node.js

The SDK uses the `ws` library for WebSocket connections in Node.js:

```bash
npm install ws
```

### Browser

Native browser WebSocket API is used automatically—no additional dependencies needed.

## Reconnection Strategies

The SDK provides two approaches to reconnection:

### Approach 1: Built-in Reconnection (Recommended)

**Use this when you need:**
- Simple automatic reconnection on disconnect
- Configurable max attempts and delay
- Standard Fibonacci backoff
- Integration with connection lifecycle

The `ConnectionManager` has built-in reconnection support:

```typescript
const client = createClient({
  url: "wss://gateway.openclaw.example.com",
  clientId: "my-client-id",
  auth: { token: "your-auth-token" },
  connection: {
    autoReconnect: true,      // Enable auto-reconnect
    maxReconnectAttempts: 5,  // Max retry attempts
    reconnectDelayMs: 1000,   // Initial delay
  },
});

// Reconnection happens automatically
```

### Approach 2: Stand-alone ReconnectManager (Advanced)

**Use this when you need:**
- Custom reconnection logic separate from ConnectionManager
- Reconnection state tracking for external management
- Event-driven reconnection workflows
- Auth-aware retry with token refresh

```typescript
import { createReconnectManager } from "openclaw-sdk";

const reconnectMgr = createReconnectManager({
  maxAttempts: 10,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  pauseOnAuthError: true,
  jitterFactor: 0.3,
});

reconnectMgr.onEvent((event) => {
  console.log(`State: ${event.state}, attempt: ${event.attempt}`);
});

// Use with reconnection logic
try {
  await reconnectMgr.reconnect(
    async () => { /* connect function */ },
    async () => { /* token refresh function */ }
  );
} catch (error) {
  console.error("Reconnection failed:", error);
}
```

### Decision Guide

| Need | Recommended Approach |
|------|---------------------|
| Standard reconnection on disconnect | ConnectionManager built-in |
| Custom reconnection logic | ReconnectManager stand-alone |
| Integration with connection lifecycle | ConnectionManager built-in |
| Event-driven reconnection workflows | ReconnectManager stand-alone |

## High-Level APIs

The SDK provides typed APIs for common gateway operations:

```typescript
import {
  ChatAPI,
  AgentsAPI,
  SessionsAPI,
  ConfigAPI,
  CronAPI,
  NodesAPI,
  SkillsAPI,
  DevicePairingAPI,
} from "openclaw-sdk";

// Access via client.api
client.api.agents.list();
client.api.chat.send();
client.api.sessions.create();
```

## Event Monitoring

### TickMonitor (Heartbeat)

Monitor connection health with tick events:

```typescript
import { createTickMonitor } from "openclaw-sdk";

const tickMonitor = createTickMonitor({
  intervalMs: 30000,
  timeoutMs: 10000,
});

tickMonitor.on("tick", (info) => {
  console.log("Tick:", info.timestamp);
});

tickMonitor.on("missed", (info) => {
  console.warn("Missed tick count:", info.missedCount);
});

tickMonitor.on("recovered", () => {
  console.log("Tick monitoring recovered");
});
```

### GapDetector (Sequence Gap Detection)

Detect and recover from message sequence gaps:

```typescript
import { createGapDetector } from "openclaw-sdk";

const gapDetector = createGapDetector({
  recovery: {
    mode: "skip", // "skip" | "reconnect" | "snapshot"
    onGap: (gaps) => {
      console.log("Gap detected:", gaps);
    },
  },
});

// Record sequence numbers
gapDetector.recordSequence(1);
gapDetector.recordSequence(2);
gapDetector.recordSequence(4); // Gap detected (missed 3)
```

## API Reference

Please see: [API Docs](https://frisbee-ai.github.io/openclaw-sdk-typescript/)


## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Build
npm run build

# Type check
npm run typecheck
```

## License

Apache 2.0
