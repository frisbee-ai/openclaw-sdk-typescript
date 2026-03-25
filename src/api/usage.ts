/**
 * Usage API Namespace
 *
 * Provides typed methods for usage reporting on the OpenClaw Gateway.
 *
 * @module api/usage
 */

import type {
  UsageStatusParams,
  UsageStatusResult,
  UsageCostParams,
  UsageCostResult,
} from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

/**
 * Usage API namespace.
 *
 * @example
 * ```ts
 * const { status } = await client.usage.status();
 * const { cost } = await client.usage.cost();
 * ```
 */
export class UsageAPI {
  constructor(private request: RequestFn) {}

  /**
   * Get usage status.
   */
  async status(params?: UsageStatusParams): Promise<UsageStatusResult> {
    return this.request<UsageStatusResult>('usage.status', params);
  }

  /**
   * Get usage cost.
   */
  async cost(params?: UsageCostParams): Promise<UsageCostResult> {
    return this.request<UsageCostResult>('usage.cost', params);
  }
}
