/**
 * OpenClaw Protocol Common API Types
 *
 * Shared types used across multiple API domains.
 *
 * @module
 */

// ============================================================================
// Common API Types
// ============================================================================

/** Agent summary information returned from identity verification */
export interface AgentSummary {
  [key: string]: unknown;
}

export interface WizardStep {
  id: string;
  prompt?: string;
  [key: string]: unknown;
}

export interface CronJob {
  id: string;
  cron: string;
  prompt: string;
  [key: string]: unknown;
}

export interface CronRunLogEntry {
  timestamp: number;
  [key: string]: unknown;
}

export interface TtsVoicesResult {
  voices: Array<{ id: string; name: string; language?: string; [key: string]: unknown }>;
}

export interface VoiceWakeStatusResult {
  active: boolean;
  sensitivity?: number;
}

export interface BrowserListResult {
  tabs: Array<{ tabId: string; url: string; title?: string; [key: string]: unknown }>;
}

export interface DoctorCheckResult {
  checks: Array<{ name: string; status: string; message?: string; [key: string]: unknown }>;
}

export interface SecretsListResult {
  keys: string[];
}

export interface ChatListResult {
  chats: Array<{ chatId: string; [key: string]: unknown }>;
}
