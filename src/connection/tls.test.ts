/**
 * TLS Validator Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TlsValidator, createTlsValidator } from "./tls";
import { ConnectionError } from "../errors";

// Mock TLS socket
interface MockTLSSocket {
  getPeerCertificate: () => MockCertificate;
}

interface MockCertificate {
  fingerprint256?: string;
  subject?: string;
  issuer?: string;
  valid_from?: string;
  valid_to?: string;
}

describe("TlsValidator", () => {
  let validator: TlsValidator;
  const expectedFingerprint = "A1:B2:C3:D4:E5:F6:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF";

  beforeEach(() => {
    validator = createTlsValidator({
      expectedFingerprints: [expectedFingerprint],
      requireValidation: true,
    });
  });

  describe("isSupported", () => {
    it("should indicate platform support", () => {
      // Node.js should support TLS validation
      expect(typeof TlsValidator.isSupported).toBe("boolean");
    });
  });

  describe("validate", () => {
    it("should validate certificate with matching fingerprint", () => {
      const mockSocket: MockTLSSocket = {
        getPeerCertificate: () => ({
          fingerprint256: expectedFingerprint,
          subject: "CN=example.com",
          issuer: "CN=CA",
          valid_from: "2024-01-01",
          valid_to: "2025-01-01",
        }),
      };

      const result = validator.validate(mockSocket as any);
      expect(result.valid).toBe(true);
      expect(result.fingerprint).toBe(expectedFingerprint);
    });

    it("should reject certificate with non-matching fingerprint", () => {
      const mockSocket: MockTLSSocket = {
        getPeerCertificate: () => ({
          fingerprint256: "FF:EE:DD:CC:BB:AA:99:88:77:66:55:44:33:22:11:00:FF:EE:DD:CC:BB:AA:99:88:77:66:55:44:33:22",
          subject: "CN=example.com",
        }),
      };

      expect(() => validator.validate(mockSocket as any)).toThrow(ConnectionError);
      expect(() => validator.validate(mockSocket as any)).toThrow("TLS fingerprint mismatch");
    });

    it("should return valid result when requireValidation is false", () => {
      const nonStrictValidator = createTlsValidator({
        expectedFingerprints: [expectedFingerprint],
        requireValidation: false,
      });

      const mockSocket: MockTLSSocket = {
        getPeerCertificate: () => ({
          fingerprint256: "UNKNOWN:FINGER:PRINT",
        }),
      };

      const result = nonStrictValidator.validate(mockSocket as any);
      // When requireValidation is false, it returns false instead of throwing
      expect(result.valid).toBe(false);
    });

    it("should handle missing fingerprint in certificate", () => {
      const mockSocket: MockTLSSocket = {
        getPeerCertificate: () => ({}),
      };

      expect(() => validator.validate(mockSocket as any)).toThrow();
    });
  });

  describe("addExpectedFingerprint", () => {
    it("should add new fingerprint to list", () => {
      const newFingerprint = "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF";
      validator.addExpectedFingerprint(newFingerprint);

      const mockSocket: MockTLSSocket = {
        getPeerCertificate: () => ({
          fingerprint256: newFingerprint,
        }),
      };

      const result = validator.validate(mockSocket as any);
      expect(result.valid).toBe(true);
    });
  });

  describe("clearExpectedFingerprints", () => {
    it("should clear all expected fingerprints", () => {
      validator.clearExpectedFingerprints();

      const mockSocket: MockTLSSocket = {
        getPeerCertificate: () => ({
          fingerprint256: expectedFingerprint,
        }),
      };

      // With no expected fingerprints, validation should fail
      expect(() => validator.validate(mockSocket as any)).toThrow();
    });
  });
});

describe("createTlsValidator", () => {
  it("should create a new TlsValidator instance", () => {
    const validator = createTlsValidator({
      expectedFingerprints: [],
      requireValidation: true,
    });
    expect(validator).toBeInstanceOf(TlsValidator);
  });

  it("should accept empty fingerprints array", () => {
    const validator = createTlsValidator({
      expectedFingerprints: [],
      requireValidation: false,
    });
    expect(validator).toBeInstanceOf(TlsValidator);
  });
});
