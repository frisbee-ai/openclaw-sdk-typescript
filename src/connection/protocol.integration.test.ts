/**
 * Protocol Negotiation Integration Tests
 *
 * Integration tests covering:
 * - Full protocol negotiation flow
 * - Version range handling
 * - Cross-component negotiation scenarios
 */

import { describe, it, expect } from 'vitest';
import { createProtocolNegotiator } from './protocol.js';

describe('ProtocolNegotiator Integration', () => {
  describe('Full negotiation flow', () => {
    it('should negotiate protocol version within range', () => {
      const negotiator = createProtocolNegotiator([{ min: 1, max: 3 }]);

      const helloOk = {
        type: 'hello-ok' as const,
        protocol: 2,
        server: { version: '1.0', connId: 'conn-1' },
        features: { methods: ['ping', 'pong'], events: ['tick'] },
        snapshot: { presence: {}, agents: {}, nodes: {} },
        policy: { maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 },
      };

      const result = negotiator.negotiate(helloOk);

      expect(result.version).toBe(2);
    });

    it('should handle exact version match', () => {
      const negotiator = createProtocolNegotiator([{ min: 2, max: 2 }]);

      const helloOk = {
        type: 'hello-ok' as const,
        protocol: 2,
        server: { version: '1.0', connId: 'conn-1' },
        features: { methods: ['ping'], events: [] },
        snapshot: { presence: {}, agents: {}, nodes: {} },
        policy: { maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 },
      };

      const result = negotiator.negotiate(helloOk);

      expect(result.version).toBe(2);
    });

    it('should handle server protocol within client range', () => {
      const negotiator = createProtocolNegotiator([{ min: 1, max: 5 }]);

      const helloOk = {
        type: 'hello-ok' as const,
        protocol: 3,
        server: { version: '1.0', connId: 'conn-1' },
        features: { methods: ['ping'], events: [] },
        snapshot: { presence: {}, agents: {}, nodes: {} },
        policy: { maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 },
      };

      const result = negotiator.negotiate(helloOk);

      expect(result.version).toBe(3);
    });
  });

  describe('Version range handling', () => {
    it('should return correct range', () => {
      const negotiator = createProtocolNegotiator([{ min: 1, max: 3 }]);

      const range = negotiator.getRange();

      expect(range.min).toBe(1);
      expect(range.max).toBe(3);
    });

    it('should handle single version range', () => {
      const negotiator = createProtocolNegotiator([{ min: 2, max: 2 }]);

      const range = negotiator.getRange();

      expect(range.min).toBe(2);
      expect(range.max).toBe(2);
    });

    it('should handle default range', () => {
      const negotiator = createProtocolNegotiator();

      const range = negotiator.getRange();

      expect(range.min).toBe(3);
      expect(range.max).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Negotiation state', () => {
    it('should report negotiated state correctly', () => {
      const negotiator = createProtocolNegotiator([{ min: 1, max: 3 }]);

      expect(negotiator.isNegotiated()).toBe(false);
      expect(negotiator.getNegotiatedVersion()).toBeNull();

      const helloOk = {
        type: 'hello-ok' as const,
        protocol: 2,
        server: { version: '1.0', connId: 'conn-1' },
        features: { methods: ['ping'], events: [] },
        snapshot: { presence: {}, agents: {}, nodes: {} },
        policy: { maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 },
      };

      negotiator.negotiate(helloOk);

      expect(negotiator.isNegotiated()).toBe(true);
      expect(negotiator.getNegotiatedVersion()).toBe(2);
    });

    it('should reset negotiation state', () => {
      const negotiator = createProtocolNegotiator([{ min: 1, max: 3 }]);

      const helloOk = {
        type: 'hello-ok' as const,
        protocol: 2,
        server: { version: '1.0', connId: 'conn-1' },
        features: { methods: ['ping'], events: [] },
        snapshot: { presence: {}, agents: {}, nodes: {} },
        policy: { maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 },
      };

      negotiator.negotiate(helloOk);
      expect(negotiator.isNegotiated()).toBe(true);

      negotiator.reset();
      expect(negotiator.isNegotiated()).toBe(false);
      expect(negotiator.getNegotiatedVersion()).toBeNull();
    });
  });

  describe('Multiple negotiations', () => {
    it('should allow re-negotiation after reset', () => {
      const negotiator = createProtocolNegotiator([{ min: 1, max: 3 }]);

      const helloOk1 = {
        type: 'hello-ok' as const,
        protocol: 1,
        server: { version: '1.0', connId: 'conn-1' },
        features: { methods: ['ping'], events: [] },
        snapshot: { presence: {}, agents: {}, nodes: {} },
        policy: { maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 },
      };

      const helloOk2 = {
        type: 'hello-ok' as const,
        protocol: 2,
        server: { version: '1.0', connId: 'conn-2' },
        features: { methods: ['ping', 'pong'], events: [] },
        snapshot: { presence: {}, agents: {}, nodes: {} },
        policy: { maxPayload: 1000, maxBufferedBytes: 5000, tickIntervalMs: 1000 },
      };

      negotiator.negotiate(helloOk1);
      expect(negotiator.getNegotiatedVersion()).toBe(1);

      negotiator.reset();
      negotiator.negotiate(helloOk2);
      expect(negotiator.getNegotiatedVersion()).toBe(2);
    });
  });
});
