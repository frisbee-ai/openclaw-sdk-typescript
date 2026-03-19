/**
 * Timeout Manager Integration Tests
 *
 * Integration tests covering:
 * - Complex timeout workflows
 * - Cross-timeout coordination
 * - Timeout cancellation patterns
 */

import { describe, it, expect, vi } from 'vitest';
import { createTimeoutManager } from './timeoutManager.js';

describe('TimeoutManager Integration', () => {
  describe('Multiple timeout coordination', () => {
    it('should handle multiple concurrent timeouts', async () => {
      const manager = createTimeoutManager();

      const results: string[] = [];

      manager.set(() => results.push('first'), 50, 'first');
      manager.set(() => results.push('second'), 30, 'second');
      manager.set(() => results.push('third'), 10, 'third');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(results).toEqual(['third', 'second', 'first']);
    });

    it('should track multiple timeout handles', () => {
      const manager = createTimeoutManager();

      const handle1 = manager.set(() => {}, 1000, 'timeout1');
      const handle2 = manager.set(() => {}, 500, 'timeout2');
      const handle3 = manager.set(() => {}, 2000, 'timeout3');

      expect(manager.has(handle1.id)).toBe(true);
      expect(manager.has(handle2.id)).toBe(true);
      expect(manager.has(handle3.id)).toBe(true);
    });

    it('should clear specific timeouts', () => {
      const manager = createTimeoutManager();
      const callback = vi.fn();

      const handle = manager.set(callback, 1000, 'test');

      manager.clear(handle.id);

      expect(manager.has(handle.id)).toBe(false);
    });

    it('should clear all timeouts', () => {
      const manager = createTimeoutManager();

      manager.set(() => {}, 1000, 'timeout1');
      manager.set(() => {}, 2000, 'timeout2');
      manager.set(() => {}, 3000, 'timeout3');

      manager.clearAll();

      expect(manager['timeouts'].size).toBe(0);
    });
  });

  describe('Delay and wait coordination', () => {
    it('should create delay promise', () => {
      const manager = createTimeoutManager();

      const delayPromise = manager.delay(10);

      expect(delayPromise).toBeDefined();
    });

    it('should coordinate wait and clear', () => {
      const manager = createTimeoutManager();

      const { promise, cancel } = manager.wait(5000);

      cancel();

      expect(promise).toBeDefined();
    });

    it('should handle multiple waits', () => {
      const manager = createTimeoutManager();

      const wait1 = manager.wait(1000);
      const wait2 = manager.wait(2000);
      const wait3 = manager.wait(3000);

      expect(wait1.promise).toBeDefined();
      expect(wait2.promise).toBeDefined();
      expect(wait3.promise).toBeDefined();

      wait1.cancel();
      wait2.cancel();
      wait3.cancel();
    });
  });

  describe('Destroy workflow', () => {
    it('should clean up all timeouts on destroy', () => {
      const manager = createTimeoutManager();

      manager.set(() => {}, 1000, 'timeout1');
      manager.set(() => {}, 2000, 'timeout2');
      manager.set(() => {}, 3000, 'timeout3');

      manager.destroy();

      expect(manager['timeouts'].size).toBe(0);
    });
  });
});
