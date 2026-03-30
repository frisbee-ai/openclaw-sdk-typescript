/**
 * OpenClaw Client Configuration Types
 *
 * Shared configuration interfaces used by both OpenClawClient and ClientBuilder.
 * This file exists to avoid circular dependencies between client.ts and client-builder.ts.
 *
 * @module
 */

import type { CredentialsProvider } from './auth/provider.js';
import type { TickMonitorConfig } from './events/tick.js';
import type { GapDetectorConfig } from './events/gap.js';
import type { Logger } from './types/logger.js';
import type { MetricsCollector } from './metrics/collector.js';

/**
 * Connection behavior configuration
 */
export interface ConnectionConfig {
  /** Request timeout in milliseconds */
  requestTimeoutMs?: number;
  /** Connection timeout in milliseconds */
  connectTimeoutMs?: number;
  /** Whether to automatically reconnect on disconnect */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Reconnection delay in milliseconds */
  reconnectDelayMs?: number;
}

/**
 * Configuration for the OpenClaw client.
 */
export interface ClientConfig {
  /** WebSocket URL to connect to */
  url: string;
  /** Client identifier */
  clientId: string;
  /** Client version string */
  clientVersion?: string;
  /** Platform identifier */
  platform?: string;
  /** Device family (optional) */
  deviceFamily?: string;
  /** Model identifier (optional) */
  modelIdentifier?: string;
  /** Client mode (default: "node") */
  mode?: string;
  /** Instance identifier (optional) */
  instanceId?: string;
  /** Connection parameters for authentication */
  auth?: {
    /** Authentication token */
    token?: string;
    /** Bootstrap token */
    bootstrapToken?: string;
    /** Device token */
    deviceToken?: string;
    /** Password */
    password?: string;
  };
  /** Optional device pairing credentials */
  device?: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
  };
  /** Connection behavior configuration (nested form) */
  connection?: ConnectionConfig;
  /** Credentials provider for advanced auth flows */
  credentialsProvider?: CredentialsProvider;
  /** Tick monitor configuration for heartbeat monitoring */
  tickMonitor?: Partial<TickMonitorConfig>;
  /** Gap detector configuration for event sequence tracking */
  gapDetector?: Partial<GapDetectorConfig>;
  /** Client capabilities to advertise (e.g., ['tool_events']) */
  capabilities?: string[];
  /** Logger instance for structured logging */
  logger?: Logger;
  /** Metrics collector for observability telemetry */
  metricsCollector?: MetricsCollector;
}

/**
 * Options for requests.
 */
export interface RequestOptions {
  /** Abort signal for request cancellation */
  signal?: AbortSignal;
  /** Wait for final response (no progress updates) */
  expectFinal?: boolean;
  /** Timeout for expectFinal in milliseconds */
  expectFinalTimeoutMs?: number;
  /** Callback for intermediate progress updates from the server */
  onProgress?: (payload: unknown) => void;
}
