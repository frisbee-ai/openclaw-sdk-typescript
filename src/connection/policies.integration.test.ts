/**
 * Policy Manager Integration Tests
 *
 * Integration tests covering:
 * - Policy configuration and retrieval
 * - Policy enforcement scenarios
 * - Cross-component policy coordination
 */

import { describe, it, expect } from 'vitest';
import { createPolicyManager, type Policy } from './policies.js';

describe('PolicyManager Integration', () => {
  describe('Policy configuration', () => {
    it('should have default policy values before setting', () => {
      const manager = createPolicyManager();

      expect(manager.hasPolicy()).toBe(false);
      expect(manager.getMaxPayload()).toBe(1048576);
      expect(manager.getMaxBufferedBytes()).toBe(65536);
    });

    it('should set and retrieve policy', () => {
      const manager = createPolicyManager();
      const policy: Policy = {
        maxPayload: 10000,
        maxBufferedBytes: 50000,
        tickIntervalMs: 2000,
      };

      manager.setPolicies(policy);

      expect(manager.hasPolicy()).toBe(true);
      expect(manager.getMaxPayload()).toBe(10000);
      expect(manager.getMaxBufferedBytes()).toBe(50000);
      expect(manager.getTickIntervalMs()).toBe(2000);
    });

    it('should convert tick interval to seconds', () => {
      const manager = createPolicyManager();
      const policy: Policy = {
        maxPayload: 10000,
        maxBufferedBytes: 50000,
        tickIntervalMs: 5000,
      };

      manager.setPolicies(policy);

      expect(manager.getTickIntervalSeconds()).toBe(5);
    });

    it('should handle zero tick interval', () => {
      const manager = createPolicyManager();
      const policy: Policy = {
        maxPayload: 1000,
        maxBufferedBytes: 5000,
        tickIntervalMs: 0,
      };

      manager.setPolicies(policy);

      expect(manager.getTickIntervalMs()).toBe(0);
      expect(manager.getTickIntervalSeconds()).toBe(0);
    });

    it('should handle large values', () => {
      const manager = createPolicyManager();
      const policy: Policy = {
        maxPayload: 1000000,
        maxBufferedBytes: 5000000,
        tickIntervalMs: 60000,
      };

      manager.setPolicies(policy);

      expect(manager.getMaxPayload()).toBe(1000000);
      expect(manager.getMaxBufferedBytes()).toBe(5000000);
      expect(manager.getTickIntervalSeconds()).toBe(60);
    });
  });

  describe('Policy updates', () => {
    it('should update policy values', () => {
      const manager = createPolicyManager();

      manager.setPolicies({ maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 });
      expect(manager.getMaxPayload()).toBe(1000);

      manager.setPolicies({ maxPayload: 2000, maxBufferedBytes: 10000, tickIntervalMs: 2000 });
      expect(manager.getMaxPayload()).toBe(2000);
      expect(manager.getTickIntervalMs()).toBe(2000);
    });
  });
});
