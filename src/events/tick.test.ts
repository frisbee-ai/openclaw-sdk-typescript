/**
 * TickMonitor Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TickMonitor, createTickMonitor } from './tick';

describe('TickMonitor', () => {
  let monitor: TickMonitor;
  const tickIntervalMs = 1000;
  const staleMultiplier = 2;
  let currentTime = 10000;

  beforeEach(() => {
    currentTime = 10000;
    monitor = createTickMonitor({
      tickIntervalMs,
      staleMultiplier,
      onStale: vi.fn(),
      onRecovered: vi.fn(),
      getTime: () => currentTime,
    });
  });

  describe('start/stop', () => {
    it('should start and stop monitoring', () => {
      monitor.start();
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should allow multiple start/stop', () => {
      monitor.start();
      monitor.stop();
      monitor.start();
      monitor.stop();
    });
  });

  describe('recordTick', () => {
    it('should record tick timestamp', () => {
      monitor.start();
      monitor.recordTick(currentTime);
      expect(monitor.getTimeSinceLastTick()).toBe(0);
    });

    it('should update last tick time on subsequent ticks', () => {
      monitor.start();
      monitor.recordTick(currentTime);
      currentTime += 500;
      monitor.recordTick(currentTime);
      expect(monitor.getTimeSinceLastTick()).toBe(0);
    });
  });

  describe('isStale', () => {
    it('should return false when ticks are received', () => {
      monitor.start();
      monitor.recordTick(currentTime);
      currentTime += 500;
      expect(monitor.isStale()).toBe(false);
    });

    it('should return true when no ticks received beyond threshold', () => {
      monitor.start();
      // tickIntervalMs * staleMultiplier = 1000 * 2 = 2000ms threshold
      monitor.recordTick(currentTime);
      currentTime += 2001;
      expect(monitor.isStale()).toBe(true);
    });

    it('should return false before threshold', () => {
      monitor.start();
      monitor.recordTick(currentTime);
      currentTime += 1999;
      expect(monitor.isStale()).toBe(false);
    });

    it('should not be stale before start is called', () => {
      monitor.recordTick(currentTime);
      currentTime += 10000;
      expect(monitor.isStale()).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should call onStale when connection becomes stale', () => {
      const onStale = vi.fn();
      const monitor = createTickMonitor({
        tickIntervalMs: 1000,
        staleMultiplier: 2,
        onStale,
        getTime: () => currentTime,
      });

      monitor.start();
      monitor.recordTick(currentTime);
      currentTime += 2001;
      monitor.checkStale();

      expect(onStale).toHaveBeenCalled();
    });

    it('should call onRecovered when connection recovers', () => {
      const onRecovered = vi.fn();
      const monitor = createTickMonitor({
        tickIntervalMs: 1000,
        staleMultiplier: 2,
        onRecovered,
        getTime: () => currentTime,
      });

      monitor.start();
      // First become stale
      monitor.recordTick(currentTime);
      currentTime += 2001;
      monitor.checkStale();
      onRecovered.mockClear();

      // Then recover with new tick
      monitor.recordTick(currentTime);
      expect(onRecovered).toHaveBeenCalled();
    });

    it('should not call onRecovered if already not stale', () => {
      const onRecovered = vi.fn();
      const monitor = createTickMonitor({
        tickIntervalMs: 1000,
        staleMultiplier: 2,
        onRecovered,
        getTime: () => currentTime,
      });

      monitor.start();
      monitor.recordTick(currentTime);
      monitor.recordTick(currentTime);

      expect(onRecovered).not.toHaveBeenCalled();
    });
  });

  describe('getTimeSinceLastTick', () => {
    it('should return 0 when no tick recorded', () => {
      monitor.start();
      expect(monitor.getTimeSinceLastTick()).toBe(0);
    });

    it('should return time since last tick', () => {
      monitor.start();
      monitor.recordTick(currentTime);
      currentTime += 500;
      expect(monitor.getTimeSinceLastTick()).toBe(500);
    });
  });

  describe('getStaleDuration', () => {
    it('should return 0 when not stale', () => {
      monitor.start();
      monitor.recordTick(currentTime);
      currentTime += 1000;
      expect(monitor.getStaleDuration()).toBe(0);
    });

    it('should return duration in stale state', () => {
      monitor.start();
      monitor.recordTick(currentTime);
      currentTime += 2500;
      expect(monitor.getStaleDuration()).toBe(500);
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      monitor.start();
      const now = currentTime;
      monitor.recordTick(now);

      const status = monitor.getStatus();
      expect(status.lastTickTime).toBe(now);
      expect(status.isStale).toBe(false);
      expect(status.timeSinceLastTick).toBe(0);
      expect(status.staleDuration).toBe(0);
    });
  });
});

describe('createTickMonitor', () => {
  it('should create a new TickMonitor instance', () => {
    const monitor = createTickMonitor({ tickIntervalMs: 1000 });
    expect(monitor).toBeInstanceOf(TickMonitor);
    monitor.stop();
  });

  it('should use default staleMultiplier', () => {
    const monitor = createTickMonitor({ tickIntervalMs: 1000 });
    expect(monitor.getStatus().lastTickTime).toBe(0);
    monitor.stop();
  });
});
