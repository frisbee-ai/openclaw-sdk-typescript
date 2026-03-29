/**
 * ExecApprovals API Parameter Types
 *
 * Parameter and result types for execution approval operations.
 *
 * @module protocol/params/execApprovals
 */

export interface ExecApprovalsGetParams {}

export interface ExecApprovalsSetParams {
  enabled: boolean;
}

export interface ExecApprovalsSnapshot {
  approvals: unknown[];
}

export interface ExecApprovalsNodeGetParams {
  nodeId: string;
}

export interface ExecApprovalsNodeSetParams {
  nodeId: string;
  enabled: boolean;
}

export interface ExecApprovalRequestParams {
  nodeId: string;
  prompt: string;
}

export interface ExecApprovalWaitDecisionParams {
  requestId: string;
  timeoutMs?: number;
}

export interface ExecApprovalResolveParams {
  requestId: string;
  approved: boolean;
}
