/**
 * Agents API Parameter Types
 *
 * Parameter and result types for agent lifecycle and file operations.
 *
 * @module protocol/params/agents
 */

import type { AgentSummary } from '../api-common.js';

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentIdentityParams {
  agentId: string;
}

export interface AgentIdentityResult {
  id: string;
  summary?: AgentSummary;
}

export interface AgentWaitParams {
  agentId: string;
  timeoutMs?: number;
}

export interface AgentsCreateParams {
  name: string;
  workspace: string;
  emoji?: string;
  avatar?: string;
}

export interface AgentsCreateResult {
  ok: true;
  agentId: string;
  name: string;
  workspace: string;
}

export interface AgentsUpdateParams {
  agentId: string;
  name?: string;
  workspace?: string;
  model?: string;
  avatar?: string;
}

export interface AgentsUpdateResult {
  ok: true;
  agentId: string;
}

export interface AgentsDeleteParams {
  agentId: string;
}

export interface AgentsDeleteResult {
  agentId: string;
}

export interface AgentsFilesListParams {
  agentId: string;
}

export interface AgentsFilesListResult {
  files: string[];
}

export interface AgentsFilesGetParams {
  agentId: string;
  path: string;
}

export interface AgentsFilesGetResult {
  content: string;
}

export interface AgentsFilesSetParams {
  agentId: string;
  path: string;
  content: string;
}

export interface AgentsFilesSetResult {}

export interface AgentsListParams {}

export interface AgentsListResult {
  agents: AgentSummary[];
}
