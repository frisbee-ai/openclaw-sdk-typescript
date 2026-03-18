# Fix Configuration Object Parameter Bloat

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract ConnectionConfig from ClientConfig as a focused nested type while maintaining backward compatibility.

**Architecture:** Extract only the connection-related fields into a new `ConnectionConfig` interface. Keep identity fields flat (they work fine as-is). Support both flat and nested config for connection settings.

**Tech Stack:** TypeScript

---

## Problem Analysis

The current `ClientConfig` interface at `src/client.ts:30-76` has:

| Category | Fields | Current State |
|----------|--------|---------------|
| Identity | clientId, clientVersion, platform, deviceFamily, modelIdentifier, mode, instanceId | 7 flat optional fields - works fine |
| Auth | token, bootstrapToken, deviceToken, password | Already nested as `auth:` |
| Device | id, publicKey, signature, signedAt, nonce | Already nested as `device:` |
| Connection | requestTimeoutMs, connectTimeoutMs, autoReconnect, maxReconnectAttempts, reconnectDelayMs | 5 flat fields - should be extracted |

**Decision:** Only extract `ConnectionConfig`. Identity fields don't need extraction (no grouping benefit, work fine flat).

---

## Acceptance Criteria

1. **ConnectionConfig is extracted** as a new nested interface
2. **Both flat and nested config supported** for connection settings
3. **Backward compatibility preserved** - existing code using flat config continues to work
4. **All tests pass** after refactoring
5. **TypeScript compiles without errors**

---

## Implementation Steps

### Chunk 1: Extract ConnectionConfig Interface

- [ ] **Step 1: Read current ClientConfig structure**

```bash
Read src/client.ts lines 30-80
```

- [ ] **Step 2: Add ConnectionConfig interface**

File: `src/client.ts`

```typescript
/**
 * Connection behavior configuration
 */
export interface ConnectionConfig {
  /** Request timeout in milliseconds */
  requestTimeoutMs?: number;
  /** Connection timeout in milliseconds */
  connectTimeoutMs?: number;
  /** Whether to auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Delay between reconnection attempts in milliseconds */
  reconnectDelayMs?: number;
}
```

- [ ] **Step 3: Export ConnectionConfig from public API**

File: `src/index.ts` - Add export after ClientConfig export:

```typescript
export type { ConnectionConfig } from './client.js';
```

- [ ] **Step 4: Update ClientConfig to include connection**

```typescript
export interface ClientConfig {
  // Required
  url: string;
  clientId: string;

  // Identity - keep flat (works fine as-is)
  clientVersion?: string;
  platform?: string;
  deviceFamily?: string;
  modelIdentifier?: string;
  mode?: string;
  instanceId?: string;

  // Auth - already nested, keep as-is
  auth?: {
    token?: string;
    bootstrapToken?: string;
    deviceToken?: string;
    password?: string;
  };

  // Device - already nested, keep as-is
  device?: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
  };

  // Connection - NEW: extracted but supports both styles
  connection?: ConnectionConfig;

  // Backward compatibility: flat connection fields
  requestTimeoutMs?: number;
  connectTimeoutMs?: number;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelayMs?: number;
}
```

### Chunk 2: Add Normalization Logic

- [ ] **Step 5: Add helper function to normalize connection config**

File: `src/client.ts` - Add in OpenClawClient class

```typescript
/**
 * Normalize connection config - supports both flat and nested style
 */
private normalizeConnectionConfig(config: ClientConfig): Required<ConnectionConfig> {
  const conn = config.connection ?? {};
  return {
    requestTimeoutMs: conn.requestTimeoutMs ?? config.requestTimeoutMs ?? 30000,
    connectTimeoutMs: conn.connectTimeoutMs ?? config.connectTimeoutMs ?? 30000,
    autoReconnect: conn.autoReconnect ?? config.autoReconnect ?? true,
    maxReconnectAttempts: conn.maxReconnectAttempts ?? config.maxReconnectAttempts ?? 10,
    reconnectDelayMs: conn.reconnectDelayMs ?? config.reconnectDelayMs ?? 1000,
  };
}
```

- [ ] **Step 6: Update constructor to use normalized config**

Find where connection config is used in constructor and update to use `normalizeConnectionConfig()`.

Known locations in `src/client.ts`:
- Line 122: `config.connectTimeoutMs`
- Lines 127-130: `requestTimeoutMs`, `autoReconnect`, `reconnectDelayMs`, `maxReconnectAttempts`
- Line 273: `this.config.requestTimeoutMs`

### Chunk 3: Test and Verify

- [ ] **Step 7: Run TypeScript build**

```bash
npm run build
```

- [ ] **Step 8: Run all tests**

```bash
npm test
```

- [ ] **Step 9: Run lint**

```bash
npm run lint
```

---

## Verification Steps

1. TypeScript compiles: `npm run build` → 0 errors
2. All tests pass: `npm test` → 407 passed
3. No lint errors: `npm run lint` → 0 errors
4. Backward compatibility verified: Both flat and nested config work

---

## Precedence Rules

When both flat and nested are provided:
- Nested (`connection.requestTimeoutMs`) takes precedence over flat (`requestTimeoutMs`)
- This gives users migration path: start with flat, gradually move to nested

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Confusion about which style to use | Document nested as preferred, flat as deprecated but supported |
| Edge case: both styles specified | Nested takes precedence (documented) |

---

## RALPLAN-DR Summary

### Principles

1. **Minimal intervention** - Only extract what needs extraction (connection fields)
2. **Backward compatibility** - Support both flat and nested for connection
3. **YAGNI** - Don't extract identity fields (no grouping benefit)

### Decision Drivers

1. **Connection fields are cohesive** - They control connection behavior and are passed together
2. **Identity fields work fine flat** - No meaningful grouping benefit
3. **Already partially nested** - Auth/device are nested, only connection is flat

### Viable Options

| Option | Approach | Pros | Cons |
|--------|---------|------|------|
| **Extract only ConnectionConfig** | Minimal extraction, both styles | Clear benefit, backward compatible | None significant |
| Full dual-mode (original plan) | Extract identity + connection, both styles | Maximum flexibility | API confusion, over-engineering |
| No change | Keep all flat | Zero risk | Doesn't solve any problem |

### Why Chosen

- Connection fields ARE cohesive (control connection behavior)
- Identity fields DON'T need extraction (work fine flat)
- Provides clear migration path without breaking existing code

---

## ADR

### Decision

Extract only ConnectionConfig from ClientConfig, supporting both flat and nested config styles with nested taking precedence.

### Drivers

- Connection fields are cohesive (control connection lifecycle)
- Identity fields work fine flat (no grouping benefit)
- Maintains backward compatibility

### Alternatives Considered

- Full dual-mode for all fields (over-engineering, creates API confusion)
- No extraction (doesn't solve problem)

### Why Chosen

Minimal intervention achieves the goal without creating confusion or breaking existing code.

### Consequences

- Users have optional nested ConnectionConfig
- Flat config still works
- Migration path: flat → nested

### Follow-ups

- Consider deprecating flat connection fields in next major version
- Add documentation for migration path
