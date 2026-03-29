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
  ExecApprovalsNodeGetParams,
  ExecApprovalsNodeSetParams,
  ExecApprovalRequestParams,
  ExecApprovalWaitDecisionParams,
  ExecApprovalResolveParams,
} from '../protocol/params/execApprovals.js';

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
    return this.request<ExecApprovalsSnapshot>('exec.approvals.get', params);
  }

  /**
   * Set execution approval enabled/disabled.
   */
  async set(params: ExecApprovalsSetParams): Promise<void> {
    await this.request('exec.approvals.set', params);
  }

  /**
   * Node-level execution approval operations.
   */
  get node() {
    const request = this.request;
    return {
      /**
       * Get node-level execution approval settings.
       */
      async get(params: ExecApprovalsNodeGetParams): Promise<ExecApprovalsSnapshot> {
        return request<ExecApprovalsSnapshot>('exec.approvals.node.get', params);
      },

      /**
       * Set node-level execution approval enabled/disabled.
       */
      async set(params: ExecApprovalsNodeSetParams): Promise<void> {
        await request('exec.approvals.node.set', params);
      },
    };
  }

  /**
   * Execution approval request operations.
   */
  get approval() {
    const request = this.request;
    return {
      /**
       * Request execution approval.
       */
      async request(params: ExecApprovalRequestParams): Promise<{ requestId: string }> {
        return request<{ requestId: string }>('exec.approval.request', params);
      },

      /**
       * Wait for an approval decision.
       */
      async waitDecision(params: ExecApprovalWaitDecisionParams): Promise<{ approved: boolean }> {
        return request<{ approved: boolean }>('exec.approval.waitDecision', params);
      },

      /**
       * Resolve an approval request.
       */
      async resolve(params: ExecApprovalResolveParams): Promise<void> {
        await request('exec.approval.resolve', params);
      },
    };
  }
}
