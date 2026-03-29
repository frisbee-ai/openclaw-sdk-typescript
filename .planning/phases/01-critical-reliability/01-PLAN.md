---
phase: 01-critical-reliability
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/managers/connection.ts
  - src/client.ts
autonomous: true
requirements:
  - REL-01

must_haves:
  truths:
    - "When reconnect encounters AUTH_TOKEN_EXPIRED, CHALLENGE_EXPIRED, or AUTH_RATE_LIMITED, authHandler.refreshToken() is called"
    - "After successful token refresh, the new token is used for the next reconnect attempt"
  artifacts:
    - path: "src/managers/connection.ts"
      provides: "ReconnectManager integration with token refresh"
      exports: ["ConnectionManager.reconnect()", "createConnectionManager(transport, config, reconnectManager?, authHandler?)"]
    - path: "src/client.ts"
      provides: "ReconnectManager instantiation and wiring"
  key_links:
    - from: "src/client.ts"
      to: "src/managers/connection.ts"
      via: "ReconnectManager passed in constructor"
    - from: "src/managers/connection.ts"
      to: "src/auth/provider.ts"
      via: "authHandler.refreshToken() in retry loop"
      pattern: "refreshTokenFn"
---

<objective>
Wire AuthHandler into the reconnect path so token refresh happens automatically when reconnect encounters retryable auth errors (AUTH_TOKEN_EXPIRED, CHALLENGE_EXPIRED, AUTH_RATE_LIMITED).

Purpose: The SDK must automatically recover from token expiry during reconnection without manual intervention.
Output: ConnectionManager uses ReconnectManager for reconnection with token refresh support.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/managers/connection.ts
@src/managers/reconnect.ts
@src/client.ts
@src/auth/provider.ts

<interfaces>
From src/managers/reconnect.ts:
```typescript
async reconnect(
  connectFn: () => Promise<void>,
  refreshTokenFn?: () => Promise<RefreshResult | null>
): Promise<void>
```

From src/auth/provider.ts:
```typescript
async refreshToken(): Promise<RefreshResult | null>
```

From src/managers/connection.ts (TO BE MODIFIED):
```typescript
// New constructor signature:
constructor(
  transport: IWebSocketTransport,
  config?: ConnectionManagerConfig,
  reconnectManager?: ReconnectManager,
  authHandler?: AuthHandler
)

// New factory signature:
export function createConnectionManager(
  transport: IWebSocketTransport,
  config?: ConnectionManagerConfig,
  reconnectManager?: ReconnectManager,
  authHandler?: AuthHandler
): ConnectionManager
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Modify ConnectionManager to accept ReconnectManager and AuthHandler</name>
  <files>src/managers/connection.ts</files>
  <action>
    Add imports at the top of the file (after existing imports):
    ```typescript
    import type { ReconnectManager } from './reconnect.js';
    import type { AuthHandler } from '../auth/provider.js';
    ```

    Add to ConnectionManager class fields:
    ```typescript
    private reconnectManager: ReconnectManager | null = null;
    private authHandler: AuthHandler | null = null;
    ```

    Modify constructor signature to accept two new optional parameters:
    ```typescript
    constructor(
      transport: IWebSocketTransport,
      config?: ConnectionManagerConfig,
      reconnectManager?: ReconnectManager,
      authHandler?: AuthHandler
    )
    ```

    Add at end of constructor body:
    ```typescript
    if (reconnectManager) {
      this.reconnectManager = reconnectManager;
    }
    if (authHandler) {
      this.authHandler = authHandler;
    }
    ```

    Add a new public reconnect() method that allows external triggering of reconnection (needed by GapDetector recovery in Plan 03):
    ```typescript
    /**
     * Trigger a reconnection attempt.
     * Uses ReconnectManager if available, otherwise falls back to scheduleReconnect.
     */
    reconnect(): void {
      if (this.reconnectManager && this.authHandler) {
        // Use ReconnectManager with token refresh
        this.reconnectManager.reconnect(
          () => this.doReconnect(),
          () => this.authHandler!.refreshToken()
        ).catch(error => {
          this.handleError('ReconnectManager failed', error, true);
        });
      } else {
        // Fallback to basic reconnection
        this.scheduleReconnect();
      }
    }

    /**
     * Internal reconnect implementation (called by ReconnectManager).
     */
    private async doReconnect(): Promise<void> {
      if (this.state === 'ready' || this.state === 'disconnected') {
        return;
      }
      const params = this.connectParams;
      const url = this.currentUrl;
      if (params && url) {
        await this.connect(url, params);
      }
    }
    ```

    Modify scheduleReconnect() to use ReconnectManager when available:
    Replace the setTimeout-based scheduling with:
    ```typescript
    private scheduleReconnect(): void {
      if (this.reconnectManager && this.authHandler) {
        // Use ReconnectManager for backoff + token refresh
        this.reconnectManager.reconnect(
          () => this.doReconnect(),
          () => this.authHandler!.refreshToken()
        ).catch(error => {
          this.handleError('ReconnectManager failed', error, true);
        });
      } else {
        // Fallback: basic immediate reconnect (preserves existing behavior when ReconnectManager not wired)
        this.setState('reconnecting');
        setTimeout(() => {
          const params = this.connectParams;
          const url = this.currentUrl;
          if (params && url) {
            this.connect(url, params).catch(error => {
              this.handleError(`Reconnection attempt failed`, error, true);
            });
          }
        }, this.config.reconnectDelayMs);
      }
    }
    ```

    Note: The `doReconnect()` method reuses `connect()` which already stores `connectParams`. No need to call `prepareAuth()` before each reconnect attempt - ReconnectManager handles token refresh via `refreshTokenFn` which is called when retryable auth errors occur.
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>ConnectionManager accepts ReconnectManager and AuthHandler, scheduleReconnect uses ReconnectManager when both are available, reconnect() public method exists</done>
  <read_first>
    - src/managers/connection.ts
    - src/managers/reconnect.ts
  </read_first>
  <acceptance_criteria>
    - grep -n "reconnectManager" src/managers/connection.ts shows the field declaration and usage
    - grep -n "authHandler" src/managers/connection.ts shows the field and usage in refreshToken call
    - grep -n "doReconnect" src/managers/connection.ts finds the private method
    - grep -n "reconnect()" src/managers/connection.ts finds the public reconnect() method
    - grep -n "import type.*ReconnectManager" src/managers/connection.ts finds the import
    - grep -n "import type.*AuthHandler" src/managers/connection.ts finds the import
    - TypeScript compiles without errors (npm run typecheck passes)
  </acceptance_criteria>
</task>

<task type="auto">
  <name>Task 2: Wire ReconnectManager and AuthHandler in client.ts</name>
  <files>src/client.ts</files>
  <action>
    Import ReconnectManager at the top of the file (add to existing imports from './managers/reconnect.js'):
    ```typescript
    import { ReconnectManager, createReconnectManager } from './managers/reconnect.js';
    ```

    In the OpenClawClient constructor, AFTER creating authHandler (around line 268), create ReconnectManager:
    ```typescript
    // Create reconnect manager with auth-aware retry
    const reconnectMgr = createReconnectManager({
      maxAttempts: this._normalizedConfig.maxReconnectAttempts,
      initialDelayMs: this._normalizedConfig.reconnectDelayMs,
      maxDelayMs: 30000,
      pauseOnAuthError: true,
      maxAuthRetries: 3,
      jitterFactor: 0.3,
    }, this.logger);
    ```

    Modify the createConnectionManager call to pass both reconnectManager and authHandler:
    ```typescript
    this.connectionManager = createConnectionManager(transport, {
      defaultRequestTimeout: normalizedConfig.requestTimeoutMs,
      autoReconnect: normalizedConfig.autoReconnect,
      reconnectDelayMs: normalizedConfig.reconnectDelayMs,
      maxReconnectAttempts: normalizedConfig.maxReconnectAttempts,
    }, reconnectMgr, this.authHandler);
    ```

    Note: The createConnectionManager factory now accepts 4 parameters: transport, config, reconnectManager (optional), authHandler (optional) - matching the ConnectionManager constructor signature.
  </action>
  <verify>
    <automated>npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>ReconnectManager created in client.ts and passed to ConnectionManager with authHandler</done>
  <read_first>
    - src/client.ts
  </read_first>
  <acceptance_criteria>
    - grep -n "createReconnectManager" src/client.ts finds the ReconnectManager creation
    - grep -n "reconnectMgr" src/client.ts shows it passed to createConnectionManager
    - grep -n "authHandler" src/client.ts shows authHandler passed to createConnectionManager
    - TypeScript compiles without errors (npm run typecheck passes)
  </acceptance_criteria>
</task>

</tasks>

<verification>
- npm run typecheck passes with no errors
- npm run build passes (ESM + CJS)
- Existing tests still pass: npm test -- --run
</verification>

<success_criteria>
When a token expires during reconnect, authHandler.refreshToken() is called (per D-01: triggered only for AUTH_TOKEN_EXPIRED, CHALLENGE_EXPIRED, AUTH_RATE_LIMITED). After token refresh succeeds, the new token is used for the next reconnect attempt. This is verified through the ReconnectManager.reconnect(connectFn, refreshTokenFn) pattern where refreshTokenFn is authHandler.refreshToken.
</success_criteria>

<output>
After completion, create `.planning/phases/01-critical-reliability/01-PLAN-SUMMARY.md`
</output>
