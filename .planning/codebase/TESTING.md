# Testing Patterns

**Analysis Date:** 2026-03-29

## Test Framework

**Runner:** Vitest 4.1.1

**Coverage:** @vitest/coverage-v8 4.1.1

**Run Commands:**
```bash
npm test                    # Run all tests in watch mode
npm test -- --run           # Run once (no watch), CI-friendly
npm test -- src/foo.test.ts # Run single test file
npm run lint                # Lint source and tests
```

**Node Requirement:** >=22.0.0

## Test File Organization

**Location:** Tests are co-located with source files, in the same directory.

**Naming Patterns:**
- Unit tests: `*.test.ts` (e.g., `src/managers/event.test.ts`)
- Integration tests: `*.integration.test.ts` (e.g., `src/managers/connection.integration.test.ts`)
- Alternative: `__tests__/` subdirectory with `*.test.ts` files (e.g., `src/transport/__tests__/browser.test.ts`)

**Test Distribution:**
- 45 test files across the codebase
- ~2,549 test assertions across all files
- Mix of unit and integration tests
- Some modules have both unit and integration test files

**No Separate Config File:**
Vitest uses default configuration. Test-specific globals and rules are defined in `eslint.config.js`.

## Test Structure

**Vitest Globals Available:**
`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, `beforeAll`, `afterAll`

**Suite Organization:**
```typescript
/**
 * ModuleName Tests
 *
 * Brief description covering:
 * - Unit: What is tested in unit tests
 * - Edge Cases: Edge cases covered
 * - Security: Security aspects tested
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SomeClass, createSomeClass, SOME_CONSTANT } from './some-module.js';

describe('SomeClass', () => {
  let instance: SomeClass;

  beforeEach(() => {
    instance = createSomeClass();
  });

  describe('methodName', () => {
    it('should do X', () => {
      const result = instance.methodName();
      expect(result).toBe(expected);
    });

    it('should handle Y case', () => {
      // ...
    });
  });
});
```

**Grouping Pattern:**
Tests are grouped by method/feature using nested `describe` blocks, then by scenario using `it`.

## Mocking

**Framework:** Vitest's built-in `vi` API (ViMock)

**Mocking Functions (`vi.fn`):**
```typescript
const mockFn = vi.fn();
const mockFnWithImpl = vi.fn((x: number) => x * 2);
const mockAsyncFn = vi.fn(async () => ({ success: true }));

// Assert calls
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ key: 'value' }));
```

**Spying on Objects (`vi.spyOn`):**
```typescript
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... test code ...
consoleErrorSpy.mockRestore();
```

**Mocking Timers:**
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Advance timers in tests
vi.advanceTimersByTime(100);
```

**Mocking Modules (Dynamic Import):**
```typescript
it('should handle error case', async () => {
  const { ReconnectError } = await import('../errors.js');
  const connectFn = vi.fn(async () => {
    throw new ReconnectError({
      code: 'AUTH_TOKEN_EXPIRED' as any,
      message: 'Token expired',
      retryable: true,
    });
  });
  // ...
});
```

**Mocking Classes:**
```typescript
// Create a mock transport class for testing
class MockTransport {
  url = '';
  readyState = 0;
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  async connect(url: string): Promise<void> {
    this.url = url;
    this.readyState = 1;
    this.onopen?.({ type: 'open' });
  }

  send(_data: string | ArrayBuffer): void { }

  close(_code?: number, _reason?: string): void {
    this.readyState = 3;
  }
}
```

**What to Mock:**
- External WebSocket connections (use MockTransport)
- Timers (use fake timers)
- Logger instances (provide noop logger)
- Credentials providers (use StaticCredentialsProvider with known test values)
- Error classes (dynamic import to avoid circular dependencies)

**What NOT to Mock:**
- Internal utility classes (test them directly)
- Protocol types and validators (test them directly)

## Fixtures and Factories

**Inline Test Data:**
```typescript
const validFrame: RequestFrame = { type: 'req', id: '1', method: 'ping' };

const validHelloOk = {
  protocol: 1,
  sessionId: 'test-session',
  serverId: 'server-1',
  policy: {
    maxPayload: 2097152,
    maxBufferedBytes: 131072,
    tickIntervalMs: 15000,
  },
};
```

**Using Constants from Source:**
```typescript
import { MAX_EVENT_NAME_LENGTH, DEFAULT_RECONNECT_CONFIG } from './module.js';

it('should validate event name length', () => {
  const longPattern = 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1);
  expect(() => events.on(longPattern, () => {})).toThrow('exceeds max length');
});
```

## Coverage

**No Enforced Target:**
Coverage is generated but no minimum threshold is enforced in CI.

**View Coverage:**
```bash
npm test -- --coverage
```

Coverage output is written to the `coverage/` directory (gitignored).

**Circular Dependency Check:**
```bash
npm run check:circular
```
Uses `madge` to detect circular imports.

## Test Types

**Unit Tests:**
- Test individual classes/functions in isolation
- Use mocks for dependencies
- Located in `*.test.ts` files
- Example: `src/errors.test.ts`, `src/managers/event.test.ts`

**Integration Tests:**
- Test multiple components working together
- Use mock transport to simulate WebSocket
- May involve real timer handling
- Located in `*.integration.test.ts` files
- Example: `src/managers/connection.integration.test.ts`, `src/auth/provider.integration.test.ts`

**E2E Tests:**
- Not used in this project (no E2E test framework detected)

## Common Patterns

**Async Testing:**
```typescript
it('should succeed on first attempt', async () => {
  const connectFn = vi.fn(async () => { /* success */ });
  await manager.reconnect(connectFn);
  expect(connectFn).toHaveBeenCalledTimes(1);
});

it('should throw on max attempts exceeded', async () => {
  await expect(manager.reconnect(connectFn)).rejects.toThrow('Max reconnection attempts');
});
```

**Error Testing:**
```typescript
it('should throw ValidationError on invalid frame', () => {
  expect(() => validateFrame({ type: 'invalid' as any })).toThrow(ValidationError);
  expect(() => validateFrame({ type: 'invalid' as any })).toThrow('Invalid frame type');
});
```

**State Testing:**
```typescript
it('should track state changes', async () => {
  const states: string[] = [];
  manager.onEvent((event) => {
    states.push(event.state);
  });

  await expect(quickManager.reconnect(connectFn)).rejects.toThrow();
  expect(states).toContain('connecting');
  expect(states).toContain('failed');
});
```

**Unsubscribe Testing:**
```typescript
it('should unsubscribe listener', () => {
  const handler = vi.fn();
  const unsub = manager.onEvent(handler);

  manager.abort();
  expect(handler).toHaveBeenCalledTimes(1);

  unsub();

  manager.abort();
  expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
});
```

**Spy Restore Pattern:**
```typescript
it('should fall back to console.error when no handler is set', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  // ... test code ...
  consoleErrorSpy.mockRestore();
});
```

## ESLint Test Configuration

Test files have a separate ESLint config block in `eslint.config.js` with:
- No type checking (`project` not set for test files)
- Full Vitest globals declared
- `no-explicit-any`: Off
- `@typescript-eslint/no-require-imports`: Off

## Import Conventions in Tests

**Pattern:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SomeClass, createSomeClass } from './module.js';
import type { SomeType } from './module.js';
```

**Note:** Import Vitest matchers and utilities from `vitest`. Do NOT import from `@vitest/*` directly unless needed.

---

*Testing analysis: 2026-03-29*
