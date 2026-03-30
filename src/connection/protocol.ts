/**
 * Protocol Version Negotiation
 *
 * Handles protocol version negotiation with the server.
 *
 * @module
 */

import type { HelloOk } from '../protocol/connection.js';

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

// Default protocol versions (v3 → v2 → v1 fallback order)
export const DEFAULT_PROTOCOL_VERSIONS: ProtocolVersionRange[] = [
  { min: 3, max: 3 },
  { min: 2, max: 2 },
  { min: 1, max: 1 },
];

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
  private ranges: ProtocolVersionRange[];
  private negotiatedVersion: number | null = null;

  constructor(ranges: ProtocolVersionRange[] = DEFAULT_PROTOCOL_VERSIONS) {
    this.ranges = ranges;
  }

  /**
   * Get the protocol version range to send in connect frame.
   */
  getRange(): ProtocolVersionRange {
    return { ...this.ranges[0] };
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
   * @throws Error if version is out of all supported ranges
   */
  negotiate(helloOk: HelloOk): NegotiatedProtocol {
    const serverVersion = helloOk.protocol;

    // Try each range in order
    for (const range of this.ranges) {
      if (serverVersion >= range.min && serverVersion <= range.max) {
        // Found a match
        if (serverVersion < this.ranges[0].min) {
          // Degraded — server version is lower than our preferred
          const logger = console;
          logger.warn(
            `[ProtocolNegotiator] Protocol version ${serverVersion} is lower than preferred ${this.ranges[0].min}, proceeding with degraded mode`
          );
        }
        this.negotiatedVersion = serverVersion;
        return { version: serverVersion, min: range.min, max: range.max };
      }
    }

    // All ranges exhausted — throw with useful error
    const supported = this.ranges.map(r => `${r.min}-${r.max}`).join(', ');
    throw new Error(
      `Protocol version ${serverVersion} is out of all supported ranges [${supported}]`
    );
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
 * @param ranges - Optional ordered list of protocol version ranges (v3 → v2 → v1 fallback)
 * @returns A new ProtocolNegotiator instance
 *
 * @example
 * ```ts
 * import { createProtocolNegotiator } from './connection/protocol.js';
 *
 * // Use default versions (v3, v2, v1)
 * const negotiator = createProtocolNegotiator();
 *
 * // Custom version ranges
 * const negotiator2 = createProtocolNegotiator([
 *   { min: 2, max: 2 },
 *   { min: 1, max: 1 },
 * ]);
 * ```
 */
export function createProtocolNegotiator(
  ranges?: ProtocolVersionRange[]
): ProtocolNegotiator {
  return new ProtocolNegotiator(ranges);
}
