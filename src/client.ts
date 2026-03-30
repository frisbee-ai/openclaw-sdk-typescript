/**
 * OpenClaw SDK Client
 *
 * Main entry point for interacting with the OpenClaw Gateway via WebSocket.
 * This class provides a facade over the connection and request managers.
 *
 * @module
 */

import type { ConnectionState } from './protocol/connection-state.js';
import type { ConnectParams, HelloOk, Snapshot } from './protocol/connection.js';
import type { GatewayFrame, ResponseFrame } from './protocol/frames.js';
import type { IWebSocketTransport } from './transport/websocket.js';
import { WebSocketTransport } from './transport/websocket.js';
import type { ConnectionEventHandlers } from './managers/connection.js';
import { ConnectionManager, createConnectionManager } from './managers/connection.js';
import { RequestManager, createRequestManager } from './managers/request.js';
import { EventManager, createEventManager } from './managers/event.js';
import type { EventPattern, EventHandler, UnsubscribeFn } from './managers/event.js';
import { createErrorFromResponse, ConnectionError } from './errors.js';
import { ProtocolNegotiator, createProtocolNegotiator } from './connection/protocol.js';
import type { NegotiatedProtocol } from './connection/protocol.js';
import { PolicyManager, createPolicyManager } from './connection/policies.js';
import type { Policy } from './connection/policies.js';
import { ConnectionStateMachine, createConnectionStateMachine } from './connection/state.js';
import { AuthHandler, createAuthHandler } from './auth/provider.js';
import type { CredentialsProvider } from './auth/provider.js';
import { createReconnectManager } from './managers/reconnect.js';
import { TickMonitor, createTickMonitor } from './events/tick.js';
import type { TickMonitorConfig } from './events/tick.js';
import { GapDetector, createGapDetector } from './events/gap.js';
import type { GapDetectorConfig } from './events/gap.js';
import type { Logger } from './types/logger.js';
import { LogLevel } from './types/logger.js';
import { ChatAPI } from './api/chat.js';
import { AgentsAPI } from './api/agents.js';
import { SessionsAPI } from './api/sessions.js';
import { ConfigAPI } from './api/config.js';
import { CronAPI } from './api/cron.js';
import { NodesAPI } from './api/nodes.js';
import { SkillsAPI } from './api/skills.js';
import { DevicePairingAPI } from './api/devicePairing.js';

// ============================================================================
// Configuration Types
// ============================================================================

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
// Main Client Class
// ============================================================================

/**
 * OpenClaw Client
 *
 * Main client class for connecting to and interacting with an OpenClaw Gateway.
 * Provides methods for connection lifecycle, request/response handling, and state queries.
 */
export class OpenClawClient {
  private connectionManager: ConnectionManager;
  private requestManager: RequestManager;
  private eventManager: EventManager;
  private protocolNegotiator: ProtocolNegotiator;
  private policyManager: PolicyManager;
  private stateMachine: ConnectionStateMachine;
  private _config: ClientConfig;
  private _normalizedConfig: Required<ConnectionConfig>;
  private negotiatedProtocol: NegotiatedProtocol | null = null;
  private _serverInfo: HelloOk | null = null;
  private _snapshot: Snapshot | null = null;
  private authHandler: AuthHandler | null = null;
  private tickMonitor: TickMonitor | null = null;
  private gapDetector: GapDetector | null = null;
  private tickHandlerUnsub: (() => void) | null = null;

  // API namespaces
  private _chatAPI: ChatAPI;
  private _agentsAPI: AgentsAPI;
  private _sessionsAPI: SessionsAPI;
  private _configAPI: ConfigAPI;
  private _cronAPI: CronAPI;
  private _nodesAPI: NodesAPI;
  private _skillsAPI: SkillsAPI;
  private _devicePairingAPI: DevicePairingAPI;
  private logger: Logger;

  // Event handler storage
  private stateChangeHandlers: Set<(state: ConnectionState) => void> = new Set();
  private errorHandlers: Set<(error: Error) => void> = new Set();
  private messageHandlers: Set<(frame: GatewayFrame) => void> = new Set();
  private closedHandlers: Set<() => void> = new Set();

  /**
   * Create a new OpenClaw client instance.
   * Supports backward-compatible construction with ClientConfig, or internal construction with pre-built managers.
   */
  constructor(
    config: ClientConfig,
    _internal?: {
      connectionManager?: ConnectionManager;
      requestManager?: RequestManager;
      eventManager?: EventManager;
      protocolNegotiator?: ProtocolNegotiator;
      policyManager?: PolicyManager;
      stateMachine?: ConnectionStateMachine;
      authHandler?: AuthHandler;
      logger?: Logger;
    }
  ) {
    // Validate URL scheme
    let parsed: URL;
    try {
      parsed = new URL(config.url);
    } catch {
      throw new Error(`Invalid WebSocket URL: ${config.url}`);
    }
    if (!['ws:', 'wss:'].includes(parsed.protocol)) {
      throw new Error(`Invalid URL scheme: ${parsed.protocol}. Expected ws: or wss:`);
    }

    this._config = config;
    this._normalizedConfig = this.normalizeConnectionConfig(config);
    this.logger = config.logger ?? NOOP_LOGGER;

    if (_internal) {
      // ClientBuilder path: use pre-built managers
      this.connectionManager = _internal.connectionManager!;
      this.requestManager = _internal.requestManager!;
      this.eventManager = _internal.eventManager!;
      this.protocolNegotiator = _internal.protocolNegotiator!;
      this.policyManager = _internal.policyManager!;
      this.stateMachine = _internal.stateMachine!;
      this.authHandler = _internal.authHandler ?? null;

      // Set up 'request.cancelled' event handler on eventManager
      this.eventManager.on(
        'request.cancelled',
        (frame: { payload?: { requestId?: string; reason?: string } }) => {
          const requestId = frame.payload?.requestId;
          if (requestId) {
            this.requestManager.rejectRequest(
              requestId,
              new Error(`Request cancelled by server: ${frame.payload?.reason ?? 'unknown'}`)
            );
          }
        }
      );

      // Initialize API namespaces
      const requestFn = <T = unknown>(method: string, params?: unknown): Promise<T> =>
        this.request<T>(method, params);
      this._chatAPI = new ChatAPI(requestFn);
      this._agentsAPI = new AgentsAPI(requestFn);
      this._sessionsAPI = new SessionsAPI(requestFn);
      this._configAPI = new ConfigAPI(requestFn);
      this._cronAPI = new CronAPI(requestFn);
      this._nodesAPI = new NodesAPI(requestFn);
      this._skillsAPI = new SkillsAPI(requestFn);
      this._devicePairingAPI = new DevicePairingAPI(requestFn);

      // Set up connection handlers
      this.setupConnectionHandlers();
    } else {
      // Backward-compatible path: create managers
      const normalizedConfig = this._normalizedConfig;

      const transport: IWebSocketTransport = new WebSocketTransport({
        connectTimeoutMs: normalizedConfig.connectTimeoutMs,
      });

      if (config.credentialsProvider) {
        this.authHandler = createAuthHandler(config.credentialsProvider);
      }

      const reconnectMgr = createReconnectManager(
        {
          maxAttempts: normalizedConfig.maxReconnectAttempts,
          initialDelayMs: normalizedConfig.reconnectDelayMs,
          maxDelayMs: 30000,
          pauseOnAuthError: true,
          maxAuthRetries: 3,
          jitterFactor: 0.3,
        },
        this.logger
      );

      this.connectionManager = createConnectionManager(
        transport,
        {
          defaultRequestTimeout: normalizedConfig.requestTimeoutMs,
          autoReconnect: normalizedConfig.autoReconnect,
          reconnectDelayMs: normalizedConfig.reconnectDelayMs,
          maxReconnectAttempts: normalizedConfig.maxReconnectAttempts,
        },
        reconnectMgr,
        this.authHandler ?? undefined
      );

      this.requestManager = createRequestManager();
      this.eventManager = createEventManager(this.logger);
      this.eventManager.on(
        'request.cancelled',
        (frame: { payload?: { requestId?: string; reason?: string } }) => {
          const requestId = frame.payload?.requestId;
          if (requestId) {
            this.requestManager.rejectRequest(
              requestId,
              new Error(`Request cancelled by server: ${frame.payload?.reason ?? 'unknown'}`)
            );
          }
        }
      );

      this.protocolNegotiator = createProtocolNegotiator({ min: 3, max: 3 });
      this.policyManager = createPolicyManager();
      this.stateMachine = createConnectionStateMachine(this.logger);

      // Initialize API namespaces
      const requestFn = <T = unknown>(method: string, params?: unknown): Promise<T> =>
        this.request<T>(method, params);
      this._chatAPI = new ChatAPI(requestFn);
      this._agentsAPI = new AgentsAPI(requestFn);
      this._sessionsAPI = new SessionsAPI(requestFn);
      this._configAPI = new ConfigAPI(requestFn);
      this._cronAPI = new CronAPI(requestFn);
      this._nodesAPI = new NodesAPI(requestFn);
      this._skillsAPI = new SkillsAPI(requestFn);
      this._devicePairingAPI = new DevicePairingAPI(requestFn);

      // Set up connection handlers
      this.setupConnectionHandlers();
    }
  }

  /**
   * Normalize connection config - from nested connection object.
   */
  private normalizeConnectionConfig(config: ClientConfig): Required<ConnectionConfig> {
    const conn = config.connection ?? {};
    return {
      requestTimeoutMs: conn.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
      connectTimeoutMs: conn.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS,
      autoReconnect: conn.autoReconnect ?? true,
      maxReconnectAttempts: conn.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
      reconnectDelayMs: conn.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS,
    };
  }

  /**
   * Set up connection manager event handlers.
   */
  private setupConnectionHandlers(): void {
    const handlers: ConnectionEventHandlers = {
      onStateChange: event => {
        // Track state in the state machine (with transition validation)
        try {
          if (this.stateMachine.canTransitionTo(event.newState as ConnectionState)) {
            this.stateMachine.transitionTo(event.newState as ConnectionState);
          }
        } catch {
          // State machine validation is advisory — don't break the connection
        }

        this.stateChangeHandlers.forEach(handler => {
          try {
            handler(event.newState);
          } catch (error) {
            // Silently ignore handler errors to prevent cascading failures
            this.logger.error('Error in stateChange handler', { error: String(error) });
          }
        });
      },
      onError: event => {
        const error =
          event.original instanceof Error
            ? event.original
            : new ConnectionError({
                code: 'NETWORK_ERROR',
                message: event.message,
                retryable: event.recoverable,
              });
        this.errorHandlers.forEach(handler => {
          try {
            handler(error);
          } catch (err) {
            this.logger.error('Error in error handler', { error: String(err) });
          }
        });
      },
      onMessage: frame => {
        this.messageHandlers.forEach(handler => {
          try {
            handler(frame);
          } catch (error) {
            this.logger.error('Error in message handler', { error: String(error) });
          }
        });
        // Handle request responses
        if (frame.type === 'res') {
          if (frame.progress) {
            // Intermediate progress update — deliver to progress callback
            this.requestManager.resolveProgress(frame.id, frame.payload);
          } else {
            // Final response — resolve the pending request
            this.requestManager.resolveRequest(frame.id, frame as ResponseFrame);
          }
        }
        // Emit event frames through the EventManager
        if (frame.type === 'event') {
          this.eventManager.emitFrame(frame);
          // Track event sequence for gap detection
          if (frame.seq !== undefined && this.gapDetector) {
            this.gapDetector.recordSequence(frame.seq);
          }
        }
      },
      onClosed: () => {
        this.closedHandlers.forEach(handler => {
          try {
            handler();
          } catch (error) {
            this.logger.error('Error in closed handler', { error: String(error) });
          }
        });
      },
    };

    this.connectionManager.setHandlers(handlers);
  }

  /**
   * Check if the client is currently connected.
   */
  get isConnected(): boolean {
    return this.connectionManager.getState() === 'ready';
  }

  /**
   * Get the current connection state.
   */
  get connectionState(): ConnectionState {
    return this.connectionManager.getState();
  }

  /**
   * Get the negotiated protocol version.
   *
   * @returns The negotiated protocol version, or null if not yet connected
   */
  get protocol(): number | null {
    return this.negotiatedProtocol?.version ?? null;
  }

  /**
   * Get server policies received during handshake.
   *
   * @returns Server policy, or default policy if not yet connected
   */
  getPolicy(): Policy {
    return {
      maxPayload: this.policyManager.getMaxPayload(),
      maxBufferedBytes: this.policyManager.getMaxBufferedBytes(),
      tickIntervalMs: this.policyManager.getTickIntervalMs(),
    };
  }

  /**
   * Get server info from the hello-ok response.
   *
   * @returns Server info, or null if not yet connected
   */
  getServerInfo(): HelloOk | null {
    return this._serverInfo;
  }

  /**
   * Get the server features (available methods and events).
   *
   * @returns Server features, or null if not yet connected
   */
  getServerFeatures(): { methods: string[]; events: string[] } | null {
    return this._serverInfo?.features ?? null;
  }

  /**
   * Get the snapshot from the hello-ok response.
   *
   * Contains server state including presence, health, state version, and uptime.
   *
   * @returns Snapshot data, or null if not yet connected
   */
  getSnapshot(): Snapshot | null {
    return this._snapshot;
  }

  /**
   * Check if the connection is ready for requests (using state machine).
   *
   * @returns True if the state machine reports ready
   */
  get isReady(): boolean {
    return this.stateMachine.isReady();
  }

  /**
   * Get the tick monitor instance for heartbeat monitoring.
   *
   * @returns TickMonitor instance, or null if not configured
   */
  getTickMonitor(): TickMonitor | null {
    return this.tickMonitor;
  }

  /**
   * Get the gap detector instance for event sequence tracking.
   *
   * @returns GapDetector instance, or null if not configured
   */
  getGapDetector(): GapDetector | null {
    return this.gapDetector;
  }

  // ==========================================================================
  // API Namespaces
  // ==========================================================================

  /**
   * Chat API for chat session operations.
   *
   * const { chats } = await client.chat.list();
   * await client.chat.inject({ chatId: "chat-123", message: { role: "user", content: "Hello" } });
   * ```
   */
  get chat(): ChatAPI {
    return this._chatAPI;
  }

  /**
   * Agents API for agent lifecycle and file operations.
   *
   * const { agents } = await client.agents.list();
   * await client.agents.create({ agentId: "my-agent", files: [] });
   * ```
   */
  get agents(): AgentsAPI {
    return this._agentsAPI;
  }

  /**
   * Sessions API for session management operations.
   *
   * const sessions = await client.sessions.list();
   * await client.sessions.reset({ sessionId: "sess-123" });
   * ```
   */
  get sessions(): SessionsAPI {
    return this._sessionsAPI;
  }

  /**
   * Config API for gateway configuration operations.
   *
   * const config = await client.config.get();
   * await client.config.set({ key: "theme", value: "dark" });
   * ```
   */
  get config(): ConfigAPI {
    return this._configAPI;
  }

  /**
   * Cron API for scheduled job operations.
   *
   * const { jobs } = await client.cron.list();
   * await client.cron.add({ cron: "0 * * * *", prompt: "Check status" });
   * ```
   */
  get cron(): CronAPI {
    return this._cronAPI;
  }

  /**
   * Nodes API for node management and invocation.
   *
   * const nodes = await client.nodes.list();
   * const result = await client.nodes.invoke({ nodeId: "node-1", target: "run" });
   * ```
   */
  get nodes(): NodesAPI {
    return this._nodesAPI;
  }

  /**
   * Skills API for skill and tool catalog operations.
   *
   * const status = await client.skills.status();
   * const { tools } = await client.skills.tools.catalog();
   * ```
   */
  get skills(): SkillsAPI {
    return this._skillsAPI;
  }

  /**
   * Device Pairing API for device pairing operations.
   *
   * const pairings = await client.devicePairing.list();
   * await client.devicePairing.approve({ pairingId: "pair-123" });
   * ```
   */
  get devicePairing(): DevicePairingAPI {
    return this._devicePairingAPI;
  }

  /**
   * Connect to the OpenClaw Gateway.
   *
   * @returns Promise that resolves when the connection is established
   * @throws Error if connection fails
   *
   * const client = createClient({
   *   url: "ws://localhost:8080",
   *   clientId: "my-app"
   * });
   *
   * await client.connect();
   * console.log("Connected:", client.isConnected);
   * ```
   */
  async connect(): Promise<void> {
    // Prepare auth data via AuthHandler if credentials provider is configured
    let auth = this._config.auth;
    if (this.authHandler) {
      const prepared = await this.authHandler.prepareAuth();
      if (prepared) {
        auth = prepared.data;
      }
    }

    // Build connection parameters
    const connectParams: ConnectParams = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: this._config.clientId,
        displayName: this._config.clientId,
        version: this._config.clientVersion ?? '1.0.0',
        platform: this._config.platform ?? 'typescript-sdk',
        deviceFamily: this._config.deviceFamily,
        modelIdentifier: this._config.modelIdentifier,
        mode: (this._config.mode ?? 'node') as string,
        instanceId: this._config.instanceId,
      },
      auth,
      device: this._config.device,
      caps: this._config.capabilities,
    };

    // Connect using connection manager
    await this.connectionManager.connect(this._config.url, connectParams);

    // Post-handshake: validate protocol and store policies
    const serverInfo = this.connectionManager.getServerInfo();
    if (serverInfo) {
      this._serverInfo = serverInfo;
      this._snapshot = serverInfo.snapshot ?? null;
      this.negotiatedProtocol = this.protocolNegotiator.negotiate(serverInfo);
      this.policyManager.setPolicies(serverInfo.policy);

      // Snapshot recovery: reset gap detector if stateVersion changed
      if (this._snapshot && this.gapDetector) {
        this.gapDetector.reset();
      }

      // Create tick monitor using server's tick interval
      if (this._config.tickMonitor !== undefined) {
        const tickIntervalMs =
          this._config.tickMonitor.tickIntervalMs ?? this.policyManager.getTickIntervalMs();
        this.tickMonitor = createTickMonitor({
          tickIntervalMs,
          ...this._config.tickMonitor,
        });
        this.tickMonitor.start();

        // Wire tick events from EventManager to TickMonitor
        this.tickHandlerUnsub = this.eventManager.on(
          'tick',
          (frame: { payload?: { ts?: number } }) => {
            const ts = frame.payload?.ts ?? Date.now();
            this.tickMonitor?.recordTick(ts);
          }
        );
      }

      // Create gap detector
      if (this._config.gapDetector) {
        this.gapDetector = createGapDetector({
          recovery: { mode: 'reconnect', ...this._config.gapDetector.recovery },
          ...this._config.gapDetector,
        });

        // Wire gap recovery actions per D-05: client.ts handles recovery, GapDetector remains pure
        this.gapDetector.on('gap', (gaps: import('./events/gap.js').GapInfo[]) => {
          const mode = this._config.gapDetector?.recovery?.mode ?? 'skip';
          this.logger.debug('Gap detected', { mode, gapCount: gaps.length });

          if (mode === 'reconnect') {
            // Reconnect mode: trigger reconnection
            this.connectionManager.reconnect();
          } else if (mode === 'snapshot') {
            // Snapshot mode: call the configured HTTP endpoint
            const endpoint = this._config.gapDetector?.recovery?.snapshotEndpoint;
            if (endpoint) {
              this.performSnapshotRecovery(endpoint, gaps).catch(error => {
                this.logger.error('Snapshot recovery failed', { error: String(error) });
              });
            } else {
              this.logger.warn('Gap detected in snapshot mode but no snapshotEndpoint configured');
            }
          }
          // 'skip' mode: no action, just log
        });
      }
    }
  }

  /**
   * Perform snapshot recovery by fetching state from the snapshot endpoint.
   */
  private async performSnapshotRecovery(
    endpoint: string,
    gaps: import('./events/gap.js').GapInfo[]
  ): Promise<void> {
    try {
      // eslint-disable-next-line no-undef -- fetch is a global in Node 22+ and browsers
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gaps,
          clientId: this._config.clientId,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Snapshot endpoint returned ${response.status}: ${response.statusText}`);
      }

      this.logger.info('Snapshot recovery completed', { endpoint });
    } catch (error) {
      this.logger.error('Snapshot recovery failed', { endpoint, error: String(error) });
      throw error;
    }
  }

  /**
   * Disconnect from the OpenClaw Gateway.
   *
   * client.disconnect();
   * console.log("Disconnected:", client.isConnected);
   * ```
   */
  disconnect(): void {
    this.connectionManager.disconnect();
    this.stateMachine.reset();
    this.negotiatedProtocol = null;
    this._serverInfo = null;
    this._snapshot = null;

    // Clear pending requests so they reject immediately
    this.requestManager.clear();

    // Clean up tick handler to prevent leak on reconnect cycles
    if (this.tickHandlerUnsub) {
      this.tickHandlerUnsub();
      this.tickHandlerUnsub = null;
    }

    if (this.tickMonitor) {
      this.tickMonitor.stop();
    }
    if (this.gapDetector) {
      this.gapDetector.reset();
    }
  }

  /**
   * Send a request to the OpenClaw Gateway and wait for a response.
   *
   * @param method - The method name to invoke
   * @param params - Optional parameters for the method
   * @param options - Optional request options
   * @returns Promise that resolves with the response payload
   * @throws Error if the request fails or times out
   */
  async request<T = unknown>(
    method: string,
    params?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    // Check if signal is already aborted
    if (options?.signal?.aborted) {
      throw new Error('Request aborted');
    }

    // Generate a unique request ID
    const requestId = this.generateRequestId();

    // Create the request frame
    const requestFrame: GatewayFrame = {
      type: 'req',
      id: requestId,
      method,
      params,
    };

    // Determine timeout
    let timeout = this._normalizedConfig.requestTimeoutMs;
    if (options?.expectFinal && options.expectFinalTimeoutMs) {
      timeout = options.expectFinalTimeoutMs;
    }

    // Add pending request
    const responsePromise = this.requestManager.addRequest(requestId, {
      timeout,
      onProgress: options?.onProgress,
    });

    // Set up abort handler
    let abortHandler: (() => void) | undefined;
    let cleanupAbortHandler: (() => void) | undefined;

    try {
      if (options?.signal) {
        abortHandler = () => {
          this.requestManager.abortRequest(requestId);
        };
        options.signal.addEventListener('abort', abortHandler);

        // Store cleanup function
        cleanupAbortHandler = () => {
          if (abortHandler && options.signal) {
            options.signal.removeEventListener('abort', abortHandler);
            abortHandler = undefined;
          }
        };

        // Also clean up on abort
        options.signal.addEventListener('abort', cleanupAbortHandler, {
          once: true,
        });
      }

      // Send the request
      try {
        this.connectionManager.send(requestFrame);
      } catch (sendError) {
        this.requestManager.abortRequest(requestId);
        throw sendError;
      }

      // Wait for response
      const response = await responsePromise;

      if (!response.ok) {
        if (response.error) {
          throw createErrorFromResponse(response.error);
        }
        throw new Error('Request failed: unknown error');
      }

      return response.payload as T;
    } finally {
      // Always clean up abort handler
      if (abortHandler && options?.signal) {
        options.signal.removeEventListener('abort', abortHandler);
      }
    }
  }

  /**
   * Abort a pending request by ID.
   *
   * @param requestId - The request ID to abort
   *
   * // Abort a specific request
   * client.abort("req-123-456");
   * ```
   */
  abort(requestId: string): void {
    this.requestManager.abortRequest(requestId);
  }

  /**
   * Generate a unique request ID.
   *
   * @returns A unique request ID string
   */
  private generateRequestId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `req-${crypto.randomUUID()}`;
    }
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Register a handler for connection state changes.
   *
   * @param handler - Function to call when connection state changes
   * @returns Unsubscribe function to remove the handler
   *
   * const unsub = client.onStateChange((state) => {
   *   console.log("State changed to:", state);
   * });
   *
   * // Later: unsub();
   * ```
   */
  onStateChange(handler: (state: ConnectionState) => void): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  /**
   * Register a handler for connection errors.
   *
   * @param handler - Function to call when an error occurs
   * @returns Unsubscribe function to remove the handler
   *
   * const unsub = client.onError((error) => {
   *   console.error("Connection error:", error.message);
   * });
   * ```
   */
  onError(handler: (error: Error) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Register a handler for incoming gateway frames.
   *
   * @param handler - Function to call when a frame is received
   * @returns Unsubscribe function to remove the handler
   *
   * const unsub = client.onMessage((frame) => {
   *   console.log("Received frame:", frame.type);
   * });
   * ```
   */
  onMessage(handler: (frame: GatewayFrame) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register a handler for connection close events.
   *
   * @param handler - Function to call when the connection closes
   * @returns Unsubscribe function to remove the handler
   *
   * const unsub = client.onClosed(() => {
   *   console.log("Connection closed");
   * });
   * ```
   */
  onClosed(handler: () => void): () => void {
    this.closedHandlers.add(handler);
    return () => this.closedHandlers.delete(handler);
  }

  // ==========================================================================
  // Event Subscriptions (Server-Sent Events)
  // ==========================================================================

  /**
   * Subscribe to server-sent events with pattern matching.
   *
   * Supports exact match (`'tick'`), prefix wildcard (`'agent:*'`),
   * and global wildcard (`'*'`).
   *
   * @param pattern - Event pattern to match
   * @param handler - Event handler function
   * @returns Unsubscribe function
   *
   * // Exact match
   * const unsub1 = client.on('tick', (frame) => {
   *   console.log('Tick:', frame.payload);
   * });
   *
   * // Prefix wildcard
   * const unsub2 = client.on('agent:*', (frame) => {
   *   console.log('Agent event:', frame.event);
   * });
   *
   * // All events
   * const unsub3 = client.on('*', (frame) => {
   *   console.log('Any event:', frame.event);
   * });
   *
   * // Cleanup
   * unsub1();
   * ```
   */
  on<T = unknown>(pattern: EventPattern, handler: EventHandler<T>): UnsubscribeFn {
    return this.eventManager.on(pattern, handler);
  }

  /**
   * Subscribe to a server-sent event once.
   *
   * @param pattern - Event pattern to match
   * @param handler - Event handler function
   * @returns Unsubscribe function
   *
   * client.once('shutdown', (frame) => {
   *   console.log('Server shutting down:', frame.payload);
   * });
   * ```
   */
  once<T = unknown>(pattern: EventPattern, handler: EventHandler<T>): UnsubscribeFn {
    return this.eventManager.once(pattern, handler);
  }

  /**
   * Unsubscribe from server-sent events.
   *
   * @param pattern - Event pattern to unsubscribe from (omit to clear all)
   * @param handler - Specific handler to remove (omit to remove all for pattern)
   *
   * // Remove all 'tick' handlers
   * client.off('tick');
   *
   * // Remove specific handler
   * client.off('tick', myHandler);
   *
   * // Remove all event handlers
   * client.off();
   * ```
   */
  off<T = unknown>(pattern?: EventPattern, handler?: EventHandler<T>): void {
    this.eventManager.off(pattern, handler);
  }

  /**
   * Get the number of active event handlers.
   *
   * @param pattern - Optional pattern to count handlers for
   * @returns Number of handlers
   */
  listenerCount(pattern?: EventPattern): number {
    return this.eventManager.handlerCount(pattern);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new OpenClaw client instance.
 *
 * @param config - Client configuration
 * @returns A new OpenClaw client instance
 *
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
  return new OpenClawClient(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default OpenClawClient;
