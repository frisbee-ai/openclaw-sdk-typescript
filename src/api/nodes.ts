/**
 * Nodes API Namespace
 *
 * Provides typed methods for node operations on the OpenClaw Gateway.
 *
 * @module api/nodes
 */

import type {
  NodeListParams,
  NodeInvokeParams,
  NodeInvokeResultParams,
  NodeEventParams,
  NodePendingDrainParams,
  NodePendingDrainResult,
  NodePendingEnqueueParams,
  NodePendingEnqueueResult,
  NodePairRequestParams,
  NodePairListParams,
  NodePairApproveParams,
  NodePairRejectParams,
  NodePairVerifyParams,
} from '../protocol/types.js';

import type { RequestFn } from './shared.js';

/**
 * Nodes API namespace.
 *
 * @example
 * ```ts
 * const nodes = await client.nodes.list();
 * const result = await client.nodes.invoke({ nodeId: "node-1", target: "run", params: {} });
 * ```
 */
export class NodesAPI {
  constructor(private request: RequestFn) {}

  /**
   * List all connected nodes.
   */
  async list(params?: NodeListParams): Promise<unknown> {
    return this.request('node.list', params);
  }

  /**
   * Invoke a method on a node.
   */
  async invoke(params: NodeInvokeParams): Promise<NodeInvokeResultParams> {
    return this.request<NodeInvokeResultParams>('node.invoke', params);
  }

  /**
   * Send an event to a node.
   */
  async event(params: NodeEventParams): Promise<void> {
    await this.request('node.event', params);
  }

  /**
   * Drain pending items from a node.
   */
  async pendingDrain(params: NodePendingDrainParams): Promise<NodePendingDrainResult> {
    return this.request<NodePendingDrainResult>('node.pending.drain', params);
  }

  /**
   * Enqueue an item to a node's pending queue.
   */
  async pendingEnqueue(params: NodePendingEnqueueParams): Promise<NodePendingEnqueueResult> {
    return this.request<NodePendingEnqueueResult>('node.pending.enqueue', params);
  }

  /**
   * Node pairing operations.
   */
  get pairing() {
    const request = this.request;
    return {
      /**
       * Request pairing with a node.
       */
      async request(params: NodePairRequestParams): Promise<unknown> {
        return request('node.pair.request', params);
      },

      /**
       * List pending pairing requests for a node.
       */
      async list(params: NodePairListParams): Promise<unknown> {
        return request('node.pair.list', params);
      },

      /**
       * Approve a pairing request.
       */
      async approve(params: NodePairApproveParams): Promise<void> {
        await request('node.pair.approve', params);
      },

      /**
       * Reject a pairing request.
       */
      async reject(params: NodePairRejectParams): Promise<void> {
        await request('node.pair.reject', params);
      },

      /**
       * Verify a pairing with a code.
       */
      async verify(params: NodePairVerifyParams): Promise<void> {
        await request('node.pair.verify', params);
      },
    };
  }
}
