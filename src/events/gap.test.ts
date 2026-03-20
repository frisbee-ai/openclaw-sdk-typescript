/**
 * GapDetector Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GapDetector, createGapDetector, GapRecoveryMode } from './gap';

describe('GapDetector', () => {
  let detector: GapDetector;

  beforeEach(() => {
    detector = createGapDetector({
      recovery: {
        mode: 'skip' as GapRecoveryMode,
        onGap: vi.fn(),
      },
    });
  });

  describe('recordSequence', () => {
    it('should record first sequence number', () => {
      detector.recordSequence(1);
      expect(detector.getLastSequence()).toBe(1);
    });

    it('should record subsequent sequence numbers', () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      detector.recordSequence(3);
      expect(detector.getLastSequence()).toBe(3);
    });
  });

  describe('hasGap', () => {
    it('should return false when no gaps', () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      detector.recordSequence(3);
      expect(detector.hasGap()).toBe(false);
    });

    it('should detect gap when sequence jumps', () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      detector.recordSequence(4); // Gap: 3 is missing
      expect(detector.hasGap()).toBe(true);
    });

    it('should detect multiple gaps', () => {
      detector.recordSequence(1);
      detector.recordSequence(3); // Gap at 2
      detector.recordSequence(5); // Gap at 4
      expect(detector.hasGap()).toBe(true);
    });
  });

  describe('getGaps', () => {
    it('should return empty array when no gaps', () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      expect(detector.getGaps()).toEqual([]);
    });

    it('should return gap information', () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      detector.recordSequence(4); // Gap at 3

      const gaps = detector.getGaps();
      expect(gaps).toHaveLength(1);
      expect(gaps[0]).toMatchObject({
        expected: 3,
        received: 4,
      });
      expect(gaps[0].detectedAt).toBeDefined();
    });
  });

  describe('getLastSequence', () => {
    it('should return null when no sequence recorded', () => {
      expect(detector.getLastSequence()).toBeNull();
    });

    it('should return last recorded sequence', () => {
      detector.recordSequence(5);
      expect(detector.getLastSequence()).toBe(5);
    });
  });

  describe('reset', () => {
    it('should clear all gaps', () => {
      detector.recordSequence(1);
      detector.recordSequence(3); // Gap at 2
      detector.reset();

      expect(detector.hasGap()).toBe(false);
      expect(detector.getGaps()).toEqual([]);
      expect(detector.getLastSequence()).toBeNull();
    });
  });

  describe('callback', () => {
    it('should call onGap when gap detected', () => {
      const onGap = vi.fn();
      const detector = createGapDetector({
        recovery: {
          mode: 'skip' as GapRecoveryMode,
          onGap,
        },
      });

      detector.recordSequence(1);
      detector.recordSequence(3);

      expect(onGap).toHaveBeenCalled();
      expect(onGap).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ expected: 2, received: 3 })])
      );
    });
  });

  describe('exception safety', () => {
    it('should update lastSequence even when onGap callback throws', () => {
      const onGap = vi.fn().mockImplementation(() => {
        throw new Error('callback error');
      });
      const detector = createGapDetector({
        recovery: {
          mode: 'skip' as GapRecoveryMode,
          onGap,
        },
      });

      detector.recordSequence(1);
      // Gap detected, onGap throws but exception is caught internally
      expect(() => detector.recordSequence(3)).not.toThrow();
      // lastSequence should still be updated
      expect(detector.getLastSequence()).toBe(3);
    });

    it("should update lastSequence even when emit('gap') throws", () => {
      const detector = createGapDetector({
        recovery: {
          mode: 'skip' as GapRecoveryMode,
        },
      });

      // Make emit throw
      const emit = vi.spyOn(detector, 'emit').mockImplementation(() => {
        throw new Error('emit error');
      });

      detector.recordSequence(1);
      // Gap detected, emit throws but exception is caught internally
      expect(() => detector.recordSequence(3)).not.toThrow();
      // lastSequence should still be updated
      expect(detector.getLastSequence()).toBe(3);

      emit.mockRestore();
    });

    it('should keep gaps state consistent when callback throws', () => {
      const onGap = vi.fn().mockImplementation(() => {
        throw new Error('callback error');
      });
      const detector = createGapDetector({
        recovery: {
          mode: 'skip' as GapRecoveryMode,
          onGap,
        },
      });

      detector.recordSequence(1);
      // Record a valid sequence first
      detector.recordSequence(2);
      const gapsBefore = detector.getGaps().length;

      // Gap detected, callback throws but exception is caught
      detector.recordSequence(5);

      // Gaps should be recorded even though callback threw
      expect(detector.getGaps().length).toBe(gapsBefore + 1);
    });

    it('should not trigger duplicate gaps after callback exception', () => {
      let callCount = 0;
      const onGap = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('first call error');
        }
      });

      const detector = createGapDetector({
        recovery: {
          mode: 'skip' as GapRecoveryMode,
          onGap,
        },
      });

      detector.recordSequence(1);
      // First gap (1->3): callback throws but exception is caught
      expect(() => detector.recordSequence(3)).not.toThrow();

      // After exception, lastSequence is 3. recordSequence(4) checks:
      // - seq(4) > lastSequence(3) ✓
      // - seq(4) > expected(4) ✗ (4 > 4 is false)
      // So no NEW gap is detected for 4 -> 4
      detector.recordSequence(4);
      expect(callCount).toBe(1); // Only called once for the 1->3 gap
      expect(detector.getGaps()).toHaveLength(1);
    });

    it('should execute all deferred ops even if onGap throws', () => {
      const operations: string[] = [];
      const onGap = vi.fn().mockImplementation(() => {
        operations.push('onGap');
        throw new Error('onGap error');
      });

      const detector = createGapDetector({
        recovery: {
          mode: 'skip' as GapRecoveryMode,
          onGap,
        },
      });

      const emit = vi.spyOn(detector, 'emit').mockImplementation(() => {
        operations.push('emit');
        return true;
      });

      detector.recordSequence(1);
      // Gap detected, onGap throws but emit should still run
      expect(() => detector.recordSequence(3)).not.toThrow();
      expect(operations).toContain('onGap');
      expect(operations).toContain('emit'); // emit still runs after onGap throws

      emit.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle sequence of 0', () => {
      detector.recordSequence(0);
      expect(detector.getLastSequence()).toBe(0);
    });

    it('should handle duplicate sequences', () => {
      detector.recordSequence(1);
      detector.recordSequence(1);
      detector.recordSequence(1);
      expect(detector.getLastSequence()).toBe(1);
      expect(detector.hasGap()).toBe(false);
    });

    it('should detect gap after duplicate', () => {
      detector.recordSequence(1);
      detector.recordSequence(1);
      detector.recordSequence(3); // Gap at 2
      expect(detector.hasGap()).toBe(true);
    });
  });
});

describe('createGapDetector', () => {
  it('should create a new GapDetector instance', () => {
    const detector = createGapDetector({
      recovery: { mode: 'skip' },
    });
    expect(detector).toBeInstanceOf(GapDetector);
  });

  it('should accept all recovery modes', () => {
    const modes: GapRecoveryMode[] = ['reconnect', 'snapshot', 'skip'];
    for (const mode of modes) {
      const detector = createGapDetector({
        recovery: { mode },
      });
      expect(detector).toBeInstanceOf(GapDetector);
    }
  });
});
