/**
 * Events Integration Tests
 *
 * Integration tests covering:
 * - TickMonitor and GapDetector interaction
 * - Cross-component coordination for heartbeat and sequence tracking
 */

import { describe, it, expect } from 'vitest';
import { createTickMonitor } from './tick.js';
import { createGapDetector, type GapRecoveryMode } from './gap.js';

describe('Events Integration', () => {
  describe('TickMonitor and GapDetector coordination', () => {
    it('should track both tick and sequence together', () => {
      const tick = createTickMonitor({ tickIntervalMs: 1000, staleMultiplier: 2 });
      const gap = createGapDetector({
        recovery: { mode: 'skip' as GapRecoveryMode },
      });

      // Record initial tick
      const now = Date.now();
      tick.recordTick(now);
      gap.recordSequence(1);

      expect(tick.isStale()).toBe(false);
      expect(gap.hasGap()).toBe(false);
      expect(gap.getLastSequence()).toBe(1);
    });

    it('should detect gaps in sequence', () => {
      const gap = createGapDetector({
        recovery: { mode: 'skip' as GapRecoveryMode },
      });

      // Record sequence with gaps
      gap.recordSequence(1);
      gap.recordSequence(2);
      gap.recordSequence(4); // Skip 3

      const gaps = gap.getGaps();
      expect(gaps.length).toBe(1);
      expect(gaps[0].expected).toBe(3);
      expect(gaps[0].received).toBe(4);
    });

    it('should handle multiple gaps', () => {
      const gap = createGapDetector({
        recovery: { mode: 'skip' as GapRecoveryMode },
      });

      // Multiple gaps
      gap.recordSequence(1);
      gap.recordSequence(2);
      gap.recordSequence(5); // Gap at 3,4
      gap.recordSequence(10); // Gap at 6,7,8,9

      const gaps = gap.getGaps();
      expect(gaps.length).toBe(2);
      expect(gaps[0].expected).toBe(3);
      expect(gaps[1].expected).toBe(6);
    });

    it('should reset both monitors', () => {
      const tick = createTickMonitor({ tickIntervalMs: 1000, staleMultiplier: 2 });
      const gap = createGapDetector({
        recovery: { mode: 'skip' as GapRecoveryMode },
      });

      tick.recordTick(Date.now());
      gap.recordSequence(5);

      tick.stop();
      gap.reset();

      // Tick stopped - not started means isStale returns false
      expect(tick.isStale()).toBe(false);
      expect(gap.hasGap()).toBe(false);
      expect(gap.getLastSequence()).toBeNull();
    });
  });

  describe('Timing-based event tracking', () => {
    it('should return 0 before any tick', () => {
      const tick = createTickMonitor({ tickIntervalMs: 100, staleMultiplier: 2 });

      // Before any tick, returns 0
      expect(tick.getTimeSinceLastTick()).toBe(0);
    });

    it('should not report stale immediately after start', () => {
      const tick = createTickMonitor({ tickIntervalMs: 100, staleMultiplier: 2 });

      // Before any tick, not stale
      expect(tick.isStale()).toBe(false);
    });

    it('should track tick status', () => {
      const tick = createTickMonitor({ tickIntervalMs: 1000, staleMultiplier: 2 });

      tick.recordTick(Date.now());

      const status = tick.getStatus();
      expect(status.isStale).toBe(false);
      expect(status.lastTickTime).toBeGreaterThan(0);
    });
  });

  describe('Event monitor status', () => {
    it('should provide comprehensive status', () => {
      const tick = createTickMonitor({ tickIntervalMs: 1000, staleMultiplier: 2 });
      const gap = createGapDetector({
        recovery: { mode: 'skip' as GapRecoveryMode },
      });

      tick.recordTick(Date.now());
      gap.recordSequence(1);
      gap.recordSequence(2);

      const tickStatus = tick.getStatus();
      expect(tickStatus.isStale).toBe(false);
      expect(tickStatus.lastTickTime).toBeDefined();

      const gapInfo = gap.getGaps();
      expect(Array.isArray(gapInfo)).toBe(true);
    });
  });
});
