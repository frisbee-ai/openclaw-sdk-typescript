/**
 * Request Cancellation Integration Tests
 *
 * These tests verify the integration between AbortController, RequestManager,
 * and the client request cancellation flow.
 */

import { describe, it, expect, vi } from 'vitest';

describe('AbortController integration', () => {
  it('should detect aborted signal', () => {
    const controller = new AbortController();
    expect(controller.signal.aborted).toBe(false);
    controller.abort();
    expect(controller.signal.aborted).toBe(true);
  });

  it('should trigger abort event', () => {
    const controller = new AbortController();
    const handler = vi.fn();
    controller.signal.addEventListener('abort', handler);
    controller.abort();
    expect(handler).toHaveBeenCalled();
  });

  it('should allow removing abort listener', () => {
    const controller = new AbortController();
    const handler = vi.fn();
    controller.signal.addEventListener('abort', handler);
    controller.signal.removeEventListener('abort', handler);
    controller.abort();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle already aborted signal', () => {
    const controller = new AbortController();
    controller.abort();
    expect(controller.signal.aborted).toBe(true);
    expect(() => {
      throw controller.signal.reason;
    }).toThrow('operation was aborted');
  });
});

describe('RequestManager.abortRequest integration', () => {
  it('should abort request with AbortError message', async () => {
    // Import RequestManager dynamically to test actual implementation
    const { createRequestManager } = await import('./managers/request.js');
    const manager = createRequestManager();

    // Add a pending request
    const requestPromise = manager.addRequest('test-id-123', { timeout: 5000 });

    // Abort the request
    manager.abortRequest('test-id-123');

    // Should reject with abort message
    await expect(requestPromise).rejects.toThrow('was aborted');
  });

  it('should throw when aborting non-existent request', async () => {
    const { createRequestManager } = await import('./managers/request.js');
    const manager = createRequestManager();

    expect(() => {
      manager.abortRequest('non-existent-id');
    }).toThrow('No pending request with ID "non-existent-id"');
  });

  it('should clear timeout when aborting', async () => {
    const { createRequestManager } = await import('./managers/request.js');
    const manager = createRequestManager();

    // Add a request
    const requestPromise = manager.addRequest('test-id-456', { timeout: 10000 });

    // Abort immediately
    manager.abortRequest('test-id-456');

    // Should reject quickly, not wait for timeout
    const start = Date.now();
    await expect(requestPromise).rejects.toThrow();
    const elapsed = Date.now() - start;

    // Should reject almost immediately, not wait for timeout
    expect(elapsed).toBeLessThan(1000);
  });
});
