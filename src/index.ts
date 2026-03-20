/**
 * OpenClaw SDK
 *
 * TypeScript SDK for connecting to OpenClaw Gateway via WebSocket.
 * Provides a high-level client interface with connection management,
 * request/response handling, and event emission.
 */

// Main client exports
export { OpenClawClient, createClient } from './client.js';
export type { ClientConfig, ConnectionConfig, RequestOptions } from './client.js';

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

  // Connection types
  ConnectionState,
  ConnectParams,
  HelloOk,

  // Error types
  ErrorShape,

  // Snapshot types
  Snapshot,

  // State types
  StateVersion,

  // Agent types
  AgentSummary,
  AgentsFileEntry,
} from './protocol/types.js';

// API parameter types (selectively exported)
export type {
  AgentIdentityParams,
  AgentIdentityResult,
  AgentWaitParams,
  NodePairRequestParams,
  NodePairListParams,
  NodePairApproveParams,
  NodePairRejectParams,
  NodePairVerifyParams,
  DevicePairListParams,
  DevicePairApproveParams,
  DevicePairRejectParams,
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
  CronListParams,
  CronStatusParams,
  CronAddParams,
  CronUpdateParams,
  CronRemoveParams,
  CronRunParams,
  CronRunsParams,
  NodeListParams,
  NodeInvokeParams,
  NodeInvokeResultParams,
  NodeEventParams,
  NodePendingDrainParams,
  NodePendingDrainResult,
  NodePendingEnqueueParams,
  NodePendingEnqueueResult,
  // TTS
  TtsSpeakParams,
  TtsSpeakResult,
  TtsVoicesParams,
  TtsVoicesResult,
  // Browser
  BrowserOpenParams,
  BrowserOpenResult,
  BrowserListParams,
  BrowserListResult,
  BrowserScreenshotParams,
  BrowserScreenshotResult,
  BrowserEvalParams,
  BrowserEvalResult,
  // Chat extended
  ChatListParams,
  ChatListResult,
  ChatHistoryParams,
  ChatHistoryResult,
  ChatDeleteParams,
  ChatDeleteResult,
  ChatTitleParams,
  ChatTitleResult,
  // Secrets
  SecretsListParams,
  SecretsListResult,
  SecretsGetParams,
  SecretsGetResult,
  SecretsSetParams,
  SecretsSetResult,
  // Usage
  UsageSummaryParams,
  UsageSummaryResult,
  // Doctor
  DoctorCheckParams,
  DoctorCheckResult,
  // Config extended
  ConfigGetParams,
  ConfigSetParams,
  ConfigApplyParams,
  ConfigPatchParams,
  ConfigSchemaParams,
  ConfigSchemaResponse,
  // Wizard
  WizardStartParams,
  WizardNextParams,
  WizardCancelParams,
  WizardStatusParams,
  WizardStep,
  WizardNextResult,
  WizardStartResult,
  WizardStatusResult,
  // Skills
  SkillsStatusParams,
  ToolsCatalogParams,
  ToolsCatalogResult,
  SkillsBinsParams,
  SkillsBinsResult,
  SkillsInstallParams,
  SkillsUpdateParams,
  // Exec Approvals
  ExecApprovalsGetParams,
  ExecApprovalsSetParams,
  ExecApprovalsSnapshot,
  // Sessions
  SessionsListParams,
  SessionsPreviewParams,
  SessionsResolveParams,
  SessionsPatchParams,
  SessionsPatchResult,
  SessionsResetParams,
  SessionsDeleteParams,
  SessionsCompactParams,
  SessionsUsageParams,
  // Logs
  LogsTailParams,
  LogsTailResult,
  // Talk
  TalkConfigParams,
  TalkConfigResult,
  TalkModeParams,
  // Channels
  ChannelsStatusParams,
  ChannelsStatusResult,
  ChannelsLogoutParams,
  // Web Login
  WebLoginStartParams,
  WebLoginWaitParams,
  WebLoginStartResult,
  WebLoginWaitResult,
  // Push
  PushRegisterParams,
  PushRegisterResult,
  PushSendParams,
  PushSendResult,
  // Update
  UpdateCheckParams,
  UpdateCheckResult,
  UpdateApplyParams,
  UpdateApplyResult,
  // Diagnostics
  DiagnosticsSnapshotParams,
  DiagnosticsSnapshotResult,
} from './protocol/types.js';

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
 * reconnectMgr.on("stateChange", (state) => {
 *   if (state.phase === "waiting") {
 *     console.log(`Reconnecting in ${state.delayMs}ms...`);
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
  ClientConnectionState,
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
