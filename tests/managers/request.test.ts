/**
 * Request Manager Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RequestManager, createRequestManager } from '../../src/managers/request';
import type { ResponseFrame } from '../../src/protocol/types';

describe('RequestManager', () => {
  let manager: RequestManager;
  let trackedPromises: Array<Promise<ResponseFrame>> = [];

  beforeEach(() => {
    manager = new RequestManager();
    trackedPromises = [];
  });

  // Helper to track and handle request promises
  function trackRequest(id: string, options?: { timeout: number }): Promise<ResponseFrame> {
    const promise = manager.addRequest(id, options ?? { timeout: 5000 });
    trackedPromises.push(promise);
    return promise;
  }

  afterEach(async () => {
    // Clean up any pending requests
    manager.clear();

    // Handle all tracked promise rejections to avoid unhandled errors
    await Promise.allSettled(trackedPromises.map(p => p.catch(() => {})));
  });

  describe('addRequest', () => {
    it('should add a new pending request', async () => {
      const requestPromise = trackRequest('test-id', { timeout: 5000 });

      expect(manager.isPending('test-id')).toBe(true);
      expect(manager.pendingCount).toBe(1);

      // Resolve the request to clean up
      manager.resolveRequest('test-id', {
        type: 'res',
        id: 'test-id',
        ok: true,
        payload: { data: 'test' },
      });

      await requestPromise;
    });

    it('should reject if request ID already exists', async () => {
      trackRequest('test-id', { timeout: 5000 });

      await expect(trackRequest('test-id', { timeout: 5000 })).rejects.toThrow(
        'Request with ID "test-id" already exists'
      );
    });

    it('should timeout after specified duration', async () => {
      vi.useFakeTimers();

      const requestPromise = trackRequest('test-id', { timeout: 1000 });

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      await expect(requestPromise).rejects.toThrow('Request "test-id" timed out after 1000ms');

      expect(manager.isPending('test-id')).toBe(false);
      expect(manager.pendingCount).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('resolveRequest', () => {
    it('should resolve a pending request with a response', async () => {
      const response: ResponseFrame = {
        type: 'res',
        id: 'test-id',
        ok: true,
        payload: { data: 'test' },
      };

      const requestPromise = trackRequest('test-id', { timeout: 5000 });
      manager.resolveRequest('test-id', response);

      const result = await requestPromise;
      expect(result).toEqual(response);
      expect(manager.isPending('test-id')).toBe(false);
      expect(manager.pendingCount).toBe(0);
    });

    it('should return silently if no pending request with the given ID exists (duplicate response)', () => {
      // BUG-05 fix: duplicate server responses are expected in retry scenarios
      // and should be handled silently without throwing
      expect(() => {
        manager.resolveRequest('non-existent-id', {
          type: 'res',
          id: 'non-existent-id',
          ok: true,
        });
      }).not.toThrow();
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending request with an error', async () => {
      const error = new Error('Test error');

      const requestPromise = trackRequest('test-id', { timeout: 5000 });
      manager.rejectRequest('test-id', error);

      await expect(requestPromise).rejects.toThrow('Test error');
      expect(manager.isPending('test-id')).toBe(false);
      expect(manager.pendingCount).toBe(0);
    });

    it('should throw if no pending request with the given ID exists', () => {
      expect(() => {
        manager.rejectRequest('non-existent-id', new Error('Test error'));
      }).toThrow('No pending request with ID "non-existent-id"');
    });
  });

  describe('abortRequest', () => {
    it('should abort a pending request', async () => {
      const requestPromise = trackRequest('test-id', { timeout: 5000 });
      manager.abortRequest('test-id');

      await expect(requestPromise).rejects.toThrow('Request "test-id" was aborted');
      expect(manager.isPending('test-id')).toBe(false);
      expect(manager.pendingCount).toBe(0);
    });

    it('should throw if no pending request with the given ID exists', () => {
      expect(() => {
        manager.abortRequest('non-existent-id');
      }).toThrow('No pending request with ID "non-existent-id"');
    });
  });

  describe('clear', () => {
    it('should clear all pending requests', async () => {
      const promises = [
        trackRequest('id-1', { timeout: 5000 }),
        trackRequest('id-2', { timeout: 5000 }),
        trackRequest('id-3', { timeout: 5000 }),
      ];

      expect(manager.pendingCount).toBe(3);

      manager.clear();

      expect(manager.pendingCount).toBe(0);

      // All promises should be rejected
      await expect(promises[0]).rejects.toThrow('Request "id-1" was aborted due to clear()');
      await expect(promises[1]).rejects.toThrow('Request "id-2" was aborted due to clear()');
      await expect(promises[2]).rejects.toThrow('Request "id-3" was aborted due to clear()');
    });

    it('should handle clearing an empty manager', () => {
      expect(() => manager.clear()).not.toThrow();
      expect(manager.pendingCount).toBe(0);
    });
  });

  describe('pendingCount', () => {
    it('should return the number of pending requests', () => {
      expect(manager.pendingCount).toBe(0);

      trackRequest('id-1', { timeout: 5000 });
      expect(manager.pendingCount).toBe(1);

      trackRequest('id-2', { timeout: 5000 });
      expect(manager.pendingCount).toBe(2);

      manager.resolveRequest('id-1', { type: 'res', id: 'id-1', ok: true });
      expect(manager.pendingCount).toBe(1);

      manager.abortRequest('id-2');
      expect(manager.pendingCount).toBe(0);
    });
  });

  describe('isPending', () => {
    it('should return true if a request is pending', () => {
      trackRequest('test-id', { timeout: 5000 });
      expect(manager.isPending('test-id')).toBe(true);
    });

    it('should return false if a request is not pending', () => {
      expect(manager.isPending('non-existent-id')).toBe(false);

      trackRequest('test-id', { timeout: 5000 });
      manager.resolveRequest('test-id', { type: 'res', id: 'test-id', ok: true });
      expect(manager.isPending('test-id')).toBe(false);
    });
  });

  describe('timeout cleanup', () => {
    it('should clean up timeout when request is resolved', async () => {
      vi.useFakeTimers();

      trackRequest('test-id', { timeout: 1000 });
      manager.resolveRequest('test-id', {
        type: 'res',
        id: 'test-id',
        ok: true,
      });

      // Advance time beyond timeout - should not cause any issues
      vi.advanceTimersByTime(2000);

      expect(manager.pendingCount).toBe(0);

      vi.useRealTimers();
    });

    it('should clean up timeout when request is rejected', async () => {
      vi.useFakeTimers();

      const requestPromise = trackRequest('test-id', { timeout: 1000 });
      manager.rejectRequest('test-id', new Error('Test error'));

      // Advance time beyond timeout - should not cause any issues
      vi.advanceTimersByTime(2000);

      await expect(requestPromise).rejects.toThrow('Test error');
      expect(manager.pendingCount).toBe(0);

      vi.useRealTimers();
    });

    it('should clean up timeout when request is aborted', async () => {
      vi.useFakeTimers();

      const requestPromise = trackRequest('test-id', { timeout: 1000 });
      manager.abortRequest('test-id');

      // Advance time beyond timeout - should not cause any issues
      vi.advanceTimersByTime(2000);

      await expect(requestPromise).rejects.toThrow('was aborted');
      expect(manager.pendingCount).toBe(0);

      vi.useRealTimers();
    });
  });
});

describe('createRequestManager', () => {
  it('should create a new RequestManager instance', () => {
    const manager = createRequestManager();

    expect(manager).toBeInstanceOf(RequestManager);
    expect(manager.pendingCount).toBe(0);
  });
});
