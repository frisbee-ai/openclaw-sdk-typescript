/**
 * Protocol Version Negotiation
 *
 * Handles protocol version negotiation with the server.
 *
 * @module
 */

import type { HelloOk } from '../protocol/types.js';

// ============================================================================
// Types
// ============================================================================

/** Supported protocol version range */
export interface ProtocolVersionRange {
  min: number;
  max: number;
}

/** Negotiated protocol version */
export interface NegotiatedProtocol {
  version: number;
  min: number;
  max: number;
}

// Default protocol version
export const DEFAULT_PROTOCOL_VERSION: ProtocolVersionRange = {
  min: 3,
  max: 3,
};

// ============================================================================
// Protocol Negotiator
// ============================================================================

/**
 * Protocol version negotiator.
 *
 * Handles client-server protocol version negotiation:
 * - Client sends minProtocol/maxProtocol in connect
 * - Server returns negotiated protocol in hello-ok
 * - Client handles version mismatch gracefully
 */
export class ProtocolNegotiator {
  private range: ProtocolVersionRange;
  private negotiatedVersion: number | null = null;

  constructor(range: Partial<ProtocolVersionRange> = {}) {
    this.range = { ...DEFAULT_PROTOCOL_VERSION, ...range };
  }

  /**
   * Get the protocol version range to send in connect frame.
   */
  getRange(): ProtocolVersionRange {
    return { ...this.range };
  }

  /**
   * Get the negotiated protocol version.
   */
  getNegotiatedVersion(): number | null {
    return this.negotiatedVersion;
  }

  /**
   * Check if negotiation is complete.
   */
  isNegotiated(): boolean {
    return this.negotiatedVersion !== null;
  }

  /**
   * Process server response and negotiate version.
   *
   * @param helloOk Server hello-ok response
   * @returns Negotiated protocol version
   * @throws Error if version is out of supported range
   */
  negotiate(helloOk: HelloOk): NegotiatedProtocol {
    const serverVersion = helloOk.protocol;

    // Check if server version is within our supported range
    if (serverVersion < this.range.min || serverVersion > this.range.max) {
      throw new Error(
        `Protocol version ${serverVersion} is out of supported range [${this.range.min}, ${this.range.max}]`
      );
    }

    this.negotiatedVersion = serverVersion;

    return {
      version: serverVersion,
      min: this.range.min,
      max: this.range.max,
    };
  }

  /**
   * Reset negotiation state.
   */
  reset(): void {
    this.negotiatedVersion = null;
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a protocol negotiator.
 *
 * @param range - Optional protocol version range
 * @returns A new ProtocolNegotiator instance
 *
 * @example
 * ```ts
 * import { createProtocolNegotiator } from './connection/protocol.js';
 *
 * const negotiator = createProtocolNegotiator({
 *   minProtocol: 1,
 *   maxProtocol: 2
 * });
 * ```
 */
export function createProtocolNegotiator(
  range?: Partial<ProtocolVersionRange>
): ProtocolNegotiator {
  return new ProtocolNegotiator(range);
}
