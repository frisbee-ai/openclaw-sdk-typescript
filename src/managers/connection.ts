/**
 * OpenClaw Connection Manager
 *
 * This module provides a connection manager that handles the WebSocket connection
 * lifecycle, including state transitions, handshake, authentication, and event emission.
 *
 * @module
 */

import type { IWebSocketTransport } from '../transport/websocket.js';
import type {
  ConnectionState,
  ConnectParams,
  HelloOk,
  GatewayFrame,
  ResponseFrame,
} from '../protocol/types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum allowed size for incoming WebSocket messages (1MB)
 * Prevents DoS attacks via large JSON payloads
 */
const MAX_MESSAGE_SIZE = 1024 * 1024;

// ============================================================================
// Types
// ============================================================================

/**
 * Connection state change event
 */
export interface ConnectionStateChangeEvent {
  /** Previous state */
  previousState: ConnectionState;
  /** New state */
  newState: ConnectionState;
  /** Timestamp of the state change */
  timestamp: number;
}

/**
 * Connection error event
 */
export interface ConnectionErrorEvent {
  /** Error message */
  message: string;
  /** Original error if available */
  original?: Error | unknown;
  /** Whether the error is recoverable */
  recoverable: boolean;
}

/**
 * Connection manager configuration
 */
export interface ConnectionManagerConfig {
  /** Default request timeout in milliseconds */
  defaultRequestTimeout?: number;
  /** Whether to automatically reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnection delay in milliseconds */
  reconnectDelayMs?: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
}

/**
 * Event handler types for connection manager events
 */
export interface ConnectionEventHandlers {
  /** Called when the connection state changes */
  onStateChange?: (event: ConnectionStateChangeEvent) => void;
  /** Called when a connection error occurs */
  onError?: (event: ConnectionErrorEvent) => void;
  /** Called when a message is received */
  onMessage?: (frame: GatewayFrame) => void;
  /** Called when the connection is closed */
  onClosed?: () => void;
}

// ============================================================================
// Connection Manager
// ============================================================================

/**
 * Connection Manager
 *
 * Manages WebSocket connection lifecycle including state transitions,
 * handshake, authentication, and event emission.
 */
export class ConnectionManager {
  /** WebSocket transport instance */
  private transport: IWebSocketTransport;

  /** Current connection state */
  private state: ConnectionState = 'disconnected';

  /** Connection configuration */
  private config: Required<ConnectionManagerConfig>;

  /** Event handlers */
  private handlers: ConnectionEventHandlers = {};

  /** Reconnection attempt counter */
  private reconnectAttempts: number = 0;

  /** Reconnection timer ID */
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;

  /** Current connection URL */
  private currentUrl: string = '';

  /** Pending request ID counter */
  private requestIdCounter: number = 0;

  /** Map of pending requests by ID */
  private pendingRequests: Map<
    string,
    {
      resolve: (response: ResponseFrame) => void;
      reject: (error: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  > = new Map();

  /** Connection parameters for handshake */
  private connectParams?: ConnectParams;

  /** Handshake completion resolvers */
  private handshakeCompleters?: {
    resolve: () => void;
    reject: (error: Error) => void;
  };

  /** Server info from handshake */
  private serverInfo?: HelloOk;

  /**
   * Create a new connection manager
   *
   * @param transport - WebSocket transport instance
   * @param config - Optional configuration
   */
  constructor(transport: IWebSocketTransport, config: ConnectionManagerConfig = {}) {
    this.transport = transport;
    this.config = {
      defaultRequestTimeout: config.defaultRequestTimeout ?? 30000,
      autoReconnect: config.autoReconnect ?? false,
      reconnectDelayMs: config.reconnectDelayMs ?? 1000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
    };

    // Set up transport event handlers
    this.setupTransportHandlers();
  }

  /**
   * Set up WebSocket transport event handlers
   */
  private setupTransportHandlers(): void {
    this.transport.onopen = () => {
      this.setState('handshaking');
      this.performHandshake();
    };

    this.transport.onmessage = (data: string) => {
      this.handleMessage(data);
    };

    this.transport.onclose = () => {
      this.handleDisconnect();
    };

    this.transport.onerror = error => {
      this.handleError(error.message, error.original, error.recoverable ?? false);
    };
  }

  /**
   * Connect to the OpenClaw gateway
   *
   * @param url - WebSocket URL to connect to
   * @param params - Connection parameters for handshake
   * @returns Promise that resolves when connection is ready
   */
  async connect(url: string, params: ConnectParams): Promise<void> {
    if (
      this.state === 'connecting' ||
      this.state === 'handshaking' ||
      this.state === 'authenticating'
    ) {
      throw new Error(`Already connecting in state: ${this.state}`);
    }

    if (this.state === 'ready') {
      throw new Error('Already connected. Call disconnect() first.');
    }

    this.currentUrl = url;
    this.setState('connecting');

    try {
      // Store connection params for handshake
      this.connectParams = params;

      // Create a promise that resolves when handshake completes
      const handshakeComplete = new Promise<void>((resolve, reject) => {
        this.handshakeCompleters = { resolve, reject };
      });

      // Connect using the transport
      await this.transport.connect(url);

      // Wait for handshake to complete
      await handshakeComplete;
    } catch (error) {
      this.setState('disconnected');
      throw error;
    }
  }

  /**
   * Perform the handshake with the server
   */
  private async performHandshake(): Promise<void> {
    try {
      const params = this.connectParams;
      if (!params) {
        throw new Error('No connection parameters available');
      }

      // Send connect request
      const response = await this.sendRequest<HelloOk>('connect', params);

      // Verify hello-ok response
      if (response.type !== 'res' || !response.ok) {
        throw new Error('Handshake failed: ' + (response.error?.message ?? 'Unknown error'));
      }

      const helloOk = response.payload as HelloOk;
      if (helloOk.type !== 'hello-ok') {
        throw new Error('Expected hello-ok response');
      }

      // Store server info
      this.serverInfo = helloOk;

      // Transition to ready state
      this.setState('ready');
      this.reconnectAttempts = 0;

      // Resolve the handshake promise
      this.handshakeCompleters?.resolve();
    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Handshake failed', error, true);

      // Reject the handshake promise
      this.handshakeCompleters?.reject(
        error instanceof Error ? error : new Error('Handshake failed')
      );

      this.handleDisconnect();
    }
  }

  /**
   * Send a request and wait for a response
   *
   * @param method - The method name
   * @param params - The method parameters
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise that resolves with the response
   */
  private sendRequest<T = unknown>(
    method: string,
    params: unknown,
    timeout?: number
  ): Promise<ResponseFrame & { payload: T }> {
    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestIdCounter}`;
      const timeoutMs = timeout ?? this.config.defaultRequestTimeout;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request "${method}" (${id}) timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // Store the pending request
      this.pendingRequests.set(id, {
        resolve: resolve as (response: ResponseFrame) => void,
        reject,
        timeoutId,
      });

      // Send the request frame
      const frame: GatewayFrame = {
        type: 'req',
        id,
        method,
        params,
      };

      try {
        this.transport.send(JSON.stringify(frame));
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle an incoming message
   *
   * @param data - Raw message data
   */
  private handleMessage(data: string): void {
    try {
      // Check for empty data early
      if (!data || data.trim().length === 0) {
        throw new Error('Cannot parse empty message data');
      }

      // Check message size to prevent DoS attacks
      if (data.length > MAX_MESSAGE_SIZE) {
        throw new Error(
          `Incoming message exceeds maximum size of ${MAX_MESSAGE_SIZE} bytes (received: ${data.length} bytes)`
        );
      }

      const frame: GatewayFrame = JSON.parse(data);

      // Handle response frames
      if (frame.type === 'res') {
        const pending = this.pendingRequests.get(frame.id);
        if (pending) {
          clearTimeout(pending.timeoutId);
          this.pendingRequests.delete(frame.id);
          pending.resolve(frame);
        }
        return;
      }

      // Emit message event for other frame types
      if (this.handlers.onMessage) {
        this.handlers.onMessage(frame);
      }
    } catch (error) {
      // Create a data preview for debugging (max 100 chars)
      const dataPreview =
        data.length > 100 ? `${data.slice(0, 100)}... (${data.length} bytes total)` : data;

      // Build detailed error message
      const baseError = 'Failed to parse incoming message';
      let errorMessage = baseError;
      if (error instanceof SyntaxError) {
        errorMessage = `${baseError}: Invalid JSON`;
      } else if (error instanceof Error && error.message.includes('empty')) {
        errorMessage = `${baseError}: empty data received`;
      }

      // Keep original error intact but attach data preview
      if (error instanceof Error) {
        (error as Error & { dataPreview?: string }).dataPreview = dataPreview;
      }

      this.handleError(`${errorMessage}: "${dataPreview}"`, error, false);
    }
  }

  /**
   * Handle connection close
   */
  private handleDisconnect(): void {
    // Clear all pending requests
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();

    // Notify closed handler
    if (this.handlers.onClosed) {
      this.handlers.onClosed();
    }

    // Attempt reconnection if enabled
    if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.setState('closed');
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    this.setState('reconnecting');

    this.reconnectTimerId = setTimeout(() => {
      this.reconnectAttempts++;
      const params = this.connectParams;

      if (params) {
        this.connect(this.currentUrl, params).catch(error => {
          this.handleError(`Reconnection attempt ${this.reconnectAttempts} failed`, error, true);
        });
      } else {
        this.setState('disconnected');
      }
    }, this.config.reconnectDelayMs);
  }

  /**
   * Handle an error
   *
   * @param message - Error message
   * @param original - Original error
   * @param recoverable - Whether the error is recoverable
   */
  private handleError(message: string, original?: Error | unknown, recoverable = false): void {
    const event: ConnectionErrorEvent = {
      message,
      original,
      recoverable,
    };

    if (this.handlers.onError) {
      this.handlers.onError(event);
    }
  }

  /**
   * Set the connection state
   *
   * @param newState - The new state
   */
  private setState(newState: ConnectionState): void {
    const previousState = this.state;

    if (previousState === newState) {
      return;
    }

    this.state = newState;

    if (this.handlers.onStateChange) {
      this.handlers.onStateChange({
        previousState,
        newState,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    // Cancel any pending reconnection
    if (this.reconnectTimerId !== null) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }

    // Close the transport
    this.transport.close();

    // Update state
    this.setState('disconnected');
  }

  /**
   * Get the current connection state
   *
   * @returns The current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if the connection is ready
   *
   * @returns True if the connection is ready
   */
  isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * Send a frame through the connection
   *
   * @param frame - The frame to send
   * @throws Error if the connection is not ready
   */
  send(frame: GatewayFrame): void {
    if (!this.isReady()) {
      throw new Error(`Cannot send: connection is ${this.state} (expected: ready)`);
    }

    this.transport.send(JSON.stringify(frame));
  }

  /**
   * Set event handlers
   *
   * @param handlers - Event handlers to set
   */
  setHandlers(handlers: ConnectionEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get the server info from the handshake
   *
   * @returns The server info or undefined if not connected
   */
  getServerInfo(): HelloOk | undefined {
    return this.serverInfo;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a connection manager instance
 *
 * @param transport - WebSocket transport instance
 * @param config - Optional configuration
 * @returns A new connection manager instance
 *
 * @example
 * ```ts
 * import { WebSocketTransport } from './transport/websocket.js';
 * import { createConnectionManager } from './managers/connection.js';
 *
 * const transport = new WebSocketTransport({ connectTimeoutMs: 30000 });
 * const manager = createConnectionManager(transport, {
 *   autoReconnect: true,
 *   maxReconnectAttempts: 5
 * });
 *
 * manager.setHandlers({
 *   onStateChange: (event) => console.log("State:", event.newState),
 *   onError: (event) => console.error("Error:", event.message)
 * });
 * ```
 */
export function createConnectionManager(
  transport: IWebSocketTransport,
  config?: ConnectionManagerConfig
): ConnectionManager {
  return new ConnectionManager(transport, config);
}

// ============================================================================
// Re-exports
// ============================================================================

export default ConnectionManager;
