/**
 * Sessions API Parameter Types
 *
 * Parameter and result types for session operations.
 *
 * @module protocol/params/sessions
 */

export interface SessionsListParams {}

export interface SessionsPreviewParams {
  sessionId: string;
}

export interface SessionsCreateParams {
  key?: string;
  agentId?: string;
  label?: string;
  model?: string;
  parentSessionKey?: string;
  task?: string;
  message?: string;
}

export interface SessionsPatchParams {
  sessionId: string;
  patch: unknown;
}

/** No fields returned. */
export interface SessionsPatchResult {}

export interface SessionsResetParams {
  sessionId: string;
}

export interface SessionsDeleteParams {
  sessionId: string;
}

export interface SessionsCompactParams {}

export interface SessionsUsageParams {}

export interface SessionsSendParams {
  key: string;
  message: string;
  thinking?: string;
  attachments?: unknown[];
  timeoutMs?: number;
  idempotencyKey?: string;
}
