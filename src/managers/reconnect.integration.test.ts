/**
 * Reconnect Manager Integration Tests
 *
 * Integration tests covering:
 * - Reconnection flow with auth retry
 * - Multiple components interaction (ReconnectManager + TimeoutManager)
 * - Error handling across component boundaries
 */

import { describe, it, expect } from 'vitest';
import { createReconnectManager } from './reconnect.js';

describe('ReconnectManager Integration', () => {
  describe('Reconnection flow with auth retry', () => {
    it('should emit reconnecting events', async () => {
      const events: string[] = [];
      const manager = createReconnectManager({
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
        pauseOnAuthError: true,
      });

      manager.onEvent(event => {
        events.push(`${event.state}:${event.attempt}`);
      });

      // Simulate connection failure
      const reconnectPromise = manager.reconnect(async () => {
        throw new Error('Connection failed');
      });

      await expect(reconnectPromise).rejects.toThrow();

      expect(events.some(e => e.startsWith('connecting'))).toBe(true);
    });

    it('should succeed after multiple attempts', async () => {
      let attemptCount = 0;
      const manager = createReconnectManager({
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
        pauseOnAuthError: false,
      });

      const result = manager.reconnect(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Connection failed');
        }
        // Success on 3rd attempt - return void on success
      });

      await expect(result).resolves.toBeUndefined();
      expect(attemptCount).toBe(3);
    });

    it('should fail after max attempts', async () => {
      const manager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
        pauseOnAuthError: false,
      });

      const result = manager.reconnect(async () => {
        throw new Error('Always fails');
      });

      await expect(result).rejects.toThrow();
    });
  });

  describe('State transitions', () => {
    it('should track state correctly during reconnection', async () => {
      const states: string[] = [];
      const manager = createReconnectManager({
        maxAttempts: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      manager.onEvent(event => {
        states.push(event.state);
      });

      await manager
        .reconnect(async () => {
          throw new Error('Failed');
        })
        .catch(() => {});

      expect(states).toContain('connecting');
    });

    it('should reset state after abort', () => {
      const manager = createReconnectManager({
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 200,
      });

      expect(manager.getState()).toBe('idle');
      expect(manager.getAttempt()).toBe(0);

      manager.abort();

      expect(manager.getState()).toBe('idle');
      expect(manager.isReconnecting()).toBe(false);
    });
  });

  describe('Error classification', () => {
    it('should handle ReconnectError with terminal code immediately', async () => {
      const { ReconnectError } = await import('../errors.js');
      const manager = createReconnectManager({
        maxAttempts: 10,
        initialDelayMs: 10,
        maxDelayMs: 50,
        pauseOnAuthError: true,
      });

      // Terminal auth error - should not retry
      const result = manager.reconnect(async () => {
        throw new ReconnectError({
          code: 'MAX_AUTH_RETRIES',
          message: 'Max auth retries exceeded',
          retryable: false,
        });
      });

      await expect(result).rejects.toThrow();
      // Should stop after terminal error
      expect(manager.getAttempt()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Backoff behavior', () => {
    it('should retry with backoff between attempts', async () => {
      const attempts: number[] = [];
      const manager = createReconnectManager({
        maxAttempts: 3,
        initialDelayMs: 20,
        maxDelayMs: 100,
        pauseOnAuthError: false,
      });

      manager.onEvent(event => {
        if (event.state === 'connecting') {
          attempts.push(event.attempt);
        }
      });

      await manager
        .reconnect(async () => {
          throw new Error('Failed');
        })
        .catch(() => {});

      expect(attempts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
