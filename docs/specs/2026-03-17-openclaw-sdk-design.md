# OpenClaw TypeScript SDK Design Document

**Date**: 2026-03-17
**Goal**: Create a TypeScript SDK for programmatic interaction with OpenClaw WebSocket API

## 1. Overview

### 1.1 Objectives

Create a cross-platform (Node.js + browser) TypeScript SDK for connecting to OpenClaw Gateway, supporting:

- Local Gateway connection (ws://localhost:PORT)
- Remote Gateway connection (wss://api.openclaw.com)
- Multiple authentication methods (Token / Device Pairing / Password)
- Automatic reconnection and heartbeat detection
- Secure credential handling

### 1.2 Reference Implementation

- **Protocol Definitions**: Import from openclaw npm package or reuse TypeBox schemas
- **Connection Logic**: Reference implementation from `openclaw/src/gateway/client.ts`

### 1.3 Environment Support

- **Node.js**: v22+ (matching openclaw's requirement)
- **Browser**: Modern browsers with WebSocket support
- **Bundle**: Webpack, Rollup, Vite compatible with conditional exports

## 2. Architecture

### 2.1 Module Structure

```
openclaw-sdk/
├── src/
│   ├── index.ts                 # Entry point, exports public API
│   ├── client.ts                # Main client class (facade)
│   ├── managers/
│   │   ├── connection.ts        # Connection lifecycle manager
│   │   ├── request.ts          # Pending request manager
│   │   └── subscription.ts     # Event subscription manager
│   ├── transport/
│   │   ├── websocket.ts         # WebSocket abstraction
│   │   ├── browser.ts           # Browser WebSocket (native)
│   │   └── node.ts              # Node.js WebSocket (ws package)
│   ├── protocol/
│   │   ├── types.ts             # Type definitions
│   │   ├── frames.ts            # Frame format definitions
│   │   └── validation.ts        # Validation functions
│   ├── auth/
│   │   ├── index.ts             # Auth interface & factory
│   │   ├── token.ts             # Token authentication
│   │   ├── device.ts            # Device Pairing authentication
│   │   ├── password.ts          # Password authentication
│   │   ├── challenge.ts         # Connect challenge handling
│   │   └── provider.ts          # Credentials provider interface
│   ├── connection/
│   │   ├── handshake.ts         # Connection handshake flow
│   │   ├── state.ts             # Connection state machine
│   │   ├── policies.ts          # Policy handling (from hello-ok)
│   │   └── tls.ts               # TLS fingerprint validation
│   ├── events/
│   │   ├── emitter.ts           # Event emitter
│   │   ├── tick.ts              # Tick/heartbeat handling
│   │   └── gap.ts               # Sequence gap detection
│   ├── errors.ts                # Error types
│   └── utils/
│       ├── logger.ts            # Logger interface
│       ├── env.ts               # Environment detection
│       └── backoff.ts           # Fibonacci backoff with jitter
├── tests/
└── package.json
```

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenClaw SDK                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   OpenClawClient                       │  │
│  │   - connect() / disconnect() / stopAndWait()          │  │
│  │   - request() / subscribe() / unsubscribe()           │  │
│  │   - on() / off()                                      │  │
│  │   - isConnected / isReady / protocolVersion            │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│         ┌──────────────────────┼──────────────────────┐    │
│         ▼                      ▼                      ▼    │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │  Connection │      │    Auth     │      │   Events    │ │
│  │   Manager   │      │   Provider  │      │   Emitter   │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│         │                      │                │            │
│         ▼                      ▼                ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │  Handshake  │      │ Challenge   │      │    Tick     │ │
│  │   Flow      │      │  Handler    │      │   Monitor   │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│         │                                           │       │
│         ▼                                           ▼       │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │ TLS         │      │ Credentials │      │    Gap      │ │
│  │ Validation  │      │ Provider    │      │  Detection  │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│                              │                              │
│         ┌────────────────────┼────────────────────┐        │
│         ▼                    ▼                    ▼        │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│  │  Transport  │      │   Token     │      │             │ │
│  │   (WS)      │      │   Device    │      │  Fibonacci  │ │
│  │             │      │   Password  │      │   Backoff   │ │
│  └─────────────┘      └─────────────┘      └─────────────┘ │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                           │
│  │   Browser   │                                           │
│  │   Native    │                                           │
│  └─────────────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                           │
│  │    Node     │                                           │
│  │   (ws)     │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## 3. Connection Lifecycle

### 3.1 Full Handshake Flow

```
Client                                        Server
  |                                              |
  |---------- WebSocket Connect (wss://) --------▶|
  |                                              |
  |  [TLS Handshake - validate fingerprint]       |
  |                                              |
  |◀--------- connect.challenge (nonce) --------|
  |           (with expiresAt timestamp)          |
  |                                              |
  |  [Sign payload with private key]             |
  |  [If expired: request new challenge]          |
  |                                              |
  |---------- connect (signed payload) ----------▶|
  |                                              |
  |◀--------- hello-ok (protocol, features) ------|
  |             (auth info, policies)              |
  |                                              |
  |================== READY =====================|
  |                                              |
  |◀---------- tick (heartbeat) -----------------|
  |◀---------- events (seq) --------------------|
  |                                              |
  |---------- requests -------------------------▶|
  |◀---------- responses ------------------------|
```

### 3.2 Connection States

```typescript
type ConnectionState =
  | 'disconnected'    // Initial state
  | 'connecting'      // WebSocket connecting
  | 'handshaking'     // Waiting for challenge
  | 'authenticating'  // Sent auth, waiting for hello-ok
  | 'ready'           // Connected and authenticated
  | 'reconnecting'    // Attempting to reconnect
  | 'closed';         // Permanent close
```

## 4. Authentication

### 4.1 Credentials Provider Interface

To avoid exposing private keys in config objects, use a provider interface:

```typescript
interface CredentialsProvider {
  // For token-based auth
  getToken?(): Promise<string | null>;

  // For device auth
  getDeviceCredentials?(): Promise<DeviceCredentials | null>;

  // For bootstrap token
  getBootstrapToken?(): Promise<string | null>;

  // For password auth
  getPassword?(): Promise<{ username: string; password: string } | null>;
}

interface DeviceCredentials {
  deviceId: string;
  publicKey: string;
  privateKey: string;  // NEVER logged or exposed
}

// Built-in providers
class StaticCredentialsProvider implements CredentialsProvider {
  constructor(private config: {
    token?: string;
    device?: DeviceCredentials;
    bootstrapToken?: string;
    password?: { username: string; password: string };
  }) {}

  async getToken() { return this.config.token ?? null; }
  async getDeviceCredentials() { return this.config.device ?? null; }
  async getBootstrapToken() { return this.config.bootstrapToken ?? null; }
  async getPassword() { return this.config.password ?? null; }
}

// Browser: Use Web Crypto API for secure key storage
class BrowserSecureCredentialsProvider implements CredentialsProvider {
  private store = new Map<string, CryptoKey>();

  async getDeviceCredentials(): Promise<DeviceCredentials | null> {
    const key = this.store.get('device-key');
    if (!key) return null;

    const exported = await crypto.subtle.exportKey('jwk', key);
    return {
      deviceId: 'generated-or-stored-id',
      publicKey: JSON.stringify(exported),
      privateKey: 'KEY_NEVER_EXTRACTED',  // Use key directly for signing
    };
  }

  async signChallenge(nonce: string): Promise<string> {
    const key = this.store.get('device-key');
    const encoder = new TextEncoder();
    const data = encoder.encode(nonce);
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
}
```

### 4.2 Auth Method Priority

When multiple auth methods are available, use this priority order:

```typescript
// Priority: bootstrapToken > deviceToken > token > password
// This means if bootstrapToken is available, it's tried first

type AuthConfig = {
  // Primary auth method (recommended for clarity)
  primaryAuth?: 'bootstrapToken' | 'deviceToken' | 'token' | 'password';

  // Fallback chain (if primary fails, try next)
  fallbackChain?: Array<'bootstrapToken' | 'deviceToken' | 'token' | 'password'>;
};
```

### 4.3 Connect Challenge Handling

```typescript
interface ConnectChallengeHandler {
  // Handle incoming challenge
  handleChallenge(challenge: ChallengePayload): Promise<ChallengeResponse>;

  // Handle challenge expiration
  handleChallengeExpired(): Promise<ChallengePayload>;  // Request new challenge
}

interface ChallengePayload {
  nonce: string;
  timestamp: number;
  expiresAt: number;  // Client must respond before this timestamp
}

// Challenge expiration handling
async function handleChallenge(challenge: ChallengePayload): Promise<ChallengeResponse> {
  const now = Date.now();

  // Check if challenge expired
  if (now >= challenge.expiresAt) {
    // Server sent 'connect.challenge_expired' event
    // Automatically request new challenge (max 3 retries)
    throw new AuthError({
      code: 'CHALLENGE_EXPIRED',
      message: 'Challenge expired, retrying',
      retryable: true,
    });
  }

  // Sign the nonce with private key
  const signature = await signWithPrivateKey(challenge.nonce, challenge.timestamp);

  return {
    signature,
    timestamp: challenge.timestamp,
  };
}

// Error codes for auth
const AuthErrorCodes = {
  CHALLENGE_EXPIRED: 'CHALLENGE_EXPIRED',
  CHALLENGE_FAILED: 'CHALLENGE_FAILED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_MISMATCH: 'AUTH_TOKEN_MISMATCH',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  AUTH_DEVICE_REJECTED: 'AUTH_DEVICE_REJECTED',
  AUTH_PASSWORD_INVALID: 'AUTH_PASSWORD_INVALID',
} as const;
```

## 5. API Design

### 5.1 Client Creation and Configuration

```typescript
import { OpenClawClient, StaticCredentialsProvider } from 'openclaw-sdk';

// Option 1: Static credentials (simple but less secure for device keys)
const client = new OpenClawClient({
  url: 'wss://api.openclaw.com',

  // Use credentials provider for better security
  credentials: new StaticCredentialsProvider({
    token: 'your-auth-token',
  }),

  // Client identity
  client: {
    id: 'client-unique-id',        // Auto-generated if not provided
    name: 'my-sdk-client',
    version: '1.0.0',
    mode: 'cli',                    // 'cli' | 'webchat' | 'gateway' | 'service'
  },

  // Reconnection configuration
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    baseInterval: 1000,
    maxInterval: 30000,
    pauseOnAuthError: true,
    // Auth-specific retry limits
    maxAuthRetries: 3,
  },

  // Timeout configuration
  timeout: {
    connect: 10000,
    request: 30000,
    challenge: 5000,  // Max time to sign challenge
  },

  // Security
  security: {
    allowPlaintextLocalhost: true,
    allowPlaintextPrivate: false,
    // TLS fingerprint validation
    validateTlsFingerprint: true,
    expectedFingerprints: new Map([
      ['api.openclaw.com', new Set(['sha256/abc123...', 'sha256/def456...'])],
    ]),
  },

  // Event handlers
  onTick: (ts) => { /* heartbeat */ },
  onGap: (info) => { /* missed events */ },
  onClose: (code, reason) => { /* closed */ },
  onError: (err) => { /* error */ },
});
```

### 5.2 Connection Management

```typescript
// Connect with full handshake
await client.connect();

// Wait for connection to be ready
await client.waitForReady();
console.log(client.isReady);      // boolean
console.log(client.protocolVersion);  // number

// Check connection status
console.log(client.isConnected);  // boolean
console.log(client.connectionState);  // ConnectionState
console.log(client.serverVersion);    // string

// Graceful disconnect
await client.disconnect();

// Graceful shutdown with timeout
await client.stopAndWait({ timeoutMs: 5000 });
```

### 5.3 Request/Response

```typescript
// Send request
const response = await client.request('chat.send', {
  sessionId: 'session-123',
  message: { role: 'user', content: 'Hello!' },
});

// With custom timeout
const result = await client.request('agents.list', {}, { timeout: 60000 });

// For async operations (expect final)
const result = await client.request('agents.wait', { agentId: 'x' }, {
  expectFinal: true,
  timeout: 120000,
});

// Request cancellation
const controller = new AbortController();
const promise = client.request('long.operation', {}, { signal: controller.signal });
controller.abort();  // Rejects the promise with AbortError
```

### 5.4 Event Subscription

```typescript
// Subscribe to single event
const unsubscribe = client.on('agent.event', (event) => {
  console.log(event.payload);
});

// Subscribe to multiple events
client.on(['agent.event', 'tick'], (event) => {
  console.log(event.event, event.payload);
});

// Get event sequence info
client.on('agent.event', (event) => {
  console.log('Seq:', event.seq);
});

// Unsubscribe
unsubscribe();
client.off('agent.event');
client.off();  // Remove all
```

### 5.5 Error Handling

```typescript
import {
  OpenClawClient,
  ConnectionError,
  AuthError,
  ProtocolError,
  TimeoutError,
  GatewayError,
  ReconnectError,
} from 'openclaw-sdk';

// Connection errors
try {
  await client.connect();
} catch (err) {
  if (err instanceof ConnectionError) {
    if (err.code === 'TLS_FINGERPRINT_MISMATCH') {
      console.log('Server certificate changed! Possible security issue.');
    }
    console.log('Connection failed:', err.message);
  } else if (err instanceof AuthError) {
    if (err.code === 'CHALLENGE_EXPIRED') {
      console.log('Challenge expired, retrying...');
    } else if (err.code === 'AUTH_RATE_LIMITED') {
      console.log('Rate limited, wait before retry');
    }
  }
}

// Request errors
try {
  await client.request('chat.send', {...});
} catch (err) {
  if (err instanceof TimeoutError) {
    console.log('Request timed out');
  } else if (err instanceof GatewayError) {
    console.log('Gateway error:', err.code, err.details);
  }
}
```

## 6. Security

### 6.1 TLS Fingerprint Validation

```typescript
import tls from 'tls';

interface TlsValidator {
  validate(connection: TLSSocket): boolean;
}

// Implementation for Node.js
class TlsFingerprintValidator implements TlsValidator {
  private expectedFingerprints: Map<string, Set<string>>;

  constructor(fingerprints: Map<string, Set<string>>) {
    this.expectedFingerprints = fingerprints;
  }

  validate(socket: tls.TLSSocket): boolean {
    const cert = socket.getPeerCertificate();
    if (!cert || !cert.raw) return false;

    // Compute SPKI fingerprint (SHA-256 of Subject Public Key Info)
    const fingerprint = this.computeFingerprint(cert.raw);
    const host = socket.servername;

    // Check if fingerprint matches expected
    const expected = this.expectedFingerprints.get(host);
    if (!expected) {
      // No fingerprint configured, allow but log warning
      console.warn(`No fingerprint configured for ${host}, allowing connection`);
      return true;
    }

    return expected.has(fingerprint);
  }

  private computeFingerprint(der: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(der);
    return 'sha256/' + hash.digest('base64').replace(/=/g, '');
  }
}

// Usage in connection
async function connectWithTlsValidation(url: string, validator: TlsValidator): Promise<WebSocket> {
  const ws = new WebSocket(url, {
    // Node.js specific: inspect server certificate
    rejectUnauthorized: true,
  });

  // After TLS handshake, validate fingerprint
  ws.on('secureConnect', () => {
    const socket = ws._socket as tls.TLSSocket;
    if (!validator.validate(socket)) {
      ws.close(4001, 'TLS fingerprint mismatch');
      throw new ConnectionError({
        code: 'TLS_FINGERPRINT_MISMATCH',
        message: 'Server certificate fingerprint does not match expected',
      });
    }
  });

  return ws;
}
```

### 6.2 Credential Security

```typescript
// Credentials should NEVER be logged or exposed
// Private keys should NEVER leave the secure storage

class SecureClient extends OpenClawClient {
  // Override to prevent logging credentials
  toJSON() {
    return {
      url: this.url,
      isConnected: this.isConnected,
      // Explicitly exclude credentials
    };
  }

  // Clear sensitive data on disconnect
  async disconnect() {
    // Clear any cached tokens from memory
    this.clearSensitiveData();
    await super.disconnect();
  }
}
```

## 7. Reconnection Strategy

### 7.1 Fibonacci Backoff with Jitter

Fibonacci backoff provides a gentler, more predictable retry pattern compared to exponential backoff.

```typescript
interface BackoffConfig {
  baseInterval: number;   // Initial interval in ms (default: 1000)
  maxInterval: number;    // Maximum interval in ms (default: 30000)
  maxAttempts: number;    // Maximum retry attempts
  jitter: number;         // Jitter factor (default: 0.1 = 10%)
}

// Fibonacci sequence generator
function* fibonacci(): Generator<number> {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

function calculateBackoff(attempt: number, config: BackoffConfig): number {
  // Get Fibonacci value for this attempt
  const fib = fibonacci();
  for (let i = 0; i <= attempt; i++) {
    var fibValue = fib.next().value;
  }

  // Fibonacci: baseInterval * F(attempt + 2)
  // F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8, ...
  const fibInterval = config.baseInterval * fibValue;

  // Cap at maxInterval
  const capped = Math.min(fibInterval, config.maxInterval);

  // Add jitter to prevent thundering herd
  const jitterRange = capped * config.jitter;
  const jitter = (Math.random() * 2 - 1) * jitterRange;

  return Math.round(capped + jitter);
}

// Example: base=1000, max=30000, attempts=[0,1,2,3,4]
// Fibonacci: F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8
// attempt 0: ~1000ms  (F(2)=1  * 1000)
// attempt 1: ~2000ms  (F(3)=2  * 1000)
// attempt 2: ~3000ms  (F(4)=3  * 1000)
// attempt 3: ~5000ms  (F(5)=5  * 1000)
// attempt 4: ~8000ms  (F(6)=8  * 1000)
// attempt 5: ~13000ms (F(7)=13 * 1000, capped at maxInterval=30000)
// attempt 6: ~21000ms (F(8)=21 * 1000, capped)
// attempt 7: ~30000ms (capped at max)

// Comparison: Exponential vs Fibonacci (base=1000)
// Attempt:   0     1     2     3     4     5
// Exponential: 1s   2s   4s   8s   16s   32s
// Fibonacci:   1s   2s   3s   5s   8s   13s
```

**Why Fibonacci instead of Exponential?**

| Aspect | Exponential | Fibonacci |
|--------|-------------|-----------|
| Growth | 2^n (very aggressive) | F(n+2) (gentler) |
| Spike after 4 | 16x base | 5x base |
| Server load | Can overwhelm during outages | More predictable |
| Use case | Fast recovery needed | Balanced approach |

### 7.2 Auth-Aware Reconnection

```typescript
interface ReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  maxAuthRetries: number;  // Separate limit for auth failures
  pauseOnAuthError: boolean;

  // Which errors trigger pause vs immediate retry
  terminalAuthErrors: string[];  // Stop reconnecting
  retryableAuthErrors: string[]; // Pause then retry
}

// Default configuration
const defaultReconnectConfig: ReconnectConfig = {
  enabled: true,
  maxAttempts: 5,
  maxAuthRetries: 3,
  pauseOnAuthError: true,

  // Terminal: stop reconnecting
  terminalAuthErrors: [
    'AUTH_TOKEN_MISMATCH',      // Token definitely invalid
    'AUTH_PASSWORD_INVALID',    // Password definitely wrong
    'AUTH_DEVICE_REJECTED',     // Device permanently rejected
  ],

  // Retryable: pause, then retry
  retryableAuthErrors: [
    'AUTH_TOKEN_EXPIRED',       // Can refresh token
    'AUTH_RATE_LIMITED',        // Wait and retry
    'CHALLENGE_EXPIRED',       // Can get new challenge
  ],
};

// Reconnection flow
async function reconnectWithAuthHandling(
  config: ReconnectConfig,
  lastError: Error
): Promise<ReconnectResult> {
  let attempt = 0;
  let authRetries = 0;

  while (attempt < config.maxAttempts) {
    // Wait with backoff
    const interval = calculateBackoff(attempt, config);
    await sleep(interval);

    try {
      await connect();
      return { success: true, attempts: attempt + 1 };
    } catch (err) {
      // Check if it's an auth error
      if (err instanceof AuthError) {
        if (config.terminalAuthErrors.includes(err.code)) {
          // Terminal auth error - stop reconnecting
          return { success: false, error: err, reason: 'terminal_auth_error' };
        }

        if (config.retryableAuthErrors.includes(err.code)) {
          authRetries++;
          if (authRetries >= config.maxAuthRetries) {
            return { success: false, error: err, reason: 'max_auth_retries' };
          }
          // Continue with backoff
        }
      }

      attempt++;
    }
  }

  return { success: false, error: lastError, reason: 'max_attempts' };
}
```

## 8. Heartbeat and Gap Detection

### 8.1 Tick Monitoring

```typescript
interface TickConfig {
  // Multiple of tickIntervalMs to consider connection stale
  staleMultiplier: number;  // Default: 2
}

class TickMonitor {
  private lastTick: number | null = null;
  private tickIntervalMs: number = 30000;
  private staleMultiplier: number = 2;

  setTickInterval(ms: number) {
    this.tickIntervalMs = ms;
  }

  onTick(ts: number) {
    this.lastTick = ts;
  }

  isStale(): boolean {
    if (this.lastTick === null) return false;
    const staleThreshold = this.tickIntervalMs * this.staleMultiplier;
    return Date.now() - this.lastTick > staleThreshold;
  }

  // Call periodically to check staleness
  checkStaleness(): boolean {
    if (this.isStale()) {
      throw new ConnectionError({
        code: 'CONNECTION_STALE',
        message: 'No tick received for ' +
          (this.tickIntervalMs * this.staleMultiplier) + 'ms',
      });
    }
    return true;
  }
}
```

### 8.2 Sequence Gap Detection

```typescript
interface GapRecoveryConfig {
  mode: 'reconnect' | 'snapshot' | 'skip';
  // 'reconnect': Auto reconnect and resync
  // 'snapshot': Request state from server
  // 'skip': Continue with gaps logged
}

class GapDetector {
  private lastSeq: number | null = null;

  onEvent(seq: number): void {
    if (this.lastSeq !== null && seq > this.lastSeq + 1) {
      const gap = {
        expected: this.lastSeq + 1,
        received: seq,
        missed: seq - this.lastSeq - 1,
      };

      // Emit gap event for consumer to handle
      this.emit('gap', gap);
    }
    this.lastSeq = seq;
  }

  reset() {
    this.lastSeq = null;
  }
}

// Usage with recovery modes
const gapRecoveryConfig: GapRecoveryConfig = {
  mode: 'reconnect',  // Default
};

client.on('gap', async (info) => {
  console.log(`Gap detected: missed ${info.missed} events`);

  switch (gapRecoveryConfig.mode) {
    case 'reconnect':
      console.log('Reconnecting to resync...');
      await client.reconnect();
      break;

    case 'snapshot':
      console.log('Requesting state snapshot...');
      await client.request('snapshot.get', {});
      break;

    case 'skip':
      console.log('Continuing with gaps');
      break;
  }
});
```

## 9. Error Types Summary

| Error Type | Description | Retry Strategy |
|------------|-------------|----------------|
| `ConnectionError` | WebSocket/TLS error | Fibonacci backoff |
| `AuthError` | Authentication failed | Pause, max retries, then stop |
| `ProtocolError` | Protocol mismatch | Fatal, require upgrade |
| `TimeoutError` | Request timeout | Retry with Fibonacci backoff |
| `GatewayError` | Business error | Depends on error code |
| `ReconnectError` | Max attempts reached | Fatal, manual reconnect |
| `GapError` | Event gap detected | Consumer decides |

### Error Codes

```typescript
const ErrorCodes = {
  // Connection
  TLS_FINGERPRINT_MISMATCH: 'TLS_FINGERPRINT_MISMATCH',
  CONNECTION_STALE: 'CONNECTION_STALE',
  CONNECTION_CLOSED: 'CONNECTION_CLOSED',

  // Auth
  CHALLENGE_EXPIRED: 'CHALLENGE_EXPIRED',
  CHALLENGE_FAILED: 'CHALLENGE_FAILED',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_MISMATCH: 'AUTH_TOKEN_MISMATCH',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  AUTH_DEVICE_REJECTED: 'AUTH_DEVICE_REJECTED',
  AUTH_PASSWORD_INVALID: 'AUTH_PASSWORD_INVALID',

  // Protocol
  PROTOCOL_UNSUPPORTED: 'PROTOCOL_UNSUPPORTED',

  // Request
  METHOD_NOT_FOUND: 'METHOD_NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

## 10. Environment Adaptation

### 10.1 Package.json Exports

```json
{
  "name": "openclaw-sdk",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "browser": {
        "import": "./dist/browser/index.js",
        "require": "./dist/browser/index.cjs"
      }
    },
    "./protocol": {
      "types": "./dist/protocol/index.d.ts",
      "import": "./dist/protocol/index.js",
      "require": "./dist/protocol/index.cjs"
    }
  }
}
```

### 10.2 Platform Detection

The SDK uses **build-time exports** (via package.json conditions) rather than runtime detection. This is the correct approach for optimal tree-shaking.

- Remove `platform` from runtime config
- Use package.json `browser` condition for browser builds

## 11. Implementation Plan

### Phase 1: Core Foundation
- [ ] Project structure with exports configuration
- [ ] Protocol types (TypeBox schemas)
- [ ] WebSocket transport abstraction
- [ ] Basic connection/disconnection
- [ ] Request/response with pending tracking

### Phase 2: Authentication
- [ ] Credentials Provider interface
- [ ] Token authentication
- [ ] Device Pairing with challenge flow
- [ ] Password authentication
- [ ] Connect challenge handling
- [ ] Challenge expiration handling

### Phase 3: Connection Reliability
- [ ] Protocol version negotiation
- [ ] TLS fingerprint validation
- [ ] Tick/heartbeat monitoring
- [ ] Sequence gap detection
- [ ] Graceful shutdown (stopAndWait)
- [ ] Security: URL validation

### Phase 4: Enhanced Features
- [ ] Fibonacci backoff with jitter
- [ ] Auth-aware reconnection
- [ ] Event subscription system
- [ ] Request cancellation (AbortController)
- [ ] Async operation handling (expectFinal)

### Phase 5: Platform Support
- [ ] Node.js environment (ws package)
- [ ] Browser environment (native WebSocket)
- [ ] Bundle testing (webpack, vite)

### Phase 6: Polish
- [ ] Comprehensive type exports
- [ ] Documentation
- [ ] Test coverage (80%+)

## 12. Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| TLS fingerprint source | Configured via `expectedFingerprints` Map, admin provides fingerprints |
| Auth method priority | Explicit `primaryAuth` config, default: bootstrapToken > deviceToken > token > password |
| Challenge expiration | Auto-retry up to 3 times, then throw CHALLENGE_EXPIRED |
| Private key security | CredentialsProvider interface, Web Crypto API for browser |
| Backoff algorithm | Fibonacci with jitter: `min(base * F(attempt+2), max) * (1 ± jitter)` |

---

## Appendix: API Reference

### Client Options

```typescript
interface OpenClawClientOptions {
  // Required
  url: string;

  // Authentication
  credentials: CredentialsProvider;
  primaryAuth?: AuthMethod;

  // Client identity
  client: {
    id?: string;
    name: string;
    version: string;
    mode: 'cli' | 'webchat' | 'gateway' | 'service';
    instanceId?: string;
  };

  // Connection
  reconnect?: ReconnectConfig;
  timeout?: {
    connect?: number;
    request?: number;
    challenge?: number;
  };
  security?: SecurityConfig;

  // Events
  onTick?: (ts: number) => void;
  onGap?: (info: GapInfo) => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (err: Error) => void;
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connect.challenge` | `ChallengePayload` | Server sends challenge |
| `connect.challenge_expired` | - | Challenge timed out |
| `hello-ok` | `HelloOk` | Authentication successful |
| `tick` | `{ ts: number }` | Heartbeat |
| `agent.event` | `AgentEvent` | Agent activity |
| `chat.message` | `ChatMessage` | Chat message |
| `gap` | `GapInfo` | Sequence gap detected |
| `*` | `EventFrame` | Any event |
