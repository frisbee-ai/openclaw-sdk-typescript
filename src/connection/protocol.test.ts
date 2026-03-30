/**
 * Protocol Negotiator Unit Tests
 *
 * Comprehensive tests covering:
 * - Unit: Protocol version negotiation
 * - Edge Cases: Version boundaries, reset behavior
 * - Security: Version validation
 */

import { describe, it, expect, vi } from 'vitest';
import { ProtocolNegotiator, createProtocolNegotiator, DEFAULT_PROTOCOL_VERSIONS } from './protocol';

describe('ProtocolNegotiator', () => {
  describe('constructor', () => {
    it('should use default version ranges when not specified', () => {
      const negotiator = new ProtocolNegotiator();

      expect(negotiator.getRange()).toEqual(DEFAULT_PROTOCOL_VERSIONS[0]);
    });

    it('should use custom version ranges when specified', () => {
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 3 }]);

      expect(negotiator.getRange()).toEqual({ min: 1, max: 3 });
    });

    it('should use first range as preferred', () => {
      const negotiator = new ProtocolNegotiator([{ min: 2, max: 2 }, { min: 1, max: 1 }]);

      expect(negotiator.getRange()).toEqual({ min: 2, max: 2 });
    });
  });

  describe('getRange()', () => {
    it('should return copy of range to prevent mutation', () => {
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 5 }]);
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
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 3 }]);

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
    it('should successfully negotiate version within first range', () => {
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 3 }]);

      const result = negotiator.negotiate({ protocol: 2 } as any);

      expect(result.version).toBe(2);
      expect(result.min).toBe(1);
      expect(result.max).toBe(3);
    });

    it('should negotiate minimum supported version', () => {
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 3 }]);

      const result = negotiator.negotiate({ protocol: 1 } as any);

      expect(result.version).toBe(1);
    });

    it('should negotiate maximum supported version', () => {
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 3 }]);

      const result = negotiator.negotiate({ protocol: 3 } as any);

      expect(result.version).toBe(3);
    });

    it('should throw when server version below all ranges', () => {
      const negotiator = new ProtocolNegotiator([{ min: 2, max: 5 }]);

      expect(() => negotiator.negotiate({ protocol: 1 } as any)).toThrow(
        'Protocol version 1 is out of all supported ranges [2-5]'
      );
    });

    it('should throw when server version above all ranges', () => {
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 3 }]);

      expect(() => negotiator.negotiate({ protocol: 4 } as any)).toThrow(
        'Protocol version 4 is out of all supported ranges [1-3]'
      );
    });

    it('should negotiate with exact version match', () => {
      const negotiator = new ProtocolNegotiator([{ min: 1, max: 1 }]);

      const result = negotiator.negotiate({ protocol: 1 } as any);

      expect(result.version).toBe(1);
    });

    it('should fallback to second range when server uses lower version', () => {
      const negotiator = new ProtocolNegotiator([{ min: 3, max: 3 }, { min: 2, max: 2 }]);

      const result = negotiator.negotiate({ protocol: 2 } as any);

      expect(result.version).toBe(2);
      expect(result.min).toBe(2);
      expect(result.max).toBe(2);
    });

    it('should warn when server version is lower than preferred', () => {
      const negotiator = new ProtocolNegotiator([{ min: 3, max: 3 }, { min: 2, max: 2 }]);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      negotiator.negotiate({ protocol: 2 } as any);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Protocol version 2 is lower than preferred 3')
      );
      warnSpy.mockRestore();
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

  it('should accept custom ranges', () => {
    const negotiator = createProtocolNegotiator([{ min: 1, max: 5 }]);

    expect(negotiator.getRange()).toEqual({ min: 1, max: 5 });
  });
});

describe('DEFAULT_PROTOCOL_VERSIONS', () => {
  it('should contain v3, v2, v1 in fallback order', () => {
    expect(DEFAULT_PROTOCOL_VERSIONS).toEqual([
      { min: 3, max: 3 },
      { min: 2, max: 2 },
      { min: 1, max: 1 },
    ]);
  });
});
