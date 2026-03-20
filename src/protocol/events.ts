/**
 * OpenClaw Protocol Event Payload Types
 *
 * @module
 */

// ============================================================================
// Event Payload Types
// ============================================================================

export interface AgentEvent {
  agentId: string;
  [key: string]: unknown;
}

export interface ChatEvent {
  chatId: string;
  [key: string]: unknown;
}

export interface TickEvent {
  ts: number;
}

export interface ShutdownEvent {
  reason: string;
  restartExpectedMs?: number;
}
