/**
 * Client Builder
 *
 * Fluent builder for creating OpenClawClient instances with a chainable API.
 * Provides a declarative way to configure client options before building.
 *
 * @module
 */

import type { CredentialsProvider } from './auth/provider.js';
import type { TickMonitorConfig } from './events/tick.js';
import type { GapDetectorConfig } from './events/gap.js';
import { type Logger, LogLevel } from './types/logger.js';
import type { ConnectionConfig, ClientConfig } from './client.js';
import { OpenClawClient } from './client.js';

// ============================================================================
// Default Configuration Constants
// ============================================================================

const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_CONNECT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const DEFAULT_RECONNECT_DELAY_MS = 1000;

/** Default no-op logger used when no logger is configured */
const NOOP_LOGGER: Logger = {
  name: 'openclaw-sdk',
  level: LogLevel.Error,
  debug() {},
  info() {},
  warn() {},
  error() {},
};

// ============================================================================
// ClientBuilder
// ============================================================================

/**
 * Fluent builder for creating OpenClawClient instances.
 *
 * @example
 * ```ts
 * const client = new ClientBuilder('wss://gateway.example.com', 'my-app', '1.0.0')
 *   .withAuth('my-token')
 *   .withReconnect({ maxAttempts: 5 })
 *   .withTickMonitor({ tickIntervalMs: 5000 })
 *   .withLogger(myLogger)
 *   .build();
 * ```
 */
export class ClientBuilder {
  private readonly url: string;
  private readonly clientId: string;
  private readonly clientVersion: string;

  private authConfig?: {
    token?: string;
    credentialsProvider?: CredentialsProvider;
  };

  private reconnectConfig: Partial<ConnectionConfig> & { enabled?: boolean } = {
    autoReconnect: true,
  };

  private tickConfig?: Partial<TickMonitorConfig>;
  private gapConfig?: Partial<GapDetectorConfig>;
  private logger: Logger = NOOP_LOGGER;

  /**
   * Create a new ClientBuilder.
   *
   * @param url - WebSocket URL to connect to
   * @param clientId - Client identifier
   * @param clientVersion - Optional client version string
   */
  constructor(url: string, clientId: string, clientVersion?: string) {
    this.url = url;
    this.clientId = clientId;
    this.clientVersion = clientVersion ?? '1.0.0';
  }

  /**
   * Set authentication credentials.
   *
   * @param token - Authentication token string, or a CredentialsProvider for advanced flows
   * @returns This builder for chaining
   */
  withAuth(token: string | CredentialsProvider): this {
    if (typeof token === 'string') {
      this.authConfig = { token };
    } else {
      this.authConfig = { credentialsProvider: token };
    }
    return this;
  }

  /**
   * Configure reconnection behavior.
   *
   * @param config - ReconnectConfig object, or boolean to enable/disable with defaults
   * @returns This builder for chaining
   *
   * @example
   * ```ts
   * // Enable with custom config
   * builder.withReconnect({ maxAttempts: 5, reconnectDelayMs: 2000 });
   *
   * // Enable with defaults
   * builder.withReconnect(true);
   *
   * // Disable
   * builder.withReconnect(false);
   * ```
   */
  withReconnect(config: Partial<ConnectionConfig> | boolean): this {
    if (typeof config === 'boolean') {
      this.reconnectConfig = { autoReconnect: config };
    } else {
      this.reconnectConfig = { enabled: true, ...config };
    }
    return this;
  }

  /**
   * Configure gap detection for event sequence tracking.
   *
   * @param config - Gap detector configuration
   * @returns This builder for chaining
   *
   * @example
   * ```ts
   * builder.withGapDetection({
   *   recovery: { mode: 'reconnect' },
   *   maxGaps: 50
   * });
   * ```
   */
  withGapDetection(config: Partial<GapDetectorConfig>): this {
    this.gapConfig = config;
    return this;
  }

  /**
   * Configure tick/heartbeat monitoring.
   *
   * @param config - Tick monitor configuration
   * @returns This builder for chaining
   *
   * @example
   * ```ts
   * builder.withTickMonitor({
   *   tickIntervalMs: 5000,
   *   staleMultiplier: 2
   * });
   * ```
   */
  withTickMonitor(config: Partial<TickMonitorConfig>): this {
    this.tickConfig = config;
    return this;
  }

  /**
   * Set a logger instance.
   *
   * @param logger - Logger instance implementing the Logger interface
   * @returns This builder for chaining
   */
  withLogger(logger: Logger): this {
    this.logger = logger;
    return this;
  }

  /**
   * Build the OpenClawClient instance.
   *
   * @returns A configured OpenClawClient instance
   * @throws Error if required configuration is missing or invalid
   */
  build(): OpenClawClient {
    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(this.url);
    } catch {
      throw new Error(`Invalid WebSocket URL: ${this.url}`);
    }
    if (!['ws:', 'wss:'].includes(parsed.protocol)) {
      throw new Error(`Invalid URL scheme: ${parsed.protocol}. Expected ws: or wss:`);
    }

    // Normalize connection config
    const normalizedConfig = this.normalizeConnectionConfig();
    const credentialsProvider = this.authConfig?.credentialsProvider;
    const authToken = this.authConfig?.token;

    // Build ClientConfig for OpenClawClient
    const clientConfig: ClientConfig = {
      url: this.url,
      clientId: this.clientId,
      clientVersion: this.clientVersion,
      connection: {
        requestTimeoutMs: normalizedConfig.requestTimeoutMs,
        connectTimeoutMs: normalizedConfig.connectTimeoutMs,
        autoReconnect: normalizedConfig.autoReconnect,
        maxReconnectAttempts: normalizedConfig.maxReconnectAttempts,
        reconnectDelayMs: normalizedConfig.reconnectDelayMs,
      },
      credentialsProvider,
      tickMonitor: this.tickConfig,
      gapDetector: this.gapConfig,
      logger: this.logger,
    };

    // If token was provided via withAuth(), add it to auth config
    if (authToken) {
      clientConfig.auth = { token: authToken };
    }

    // Create and return the client instance
    return new OpenClawClient(clientConfig);
  }

  /**
   * Normalize connection config with defaults.
   */
  private normalizeConnectionConfig(): Required<ConnectionConfig> {
    const reconnect = this.reconnectConfig;
    const autoReconnect =
      typeof reconnect === 'boolean' ? reconnect : (reconnect.autoReconnect ?? true);

    return {
      requestTimeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
      connectTimeoutMs: DEFAULT_CONNECT_TIMEOUT_MS,
      autoReconnect,
      maxReconnectAttempts: DEFAULT_MAX_RECONNECT_ATTEMPTS,
      reconnectDelayMs: DEFAULT_RECONNECT_DELAY_MS,
    };
  }
}

// ============================================================================
// Factory Function (Deprecated)
// ============================================================================

/**
 * Create a new OpenClaw client instance.
 *
 * @param config - Client configuration
 * @returns A new OpenClaw client instance
 *
 * @deprecated Use `new ClientBuilder(url, clientId).withAuth(...).build()` instead.
 *
 * @example
 * ```ts
 * const client = createClient({
 *   url: "ws://localhost:8080",
 *   clientId: "my-app",
 *   auth: { token: "my-token" }
 * });
 *
 * await client.connect();
 * const result = await client.request("ping");
 * ```
 */
export function createClient(config: ClientConfig): OpenClawClient {
  const builder = new ClientBuilder(config.url, config.clientId, config.clientVersion);

  if (config.auth?.token) {
    builder.withAuth(config.auth.token);
  }

  if (config.credentialsProvider) {
    builder.withAuth(config.credentialsProvider);
  }

  if (config.logger) {
    builder.withLogger(config.logger);
  }

  if (config.connection) {
    builder.withReconnect({
      autoReconnect: config.connection.autoReconnect,
      reconnectDelayMs: config.connection.reconnectDelayMs,
      maxReconnectAttempts: config.connection.maxReconnectAttempts,
    });
  }

  if (config.tickMonitor) {
    builder.withTickMonitor(config.tickMonitor);
  }

  if (config.gapDetector) {
    builder.withGapDetection(config.gapDetector);
  }

  return builder.build();
}
