/**
 * OpenClaw SDK Client
 *
 * Main entry point for interacting with the OpenClaw Gateway via WebSocket.
 * This class provides a facade over the connection and request managers.
 */

import type { ConnectionState } from "./protocol/types.js";
import type { ConnectParams, GatewayFrame, ResponseFrame } from "./protocol/types.js";
import type { IWebSocketTransport } from "./transport/websocket.js";
import { WebSocketTransport } from "./transport/websocket.js";
import type { ConnectionEventHandlers } from "./managers/connection.js";
import { ConnectionManager, createConnectionManager } from "./managers/connection.js";
import { RequestManager, createRequestManager } from "./managers/request.js";

// ============================================================================
// Configuration Types
// ============================================================================

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
  /** Default request timeout in milliseconds (default: 30000) */
  requestTimeoutMs?: number;
  /** Connection timeout in milliseconds (default: 30000) */
  connectTimeoutMs?: number;
  /** Whether to automatically reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Reconnection delay in milliseconds (default: 1000) */
  reconnectDelayMs?: number;
}

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
  private config: ClientConfig;

  // Event handler storage
  private stateChangeHandlers: Array<(state: ConnectionState) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private messageHandlers: Array<(frame: GatewayFrame) => void> = [];
  private closedHandlers: Array<() => void> = [];

  /**
   * Create a new OpenClaw client instance.
   *
   * @param config - Client configuration
   */
  constructor(config: ClientConfig) {
    this.config = config;

    // Create WebSocket transport
    const transport: IWebSocketTransport = new WebSocketTransport({
      connectTimeoutMs: config.connectTimeoutMs,
    });

    // Create connection manager with event handlers
    this.connectionManager = createConnectionManager(transport, {
      defaultRequestTimeout: config.requestTimeoutMs ?? 30000,
      autoReconnect: config.autoReconnect ?? true,
      reconnectDelayMs: config.reconnectDelayMs ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
    });

    // Set up connection manager event handlers
    this.setupConnectionHandlers();

    // Create request manager
    this.requestManager = createRequestManager();
  }

  /**
   * Set up connection manager event handlers.
   */
  private setupConnectionHandlers(): void {
    const handlers: ConnectionEventHandlers = {
      onStateChange: (event) => {
        this.stateChangeHandlers.forEach((handler) => handler(event.newState));
      },
      onError: (event) => {
        const error = new Error(event.message);
        this.errorHandlers.forEach((handler) => handler(error));
      },
      onMessage: (frame) => {
        this.messageHandlers.forEach((handler) => handler(frame));
        // Also handle request responses
        if (frame.type === "res") {
          this.requestManager.resolveRequest(frame.id, frame as ResponseFrame);
        }
      },
      onClosed: () => {
        this.closedHandlers.forEach((handler) => handler());
      },
    };

    this.connectionManager.setHandlers(handlers);
  }

  /**
   * Check if the client is currently connected.
   */
  get isConnected(): boolean {
    return this.connectionManager.getState() === "ready";
  }

  /**
   * Get the current connection state.
   */
  get connectionState(): ConnectionState {
    return this.connectionManager.getState();
  }

  /**
   * Connect to the OpenClaw Gateway.
   *
   * @returns Promise that resolves when the connection is established
   * @throws Error if connection fails
   */
  async connect(): Promise<void> {
    // Build connection parameters
    const connectParams: ConnectParams = {
      minProtocol: 1,
      maxProtocol: 1,
      client: {
        id: this.config.clientId,
        displayName: this.config.clientId,
        version: this.config.clientVersion ?? "1.0.0",
        platform: this.config.platform ?? "typescript-sdk",
        deviceFamily: this.config.deviceFamily,
        modelIdentifier: this.config.modelIdentifier,
        mode: (this.config.mode ?? "node") as string,
        instanceId: this.config.instanceId,
      },
      auth: this.config.auth,
      device: this.config.device,
    };

    // Connect using connection manager
    await this.connectionManager.connect(this.config.url, connectParams);
  }

  /**
   * Disconnect from the OpenClaw Gateway.
   */
  disconnect(): void {
    this.connectionManager.disconnect();
  }

  /**
   * Send a request to the OpenClaw Gateway and wait for a response.
   *
   * @param method - The method name to invoke
   * @param params - Optional parameters for the method
   * @returns Promise that resolves with the response payload
   * @throws Error if the request fails or times out
   */
  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    // Generate a unique request ID
    const requestId = this.generateRequestId();

    // Create the request frame
    const requestFrame: GatewayFrame = {
      type: "req",
      id: requestId,
      method,
      params,
    };

    // Add pending request
    const responsePromise = this.requestManager.addRequest(requestId, {
      timeout: this.config.requestTimeoutMs ?? 30000,
    });

    // Send the request
    this.connectionManager.send(requestFrame);

    // Wait for response
    const response = await responsePromise;

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.error?.code ?? "UNKNOWN"} - ${response.error?.message ?? "Unknown error"}`
      );
    }

    return response.payload as T;
  }

  /**
   * Generate a unique request ID.
   *
   * @returns A unique request ID string
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Register a handler for connection state changes.
   *
   * @param handler - Function to call when connection state changes
   */
  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandlers.push(handler);
  }

  /**
   * Register a handler for connection errors.
   *
   * @param handler - Function to call when an error occurs
   */
  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Register a handler for incoming gateway frames.
   *
   * @param handler - Function to call when a frame is received
   */
  onMessage(handler: (frame: GatewayFrame) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register a handler for connection close events.
   *
   * @param handler - Function to call when the connection closes
   */
  onClosed(handler: () => void): void {
    this.closedHandlers.push(handler);
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
  return new OpenClawClient(config);
}

// ============================================================================
// Default Export
// ============================================================================

export default OpenClawClient;
