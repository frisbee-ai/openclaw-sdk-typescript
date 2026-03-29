# Coding Conventions

**Analysis Date:** 2026-03-29

## Naming Patterns

**Files:**
- TypeScript source: `camelCase.ts` (e.g., `eventManager.ts`, `timeoutManager.ts`)
- Test files: Same as source with `.test.ts` suffix (e.g., `event.test.ts`)
- Integration test files: Same as source with `.integration.test.ts` suffix
- Alternative test location: `__tests__/` subdirectory with `*.test.ts` files (e.g., `src/transport/__tests__/browser.test.ts`)

**Directories:**
- kebab-case (e.g., `connection-manager`, `api-methods`)

**Classes and Types:**
- PascalCase (e.g., `OpenClawError`, `EventManager`, `ConnectionConfig`)
- Interface names do NOT use `I` prefix (e.g., `CredentialsProvider`, not `ICredentialsProvider`)
- Type aliases for unions/enums use PascalCase (e.g., `AuthErrorCode`, `ReconnectState`)

**Variables and Functions:**
- camelCase (e.g., `createClient`, `requestTimeoutMs`, `maxAttempts`)
- Unused function parameters: prefix with `_` (e.g., `function foo(_unused: string)`)

**Constants:**
- `UPPER_SNAKE_CASE` for exported constants (e.g., `DEFAULT_RECONNECT_CONFIG`, `MAX_EVENT_NAME_LENGTH`)
- `UPPER_SNAKE_CASE` for named groups in source (e.g., `// ============================================================================`)
- Plain camelCase for private class-level constants

**Enums and Error Codes:**
- SCREAMING_SNAKE_CASE for error code string literals (e.g., `'AUTH_TOKEN_EXPIRED'`, `'MAX_RECONNECT_ATTEMPTS'`)

## Code Style

**Formatting:**
- Tool: Prettier (configured in `.prettierrc`)
- Settings:
  - `singleQuote: true` - Use single quotes for strings
  - `semi: true` - Always include semicolons
  - `tabWidth: 2` - 2-space indentation
  - `trailingComma: "es5"` - Trailing commas where valid in ES5
  - `printWidth: 100` - Max line length 100 characters
  - `bracketSpacing: true` - Space inside braces
  - `arrowParens: "avoid"` - Omit parens when possible for single-arg arrow functions

**Linting:**
- Tool: ESLint flat config (`eslint.config.js`)
- Plugin: `@typescript-eslint` with `recommended` rules
- Key rules enforced:
  - `no-unused-vars`: Error, with `argsIgnorePattern: '^_'` to allow unused args prefixed with `_`
  - `no-explicit-any`: Warn in source files, off in test files
  - `no-empty-object-type`: Off (allows `interface Foo {}`)
- Test files: Separate ESLint config block with relaxed rules and full Vitest/Node.js globals

**Pre-commit Hooks:**
- Tool: husky + lint-staged
- On commit, runs: `prettier --write` then `eslint --fix` on `*.ts` files

**TypeScript Configuration:**
- `strict: true` - Full strict mode enabled
- `moduleResolution: "bundler"` - Bundler-style resolution
- ESM output (`module: "ESNext"`, `moduleResolution: "bundler"`)
- Dual build: ESM (`dist/esm/`) + CJS (`dist/cjs/`)
- Path alias: `openclaw/protocol` maps to `node_modules/openclaw/dist/plugin-sdk/gateway/protocol/index`

**Private Members:**
- Use `private` keyword on class members (not `#` private fields)
- Combine with `readonly` when applicable

## Import Organization

**ESM with `.js` Extensions:**
All internal imports use `.js` extensions for ESM compatibility:

```typescript
import { OpenClawClient, createClient } from './client.js';
import type { ClientConfig } from './client.js';
import { ReconnectError, OpenClawError } from '../errors.js';
```

**Import Grouping (within files):**
Use separator comments to group imports:

```typescript
// Main client exports
export { OpenClawClient, createClient } from './client.js';

// ============================================================================
// Error Types
// ============================================================================

// Error classes
export { OpenClawError, AuthError, ConnectionError } from './errors.js';
```

**Type-only Imports:**
Always use `import type` for type-only imports to enable tree-shaking:

```typescript
import type { CredentialsProvider } from './auth/provider.js';
import type { EventFrame } from './protocol/frames.js';
```

**Order:**
1. External dependencies
2. Internal imports (grouped by module with separators)

## Error Handling

**Error Class Hierarchy:**
```
OpenClawError (base)
  AuthError
  ConnectionError
  ProtocolError
  RequestError
    TimeoutError
    CancelledError
    AbortError
  GatewayError
  ReconnectError
```

**Base Class Pattern:**
```typescript
export class OpenClawError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Subclass Pattern (config object):**
```typescript
export class AuthError extends OpenClawError {
  constructor(config: {
    code: AuthErrorCode;
    message: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(config.message, config.code, config.retryable ?? isAuthErrorRetryable(config.code), config.details);
    this.name = 'AuthError';
  }
}
```

**Factory Function:**
```typescript
export function createErrorFromResponse(error: {
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
}): OpenClawError { ... }
```

**Type Guards:**
```typescript
export function isOpenClawError(error: unknown): error is OpenClawError {
  return error instanceof OpenClawError;
}
```

**Listener Error Handling Pattern:**
Classes with event listeners (EventManager, ReconnectManager) wrap handler calls in try/catch and delegate errors to a configurable `onListenerError` handler. Default falls back to logger/console.

```typescript
private listenerErrorHandler: ListenerErrorHandler | null = null;

onListenerError(handler: ListenerErrorHandler | null): void {
  this.listenerErrorHandler = handler;
}

private safeCall(handler: EventHandler<T>, payload: T, eventName: string, pattern: EventPattern): void {
  try {
    handler(payload);
  } catch (error) {
    if (this.listenerErrorHandler) {
      this.listenerErrorHandler({ error, eventName, pattern });
    } else {
      this.logger.error(...);
    }
  }
}
```

## Logging

**Logger Interface:**
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  name: string;
  level: LogLevel;
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
```

**Pattern:**
- Accept optional `Logger` in constructor, fall back to inline noop logger or console-based logger
- Use structured metadata as second parameter: `logger.error('message', { key: value })`

## JSDoc / Documentation

**Required for All Public APIs:**
Every exported class, function, and type should have JSDoc:

```typescript
/**
 * Event manager for client-side event handling.
 *
 * Supports:
 * - Exact match: 'tick' matches only 'tick'
 * - Prefix wildcard: 'agent:*' matches 'agent.event', 'agent.created'
 * - Global wildcard: '*' matches all events
 *
 * @module
 */
export class EventManager { ... }
```

**Tags Used:**
- `@module` - Marks file-level module documentation
- `@example` - Code examples within JSDoc (wrapped in ` ```ts `)
- `@see` - Reference to related docs
- `@param` - Parameter descriptions
- `@returns` - Return value description

**Factory Functions:**
All modules that export a class also export a `createXxx()` factory function with JSDoc:

```typescript
/**
 * Create an event manager.
 *
 * @param logger - Optional logger instance
 * @returns New EventManager instance
 *
 * @example
 * ```ts
 * const events = createEventManager();
 * const unsub = events.on('tick', (payload) => { ... });
 * ```
 */
export function createEventManager(logger?: Logger): EventManager {
  return new EventManager(logger);
}
```

## Module Design

**Barrel Exports:**
The main `src/index.ts` re-exports everything public. Each submodule has its own `index.ts` barrel.

**File Structure:**
- One class per file (or tightly related classes)
- Keep files focused: typically under 400 lines
- Extract utilities into separate files when appropriate

**Constant Organization:**
```typescript
// ============================================================================
// Types
// ============================================================================

export interface FooConfig { ... }

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_FOO_CONFIG: FooConfig = { ... };

// ============================================================================
// Manager Class
// ============================================================================

export class FooManager { ... }
```

**Default Exports:**
Only the base `OpenClawError` class uses a default export. All other modules use named exports.

## Function Design

**Size:** Functions are kept small with single responsibility. Complex functions are broken into private helpers.

**Factory Pattern:**
Prefer factory functions `createXxx()` over direct constructor calls for public API, allowing for future extensibility (e.g., adding caching, pooling).

**Async Functions:**
All async operations use `async/await`. No raw Promises.

**Options Objects:**
For functions with many parameters, use options objects:

```typescript
export interface ReconnectConfig {
  maxAttempts: number;
  maxAuthRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  pauseOnAuthError: boolean;
  jitterFactor: number;
}
```

---

*Convention analysis: 2026-03-29*
