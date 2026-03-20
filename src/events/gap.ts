/**
 * Gap Detector
 *
 * Detects gaps in event sequence numbers.
 *
 * @module
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export type GapRecoveryMode = 'reconnect' | 'snapshot' | 'skip';

export interface GapInfo {
  expected: number;
  received: number;
  detectedAt: number;
}

export interface GapRecoveryConfig {
  mode: GapRecoveryMode;
  onGap?: (gaps: GapInfo[]) => void;
  snapshotEndpoint?: string;
}

export interface GapDetectorConfig {
  recovery: GapRecoveryConfig;
  maxGaps?: number;
}

// Default max gaps to track
const DEFAULT_MAX_GAPS = 100;

// ============================================================================
// Gap Detector
// ============================================================================

/**
 * Gap detector for sequence number tracking.
 *
 * Detects gaps in event sequence numbers and can trigger
 * recovery actions based on configured mode.
 */
export class GapDetector extends EventEmitter {
  private recovery: GapRecoveryConfig;
  private maxGaps: number;
  private lastSequence: number | null = null;
  private gaps: GapInfo[] = [];

  /**
   * Create a gap detector.
   *
   * @param config Configuration
   */
  constructor(config: GapDetectorConfig) {
    super();
    this.recovery = config.recovery;
    this.maxGaps = config.maxGaps ?? DEFAULT_MAX_GAPS;
  }

  /**
   * Record an incoming sequence number.
   *
   * @param seq Sequence number from event
   */
  recordSequence(seq: number): void {
    // Deferred side-effects list — executed after all state updates
    const deferred: Array<() => void> = [];

    // Check for gap if we have a previous sequence
    if (this.lastSequence !== null) {
      const expected = this.lastSequence + 1;

      // Only detect gaps for sequences after the last one
      // Duplicate or old sequences are ignored
      if (seq > this.lastSequence && seq > expected) {
        const gap: GapInfo = {
          expected,
          received: seq,
          detectedAt: Date.now(),
        };

        // 1. State mutation FIRST
        this.gaps.push(gap);

        // Trim if exceeds max (use splice to avoid array copy)
        if (this.gaps.length > this.maxGaps) {
          this.gaps.splice(0, this.gaps.length - this.maxGaps);
        }

        // 2. Capture side-effects (do not execute yet)
        if (this.recovery.onGap) {
          deferred.push(() => this.recovery.onGap!(this.gaps));
        }
        deferred.push(() => this.emit('gap', this.gaps));
      }
    }

    // 3. Update lastSequence BEFORE executing side-effects
    this.lastSequence = seq;

    // 4. Execute deferred side-effects — state is already consistent
    // Continue executing remaining ops even if one throws
    for (const op of deferred) {
      try {
        op();
      } catch {
        // State is already consistent; log or handle as needed
        // We intentionally continue executing remaining deferred ops
      }
    }
  }

  /**
   * Check if gaps exist.
   *
   * @returns true if gaps detected
   */
  hasGap(): boolean {
    return this.gaps.length > 0;
  }

  /**
   * Get all detected gaps.
   *
   * @returns Array of gap information
   */
  getGaps(): GapInfo[] {
    return [...this.gaps];
  }

  /**
   * Get the last recorded sequence number.
   *
   * @returns Last sequence or null
   */
  getLastSequence(): number | null {
    return this.lastSequence;
  }

  /**
   * Reset sequence tracking.
   */
  reset(): void {
    this.lastSequence = null;
    this.gaps = [];
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a gap detector.
 *
 * @param config - Gap detector configuration
 * @returns A new GapDetector instance
 *
 * @example
 * ```ts
 * import { createGapDetector } from './events/gap.js';
 *
 * const gapDetector = createGapDetector({
 *   expectedSequence: 1,
 *   onGap: (gapInfo) => {
 *     console.log(`Gap detected: expected ${gapInfo.expected}, got ${gapInfo.received}`);
 *   }
 * });
 *
 * // Process incoming event frames
 * gapDetector.processSequence(1); // ok
 * gapDetector.processSequence(3); // gap! (missed 2)
 * ```
 */
export function createGapDetector(config: GapDetectorConfig): GapDetector {
  return new GapDetector(config);
}
