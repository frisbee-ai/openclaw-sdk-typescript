/**
 * System API Parameter Types
 *
 * Parameter and result types for system, health, TTS, update, and diagnostics operations.
 *
 * @module protocol/params/system
 */

import type { TtsVoicesResult } from '../api-common.js';

// ============================================================================
// Doctor / Diagnostics Types
// ============================================================================

export interface DoctorCheckParams {}

export interface DoctorFixParams {
  checkName?: string;
}

export interface DoctorFixResult {
  fixed: string[];
  failed: string[];
}

export interface DoctorMemoryStatusParams {}

export interface DoctorMemoryStatusResult {
  used: number;
  total: number;
  [key: string]: unknown;
}

// ============================================================================
// Gateway Identity Types
// ============================================================================

export interface GatewayIdentityGetParams {}

export interface GatewayIdentityGetResult {
  id: string;
  version: string;
  [key: string]: unknown;
}

// ============================================================================
// System Presence / Event Types
// ============================================================================

export interface SystemPresenceParams {}

export interface SystemPresenceResult {
  presence: string;
  [key: string]: unknown;
}

export interface SystemEventParams {
  event: string;
  payload?: unknown;
}

export interface SystemEventResult {}

// ============================================================================
// Heartbeat Types
// ============================================================================

export interface LastHeartbeatParams {}

export interface LastHeartbeatResult {
  timestamp: number;
  [key: string]: unknown;
}

export interface SetHeartbeatsParams {
  intervalMs: number;
}

// ============================================================================
// Wake Types
// ============================================================================

export interface WakeParams {}

// ============================================================================
// Update Types
// ============================================================================

export interface UpdateRunParams {}

export interface UpdateCheckParams {}

export interface UpdateCheckResult {
  available: boolean;
  version?: string;
  changelog?: string;
}

export interface UpdateApplyParams {
  version?: string;
}

export interface UpdateApplyResult {
  success: boolean;
  version?: string;
}

// ============================================================================
// Agent / Send Low-Level Types
// ============================================================================

export interface AgentParams {
  action: string;
  params?: unknown;
}

export interface AgentResult {
  result: unknown;
}

export interface SendParams {
  channel: string;
  message: unknown;
}

export interface SendResult {
  sent: boolean;
}

// ============================================================================
// Diagnostics Types
// ============================================================================

export interface DiagnosticsSnapshotParams {}

export interface DiagnosticsSnapshotResult {
  snapshot: unknown;
}

// ============================================================================
// Models Types
// ============================================================================

export interface ModelsListParams {}

export interface ModelsListResult {
  models: { id: string; name: string; [key: string]: unknown }[];
}

// ============================================================================
// TTS Types
// ============================================================================

export interface TtsSpeakParams {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
}

export interface TtsSpeakResult {
  audioUrl?: string;
  durationMs?: number;
}

export interface TtsVoicesParams {}

export interface TtsStatusParams {}

export interface TtsStatusResult {
  enabled: boolean;
  [key: string]: unknown;
}

export interface TtsProvidersParams {}

export interface TtsProvidersResult {
  providers: string[];
  current: string;
}

export interface TtsEnableParams {}

export interface TtsDisableParams {}

export interface TtsConvertParams {
  text: string;
  voice?: string;
  format?: string;
}

export interface TtsSetProviderParams {
  provider: string;
}

// ============================================================================
// Logs Types
// ============================================================================

export interface LogsTailParams {
  lines?: number;
}

export interface LogsTailResult {
  logs: string[];
}

// Re-export TtsVoicesResult for convenience (used by SystemAPI)
export type { TtsVoicesResult };
