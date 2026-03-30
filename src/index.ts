/**
 * OpenClaw SDK
 *
 * TypeScript SDK for connecting to OpenClaw Gateway via WebSocket.
 * Provides a high-level client interface with connection management,
 * request/response handling, and event emission.
 */

// Main client exports
export { OpenClawClient } from './client.js';
export { ClientBuilder } from './client-builder.js';
export type { ClientConfig, ConnectionConfig, RequestOptions } from './client-config.js';

// ============================================================================
// Error Types
// ============================================================================

// Error classes
export {
  OpenClawError,
  AuthError,
  ConnectionError,
  ProtocolError,
  RequestError,
  TimeoutError,
  CancelledError,
  AbortError,
  GatewayError,
  ReconnectError,
} from './errors.js';

// Error code types
export type {
  AuthErrorCode,
  ConnectionErrorCode,
  ProtocolErrorCode,
  RequestErrorCode,
  GatewayErrorCode,
  ReconnectErrorCode,
} from './errors.js';

// Error type guards
export {
  isOpenClawError,
  isAuthError,
  isConnectionError,
  isTimeoutError,
  isCancelledError,
  isAbortError,
} from './errors.js';

// Error factory
export { createErrorFromResponse } from './errors.js';

// ============================================================================
// Protocol Types
// ============================================================================
export type {
  // Frame types
  GatewayFrame,
  RequestFrame,
  ResponseFrame,
  EventFrame,
  StateVersion,
} from './protocol/frames.js';

export type {
  // Connection types
  ConnectionState,
} from './protocol/connection-state.js';

export type {
  // Connection types
  ConnectParams,
  HelloOk,
  Snapshot,
} from './protocol/connection.js';

export type {
  // Error types
  ErrorShape,
} from './protocol/errors.js';

export type {
  // Agent types
  AgentSummary,
} from './protocol/api-common.js';

// API parameter types (selectively exported)
export type {
  // Chat
  ChatListParams,
  ChatHistoryParams,
  ChatHistoryResult,
  ChatDeleteParams,
  ChatDeleteResult,
  ChatTitleParams,
  ChatTitleResult,
  ChatAbortParams,
  ChatSendParams,
} from './protocol/params/chat.js';

export type {
  // Agents
  AgentIdentityParams,
  AgentIdentityResult,
  AgentWaitParams,
  AgentsCreateParams,
  AgentsCreateResult,
  AgentsUpdateParams,
  AgentsUpdateResult,
  AgentsDeleteParams,
  AgentsDeleteResult,
  AgentsFilesListParams,
  AgentsFilesListResult,
  AgentsFilesGetParams,
  AgentsFilesGetResult,
  AgentsFilesSetParams,
  AgentsFilesSetResult,
  AgentsListParams,
  AgentsListResult,
} from './protocol/params/agents.js';

// Node Pairing types from nodes.js
export type {
  NodePairRequestParams,
  NodePairListParams,
  NodePairApproveParams,
  NodePairRejectParams,
  NodePairVerifyParams,
} from './protocol/params/nodes.js';

export type {
  // Sessions
  SessionsListParams,
  SessionsPreviewParams,
  SessionsCreateParams,
  SessionsSendParams,
  SessionsPatchParams,
  SessionsPatchResult,
  SessionsResetParams,
  SessionsDeleteParams,
  SessionsCompactParams,
  SessionsUsageParams,
} from './protocol/params/sessions.js';

export type {
  // Config
  ConfigGetParams,
  ConfigSetParams,
  ConfigApplyParams,
  ConfigPatchParams,
  ConfigSchemaParams,
  ConfigSchemaResponse,
  ConfigSchemaLookupParams,
  ConfigSchemaLookupResult,
  ToolsEffectiveParams,
  ToolsEffectiveResult,
  // Wizard
  WizardStartParams,
  WizardNextParams,
  WizardCancelParams,
  WizardStatusParams,
  WizardNextResult,
  WizardStartResult,
  WizardStatusResult,
} from './protocol/params/config.js';

export type {
  // Cron
  CronListParams,
  CronStatusParams,
  CronAddParams,
  CronUpdateParams,
  CronRemoveParams,
  CronRunParams,
  CronRunsParams,
} from './protocol/params/cron.js';

export type {
  // Nodes
  NodeListParams,
  NodeInvokeParams,
  NodeInvokeResultParams,
  NodeEventParams,
  NodePendingDrainParams,
  NodePendingDrainResult,
  NodePendingEnqueueParams,
  NodePendingEnqueueResult,
  NodeDescribeParams,
  NodeDescribeResult,
  NodePendingPullParams,
  NodePendingPullResult,
  NodePendingAckParams,
  NodeRenameParams,
  NodeCanvasCapabilityRefreshParams,
} from './protocol/params/nodes.js';

export type {
  // Skills
  SkillsStatusParams,
  ToolsCatalogParams,
  ToolsCatalogResult,
  SkillsBinsParams,
  SkillsBinsResult,
  SkillsInstallParams,
  SkillsUpdateParams,
  VoiceWakeGetParams,
  VoiceWakeSetParams,
} from './protocol/params/skills.js';

export type {
  // Device Pairing
  DevicePairListParams,
  DevicePairApproveParams,
  DevicePairRejectParams,
  DeviceTokenRotateParams,
  DeviceTokenRevokeParams,
} from './protocol/params/devicePairing.js';

export type {
  // Browser
  BrowserOpenParams,
  BrowserOpenResult,
  BrowserListParams,
  BrowserScreenshotParams,
  BrowserScreenshotResult,
  BrowserEvalParams,
  BrowserEvalResult,
  BrowserRequestParams,
  BrowserRequestResult,
} from './protocol/params/browser.js';

export type {
  // Push
  PushRegisterParams,
  PushRegisterResult,
  PushUnregisterParams,
  PushUnregisterResult,
  PushSendParams,
  PushSendResult,
} from './protocol/params/push.js';

export type {
  // Exec Approvals
  ExecApprovalsGetParams,
  ExecApprovalsSetParams,
  ExecApprovalsSnapshot,
  ExecApprovalsNodeGetParams,
  ExecApprovalsNodeSetParams,
  ExecApprovalRequestParams,
  ExecApprovalWaitDecisionParams,
  ExecApprovalResolveParams,
} from './protocol/params/execApprovals.js';

export type {
  // System
  DoctorCheckParams,
  DoctorFixParams,
  DoctorFixResult,
  DoctorMemoryStatusParams,
  DoctorMemoryStatusResult,
  GatewayIdentityGetParams,
  GatewayIdentityGetResult,
  SystemPresenceParams,
  SystemPresenceResult,
  SystemEventParams,
  SystemEventResult,
  LastHeartbeatParams,
  LastHeartbeatResult,
  SetHeartbeatsParams,
  WakeParams,
  UpdateRunParams,
  UpdateCheckParams,
  UpdateCheckResult,
  UpdateApplyParams,
  UpdateApplyResult,
  AgentParams,
  AgentResult,
  SendParams,
  SendResult,
  DiagnosticsSnapshotParams,
  DiagnosticsSnapshotResult,
  ModelsListParams,
  ModelsListResult,
  TtsSpeakParams,
  TtsSpeakResult,
  TtsVoicesParams,
  TtsStatusParams,
  TtsStatusResult,
  TtsProvidersParams,
  TtsProvidersResult,
  TtsEnableParams,
  TtsDisableParams,
  TtsConvertParams,
  TtsSetProviderParams,
  LogsTailParams,
  LogsTailResult,
} from './protocol/params/system.js';

export type {
  // Channels
  ChannelsStatusParams,
  ChannelsStatusResult,
  ChannelsLogoutParams,
  TalkConfigParams,
  TalkConfigResult,
  TalkModeParams,
  TalkStartParams,
  TalkStartResult,
  TalkStopParams,
  TalkStopResult,
  TalkSpeakParams,
  WebLoginStartParams,
  WebLoginWaitParams,
  WebLoginStartResult,
  WebLoginWaitResult,
  WebLoginCancelParams,
  WebLoginCancelResult,
} from './protocol/params/channels.js';

export type {
  // Secrets
  SecretsListParams,
  SecretsGetParams,
  SecretsGetResult,
  SecretsSetParams,
  SecretsSetResult,
  SecretsDeleteParams,
  SecretsDeleteResult,
  SecretsReloadParams,
  SecretsResolveParams,
} from './protocol/params/secrets.js';

export type {
  // Usage
  UsageSummaryParams,
  UsageSummaryResult,
  UsageDetailsParams,
  UsageDetailsResult,
  UsageStatusParams,
  UsageStatusResult,
  UsageCostParams,
  UsageCostResult,
} from './protocol/params/usage.js';

export type {
  WizardStep,
  ChatListResult,
  TtsVoicesResult,
  VoiceWakeStatusResult,
  BrowserListResult,
  DoctorCheckResult,
  SecretsListResult,
  CronJob,
  CronRunLogEntry,
} from './protocol/api-common.js';

// Validation functions
export {
  ValidationError,
  validateRequestId,
  validateFrame,
  validateRequestFrame,
  validateResponseFrame,
  validateEventFrame,
  validateErrorShape,
  validateConnectParams,

  // Type guards
  isRequestFrame,
  isResponseFrame,
  isEventFrame,
  isSuccessfulResponse,
  isErrorResponse,
} from './protocol/validation.js';
export type { RequestIdValidationOptions } from './protocol/validation.js';

// Authentication
export {
  CredentialsProvider,
  StaticCredentialsProvider,
  AuthHandler,
  createAuthHandler,
} from './auth/provider.js';
export type {
  DeviceCredentials,
  RefreshResult,
  AuthMethod,
  StaticCredentialsConfig,
  AuthConfig,
} from './auth/provider.js';

// Event Manager
export { EventManager, createEventManager, MAX_EVENT_NAME_LENGTH } from './managers/event.js';
export type {
  EventHandler,
  UnsubscribeFn,
  EventPattern,
  ListenerErrorHandler,
} from './managers/event.js';

// ============================================================================
// Reconnection Manager (Advanced/Stand-alone)
// ============================================================================

/**
 * Reconnection Manager - Advanced Stand-alone Reconnection Control
 *
 * **Use this when you need custom reconnection behavior** outside of
 * ConnectionManager's built-in reconnection.
 *
 * ### Decision Guide: Which Reconnection Approach?
 *
 * **Use ConnectionManager's built-in reconnection if you need:**
 * - Simple automatic reconnection on disconnect
 * - Configurable max attempts and delay
 * - Standard Fibonacci backoff
 * - Integration with connection lifecycle
 *
 * **Use ReconnectManager stand-alone if you need:**
 * - Custom reconnection logic separate from ConnectionManager
 * - Reconnection state tracking for external management
 * - Event-driven reconnection workflows
 * - Advanced retry strategies beyond standard backoff
 *
 * @example
 * ```ts
 * // Stand-alone usage for custom reconnection flow
 * const reconnectMgr = createReconnectManager({
 *   maxAttempts: 10,
 *   initialDelayMs: 1000,
 *   maxDelayMs: 30000,
 * });
 *
 * reconnectMgr.onEvent((event) => {
 *   if (event.state === "waiting") {
 *     console.log(`Reconnecting in ${event.delayMs}ms...`);
 *   }
 * });
 * ```
 */
export { ReconnectManager, createReconnectManager } from './managers/reconnect.js';
export type {
  ReconnectConfig,
  ReconnectState,
  ReconnectEvent,
  ReconnectListener,
  ReconnectListenerErrorHandler,
} from './managers/reconnect.js';

// Connection
export { ProtocolNegotiator, createProtocolNegotiator } from './connection/protocol.js';
export type { ProtocolVersionRange, NegotiatedProtocol } from './connection/protocol.js';
export { ConnectionStateMachine, createConnectionStateMachine } from './connection/state.js';
export type {
  StateChangeEvent,
  StateChangeListener,
  StateChangeListenerErrorHandler,
} from './connection/state.js';
export { PolicyManager, createPolicyManager, DEFAULT_POLICY } from './connection/policies.js';
export type { Policy } from './connection/policies.js';
export { TlsValidator, createTlsValidator } from './connection/tls.js';
export type {
  TlsValidatorConfig,
  TlsValidationResult,
  TLSSocket,
  TLSCertificate,
} from './connection/tls.js';

// Events
export { TickMonitor, createTickMonitor } from './events/tick.js';
export type { TickMonitorConfig, TickStatus } from './events/tick.js';
export { GapDetector, createGapDetector } from './events/gap.js';
export type {
  GapInfo,
  GapRecoveryMode,
  GapRecoveryConfig,
  GapDetectorConfig,
} from './events/gap.js';

// ============================================================================
// Timeout Manager
// ============================================================================

export { TimeoutManager, createTimeoutManager } from './utils/timeoutManager.js';
export type { TimeoutHandle, TimeoutManagerConfig } from './utils/timeoutManager.js';

// ============================================================================
// Logger Types (Reserved for Future Use)
// ============================================================================

/**
 * Logger types reserved for future use.
 *
 * @beta
 *
 * The SDK currently uses `console.log()` directly. A full logging
 * implementation violates YAGNI at this stage. These types are
 * reserved for when logging needs grow.
 */
export type { Logger, LogLevel } from './types/logger.js';
export { isLogger, ConsoleLogger } from './types/logger.js';

// Re-export default
export { default } from './client.js';

// ============================================================================
// API Namespaces
// ============================================================================

export { ChatAPI } from './api/chat.js';
export { AgentsAPI } from './api/agents.js';
export { SessionsAPI } from './api/sessions.js';
export { ConfigAPI } from './api/config.js';
export { CronAPI } from './api/cron.js';
export { NodesAPI } from './api/nodes.js';
export { SkillsAPI } from './api/skills.js';
export { DevicePairingAPI } from './api/devicePairing.js';
export { BrowserAPI } from './api/browser.js';
export { PushAPI } from './api/push.js';
export { ExecApprovalsAPI } from './api/execApprovals.js';
export { SystemAPI } from './api/system.js';
export { ChannelsAPI } from './api/channels.js';
export { SecretsAPI } from './api/secrets.js';
export { UsageAPI } from './api/usage.js';
