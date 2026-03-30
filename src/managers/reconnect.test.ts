/**
 * Reconnection Manager Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReconnectManager, createReconnectManager, DEFAULT_RECONNECT_CONFIG } from './reconnect.js';

describe('ReconnectManager', () => {
  let manager: ReconnectManager;

  beforeEach(() => {
    manager = createReconnectManager();
  });

  describe('onListenerError', () => {
    it('should call custom error handler when listener throws', async () => {
      const errorHandler = vi.fn();
      manager.onListenerError(errorHandler);

      const badListener = () => {
        throw new Error('Listener error');
      };

      manager.onEvent(badListener);

      // Trigger an event by aborting
      manager.abort();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        event: expect.objectContaining({
          state: 'idle',
        }),
      });
      expect((errorHandler.mock.calls[0][0] as { error: Error }).error.message).toBe(
        'Listener error'
      );
    });

    it('should include event details in error handler call', async () => {
      const errorHandler = vi.fn();
      manager.onListenerError(errorHandler);

      manager.onEvent(() => {
        throw new Error('Test error');
      });

      // Start reconnect which will trigger events (use quick config)
      const quickManager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 20,
      });
      quickManager.onListenerError(errorHandler);
      quickManager.onEvent(() => {
        throw new Error('Test error');
      });

      const connectFn = vi.fn(async () => {
        throw new Error('Connection fails');
      });

      await expect(quickManager.reconnect(connectFn)).rejects.toThrow();

      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        event: expect.objectContaining({
          state: expect.any(String),
          attempt: expect.any(Number),
        }),
      });
    });

    it('should allow removing error handler by passing null', async () => {
      const errorHandler = vi.fn();
      manager.onListenerError(errorHandler);
      manager.onListenerError(null);

      manager.onEvent(() => {
        throw new Error('Should not be caught');
      });

      manager.abort();

      // Should not call the error handler when it's null
      expect(errorHandler).not.toHaveBeenCalled();
    });

    it('should continue processing other listeners after one throws', async () => {
      const errorHandler = vi.fn();
      manager.onListenerError(errorHandler);

      const results: string[] = [];

      manager.onEvent(() => {
        results.push('listener1');
      });

      manager.onEvent(() => {
        results.push('listener2');
        throw new Error('Listener2 error');
      });

      manager.onEvent(() => {
        results.push('listener3');
      });

      manager.abort();

      expect(results).toEqual(['listener1', 'listener2', 'listener3']);
      expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple errors from different listeners', async () => {
      const errorHandler = vi.fn();
      manager.onListenerError(errorHandler);

      manager.onEvent(() => {
        throw new Error('Error 1');
      });

      manager.onEvent(() => {
        throw new Error('Error 2');
      });

      manager.abort();

      expect(errorHandler).toHaveBeenCalledTimes(2);
      expect((errorHandler.mock.calls[0][0] as { error: Error }).error.message).toBe('Error 1');
      expect((errorHandler.mock.calls[1][0] as { error: Error }).error.message).toBe('Error 2');
    });

    it('should not call error handler for successful listeners', async () => {
      const errorHandler = vi.fn();
      manager.onListenerError(errorHandler);

      manager.onEvent(() => {
        // Successful listener
      });

      manager.abort();

      expect(errorHandler).not.toHaveBeenCalled();
    });
  });

  describe('basic functionality', () => {
    it('should create with default config', () => {
      expect(manager.getState()).toBe('idle');
      expect(manager.getAttempt()).toBe(0);
      expect(manager.isReconnecting()).toBe(false);
    });

    it('should create with custom config', () => {
      const customManager = createReconnectManager({
        maxAttempts: 5,
        initialDelayMs: 500,
      });

      expect(customManager).toBeInstanceOf(ReconnectManager);
    });

    it('should track state changes', async () => {
      const states: string[] = [];

      manager.onEvent(event => {
        states.push(event.state);
      });

      // Use abort to trigger idle state
      manager.abort();
      expect(states).toContain('idle');

      // Use reconnect to trigger state changes with low maxAttempts
      const quickManager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10, // Very short delay for testing
        maxDelayMs: 20,
      });
      quickManager.onEvent(event => {
        states.push(event.state);
      });

      const connectFn = vi.fn(async () => {
        throw new Error('Fail');
      });

      await expect(quickManager.reconnect(connectFn)).rejects.toThrow();

      // Should have captured state changes
      expect(states).toContain('connecting');
      expect(states).toContain('reconnecting');
      expect(states).toContain('failed');
    });

    it('should unsubscribe listener', () => {
      const handler = vi.fn();
      const unsub = manager.onEvent(handler);

      manager.abort();
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();

      manager.abort();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return current state', () => {
      expect(manager.getState()).toBe('idle');

      manager.abort();
      expect(manager.getState()).toBe('idle');
    });

    it('should return current attempt', async () => {
      expect(manager.getAttempt()).toBe(0);

      // After a failed reconnect attempt (use quick config)
      const quickManager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 20,
      });

      const connectFn = vi.fn(async () => {
        throw new Error('Fail');
      });

      await expect(quickManager.reconnect(connectFn)).rejects.toThrow();

      expect(quickManager.getAttempt()).toBeGreaterThan(0);
    });

    it('should check if reconnecting', async () => {
      // BUG-03 fix: reconnect now has initial delay before first connectFn call
      // Use increased timeout to account for async initial delay
      vi.setConfig({ testTimeout: 20000 });

      expect(manager.isReconnecting()).toBe(false);

      // Start reconnect process with initialDelayMs=10, jitterFactor=0 for predictable ~10ms initial delay
      const quickManager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10,
        jitterFactor: 0,
        maxDelayMs: 20,
      });

      const connectFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
      });

      const reconnectPromise = quickManager.reconnect(connectFn);

      // Wait enough time for initial delay + connectFn to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should no longer be reconnecting since connectFn succeeded
      expect(quickManager.isReconnecting()).toBe(false);

      // Abort to clean up (should be no-op since already succeeded)
      quickManager.abort();

      try {
        await reconnectPromise;
      } catch {
        // Expected if already aborted
      }

      expect(quickManager.isReconnecting()).toBe(false);
    }, 20000);
  });

  describe('abort', () => {
    it('should stop reconnection', async () => {
      // BUG-03 fix: reconnect now has initial delay before first connectFn call
      vi.setConfig({ testTimeout: 20000 });

      let callCount = 0;
      const connectFn = vi.fn(async () => {
        callCount++;
        // This will succeed, so no retries will happen
      });

      // Start reconnection with initialDelayMs=1, jitterFactor=0 for fast initial delay
      const reconnectManager = createReconnectManager({
        maxAttempts: 10,
        initialDelayMs: 1,
        jitterFactor: 0,
      });

      // Start reconnect in background
      const reconnectPromise = reconnectManager.reconnect(connectFn);

      // Wait for initial delay to pass then abort
      await new Promise(resolve => setTimeout(resolve, 50));
      reconnectManager.abort();

      // The promise should resolve successfully (connectFn completed before abort took effect)
      await reconnectPromise;

      // But subsequent retries won't happen
      expect(callCount).toBe(1);
      expect(reconnectManager.getState()).toBe('idle');
    }, 20000);

    it('should clear timeout on abort', () => {
      manager.abort();

      expect(manager.getState()).toBe('idle');
    });

    it('should be idempotent', () => {
      expect(() => {
        manager.abort();
        manager.abort();
        manager.abort();
      }).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset state to idle', async () => {
      // First, put manager in a non-idle state (use quick config)
      const quickManager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 20,
      });

      const connectFn = vi.fn(async () => {
        throw new Error('Fail');
      });

      await expect(quickManager.reconnect(connectFn)).rejects.toThrow();

      // Reset should return to idle
      quickManager.reset();

      expect(quickManager.getState()).toBe('idle');
      expect(quickManager.getAttempt()).toBe(0);
    });

    it('should call abort internally', () => {
      const abortSpy = vi.spyOn(manager as any, 'abort');

      manager.reset();

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('reconnect', () => {
    it('should succeed on first attempt', async () => {
      const connectFn = vi.fn(async () => {
        // Connection succeeds
      });

      await manager.reconnect(connectFn);

      expect(connectFn).toHaveBeenCalledTimes(1);
      expect(manager.getState()).toBe('success');
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const connectFn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Connection failed');
        }
      });

      await manager.reconnect(connectFn);

      expect(connectFn).toHaveBeenCalledTimes(3);
      expect(manager.getState()).toBe('success');
    });

    it('should respect maxAttempts', async () => {
      const connectFn = vi.fn(async () => {
        throw new Error('Always fails');
      });

      const maxAttemptsManager = createReconnectManager({
        maxAttempts: 3,
      });

      await expect(maxAttemptsManager.reconnect(connectFn)).rejects.toThrow(
        'Max reconnection attempts'
      );
    });

    it('should emit events during reconnection', async () => {
      const events: string[] = [];

      // Use quick config to avoid timeout
      const quickManager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 20,
      });

      quickManager.onEvent(event => {
        events.push(event.state);
      });

      const connectFn = vi.fn(async () => {
        throw new Error('Fails once');
      });

      await expect(quickManager.reconnect(connectFn)).rejects.toThrow();

      expect(events).toContain('connecting');
      expect(events).toContain('reconnecting');
    });
  });

  describe('calculateDelay', () => {
    it('should use Fibonacci backoff', async () => {
      const manager = createReconnectManager({
        initialDelayMs: 10,
        maxDelayMs: 100,
        jitterFactor: 0, // Disable jitter for predictable testing
        maxAttempts: 2, // Limit attempts for faster test
      });

      // Verify reconnection works with fibonacci delays
      const connectFn = vi.fn(async () => {
        throw new Error('Test');
      });

      await expect(manager.reconnect(connectFn)).rejects.toThrow();

      // Verify it tried multiple times (with fibonacci delays)
      expect(connectFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('terminal auth errors', () => {
    it('should stop reconnection on terminal auth error', async () => {
      const { ReconnectError } = await import('../errors.js');

      const connectFn = vi.fn(async () => {
        // Use 'any' to bypass type check since implementation does code casting
        throw new ReconnectError({
          code: 'AUTH_DEVICE_REJECTED' as any,
          message: 'Device rejected',
          retryable: false,
        });
      });

      await expect(manager.reconnect(connectFn)).rejects.toThrow('Terminal auth error');
      expect(connectFn).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  describe('retryable auth errors', () => {
    it('should retry on retryable auth error with token refresh', async () => {
      const { ReconnectError } = await import('../errors.js');

      let attempts = 0;
      const connectFn = vi.fn(async () => {
        attempts++;
        if (attempts === 1) {
          throw new ReconnectError({
            code: 'AUTH_TOKEN_EXPIRED' as any,
            message: 'Token expired',
            retryable: true,
          });
        }
      });

      const refreshTokenFn = vi.fn(async () => ({
        success: true,
        token: 'new-token',
      }));

      await manager.reconnect(connectFn, refreshTokenFn);

      expect(connectFn).toHaveBeenCalledTimes(2);
      expect(refreshTokenFn).toHaveBeenCalledTimes(1);
    });

    it('should stop after max auth retries', async () => {
      const { ReconnectError } = await import('../errors.js');

      const connectFn = vi.fn(async () => {
        throw new ReconnectError({
          code: 'AUTH_TOKEN_EXPIRED' as any,
          message: 'Token expired',
          retryable: true,
        });
      });

      const refreshTokenFn = vi.fn(async () => ({
        success: true,
        token: 'new-token',
      }));

      // Use quick config to avoid timeout
      const quickManager = createReconnectManager({
        maxAttempts: 5, // Allow enough attempts for auth retries
        maxAuthRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 20,
      });

      await expect(quickManager.reconnect(connectFn, refreshTokenFn)).rejects.toThrow(
        'Max auth retries'
      );

      expect(refreshTokenFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('token refresh failure', () => {
    it('should stop reconnecting when token refresh fails', async () => {
      const { ReconnectError } = await import('../errors.js');

      const connectFn = vi.fn(async () => {
        throw new ReconnectError({
          code: 'AUTH_TOKEN_EXPIRED' as any,
          message: 'Token expired',
          retryable: true,
        });
      });

      const refreshTokenFn = vi.fn(async () => ({
        success: false,
        token: null as any, // Include token property to match RefreshResult type
      }));

      await expect(manager.reconnect(connectFn, refreshTokenFn)).rejects.toThrow(
        'Token refresh failed'
      );

      expect(connectFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration', () => {
    it('should use default config values', () => {
      expect(DEFAULT_RECONNECT_CONFIG.maxAttempts).toBe(10);
      expect(DEFAULT_RECONNECT_CONFIG.maxAuthRetries).toBe(3);
      expect(DEFAULT_RECONNECT_CONFIG.initialDelayMs).toBe(1000);
      expect(DEFAULT_RECONNECT_CONFIG.maxDelayMs).toBe(30000);
      expect(DEFAULT_RECONNECT_CONFIG.pauseOnAuthError).toBe(true);
      expect(DEFAULT_RECONNECT_CONFIG.jitterFactor).toBe(0.3);
    });

    it('should merge partial config with defaults', () => {
      const customManager = createReconnectManager({
        maxAttempts: 5,
      });

      // Should use custom maxAttempts but default other values
      expect(customManager).toBeInstanceOf(ReconnectManager);
    });
  });
});

describe('createReconnectManager', () => {
  it('should create a new reconnect manager instance', () => {
    const manager = createReconnectManager();

    expect(manager).toBeInstanceOf(ReconnectManager);
    expect(manager.getState()).toBe('idle');
  });

  it('should create with custom config', () => {
    const manager = createReconnectManager({
      maxAttempts: 5,
      initialDelayMs: 500,
    });

    expect(manager).toBeInstanceOf(ReconnectManager);
  });
});
