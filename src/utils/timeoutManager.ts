/**
 * Timeout Manager
 *
 * Provides centralized timeout management with automatic cleanup,
 * promise-based delays, and prevents common timeout-related bugs.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Timeout handle returned by the manager
 */
export interface TimeoutHandle {
  /** Unique identifier for this timeout */
  readonly id: string;
  /** Whether the timeout has been cleared */
  readonly cleared: boolean;
  /** Clear this specific timeout */
  clear: () => void;
}

/**
 * Configuration for TimeoutManager
 */
export interface TimeoutManagerConfig {
  /** Default timeout in milliseconds */
  defaultTimeoutMs?: number;
  /** Whether to warn on cleared timeouts */
  warnOnClear?: boolean;
}

// ============================================================================
// Timeout Manager
// ============================================================================

/**
 * Centralized timeout management utility.
 *
 * Provides:
 * - Automatic cleanup on manager destruction
 * - Promise-based delays
 * - Named timeouts for debugging
 * - Batch timeout management
 */
export class TimeoutManager {
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private config: Required<TimeoutManagerConfig>;
  private idCounter = 0;

  constructor(config: TimeoutManagerConfig = {}) {
    this.config = {
      defaultTimeoutMs: config.defaultTimeoutMs ?? 30000,
      warnOnClear: config.warnOnClear ?? false,
    };
  }

  /**
   * Set a named timeout.
   *
   * @param callback - Function to execute on timeout
   * @param ms - Timeout in milliseconds
   * @param name - Optional name for debugging
   * @returns TimeoutHandle for clearing the timeout
   */
  set(callback: () => void, ms: number, name?: string): TimeoutHandle {
    const id = name ?? `timeout_${++this.idCounter}`;

    // Clear any existing timeout with same name
    if (this.timeouts.has(id)) {
      if (this.config.warnOnClear) {
        console.warn(`TimeoutManager: Overwriting existing timeout "${id}"`);
      }
      this.clear(id);
    }

    const timeoutId = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, ms);

    this.timeouts.set(id, timeoutId);

    return {
      id,
      cleared: false,
      clear: () => this.clear(id),
    };
  }

  /**
   * Set a timeout with a Promise-based API.
   *
   * @param ms - Delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.set(resolve, ms, `delay_${++this.idCounter}`);
    });
  }

  /**
   * Set a timeout that can be awaited.
   *
   * @param ms - Delay in milliseconds
   * @returns Object with promise and cancel function
   */
  wait(ms: number): { promise: Promise<void>; cancel: () => void } {
    let cancelFn: (() => void) | undefined;

    const promise = new Promise<void>(resolve => {
      const handle = this.set(() => resolve(), ms);
      cancelFn = () => handle.clear();
    });

    return { promise, cancel: cancelFn! };
  }

  /**
   * Clear a specific timeout by ID.
   *
   * @param id - The timeout ID to clear
   * @returns true if timeout was found and cleared
   */
  clear(id: string): boolean {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Clear all timeouts.
   */
  clearAll(): void {
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
  }

  /**
   * Check if a specific timeout is active.
   *
   * @param id - The timeout ID to check
   * @returns true if the timeout is active
   */
  has(id: string): boolean {
    return this.timeouts.has(id);
  }

  /**
   * Get the number of active timeouts.
   */
  get size(): number {
    return this.timeouts.size;
  }

  /**
   * Get all active timeout IDs.
   */
  get activeIds(): string[] {
    return Array.from(this.timeouts.keys());
  }

  /**
   * Destroy the manager and clear all timeouts.
   * Should be called when the manager is no longer needed.
   */
  destroy(): void {
    this.clearAll();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new TimeoutManager instance.
 *
 * @param config - Optional configuration
 * @returns A new TimeoutManager instance
 *
 * @example
 * ```ts
 * import { createTimeoutManager } from './utils/timeoutManager.js';
 *
 * const timeoutMgr = createTimeoutManager();
 *
 * // Delay helper
 * await timeoutMgr.delay(5000);
 *
 * // Set custom timeout
 * const id = timeoutMgr.setTimeout(() => console.log("Done!"), 3000);
 * timeoutMgr.clearTimeout(id);
 * ```
 */
export function createTimeoutManager(config?: TimeoutManagerConfig): TimeoutManager {
  return new TimeoutManager(config);
}

// ============================================================================
// Re-exports
// ============================================================================

export default TimeoutManager;
