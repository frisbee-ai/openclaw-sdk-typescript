/**
 * ExecApprovals API Namespace
 *
 * Provides typed methods for execution approval operations on the OpenClaw Gateway.
 *
 * @module api/execApprovals
 */

import type {
  ExecApprovalsGetParams,
  ExecApprovalsSetParams,
  ExecApprovalsSnapshot,
} from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

/**
 * ExecApprovals API namespace.
 *
 * @example
 * ```ts
 * const { approvals } = await client.execApprovals.get();
 * await client.execApprovals.set({ enabled: true });
 * ```
 */
export class ExecApprovalsAPI {
  constructor(private request: RequestFn) {}

  /**
   * Get current execution approval settings.
   */
  async get(params?: ExecApprovalsGetParams): Promise<ExecApprovalsSnapshot> {
    return this.request<ExecApprovalsSnapshot>('execApprovals.get', params);
  }

  /**
   * Set execution approval enabled/disabled.
   */
  async set(params: ExecApprovalsSetParams): Promise<void> {
    await this.request('execApprovals.set', params);
  }
}
