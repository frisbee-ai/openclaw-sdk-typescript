/**
 * OpenClaw Protocol Error Types
 *
 * @module
 */

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCodes = {
  NOT_LINKED: 'NOT_LINKED',
  NOT_PAIRED: 'NOT_PAIRED',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ErrorShape {
  code: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
  retryAfterMs?: number;
}
