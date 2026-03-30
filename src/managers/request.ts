/**
 * OpenClaw Request Manager
 *
 * This module provides a request manager that tracks pending requests and correlates
 * responses with their corresponding requests. It handles timeouts and cleanup of
 * completed requests.
 *
 * @module
 */

import type { ResponseFrame } from '../protocol/frames.js';
import { type Logger, LogLevel } from '../types/logger.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Request entry stored in the pending requests map
 */
interface RequestEntry {
  /** The request ID */
  id: string;
  /** Promise resolve function */
  resolve: (response: ResponseFrame) => void;
  /** Promise reject function */
  reject: (error: Error) => void;
  /** Timeout timer ID */
  timeoutId: ReturnType<typeof setTimeout> | null;
  /** Optional progress callback for intermediate responses */
  onProgress?: (payload: unknown) => void;
}

// ============================================================================
// Request Manager
// ============================================================================

/**
 * Request Manager
 *
 * Tracks pending requests and correlates responses with their corresponding requests.
 * Handles timeouts and cleanup of completed requests.
 */
export class RequestManager {
  /** Map of pending requests by ID */
  private pendingRequests: Map<string, RequestEntry> = new Map();

  /** Logger for debug messages */
  private logger: Logger = {
    name: 'request-manager',
    level: LogLevel.Error,
    debug() {},
    info() {},
    warn() {},
    error(message: string, meta?: Record<string, unknown>) {
      console.error(message, meta ?? '');
    },
  };

  /**
   * Add a new pending request
   *
   * Creates a promise that will resolve when a response is received or reject
   * if the request times out.
   *
   * @param id - The request ID
   * @param options - Request options
   * @returns Promise that resolves with the response or rejects on timeout/error
   */
  addRequest(
    id: string,
    options: { timeout: number; onProgress?: (payload: unknown) => void }
  ): Promise<ResponseFrame> {
    // Check if a request with this ID already exists
    if (this.pendingRequests.has(id)) {
      return Promise.reject(new Error(`Request with ID "${id}" already exists`));
    }

    return new Promise<ResponseFrame>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        // Remove from pending requests
        this.pendingRequests.delete(id);
        // Reject with timeout error
        reject(new Error(`Request "${id}" timed out after ${options.timeout}ms`));
      }, options.timeout);

      // Store the request entry
      const entry: RequestEntry = {
        id,
        resolve,
        reject,
        timeoutId,
        onProgress: options.onProgress,
      };

      this.pendingRequests.set(id, entry);
    });
  }

  /**
   * Resolve a pending request with a response
   *
   * @param id - The request ID
   * @param response - The response frame
   * @throws Error if no pending request with the given ID exists
   */
  resolveRequest(id: string, response: ResponseFrame): void {
    const entry = this.pendingRequests.get(id);

    if (!entry) {
      // Duplicate server response — this is expected in retry scenarios
      // Log at debug level and return silently without throwing
      this.logger.debug(`Duplicate response received for request ID "${id}" — ignoring`);
      return;
    }

    // Clean up the timeout timer
    if (entry.timeoutId !== null) {
      clearTimeout(entry.timeoutId);
    }

    // Remove from pending requests
    this.pendingRequests.delete(id);

    // Resolve the promise
    entry.resolve(response);
  }

  /**
   * Handle an intermediate progress response for a pending request.
   *
   * Calls the progress callback if one is registered, without resolving
   * the pending request. The request remains pending for the final response.
   *
   * @param id - The request ID
   * @param payload - The progress payload
   * @returns True if the progress was delivered, false if no pending request or callback
   */
  resolveProgress(id: string, payload: unknown): boolean {
    const entry = this.pendingRequests.get(id);
    if (!entry?.onProgress) {
      return false;
    }
    try {
      entry.onProgress(payload);
    } catch {
      // Silently ignore progress callback errors
    }
    return true;
  }

  /**
   * Reject a pending request with an error
   *
   * @param id - The request ID
   * @param error - The error to reject with
   * @throws Error if no pending request with the given ID exists
   */
  rejectRequest(id: string, error: Error): void {
    const entry = this.pendingRequests.get(id);

    if (!entry) {
      throw new Error(`No pending request with ID "${id}"`);
    }

    // Clean up the timeout timer
    if (entry.timeoutId !== null) {
      clearTimeout(entry.timeoutId);
    }

    // Remove from pending requests
    this.pendingRequests.delete(id);

    // Reject the promise
    entry.reject(error);
  }

  /**
   * Abort a pending request
   *
   * Similar to rejectRequest but uses a standard abort error.
   *
   * @param id - The request ID
   * @throws Error if no pending request with the given ID exists
   */
  abortRequest(id: string): void {
    const entry = this.pendingRequests.get(id);

    if (!entry) {
      throw new Error(`No pending request with ID "${id}"`);
    }

    // Clean up the timeout timer
    if (entry.timeoutId !== null) {
      clearTimeout(entry.timeoutId);
    }

    // Remove from pending requests
    this.pendingRequests.delete(id);

    // Reject with abort error
    entry.reject(new Error(`Request "${id}" was aborted`));
  }

  /**
   * Clear all pending requests
   *
   * Aborts all pending requests and clears the pending requests map.
   * Useful when closing a connection or cleaning up.
   */
  clear(): void {
    // Abort all pending requests
    for (const [id, entry] of this.pendingRequests) {
      // Clean up the timeout timer
      if (entry.timeoutId !== null) {
        clearTimeout(entry.timeoutId);
      }
      // Reject with abort error
      entry.reject(new Error(`Request "${id}" was aborted due to clear()`));
    }

    // Clear the map
    this.pendingRequests.clear();
  }

  /**
   * Get the number of pending requests
   *
   * @returns The number of pending requests
   */
  get pendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Check if a request with the given ID is pending
   *
   * @param id - The request ID
   * @returns True if the request is pending, false otherwise
   */
  isPending(id: string): boolean {
    return this.pendingRequests.has(id);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a request manager instance
 *
 * @returns A new request manager instance
 *
 * @example
 * ```ts
 * import { createRequestManager } from './managers/request.js';
 *
 * const requestMgr = createRequestManager();
 *
 * // Add a pending request
 * const responsePromise = requestMgr.addRequest("req-1", { timeout: 30000 });
 *
 * // Later: resolve the request
 * requestMgr.resolveRequest("req-1", { type: "res", id: "req-1", ok: true, payload: {} });
 * ```
 */
export function createRequestManager(): RequestManager {
  return new RequestManager();
}

// ============================================================================
// Re-exports
// ============================================================================

export default RequestManager;
