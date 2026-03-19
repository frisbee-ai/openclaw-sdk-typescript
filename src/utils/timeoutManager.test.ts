/**
 * TimeoutManager Unit Tests
 *
 * Comprehensive tests covering:
 * - Unit: Basic timeout operations
 * - Edge Cases: Zero, negative, very large delays
 * - Security: Input validation, resource exhaustion
 * - Integration: Cleanup on destroy
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeoutManager, createTimeoutManager } from '../utils/timeoutManager';

describe('TimeoutManager', () => {
  let manager: TimeoutManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new TimeoutManager();
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  // ========================================================================
  // Unit Tests: Basic Operations
  // ========================================================================

  describe('set()', () => {
    it('should set a timeout and execute callback after delay', () => {
      const callback = vi.fn();
      const handle = manager.set(callback, 100);

      expect(handle.id).toBeDefined();
      expect(handle.cleared).toBe(false);

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return TimeoutHandle with clear method', () => {
      const callback = vi.fn();
      const handle = manager.set(callback, 100);

      handle.clear();

      vi.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should use custom name when provided', () => {
      const callback = vi.fn();
      const handle = manager.set(callback, 100, 'my-timeout');

      expect(handle.id).toBe('my-timeout');
      expect(manager.has('my-timeout')).toBe(true);
    });

    it('should overwrite existing timeout with same name', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.set(callback1, 100, 'same-name');
      manager.set(callback2, 100, 'same-name');

      vi.advanceTimersByTime(100);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear()', () => {
    it('should clear a specific timeout', () => {
      const callback = vi.fn();
      manager.set(callback, 100, 'test-timeout');

      const cleared = manager.clear('test-timeout');

      expect(cleared).toBe(true);
      expect(manager.has('test-timeout')).toBe(false);

      vi.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should return false for non-existent timeout', () => {
      const cleared = manager.clear('non-existent');

      expect(cleared).toBe(false);
    });
  });

  describe('clearAll()', () => {
    it('should clear all timeouts', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.set(callback1, 100, 'timeout-1');
      manager.set(callback2, 100, 'timeout-2');

      manager.clearAll();

      expect(manager.size).toBe(0);

      vi.advanceTimersByTime(100);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('has()', () => {
    it('should return true for active timeout', () => {
      manager.set(() => {}, 100, 'active-timeout');

      expect(manager.has('active-timeout')).toBe(true);
    });

    it('should return false for cleared timeout', () => {
      const handle = manager.set(() => {}, 100, 'cleared-timeout');
      handle.clear();

      expect(manager.has('cleared-timeout')).toBe(false);
    });

    it('should return false for non-existent timeout', () => {
      expect(manager.has('non-existent')).toBe(false);
    });
  });

  describe('delay()', () => {
    it('should return promise that resolves after delay', async () => {
      const promise = manager.delay(100);

      expect(manager.size).toBe(1);

      vi.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();
      expect(manager.size).toBe(0);
    });
  });

  describe('wait()', () => {
    it('should return promise and cancel function', () => {
      const { promise, cancel } = manager.wait(100);

      expect(promise).toBeInstanceOf(Promise);
      expect(typeof cancel).toBe('function');
    });

    it('should resolve after delay', async () => {
      const { promise } = manager.wait(100);

      vi.advanceTimersByTime(100);

      await expect(promise).resolves.toBeUndefined();
    });

    // Note: cancel() clears the timeout but doesn't reject the promise
    // The promise will never resolve if cancelled - this is the current behavior
  });

  describe('destroy()', () => {
    it('should clear all timeouts and reset size', () => {
      manager.set(() => {}, 100, 'timeout-1');
      manager.set(() => {}, 100, 'timeout-2');

      expect(manager.size).toBe(2);

      manager.destroy();

      expect(manager.size).toBe(0);
      expect(manager.activeIds).toEqual([]);
    });
  });

  describe('size and activeIds', () => {
    it('should track active timeout count', () => {
      expect(manager.size).toBe(0);

      manager.set(() => {}, 100, 'timeout-1');
      expect(manager.size).toBe(1);

      manager.set(() => {}, 100, 'timeout-2');
      expect(manager.size).toBe(2);

      manager.clear('timeout-1');
      expect(manager.size).toBe(1);
    });

    it('should return all active timeout IDs', () => {
      manager.set(() => {}, 100, 'timeout-1');
      manager.set(() => {}, 100, 'timeout-2');

      const ids = manager.activeIds;

      expect(ids).toContain('timeout-1');
      expect(ids).toContain('timeout-2');
    });
  });

  // ========================================================================
  // Edge Case Tests
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle zero delay', () => {
      const callback = vi.fn();
      manager.set(callback, 0);

      vi.advanceTimersByTime(0);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle very small delay (1ms)', () => {
      const callback = vi.fn();
      manager.set(callback, 1);

      vi.advanceTimersByTime(1);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle large delay (24 hours)', () => {
      const callback = vi.fn();
      const ms24h = 24 * 60 * 60 * 1000;

      manager.set(callback, ms24h);

      expect(manager.has(manager.activeIds[0])).toBe(true);

      vi.advanceTimersByTime(ms24h);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid set/clear operations', () => {
      const callback = vi.fn();

      // Rapidly set and clear
      for (let i = 0; i < 100; i++) {
        const handle = manager.set(callback, 1000, `timeout-${i}`);
        handle.clear();
      }

      expect(manager.size).toBe(0);

      vi.advanceTimersByTime(1000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle clearing already triggered timeout', () => {
      const callback = vi.fn();
      const handle = manager.set(callback, 50);

      vi.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalledTimes(1);

      // Clear after already triggered - should return false
      const result = manager.clear(handle.id);

      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // Security Tests: Input Validation
  // ========================================================================

  describe('Security: Input Validation', () => {
    it('should handle NaN delay', () => {
      const callback = vi.fn();

      manager.set(callback, NaN);

      vi.advanceTimersByTime(0);

      // NaN converts to 0, so callback fires immediately
      expect(callback).toHaveBeenCalled();
    });

    it('should handle negative delay', () => {
      const callback = vi.fn();

      manager.set(callback, -1);

      vi.advanceTimersByTime(0);

      // Negative converts to 0 in setTimeout
      expect(callback).toHaveBeenCalled();
    });

    it('should handle many timeouts without crashing', () => {
      const MAX_TIMEOUTS = 1000;

      // Create many timeouts
      for (let i = 0; i < MAX_TIMEOUTS; i++) {
        manager.set(() => {}, 60000, `timeout-${i}`);
      }

      expect(manager.size).toBe(MAX_TIMEOUTS);

      // Manager should still be functional
      const callback = vi.fn();
      manager.set(callback, 100);

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // Configuration Tests
  // ========================================================================

  describe('Configuration', () => {
    it('should use default config when not provided', () => {
      const mgr = new TimeoutManager();

      expect(mgr.size).toBe(0);

      mgr.destroy();
    });

    it('should warn on clear when warnOnClear is enabled', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mgr = new TimeoutManager({ warnOnClear: true });

      mgr.set(() => {}, 100, 'test-timeout');
      mgr.set(() => {}, 100, 'test-timeout'); // Should warn

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Overwriting existing timeout')
      );

      consoleWarn.mockRestore();
      mgr.destroy();
    });
  });
});

describe('createTimeoutManager factory', () => {
  it('should create TimeoutManager instance', () => {
    const manager = createTimeoutManager();

    expect(manager).toBeInstanceOf(TimeoutManager);

    manager.destroy();
  });
});
