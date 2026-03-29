/**
 * Nodes API Parameter Types
 *
 * Parameter and result types for node operations.
 *
 * @module protocol/params/nodes
 */

export interface NodeListParams {}

export interface NodeInvokeParams {
  nodeId: string;
  target: string;
  params?: unknown;
}

export interface NodeInvokeResultParams {
  result: unknown;
}

export interface NodeEventParams {
  nodeId: string;
  event: string;
  payload?: unknown;
}

export interface NodePendingDrainParams {
  nodeId: string;
  max?: number;
}

export interface NodePendingDrainResult {
  items: unknown[];
}

export interface NodePendingEnqueueParams {
  nodeId: string;
  item: unknown;
}

export interface NodePendingEnqueueResult {}

export interface NodeDescribeParams {
  nodeId: string;
}

export interface NodeDescribeResult {
  nodeId: string;
  status: string;
  metadata?: unknown;
}

export interface NodePendingPullParams {
  nodeId: string;
  max?: number;
}

export interface NodePendingPullResult {
  items: unknown[];
}

export interface NodePendingAckParams {
  nodeId: string;
  itemId: string;
}

export interface NodeRenameParams {
  nodeId: string;
  name: string;
}

export interface NodeCanvasCapabilityRefreshParams {
  nodeId: string;
}

// ============================================================================
// Node Pairing Types (also used by agents.ts)
// ============================================================================

export interface NodePairRequestParams {
  nodeId: string;
  ttlSec?: number;
}

export interface NodePairListParams {
  nodeId: string;
}

export interface NodePairApproveParams {
  nodeId: string;
  pairingId: string;
}

export interface NodePairRejectParams {
  nodeId: string;
  pairingId: string;
}

export interface NodePairVerifyParams {
  nodeId: string;
  pairingId: string;
  code: string;
}
