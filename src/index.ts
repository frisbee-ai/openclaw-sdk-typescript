/**
 * OpenClaw SDK
 *
 * TypeScript SDK for connecting to OpenClaw Gateway via WebSocket.
 * Provides a high-level client interface with connection management,
 * request/response handling, and event emission.
 */

// Main client exports
export { OpenClawClient, createClient } from "./client.js";
export type { ClientConfig } from "./client.js";

// Protocol types
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
} from "./protocol/types.js";

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
} from "./protocol/types.js";

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
} from "./protocol/validation.js";

// Authentication
export {
  CredentialsProvider,
  StaticCredentialsProvider,
  AuthHandler,
  createAuthHandler,
} from "./auth/provider.js";
export type {
  DeviceCredentials,
  RefreshResult,
  AuthMethod,
  StaticCredentialsConfig,
  AuthConfig,
} from "./auth/provider.js";

// Event Manager
export { EventManager, createEventManager, MAX_EVENT_NAME_LENGTH } from "./managers/event.js";
export type { EventHandler, UnsubscribeFn, EventPattern } from "./managers/event.js";

// Reconnection Manager
export { ReconnectManager, createReconnectManager } from "./managers/reconnect.js";
export type { ReconnectConfig, ReconnectState, ReconnectEvent } from "./managers/reconnect.js";

// Re-export default
export { default } from "./client.js";
