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
 * Interval handle returned by the manager
 */
export interface TimerHandle {
  /** Unique identifier for this interval */
  readonly id: string;
  /** Whether the interval has been cleared */
  readonly cleared: boolean;
  /** Clear this specific interval */
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
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
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
   * Set a repeating interval.
   *
   * @param callback - Function to execute on each interval
   * @param ms - Interval in milliseconds
   * @param name - Optional name for debugging
   * @returns TimerHandle for clearing the interval
   */
  setInterval(callback: () => void, ms: number, name?: string): TimerHandle {
    const id = name ?? `interval_${++this.idCounter}`;

    // Clear any existing interval with same name
    if (this.intervals.has(id)) {
      if (this.config.warnOnClear) {
        console.warn(`TimeoutManager: Overwriting existing interval "${id}"`);
      }
      this.clearInterval(id);
    }

    const intervalId = setInterval(() => {
      callback();
    }, ms);

    this.intervals.set(id, intervalId);

    return {
      id,
      cleared: false,
      clear: () => this.clearInterval(id),
    };
  }

  /**
   * Clear a specific interval by ID.
   *
   * @param id - The interval ID to clear
   * @returns true if interval was found and cleared
   */
  clearInterval(id: string): boolean {
    const intervalId = this.intervals.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(id);
      return true;
    }
    return false;
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
    let cancelFn: () => void = () => {};

    const promise = new Promise<void>(resolve => {
      const handle = this.set(() => resolve(), ms);
      cancelFn = () => handle.clear();
    });

    return { promise, cancel: cancelFn };
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
    // Clear timeouts
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    // Clear intervals
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
  }

  /**
   * Check if a specific timeout or interval is active.
   *
   * @param id - The timeout or interval ID to check
   * @returns true if the timeout or interval is active
   */
  has(id: string): boolean {
    return this.timeouts.has(id) || this.intervals.has(id);
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
 * const handle = timeoutMgr.set(() => console.log("Done!"), 3000);
 * handle.clear();
 * ```
 */
export function createTimeoutManager(config?: TimeoutManagerConfig): TimeoutManager {
  return new TimeoutManager(config);
}

// ============================================================================
// Re-exports
// ============================================================================

export default TimeoutManager;
