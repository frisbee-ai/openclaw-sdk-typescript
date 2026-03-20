/**
 * Protocol Negotiator Unit Tests
 *
 * Comprehensive tests covering:
 * - Unit: Protocol version negotiation
 * - Edge Cases: Version boundaries, reset behavior
 * - Security: Version validation
 */

import { describe, it, expect } from 'vitest';
import { ProtocolNegotiator, createProtocolNegotiator, DEFAULT_PROTOCOL_VERSION } from './protocol';

describe('ProtocolNegotiator', () => {
  describe('constructor', () => {
    it('should use default version range when not specified', () => {
      const negotiator = new ProtocolNegotiator();

      expect(negotiator.getRange()).toEqual(DEFAULT_PROTOCOL_VERSION);
    });

    it('should use custom version range when specified', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 3 });

      expect(negotiator.getRange()).toEqual({ min: 1, max: 3 });
    });

    it('should merge partial config with defaults', () => {
      const negotiator = new ProtocolNegotiator({ min: 2 });

      expect(negotiator.getRange()).toEqual({ min: 2, max: 3 });
    });
  });

  describe('getRange()', () => {
    it('should return copy of range to prevent mutation', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 5 });
      const range1 = negotiator.getRange();
      const range2 = negotiator.getRange();

      expect(range1).not.toBe(range2);
      expect(range1).toEqual(range2);
    });
  });

  describe('getNegotiatedVersion()', () => {
    it('should return null before negotiation', () => {
      const negotiator = new ProtocolNegotiator();

      expect(negotiator.getNegotiatedVersion()).toBeNull();
    });

    it('should return negotiated version after successful negotiation', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 3 });

      negotiator.negotiate({ protocol: 2 } as any);

      expect(negotiator.getNegotiatedVersion()).toBe(2);
    });
  });

  describe('isNegotiated()', () => {
    it('should return false before negotiation', () => {
      const negotiator = new ProtocolNegotiator();

      expect(negotiator.isNegotiated()).toBe(false);
    });

    it('should return true after successful negotiation', () => {
      const negotiator = new ProtocolNegotiator();

      negotiator.negotiate({ protocol: 3 } as any);

      expect(negotiator.isNegotiated()).toBe(true);
    });
  });

  describe('negotiate()', () => {
    it('should successfully negotiate version within range', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 3 });

      const result = negotiator.negotiate({ protocol: 2 } as any);

      expect(result.version).toBe(2);
      expect(result.min).toBe(1);
      expect(result.max).toBe(3);
    });

    it('should negotiate minimum supported version', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 3 });

      const result = negotiator.negotiate({ protocol: 1 } as any);

      expect(result.version).toBe(1);
    });

    it('should negotiate maximum supported version', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 3 });

      const result = negotiator.negotiate({ protocol: 3 } as any);

      expect(result.version).toBe(3);
    });

    it('should throw when server version below minimum', () => {
      const negotiator = new ProtocolNegotiator({ min: 2, max: 5 });

      expect(() => negotiator.negotiate({ protocol: 1 } as any)).toThrow(
        'Protocol version 1 is out of supported range [2, 5]'
      );
    });

    it('should throw when server version above maximum', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 3 });

      expect(() => negotiator.negotiate({ protocol: 4 } as any)).toThrow(
        'Protocol version 4 is out of supported range [1, 3]'
      );
    });

    it('should throw when server version equals boundary', () => {
      const negotiator = new ProtocolNegotiator({ min: 1, max: 1 });

      const result = negotiator.negotiate({ protocol: 1 } as any);

      expect(result.version).toBe(1);
    });
  });

  describe('reset()', () => {
    it('should clear negotiated version', () => {
      const negotiator = new ProtocolNegotiator();

      negotiator.negotiate({ protocol: 3 } as any);
      expect(negotiator.isNegotiated()).toBe(true);

      negotiator.reset();

      expect(negotiator.isNegotiated()).toBe(false);
      expect(negotiator.getNegotiatedVersion()).toBeNull();
    });
  });
});

describe('createProtocolNegotiator factory', () => {
  it('should create ProtocolNegotiator instance', () => {
    const negotiator = createProtocolNegotiator();

    expect(negotiator).toBeInstanceOf(ProtocolNegotiator);
  });

  it('should accept custom range', () => {
    const negotiator = createProtocolNegotiator({ min: 1, max: 5 });

    expect(negotiator.getRange()).toEqual({ min: 1, max: 5 });
  });
});

describe('DEFAULT_PROTOCOL_VERSION', () => {
  it('should be { min: 3, max: 3 }', () => {
    expect(DEFAULT_PROTOCOL_VERSION).toEqual({ min: 3, max: 3 });
  });
});
