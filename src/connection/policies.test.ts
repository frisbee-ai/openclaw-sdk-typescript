/**
 * PolicyManager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyManager, createPolicyManager, DEFAULT_POLICY } from './policies';
import type { HelloOk } from '../protocol/connection.js';

describe('PolicyManager', () => {
  let manager: PolicyManager;

  beforeEach(() => {
    manager = createPolicyManager();
  });

  describe('setPolicies', () => {
    it('should store policies from hello-ok', () => {
      const policy: HelloOk['policy'] = {
        maxPayload: 2097152,
        maxBufferedBytes: 131072,
        tickIntervalMs: 15000,
      };

      manager.setPolicies(policy);

      expect(manager.getMaxPayload()).toBe(2097152);
      expect(manager.getMaxBufferedBytes()).toBe(131072);
      expect(manager.getTickIntervalMs()).toBe(15000);
    });

    it('should replace existing policies', () => {
      manager.setPolicies({
        maxPayload: 1000,
        maxBufferedBytes: 1000,
        tickIntervalMs: 1000,
      });

      manager.setPolicies({
        maxPayload: 2000,
        maxBufferedBytes: 2000,
        tickIntervalMs: 2000,
      });

      expect(manager.getMaxPayload()).toBe(2000);
    });
  });

  describe('hasPolicy', () => {
    it('should return false when no policy is set', () => {
      expect(manager.hasPolicy()).toBe(false);
    });

    it('should return true when policy is set', () => {
      manager.setPolicies(DEFAULT_POLICY);
      expect(manager.hasPolicy()).toBe(true);
    });
  });

  describe('getMaxPayload', () => {
    it('should return default value when not set', () => {
      expect(manager.getMaxPayload()).toBe(DEFAULT_POLICY.maxPayload);
    });

    it('should return set value', () => {
      manager.setPolicies({ maxPayload: 5000000, maxBufferedBytes: 100000, tickIntervalMs: 60000 });
      expect(manager.getMaxPayload()).toBe(5000000);
    });
  });

  describe('getMaxBufferedBytes', () => {
    it('should return default value when not set', () => {
      expect(manager.getMaxBufferedBytes()).toBe(DEFAULT_POLICY.maxBufferedBytes);
    });

    it('should return set value', () => {
      manager.setPolicies({ maxPayload: 5000000, maxBufferedBytes: 100000, tickIntervalMs: 60000 });
      expect(manager.getMaxBufferedBytes()).toBe(100000);
    });
  });

  describe('getTickIntervalMs', () => {
    it('should return default value when not set', () => {
      expect(manager.getTickIntervalMs()).toBe(DEFAULT_POLICY.tickIntervalMs);
    });

    it('should return set value', () => {
      manager.setPolicies({ maxPayload: 5000000, maxBufferedBytes: 100000, tickIntervalMs: 60000 });
      expect(manager.getTickIntervalMs()).toBe(60000);
    });
  });

  describe('getTickIntervalSeconds', () => {
    it('should return tick interval in seconds', () => {
      manager.setPolicies({ maxPayload: 1000, maxBufferedBytes: 1000, tickIntervalMs: 30000 });
      expect(manager.getTickIntervalSeconds()).toBe(30);
    });

    it('should round down for non-integer seconds', () => {
      manager.setPolicies({ maxPayload: 1000, maxBufferedBytes: 1000, tickIntervalMs: 25000 });
      expect(manager.getTickIntervalSeconds()).toBe(25);
    });
  });
});

describe('createPolicyManager', () => {
  it('should create a new PolicyManager instance', () => {
    const manager = createPolicyManager();
    expect(manager).toBeInstanceOf(PolicyManager);
    expect(manager.hasPolicy()).toBe(false);
  });
});
