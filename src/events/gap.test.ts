/**
 * GapDetector Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GapDetector, createGapDetector, GapRecoveryMode } from "./gap";

describe("GapDetector", () => {
  let detector: GapDetector;

  beforeEach(() => {
    detector = createGapDetector({
      recovery: {
        mode: "skip" as GapRecoveryMode,
        onGap: vi.fn(),
      },
    });
  });

  describe("recordSequence", () => {
    it("should record first sequence number", () => {
      detector.recordSequence(1);
      expect(detector.getLastSequence()).toBe(1);
    });

    it("should record subsequent sequence numbers", () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      detector.recordSequence(3);
      expect(detector.getLastSequence()).toBe(3);
    });
  });

  describe("hasGap", () => {
    it("should return false when no gaps", () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      detector.recordSequence(3);
      expect(detector.hasGap()).toBe(false);
    });

    it("should detect gap when sequence jumps", () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      detector.recordSequence(4); // Gap: 3 is missing
      expect(detector.hasGap()).toBe(true);
    });

    it("should detect multiple gaps", () => {
      detector.recordSequence(1);
      detector.recordSequence(3); // Gap at 2
      detector.recordSequence(5); // Gap at 4
      expect(detector.hasGap()).toBe(true);
    });
  });

  describe("getGaps", () => {
    it("should return empty array when no gaps", () => {
      detector.recordSequence(1);
      detector.recordSequence(2);
      expect(detector.getGaps()).toEqual([]);
    });

    it("should return gap information", () => {
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

  describe("getLastSequence", () => {
    it("should return null when no sequence recorded", () => {
      expect(detector.getLastSequence()).toBeNull();
    });

    it("should return last recorded sequence", () => {
      detector.recordSequence(5);
      expect(detector.getLastSequence()).toBe(5);
    });
  });

  describe("reset", () => {
    it("should clear all gaps", () => {
      detector.recordSequence(1);
      detector.recordSequence(3); // Gap at 2
      detector.reset();

      expect(detector.hasGap()).toBe(false);
      expect(detector.getGaps()).toEqual([]);
      expect(detector.getLastSequence()).toBeNull();
    });
  });

  describe("callback", () => {
    it("should call onGap when gap detected", () => {
      const onGap = vi.fn();
      const detector = createGapDetector({
        recovery: {
          mode: "skip" as GapRecoveryMode,
          onGap,
        },
      });

      detector.recordSequence(1);
      detector.recordSequence(3);

      expect(onGap).toHaveBeenCalled();
      expect(onGap).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ expected: 2, received: 3 }),
        ])
      );
    });
  });

  describe("edge cases", () => {
    it("should handle sequence of 0", () => {
      detector.recordSequence(0);
      expect(detector.getLastSequence()).toBe(0);
    });

    it("should handle duplicate sequences", () => {
      detector.recordSequence(1);
      detector.recordSequence(1);
      detector.recordSequence(1);
      expect(detector.getLastSequence()).toBe(1);
      expect(detector.hasGap()).toBe(false);
    });

    it("should detect gap after duplicate", () => {
      detector.recordSequence(1);
      detector.recordSequence(1);
      detector.recordSequence(3); // Gap at 2
      expect(detector.hasGap()).toBe(true);
    });
  });
});

describe("createGapDetector", () => {
  it("should create a new GapDetector instance", () => {
    const detector = createGapDetector({
      recovery: { mode: "skip" },
    });
    expect(detector).toBeInstanceOf(GapDetector);
  });

  it("should accept all recovery modes", () => {
    const modes: GapRecoveryMode[] = ["reconnect", "snapshot", "skip"];
    for (const mode of modes) {
      const detector = createGapDetector({
        recovery: { mode },
      });
      expect(detector).toBeInstanceOf(GapDetector);
    }
  });
});
