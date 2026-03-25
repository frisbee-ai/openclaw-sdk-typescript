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
  DeviceTokenRotateParams,
  DeviceTokenRevokeParams,
} from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

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

  /**
   * Remove a device pairing.
   */
  async remove(params: { pairingId: string }): Promise<void> {
    await this.request('device.pair.remove', params);
  }

  /**
   * Token operations.
   */
  get token() {
    const request = this.request;
    return {
      /**
       * Rotate device token.
       */
      async rotate(params: DeviceTokenRotateParams): Promise<void> {
        await request('device.token.rotate', params);
      },

      /**
       * Revoke device token.
       */
      async revoke(params: DeviceTokenRevokeParams): Promise<void> {
        await request('device.token.revoke', params);
      },
    };
  }
}
