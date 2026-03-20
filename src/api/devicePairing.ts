/**
 * Device Pairing API Namespace
 *
 * Provides typed methods for device pairing operations on the OpenClaw Gateway.
 *
 * @module api/devicePairing
 */

import type {
  DevicePairListParams,
  DevicePairApproveParams,
  DevicePairRejectParams,
} from '../protocol/types.js';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

/**
 * Device Pairing API namespace.
 *
 * @example
 * ```ts
 * const pairings = await client.devicePairing.list();
 * await client.devicePairing.approve({ pairingId: "pair-123" });
 * ```
 */
export class DevicePairingAPI {
  constructor(private request: RequestFn) {}

  /**
   * List pending device pairing requests.
   */
  async list(params?: DevicePairListParams): Promise<unknown> {
    return this.request('device.pair.list', params);
  }

  /**
   * Approve a device pairing request.
   */
  async approve(params: DevicePairApproveParams): Promise<void> {
    await this.request('device.pair.approve', params);
  }

  /**
   * Reject a device pairing request.
   */
  async reject(params: DevicePairRejectParams): Promise<void> {
    await this.request('device.pair.reject', params);
  }
}
