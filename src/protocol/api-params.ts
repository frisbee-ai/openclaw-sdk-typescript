/**
 * OpenClaw Protocol API Parameter Types
 *
 * All XxxParams and XxxResult interfaces for API calls.
 *
 * @module
 */

import type { AgentSummary, WizardStep } from './api-common.js';

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

// ============================================================================
// Node Pairing Types
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

// ============================================================================
// Device Pairing Types
// ============================================================================

export interface DevicePairListParams {}
export interface DevicePairApproveParams {
  nodeId: string;
  requestId: string;
}
export interface DevicePairRejectParams {
  pairingId: string;
}
export interface ChatAbortParams {
  chatId: string;
}
export interface DeviceTokenRotateParams {
  nodeId: string;
}
export interface DeviceTokenRevokeParams {
  nodeId: string;
  token: string;
}
// ============================================================================
// Config Types
// ============================================================================

export interface ConfigGetParams {
  key?: string;
}
export interface ConfigSetParams {
  key: string;
  value: unknown;
}
export interface ConfigApplyParams {}
export interface ConfigPatchParams {
  patches: Array<{ op: string; path: string; value?: unknown }>;
}
export interface ConfigSchemaParams {
  key?: string;
}
export interface ConfigSchemaResponse {
  schema: unknown;
}
export interface ConfigSchemaLookupParams {
  key: string;
}
export interface ConfigSchemaLookupResult {
  schema: unknown;
}
export interface ToolsEffectiveParams {
  skillId?: string;
  nodeId?: string;
}
export interface ToolsEffectiveResult {
  tools: unknown[];
}

// ============================================================================
// Wizard Types
// ============================================================================

export interface WizardStartParams {
  wizardId: string;
  input?: unknown;
}
export interface WizardNextParams {
  wizardId: string;
  input?: unknown;
}
export interface WizardCancelParams {
  wizardId: string;
}
export interface WizardStatusParams {
  wizardId: string;
}
export interface WizardNextResult {
  step: WizardStep;
  complete: boolean;
}
export interface WizardStartResult extends WizardNextResult {}
export interface WizardStatusResult {
  currentStep: WizardStep;
  complete: boolean;
}

// ============================================================================
// Talk Types
// ============================================================================

export interface TalkConfigParams {}
export interface TalkConfigResult {
  enabled: boolean;
  [key: string]: unknown;
}
export interface TalkModeParams {
  enabled: boolean;
}

// ============================================================================
// Channels Types
// ============================================================================

export interface ChannelsStatusParams {}
export interface ChannelsStatusResult {
  channels: unknown[];
}
export interface ChannelsLogoutParams {
  channelId: string;
}

// ============================================================================
// WebLogin Types
// ============================================================================

export interface WebLoginStartParams {
  returnUrl?: string;
}
export interface WebLoginWaitParams {
  token: string;
  timeoutMs?: number;
}
export interface WebLoginStartResult {
  token: string;
  url: string;
}
export interface WebLoginWaitResult {
  success: boolean;
  userId?: string;
}
export interface WebLoginCancelParams {
  token: string;
}
export interface WebLoginCancelResult {}

// ============================================================================
// Skills Types
// ============================================================================

export interface SkillsStatusParams {
  skillId?: string;
}
export interface ToolsCatalogParams {}
export interface ToolsCatalogResult {
  tools: unknown[];
}
export interface SkillsBinsParams {}
export interface SkillsBinsResult {
  bins: unknown[];
}
export interface SkillsInstallParams {
  skillId: string;
}
export interface SkillsUpdateParams {
  skillId: string;
}

// ============================================================================
// Cron Types
// ============================================================================

export interface CronListParams {}
export interface CronStatusParams {
  jobId: string;
}
export interface CronAddParams {
  cron: string;
  prompt: string;
}
export interface CronUpdateParams {
  jobId: string;
  cron?: string;
  prompt?: string;
}
export interface CronRemoveParams {
  jobId: string;
}
export interface CronRunParams {
  jobId: string;
}
export interface CronRunsParams {}

// ============================================================================
// Logs Types
// ============================================================================

export interface LogsTailParams {
  lines?: number;
}
export interface LogsTailResult {
  logs: string[];
}

// ============================================================================
// ExecApprovals Types
// ============================================================================

export interface ExecApprovalsGetParams {}
export interface ExecApprovalsSetParams {
  enabled: boolean;
}
export interface ExecApprovalsSnapshot {
  approvals: unknown[];
}

// ============================================================================
// Sessions Types
// ============================================================================

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
export interface SessionsPatchResult {}
export interface SessionsResetParams {
  sessionId: string;
}
export interface SessionsDeleteParams {
  sessionId: string;
}
export interface SessionsCompactParams {}
export interface SessionsUsageParams {}

// ============================================================================
// Node Types
// ============================================================================

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

// ============================================================================
// Poll / Update / ChatInject Types
// ============================================================================

export interface PollParams {}
export interface UpdateRunParams {}

/**
 * @deprecated Use SessionsSendParams instead. Will be removed in v2.0.
 */
export type ChatInjectParams = SessionsSendParams;
export interface SessionsSendParams {
  key: string;
  message: string;
  thinking?: string;
  attachments?: unknown[];
  timeoutMs?: number;
  idempotencyKey?: string;
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

// ============================================================================
// Voice Wake Types
// ============================================================================

export interface VoiceWakeStartParams {
  sensitivity?: number;
  keywords?: string[];
}
export interface VoiceWakeStopParams {}
export interface VoiceWakeStatusParams {}

// ============================================================================
// Browser Types
// ============================================================================

export interface BrowserOpenParams {
  url: string;
  nodeId?: string;
}
export interface BrowserOpenResult {
  tabId: string;
}
export interface BrowserCloseParams {
  tabId: string;
}
export interface BrowserCloseResult {}
export interface BrowserListParams {}
export interface BrowserScreenshotParams {
  tabId: string;
}
export interface BrowserScreenshotResult {
  imageUrl: string;
}
export interface BrowserEvalParams {
  tabId: string;
  script: string;
}
export interface BrowserEvalResult {
  result: unknown;
}

// ============================================================================
// Push Notification Types
// ============================================================================

export interface PushRegisterParams {
  token: string;
  platform: string;
}
export interface PushRegisterResult {}
export interface PushUnregisterParams {
  token: string;
}
export interface PushUnregisterResult {}
export interface PushSendParams {
  target: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
export interface PushSendResult {}

// ============================================================================
// Usage / Billing Types
// ============================================================================

export interface UsageSummaryParams {
  period?: string;
}
export interface UsageSummaryResult {
  totalTokens?: number;
  totalCost?: number;
  period?: string;
  [key: string]: unknown;
}
export interface UsageDetailsParams {
  period?: string;
  agentId?: string;
}
export interface UsageDetailsResult {
  entries: unknown[];
}

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

// ============================================================================
// Secrets Management Types
// ============================================================================

export interface SecretsListParams {}
export interface SecretsGetParams {
  key: string;
}
export interface SecretsGetResult {
  value: string;
}
export interface SecretsSetParams {
  key: string;
  value: string;
}
export interface SecretsSetResult {}
export interface SecretsDeleteParams {
  key: string;
}
export interface SecretsDeleteResult {}

// ============================================================================
// Chat Extended Types
// ============================================================================

export interface ChatListParams {}
export interface ChatHistoryParams {
  chatId: string;
  limit?: number;
  before?: string;
}
export interface ChatHistoryResult {
  messages: unknown[];
}
export interface ChatDeleteParams {
  chatId: string;
}
export interface ChatDeleteResult {}
export interface ChatTitleParams {
  chatId: string;
}
export interface ChatTitleResult {
  title: string;
}

// ============================================================================
// Talk Extended Types
// ============================================================================

export interface TalkStartParams {
  language?: string;
}
export interface TalkStartResult {
  sessionId: string;
}
export interface TalkStopParams {
  sessionId: string;
}
export interface TalkStopResult {}

// ============================================================================
// Update Types
// ============================================================================

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
// Diagnostics Types
// ============================================================================

export interface DiagnosticsSnapshotParams {}
export interface DiagnosticsSnapshotResult {
  snapshot: unknown;
}
