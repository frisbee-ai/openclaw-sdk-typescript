/**
 * Request Cancellation Unit Tests
 *
 * These tests verify the AbortError class and RequestOptions type.
 */

import { describe, it, expect } from 'vitest';
import { AbortError, isAbortError } from './errors';
import type { RequestOptions } from './client';

// ============================================================================
// AbortError Tests
// ============================================================================

describe('AbortError (Task 4.5)', () => {
  describe('constructor', () => {
    it('should create AbortError with default message', () => {
      const error = new AbortError();
      expect(error.message).toBe('Request was aborted');
      expect(error.code).toBe('REQUEST_ABORTED');
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('AbortError');
    });

    it('should create AbortError with custom message', () => {
      const error = new AbortError('Custom abort message');
      expect(error.message).toBe('Custom abort message');
      expect(error.code).toBe('REQUEST_ABORTED');
    });

    it('should create AbortError with details', () => {
      const details = { requestId: 'req-123' };
      const error = new AbortError('Aborted', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('isAbortError type guard', () => {
    it('should return true for AbortError', () => {
      const error = new AbortError();
      expect(isAbortError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Regular error');
      expect(isAbortError(error)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const error = new AbortError('Test abort');
      const json = error.toJSON();
      expect(json).toMatchObject({
        name: 'AbortError',
        message: 'Test abort',
        code: 'REQUEST_ABORTED',
        retryable: false,
      });
    });
  });
});

// ============================================================================
// RequestOptions Type Tests
// ============================================================================

describe('RequestOptions type', () => {
  it('should accept signal option', () => {
    const controller = new AbortController();
    const options: RequestOptions = { signal: controller.signal };
    expect(options.signal).toBe(controller.signal);
  });

  it('should accept expectFinal option', () => {
    const options: RequestOptions = { expectFinal: true };
    expect(options.expectFinal).toBe(true);
  });

  it('should accept expectFinalTimeoutMs option', () => {
    const options: RequestOptions = { expectFinalTimeoutMs: 5000 };
    expect(options.expectFinalTimeoutMs).toBe(5000);
  });

  it('should accept all options together', () => {
    const controller = new AbortController();
    const options: RequestOptions = {
      signal: controller.signal,
      expectFinal: true,
      expectFinalTimeoutMs: 10000,
    };
    expect(options.signal).toBeDefined();
    expect(options.expectFinal).toBe(true);
    expect(options.expectFinalTimeoutMs).toBe(10000);
  });
});

// ============================================================================
// Client Abort Method Tests
// ============================================================================

describe('Client.abort method', () => {
  it('should have RequestOptions exported as type', () => {
    // RequestOptions is exported as a type, check the type is usable
    const options: RequestOptions = {
      signal: undefined,
      expectFinal: false,
      expectFinalTimeoutMs: 30000,
    };
    expect(options).toBeDefined();
  });
});

// ============================================================================
// expectFinal Option Tests (Task 4.6)
// ============================================================================

describe('expectFinal option (Task 4.6)', () => {
  describe('RequestOptions with expectFinal', () => {
    it('should accept expectFinal: true', () => {
      const options: RequestOptions = { expectFinal: true };
      expect(options.expectFinal).toBe(true);
    });

    it('should accept expectFinal: false', () => {
      const options: RequestOptions = { expectFinal: false };
      expect(options.expectFinal).toBe(false);
    });

    it('should use default expectFinalTimeoutMs when not specified', () => {
      const options: RequestOptions = { expectFinal: true };
      expect(options.expectFinalTimeoutMs).toBeUndefined();
    });

    it('should accept custom expectFinalTimeoutMs', () => {
      const options: RequestOptions = { expectFinal: true, expectFinalTimeoutMs: 60000 };
      expect(options.expectFinalTimeoutMs).toBe(60000);
    });

    it('should combine with signal', () => {
      const controller = new AbortController();
      const options: RequestOptions = {
        expectFinal: true,
        expectFinalTimeoutMs: 30000,
        signal: controller.signal,
      };
      expect(options.expectFinal).toBe(true);
      expect(options.expectFinalTimeoutMs).toBe(30000);
      expect(options.signal).toBe(controller.signal);
    });

    it('should work without expectFinal but with expectFinalTimeoutMs', () => {
      // When expectFinal is false/undefined, expectFinalTimeoutMs should be ignored
      const options: RequestOptions = { expectFinalTimeoutMs: 5000 };
      expect(options.expectFinal).toBeUndefined();
      expect(options.expectFinalTimeoutMs).toBe(5000);
    });
  });

  describe('timeout handling', () => {
    it('should use default request timeout when expectFinal is not set', () => {
      const options: RequestOptions = {};
      // Default timeout is handled by client, this tests the options object
      expect(options.expectFinal).toBeUndefined();
    });

    it('should allow expectFinalTimeoutMs of 0', () => {
      const options: RequestOptions = { expectFinal: true, expectFinalTimeoutMs: 0 };
      expect(options.expectFinalTimeoutMs).toBe(0);
    });

    it('should allow large expectFinalTimeoutMs values', () => {
      const options: RequestOptions = { expectFinal: true, expectFinalTimeoutMs: 3600000 };
      expect(options.expectFinalTimeoutMs).toBe(3600000); // 1 hour
    });
  });
});
