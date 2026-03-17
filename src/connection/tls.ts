/**
 * TLS Validator
 *
 * Validates TLS certificate fingerprints for secure connections.
 * Supports both Node.js (with socket inspection) and browser (skipped).
 */

import { ConnectionError } from '../errors.js';

// ============================================================================
// Types
// ============================================================================

export interface TlsValidatorConfig {
  expectedFingerprints: string[];
  requireValidation: boolean;
}

export interface TlsValidationResult {
  valid: boolean;
  fingerprint?: string;
  subject?: string;
  issuer?: string;
  validFrom?: Date;
  validTo?: Date;
  error?: string;
}

/** Node.js TLS socket type */
export interface TLSSocket {
  getPeerCertificate(): TLSCertificate;
}

export interface TLSCertificate {
  fingerprint256?: string;
  subject?: string;
  issuer?: string;
  valid_from?: string;
  valid_to?: string;
}

// ============================================================================
// TLS Validator
// ============================================================================

/**
 * TLS certificate fingerprint validator.
 *
 * Validates TLS certificates using SHA-256 SPKI fingerprints.
 * Provides constant-time comparison to prevent timing attacks.
 *
 * Platform support:
 * - Node.js: Full validation with socket inspection
 * - Browser: Validation skipped (browser handles TLS)
 */
export class TlsValidator {
  private expectedFingerprints: Set<string>;
  private requireValidation: boolean;

  /**
   * Check if TLS validation is supported on this platform.
   *
   * Returns false in browser environments where TLS socket
   * inspection is not available.
   */
  static get isSupported(): boolean {
    // Check if we're in Node.js by verifying tls module exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('tls');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a TLS validator.
   *
   * @param config Configuration with expected fingerprints
   */
  constructor(config: TlsValidatorConfig) {
    this.expectedFingerprints = new Set(
      config.expectedFingerprints.map(normalizeFingerprint)
    );
    this.requireValidation = config.requireValidation;
  }

  /**
   * Validate TLS certificate.
   *
   * @param socket TLS socket to validate
   * @returns Validation result
   * @throws ConnectionError if fingerprint doesn't match and requireValidation is true
   */
  validate(socket: TLSSocket): TlsValidationResult {
    // If no fingerprints configured
    if (this.expectedFingerprints.size === 0) {
      if (this.requireValidation) {
        throw new ConnectionError({
          code: 'TLS_FINGERPRINT_MISMATCH',
          message: 'TLS validation required but no fingerprints configured',
          retryable: false,
        });
      }
      return { valid: true };
    }

    const cert = socket.getPeerCertificate();
    const fingerprint = cert.fingerprint256
      ? normalizeFingerprint(cert.fingerprint256)
      : undefined;

    if (!fingerprint) {
      const error = 'Certificate has no fingerprint';
      if (this.requireValidation) {
        throw new ConnectionError({
          code: 'TLS_FINGERPRINT_MISMATCH',
          message: error,
          retryable: false,
        });
      }
      return { valid: false, error };
    }

    // Check if fingerprint matches any expected
    const isValid = this.constantTimeCompare(fingerprint);

    const result: TlsValidationResult = {
      valid: isValid,
      fingerprint: cert.fingerprint256 ?? undefined,
      subject: cert.subject ?? undefined,
      issuer: cert.issuer ?? undefined,
      validFrom: cert.valid_from ? new Date(cert.valid_from) : undefined,
      validTo: cert.valid_to ? new Date(cert.valid_to) : undefined,
    };

    if (!isValid) {
      result.error = 'Fingerprint does not match expected';
      if (this.requireValidation) {
        throw new ConnectionError({
          code: 'TLS_FINGERPRINT_MISMATCH',
          message: `TLS fingerprint mismatch: expected ${[...this.expectedFingerprints][0]}, got ${fingerprint}`,
          retryable: false,
        });
      }
    }

    return result;
  }

  /**
   * Add an expected fingerprint.
   *
   * @param fingerprint Fingerprint to add
   */
  addExpectedFingerprint(fingerprint: string): void {
    this.expectedFingerprints.add(normalizeFingerprint(fingerprint));
  }

  /**
   * Clear all expected fingerprints.
   */
  clearExpectedFingerprints(): void {
    this.expectedFingerprints.clear();
  }

  /**
   * Constant-time comparison to prevent timing attacks.
   */
  private constantTimeCompare(input: string): boolean {
    for (const expected of this.expectedFingerprints) {
      if (constantTimeEqual(input, expected)) {
        return true;
      }
    }
    return false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize fingerprint format (colon-separated hex to uppercase).
 */
function normalizeFingerprint(fingerprint: string): string {
  return fingerprint.toUpperCase().replace(/:/g, '');
}

/**
 * Constant-time string comparison.
 * Prevents timing attacks by always comparing all bytes.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a TLS validator.
 */
export function createTlsValidator(
  config: TlsValidatorConfig
): TlsValidator {
  return new TlsValidator(config);
}
