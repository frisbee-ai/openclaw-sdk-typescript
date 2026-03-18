/**
 * Tick Monitor
 *
 * Heartbeat monitoring to detect stale connections.
 *
 * @module
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export interface TickMonitorConfig {
  tickIntervalMs: number;
  staleMultiplier?: number;
  onStale?: () => void;
  onRecovered?: () => void;
  /** Optional time provider for testing */
  getTime?: () => number;
}

export interface TickStatus {
  lastTickTime: number;
  isStale: boolean;
  timeSinceLastTick: number;
  staleDuration: number;
}

/** Default stale multiplier - matches design document */
const DEFAULT_STALE_MULTIPLIER = 2;

// ============================================================================
// Tick Monitor
// ============================================================================

/**
 * Tick/heartbeat monitor for connection health detection.
 *
 * Monitors tick events to detect stale connections.
 * Uses configurable multiplier for stale threshold.
 */
export class TickMonitor extends EventEmitter {
  private tickIntervalMs: number;
  private staleMultiplier: number;
  private lastTickTime = 0;
  private started = false;
  private staleDetected = false;
  private staleStartTime: number | null = null;
  private onStale?: () => void;
  private onRecovered?: () => void;
  private getTime: () => number;

  /**
   * Create a tick monitor.
   *
   * @param config Configuration
   */
  constructor(config: TickMonitorConfig) {
    super();
    this.tickIntervalMs = config.tickIntervalMs;
    this.staleMultiplier = config.staleMultiplier ?? DEFAULT_STALE_MULTIPLIER;
    this.onStale = config.onStale;
    this.onRecovered = config.onRecovered;
    this.getTime = config.getTime ?? (() => Date.now());
  }

  /**
   * Start monitoring.
   */
  start(): void {
    this.started = true;
  }

  /**
   * Stop monitoring.
   */
  stop(): void {
    this.started = false;
  }

  /**
   * Record an incoming tick.
   *
   * @param ts Timestamp of the tick (client time)
   */
  recordTick(ts: number): void {
    const wasStale = this.staleDetected;
    this.lastTickTime = ts;
    this.staleDetected = false;
    this.staleStartTime = null;

    // If was stale and now recovered, emit event
    if (wasStale && this.onRecovered) {
      this.onRecovered();
      this.emit('recovered');
    }
  }

  /**
   * Check if connection is stale.
   *
   * @returns true if no tick received within threshold
   */
  isStale(): boolean {
    if (!this.started) {
      return false;
    }

    if (this.lastTickTime === 0) {
      return false;
    }

    const now = this.getTime();
    const threshold = this.tickIntervalMs * this.staleMultiplier;
    const timeSinceTick = now - this.lastTickTime;

    const isStale = timeSinceTick > threshold;

    // Handle stale state transitions
    if (isStale && !this.staleDetected) {
      this.staleDetected = true;
      this.staleStartTime = this.lastTickTime + threshold;
      if (this.onStale) {
        this.onStale();
        this.emit('stale');
      }
    }

    return isStale;
  }

  /**
   * Get time since last tick.
   *
   * @returns Milliseconds since last tick
   */
  getTimeSinceLastTick(): number {
    if (!this.started || this.lastTickTime === 0) {
      return 0;
    }
    return this.getTime() - this.lastTickTime;
  }

  /**
   * Get duration in stale state.
   *
   * @returns Milliseconds in stale state, 0 if not stale
   */
  getStaleDuration(): number {
    if (!this.isStale() || this.staleStartTime === null) {
      return 0;
    }
    return this.getTime() - this.staleStartTime;
  }

  /**
   * Get current status.
   *
   * @returns Current tick status
   */
  getStatus(): TickStatus {
    const isStale = this.isStale();
    return {
      lastTickTime: this.lastTickTime,
      isStale,
      timeSinceLastTick: this.getTimeSinceLastTick(),
      staleDuration: this.getStaleDuration(),
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a tick monitor.
 *
 * @param config - Tick monitor configuration
 * @returns A new TickMonitor instance
 *
 * @example
 * ```ts
 * import { createTickMonitor } from './events/tick.js';
 *
 * const tickMonitor = createTickMonitor({
 *   expectedIntervalMs: 5000,
 *   maxMissedTicks: 3
 * });
 *
 * tickMonitor.onTick((status) => {
 *   console.log("Tick status:", status);
 * });
 *
 * tickMonitor.start();
 * ```
 */
export function createTickMonitor(config: TickMonitorConfig): TickMonitor {
  return new TickMonitor(config);
}
