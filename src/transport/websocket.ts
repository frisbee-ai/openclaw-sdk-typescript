/**
 * OpenClaw WebSocket Transport
 *
 * This module provides a WebSocket transport abstraction that works across
 * different environments (Node.js and browser) with a type-safe event emitter pattern.
 *
 * @module
 */

import { TimeoutManager } from '../utils/timeoutManager.js';

/**
 * WebSocket ready states as defined in the WebSocket specification
 */
export enum ReadyState {
  /** The connection is not yet open */
  CONNECTING = 0,
  /** The connection is open and ready to communicate */
  OPEN = 1,
  /** The connection is in the process of closing */
  CLOSING = 2,
  /** The connection is closed or couldn't be opened */
  CLOSED = 3,
}

/**
 * String representation of ready states for easier debugging
 */
export type ReadyStateString = 'connecting' | 'open' | 'closing' | 'closed';

/**
 * Convert numeric ready state to string representation
 *
 * @param state - Numeric ready state
 * @returns String representation of the ready state
 *
 * @example
 * ```ts
 * import { readyStateToString, ReadyState } from './transport/websocket.js';
 *
 * console.log(readyStateToString(ReadyState.OPEN)); // "open"
 * ```
 */
export function readyStateToString(state: ReadyState): ReadyStateString {
  switch (state) {
    case ReadyState.CONNECTING:
      return 'connecting';
    case ReadyState.OPEN:
      return 'open';
    case ReadyState.CLOSING:
      return 'closing';
    case ReadyState.CLOSED:
      return 'closed';
  }
}

/**
 * WebSocket error event data
 */
export interface WebSocketError {
  /** Error message */
  message: string;
  /** Original error object if available */
  original?: Error | Event;
  /** Whether the error is recoverable */
  recoverable?: boolean;
}

/**
 * WebSocket close event data
 */
export interface WebSocketClose {
  /** Close status code */
  code: number;
  /** Close reason */
  reason: string;
  /** Whether the close was clean */
  wasClean: boolean;
}

/**
 * Message received from the WebSocket
 */
export interface WebSocketMessage {
  /** Message data as string */
  text?: string;
  /** Message data as ArrayBuffer */
  binary?: ArrayBuffer;
}

/**
 * Event handler types for WebSocket events
 */
export interface WebSocketEventHandlers {
  /** Called when the connection is established */
  onopen?: (event: WebSocketOpenEvent) => void;
  /** Called when the connection is closed */
  onclose?: (event: WebSocketClose) => void;
  /** Called when an error occurs */
  onerror?: (error: WebSocketError) => void;
  /** Called when a text message is received */
  onmessage?: (data: string) => void;
  /** Called when a binary message is received */
  onbinary?: (data: ArrayBuffer) => void;
}

/**
 * WebSocket open event data
 */
export interface WebSocketOpenEvent {
  /** The URL connected to */
  url: string;
  /** Connection timestamp */
  timestamp: number;
}

/**
 * WebSocket transport configuration
 */
export interface WebSocketTransportConfig {
  /** Connection timeout in milliseconds */
  connectTimeoutMs?: number;
  /** Whether to use binary protocol */
  useBinary?: boolean;
  /** Custom WebSocket implementation (for testing or specific environments) */
  WebSocketImpl?: typeof WebSocket;
}

// ============================================================================
// WebSocket Transport Interface
// ============================================================================

/**
 * WebSocket transport interface
 *
 * This interface defines the contract for WebSocket transport implementations.
 * It provides methods for connecting, sending data, and closing the connection,
 * as well as event handlers for connection lifecycle events.
 */
export interface IWebSocketTransport {
  /** The URL this transport is connected to */
  readonly url: string;

  /** Current ready state of the connection */
  readonly readyState: ReadyState;

  /** Current ready state as string */
  readonly readyStateString: ReadyStateString;

  /**
   * Connect to a WebSocket server
   *
   * @param url - The WebSocket URL to connect to
   * @returns Promise that resolves when the connection is established
   */
  connect(url: string): Promise<void>;

  /**
   * Send data through the WebSocket connection
   *
   * @param data - Data to send (string or ArrayBuffer)
   * @throws Error if the connection is not open
   */
  send(data: string | ArrayBuffer): void;

  /**
   * Close the WebSocket connection
   *
   * @param code - Optional close status code (default: 1000)
   * @param reason - Optional close reason
   */
  close(code?: number, reason?: string): void;

  /**
   * Event handler called when the connection is established
   */
  onopen?: ((event: WebSocketOpenEvent) => void) | null;

  /**
   * Event handler called when the connection is closed
   */
  onclose?: ((event: WebSocketClose) => void) | null;

  /**
   * Event handler called when an error occurs
   */
  onerror?: ((error: WebSocketError) => void) | null;

  /**
   * Event handler called when a text message is received
   */
  onmessage?: ((data: string) => void) | null;

  /**
   * Event handler called when a binary message is received
   */
  onbinary?: ((data: ArrayBuffer) => void) | null;
}

// ============================================================================
// Base WebSocket Transport Implementation
// ============================================================================

/**
 * Base WebSocket transport implementation
 *
 * This class provides a cross-platform WebSocket transport that works in both
 * Node.js (with the 'ws' library) and browser environments (using native WebSocket).
 */
export class WebSocketTransport implements IWebSocketTransport {
  private ws: WebSocket | null = null;
  private _url: string = '';
  private _readyState: ReadyState = ReadyState.CLOSED;
  private config: Required<WebSocketTransportConfig>;
  private timeoutManager = new TimeoutManager();

  // Event handlers
  public onopen: ((event: WebSocketOpenEvent) => void) | null = null;
  public onclose: ((event: WebSocketClose) => void) | null = null;
  public onerror: ((error: WebSocketError) => void) | null = null;
  public onmessage: ((data: string) => void) | null = null;
  public onbinary: ((data: ArrayBuffer) => void) | null = null;

  constructor(config: WebSocketTransportConfig = {}) {
    this.config = {
      connectTimeoutMs: config.connectTimeoutMs ?? 30000,
      useBinary: config.useBinary ?? false,
      WebSocketImpl: config.WebSocketImpl ?? this.getDefaultWebSocket(),
    };
  }

  /**
   * Get the default WebSocket implementation for the current environment
   */
  private getDefaultWebSocket(): typeof WebSocket {
    // Browser environment
    if (typeof WebSocket !== 'undefined') {
      return WebSocket;
    }

    // Node.js environment - require 'ws' dynamically
    try {
      const ws = require('ws');
      return ws.WebSocket || ws.default;
    } catch {
      throw new Error(
        "WebSocket is not available. Please install the 'ws' package for Node.js environments."
      );
    }
  }

  /**
   * Get the current URL
   */
  get url(): string {
    return this._url;
  }

  /**
   * Get the current ready state
   */
  get readyState(): ReadyState {
    return this._readyState;
  }

  /**
   * Get the current ready state as a string
   */
  get readyStateString(): ReadyStateString {
    return readyStateToString(this._readyState);
  }

  /**
   * Connect to a WebSocket server
   *
   * @param url - The WebSocket URL to connect to
   * @returns Promise that resolves when the connection is established
   */
  async connect(url: string): Promise<void> {
    if (this._readyState === ReadyState.OPEN || this._readyState === ReadyState.CONNECTING) {
      throw new Error(`Already connected or connecting to ${this._url}`);
    }

    this._url = url;
    this._readyState = ReadyState.CONNECTING;

    return new Promise<void>((resolve, reject) => {
      try {
        // Create WebSocket instance
        const WebSocketImpl = this.config.WebSocketImpl;
        this.ws = new WebSocketImpl(url);

        // Set up connection timeout
        this.timeoutManager.set(
          () => {
            if (this._readyState === ReadyState.CONNECTING) {
              this.cleanup();
              const error: WebSocketError = {
                message: `Connection timeout after ${this.config.connectTimeoutMs}ms`,
                recoverable: true,
              };
              this.handleError(error);
              reject(new Error(error.message));
            }
          },
          this.config.connectTimeoutMs,
          'ws-connect'
        );

        // Set up event handlers
        this.ws.onopen = () => {
          this.timeoutManager.clear('ws-connect');

          this._readyState = ReadyState.OPEN;

          if (this.onopen) {
            this.onopen({
              url: this._url,
              timestamp: Date.now(),
            });
          }

          resolve();
        };

        this.ws.onclose = (event: CloseEvent) => {
          this.timeoutManager.clear('ws-connect');

          // Check if we were still connecting before updating state
          const wasConnecting = this._readyState === ReadyState.CONNECTING;

          this._readyState = ReadyState.CLOSED;

          const closeEvent: WebSocketClose = {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          };

          if (this.onclose) {
            this.onclose(closeEvent);
          }

          // If we were still connecting, reject the promise
          if (wasConnecting) {
            reject(new Error(`Connection closed: ${event.reason} (${event.code})`));
          }
        };

        this.ws.onerror = (event: Event) => {
          this.timeoutManager.clear('ws-connect');

          const error: WebSocketError = {
            message: 'WebSocket error occurred',
            original: event,
            recoverable: true,
          };

          this.handleError(error);

          // If we were connecting, reject the promise and update state
          if (this._readyState === ReadyState.CONNECTING) {
            this._readyState = ReadyState.CLOSED;
            this.cleanup(); // Clean up WebSocket reference to prevent memory leak
            reject(new Error(error.message));
          }
        };

        this.ws.onmessage = (event: MessageEvent) => {
          if (typeof event.data === 'string') {
            if (this.onmessage) {
              this.onmessage(event.data);
            }
          } else if (event.data instanceof ArrayBuffer || ArrayBuffer.isView(event.data)) {
            let buffer: ArrayBuffer;
            if (event.data instanceof ArrayBuffer) {
              buffer = event.data;
            } else {
              // Use buffer.slice to extract the relevant portion
              const sourceBuffer = event.data.buffer;
              buffer = sourceBuffer.slice(
                event.data.byteOffset,
                event.data.byteOffset + event.data.byteLength
              ) as ArrayBuffer;
            }
            if (this.onbinary) {
              this.onbinary(buffer);
            }
          }
        };
      } catch (err) {
        this.cleanup();
        reject(
          new Error(
            `Failed to create WebSocket: ${err instanceof Error ? err.message : String(err)}`
          )
        );
      }
    });
  }

  /**
   * Send data through the WebSocket connection
   *
   * @param data - Data to send (string or ArrayBuffer)
   * @throws Error if the connection is not open
   */
  send(data: string | ArrayBuffer): void {
    if (this._readyState !== ReadyState.OPEN || !this.ws) {
      throw new Error(`Cannot send data: connection is ${this.readyStateString} (expected: open)`);
    }

    try {
      this.ws.send(data);
    } catch (err) {
      const error: WebSocketError = {
        message: `Failed to send data: ${err instanceof Error ? err.message : String(err)}`,
        original: err instanceof Error ? err : undefined,
        recoverable: false,
      };
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Close the WebSocket connection
   *
   * @param code - Optional close status code (default: 1000)
   * @param reason - Optional close reason
   */
  close(code?: number, reason?: string): void {
    if (this._readyState === ReadyState.CLOSED) {
      return;
    }

    this.timeoutManager.clear('ws-connect');

    if (this.ws) {
      this._readyState = ReadyState.CLOSING;
      this.ws.close(code ?? 1000, reason ?? '');
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: WebSocketError): void {
    if (this.onerror) {
      this.onerror(error);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this._readyState = ReadyState.CLOSED;
    this.ws = null;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a WebSocket transport instance
 *
 * @param config - Optional configuration
 * @returns A new WebSocket transport instance
 *
 * @example
 * ```ts
 * import { createWebSocketTransport } from './transport/websocket.js';
 *
 * const transport = createWebSocketTransport({
 *   connectTimeoutMs: 30000
 * });
 * ```
 */
export function createWebSocketTransport(config?: WebSocketTransportConfig): IWebSocketTransport {
  return new WebSocketTransport(config);
}

// ============================================================================
// Re-exports
// ============================================================================

export default WebSocketTransport;
