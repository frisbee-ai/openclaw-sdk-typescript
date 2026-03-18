/**
 * Reconnection Manager
 *
 * Handles automatic reconnection with exponential backoff and auth-aware retry logic.
 *
 * @module
 */

import { ReconnectError } from '../errors.js';
import type { AuthErrorCode } from '../errors.js';
import type { RefreshResult } from '../auth/provider.js';
import { TimeoutManager } from '../utils/timeoutManager.js';

// ============================================================================
// Types
// ============================================================================

export interface ReconnectConfig {
  /** Maximum number of reconnection attempts */
  maxAttempts: number;
  /** Maximum number of auth-related retries before giving up */
  maxAuthRetries: number;
  /** Initial delay in ms before first retry */
  initialDelayMs: number;
  /** Maximum delay in ms between retries */
  maxDelayMs: number;
  /** Whether to pause and refresh token on auth errors */
  pauseOnAuthError: boolean;
  /** Jitter factor (0-1) to add randomness to delays */
  jitterFactor: number;
}

/** Default reconnection configuration */
export const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  maxAttempts: 10,
  maxAuthRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  pauseOnAuthError: true,
  jitterFactor: 0.3,
};

/** Terminal auth errors that should stop reconnection immediately */
const TERMINAL_AUTH_ERRORS: AuthErrorCode[] = [
  'AUTH_DEVICE_REJECTED',
  'AUTH_PASSWORD_INVALID',
  'AUTH_NOT_SUPPORTED',
  'AUTH_CONFIGURATION_ERROR',
];

/** Retryable auth errors that can be retried after token refresh */
const RETRYABLE_AUTH_ERRORS: AuthErrorCode[] = [
  'AUTH_TOKEN_EXPIRED',
  'CHALLENGE_EXPIRED',
  'AUTH_RATE_LIMITED',
];

/**
 * Pre-computed Fibonacci sequence for backoff calculation.
 * F(n): 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987...
 * Sufficient for reasonable reconnection limits (up to 15+ attempts).
 */
const FIBONACCI_TABLE = [
  1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765,
] as const;

// ============================================================================
// Reconnection Manager
// ============================================================================

export type ReconnectState = 'idle' | 'connecting' | 'reconnecting' | 'failed' | 'success';

export interface ReconnectEvent {
  state: ReconnectState;
  attempt: number;
  lastError?: Error;
}

export type ReconnectListener = (event: ReconnectEvent) => void;

/** Error handler for listener errors */
export type ReconnectListenerErrorHandler = (error: {
  error: unknown;
  event: ReconnectEvent;
}) => void;

/**
 * Reconnection manager with Fibonacci backoff and auth-aware retry logic.
 *
 * Features:
 * - Fibonacci backoff with jitter
 * - Separate retry limits for auth errors
 * - Terminal auth errors stop reconnection immediately
 * - Token refresh support for retryable auth errors
 */
export class ReconnectManager {
  private config: ReconnectConfig;
  private state: ReconnectState = 'idle';
  private attempt = 0;
  private authRetries = 0;
  private listeners: Set<ReconnectListener> = new Set();
  private aborted = false;
  private timeoutManager = new TimeoutManager();
  private listenerErrorHandler: ReconnectListenerErrorHandler | null = null;

  constructor(config: Partial<ReconnectConfig> = {}) {
    this.config = { ...DEFAULT_RECONNECT_CONFIG, ...config };
  }

  /**
   * Get current state.
   */
  getState(): ReconnectState {
    return this.state;
  }

  /**
   * Get current attempt number.
   */
  getAttempt(): number {
    return this.attempt;
  }

  /**
   * Check if reconnection is in progress.
   */
  isReconnecting(): boolean {
    return this.state === 'reconnecting' || this.state === 'connecting';
  }

  /**
   * Add a listener for reconnection events.
   */
  onEvent(listener: ReconnectListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Set a callback for handling errors thrown by reconnection event listeners.
   *
   * By default, listener errors are silently ignored to prevent one buggy
   * listener from breaking the entire reconnection flow. Use this method to
   * customize error handling (e.g., logging to error tracking service).
   *
   * @param handler - Callback function to handle listener errors
   */
  onListenerError(handler: ReconnectListenerErrorHandler | null): void {
    this.listenerErrorHandler = handler;
  }

  /**
   * Emit an event to all listeners.
   */
  private emit(state: ReconnectState, lastError?: Error): void {
    const event: ReconnectEvent = {
      state,
      attempt: this.attempt,
      lastError,
    };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        if (this.listenerErrorHandler) {
          this.listenerErrorHandler({ error, event });
        } else {
          // Default: silent to prevent cascading failures during reconnection
          // Users can set onListenerError to capture these
        }
      }
    }
  }

  /**
   * Calculate Fibonacci backoff delay with jitter.
   * Uses pre-computed Fibonacci table for O(1) lookup.
   */
  private calculateDelay(attempt: number): number {
    // Get Fibonacci value from table (default to last value if attempt exceeds table)
    const fibValue = FIBONACCI_TABLE[Math.min(attempt, FIBONACCI_TABLE.length - 1)];

    // Base delay grows with Fibonacci
    const baseDelay = this.config.initialDelayMs * fibValue;
    const delay = Math.min(baseDelay, this.config.maxDelayMs);

    // Add jitter
    const jitter = delay * this.config.jitterFactor * Math.random();
    return Math.floor(delay + jitter);
  }

  /**
   * Check if an error is a terminal auth error.
   */
  private isTerminalAuthError(error: Error): boolean {
    if (error instanceof ReconnectError) {
      return TERMINAL_AUTH_ERRORS.includes(error.code as AuthErrorCode);
    }
    return false;
  }

  /**
   * Check if an error is a retryable auth error.
   */
  private isRetryableAuthError(error: Error): boolean {
    if (error instanceof ReconnectError) {
      return RETRYABLE_AUTH_ERRORS.includes(error.code as AuthErrorCode);
    }
    return false;
  }

  /**
   * Start reconnection process.
   *
   * @param connectFn Function to call to attempt connection
   * @param refreshTokenFn Optional function to refresh token
   */
  async reconnect(
    connectFn: () => Promise<void>,
    refreshTokenFn?: () => Promise<RefreshResult | null>
  ): Promise<void> {
    this.aborted = false;
    this.attempt = 0;
    this.authRetries = 0;
    this.state = 'reconnecting';

    while (!this.aborted && this.attempt < this.config.maxAttempts) {
      this.attempt++;
      this.state = 'connecting';
      this.emit('connecting');

      try {
        await connectFn();
        this.state = 'success';
        this.emit('success');
        return;
      } catch (error) {
        const err = error as Error;

        // Check for terminal auth errors - stop immediately
        if (this.isTerminalAuthError(err)) {
          this.state = 'failed';
          this.emit('failed', err);
          throw new ReconnectError({
            code: 'MAX_AUTH_RETRIES',
            message: `Terminal auth error: ${err.message}`,
            retryable: false,
            details: { originalError: err.message },
          });
        }

        // Check for retryable auth errors
        if (this.isRetryableAuthError(err)) {
          if (this.config.pauseOnAuthError && refreshTokenFn) {
            this.authRetries++;

            if (this.authRetries > this.config.maxAuthRetries) {
              this.state = 'failed';
              this.emit('failed', err);
              throw new ReconnectError({
                code: 'MAX_AUTH_RETRIES',
                message: `Max auth retries (${this.config.maxAuthRetries}) exceeded`,
                retryable: false,
                details: { originalError: err.message },
              });
            }

            // Try to refresh token
            const refreshResult = await refreshTokenFn();
            if (!refreshResult?.success) {
              // Token refresh failed - stop reconnecting
              this.state = 'failed';
              this.emit('failed', err);
              throw new ReconnectError({
                code: 'MAX_AUTH_RETRIES',
                message: 'Token refresh failed, cannot reconnect',
                retryable: false,
                details: { originalError: err.message },
              });
            }
          }
        }

        // Check if we've exceeded max attempts
        if (this.attempt >= this.config.maxAttempts) {
          this.state = 'failed';
          this.emit('failed', err);
          throw new ReconnectError({
            code: 'MAX_RECONNECT_ATTEMPTS',
            message: `Max reconnection attempts (${this.config.maxAttempts}) exceeded`,
            retryable: false,
            details: { originalError: err.message },
          });
        }

        // Calculate delay for next attempt
        this.state = 'reconnecting';
        this.emit('reconnecting', err);

        const delay = this.calculateDelay(this.attempt);
        await this.delay(delay);
      }
    }

    // Should not reach here, but handle edge case
    if (this.aborted) {
      throw new ReconnectError({
        code: 'RECONNECT_DISABLED',
        message: 'Reconnection aborted',
        retryable: false,
      });
    }
  }

  /**
   * Abort reconnection.
   */
  abort(): void {
    this.aborted = true;
    this.timeoutManager.clearAll();
    this.state = 'idle';
    this.emit('idle');
  }

  /**
   * Reset manager state.
   */
  reset(): void {
    this.abort();
    this.attempt = 0;
    this.authRetries = 0;
    this.state = 'idle';
  }

  /**
   * Delay helper.
   */
  private delay(ms: number): Promise<void> {
    return this.timeoutManager.delay(ms);
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a reconnect manager.
 *
 * @param config - Optional reconnection configuration
 * @returns A new ReconnectManager instance
 *
 * @example
 * ```ts
 * import { createReconnectManager } from './managers/reconnect.js';
 *
 * const reconnectMgr = createReconnectManager({
 *   maxAttempts: 10,
 *   initialDelayMs: 1000,
 *   maxDelayMs: 30000,
 *   pauseOnAuthError: true
 * });
 *
 * // Listen to reconnection events
 * reconnectMgr.onEvent((event) => {
 *   console.log(`Reconnect ${event.state} (attempt ${event.attempt})`);
 * });
 *
 * // Start reconnection
 * await reconnectMgr.reconnect(
 *   () => client.connect(),
 *   () => authHandler.refreshToken()
 * );
 * ```
 */
export function createReconnectManager(config?: Partial<ReconnectConfig>): ReconnectManager {
  return new ReconnectManager(config);
}
