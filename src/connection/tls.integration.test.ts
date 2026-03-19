/**
 * TLS Validator Integration Tests
 *
 * Integration tests covering:
 * - Certificate validation workflows
 * - Fingerprint management
 * - Cross-component TLS coordination
 */

import { describe, it, expect } from 'vitest';
import { TlsValidator, createTlsValidator } from './tls.js';

describe('TlsValidator Integration', () => {
  describe('Certificate validation', () => {
    it('should create validator with config', () => {
      const validator = createTlsValidator({
        expectedFingerprints: [],
        requireValidation: false,
      });

      expect(validator).toBeDefined();
    });

    it('should handle validation result', () => {
      const validator = createTlsValidator({
        expectedFingerprints: [],
        requireValidation: false,
      });

      const mockSocket = {
        getPeerCertificate: () => ({
          fingerprint256: 'AA:BB:CC:DD',
        }),
      };

      const result = validator.validate(mockSocket as any);

      expect(result).toHaveProperty('valid');
    });
  });

  describe('Fingerprint management', () => {
    it('should add and validate fingerprint', () => {
      const validator = createTlsValidator({
        expectedFingerprints: [],
        requireValidation: true,
      });

      const fingerprint =
        'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:11:22:33:44:55:66:77:88:99:00';
      validator.addExpectedFingerprint(fingerprint);

      const mockSocket = {
        getPeerCertificate: () => ({
          fingerprint256: fingerprint,
        }),
      };

      const result = validator.validate(mockSocket as any);

      expect(result.valid).toBe(true);
      expect(result.fingerprint).toBe(fingerprint);
    });

    it('should reject non-matching fingerprint', () => {
      const validator = createTlsValidator({
        expectedFingerprints: [],
        requireValidation: true,
      });

      const fingerprint =
        'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:11:22:33:44:55:66:77:88:99:00';
      validator.addExpectedFingerprint(fingerprint);

      const mockSocket = {
        getPeerCertificate: () => ({
          fingerprint256: '11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88',
        }),
      };

      expect(() => validator.validate(mockSocket as any)).toThrow();
    });

    it('should clear fingerprints', () => {
      const validator = createTlsValidator({
        expectedFingerprints: ['AA:BB:CC:DD'],
        requireValidation: true,
      });

      validator.clearExpectedFingerprints();

      const mockSocket = {
        getPeerCertificate: () => ({
          fingerprint256: 'AA:BB:CC:DD',
        }),
      };

      expect(() => validator.validate(mockSocket as any)).toThrow();
    });

    it('should handle multiple fingerprints', () => {
      const validator = createTlsValidator({
        expectedFingerprints: [],
        requireValidation: true,
      });

      validator.addExpectedFingerprint('AA:BB:CC:DD');
      validator.addExpectedFingerprint('11:22:33:44');

      const mockSocket1 = {
        getPeerCertificate: () => ({
          fingerprint256: 'AA:BB:CC:DD',
        }),
      };

      const mockSocket2 = {
        getPeerCertificate: () => ({
          fingerprint256: '11:22:33:44',
        }),
      };

      expect(validator.validate(mockSocket1 as any).valid).toBe(true);
      expect(validator.validate(mockSocket2 as any).valid).toBe(true);
    });
  });

  describe('Platform support', () => {
    it('should report platform support', () => {
      const support = TlsValidator.isSupported;

      expect(typeof support).toBe('boolean');
    });
  });
});
