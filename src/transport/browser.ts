/**
 * Browser WebSocket Transport
 *
 * WebSocket transport implementation for browsers using the native `WebSocket` API.
 *
 * @module
 */

import { TimeoutManager } from '../utils/timeoutManager.js';
import {
  ReadyState,
  readyStateToString,
  type ReadyStateString,
  type WebSocketError,
  type WebSocketClose,
  type WebSocketOpenEvent,
} from './base.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for BrowserWebSocketTransport.
 */
export interface BrowserWebSocketTransportConfig {
  /** WebSocket URL */
  url: string;
  /** Connection timeout in milliseconds */
  connectTimeoutMs?: number;
  /** Event handler called when connection opens */
  onopen?: ((event: WebSocketOpenEvent) => void) | null;
  /** Event handler called when connection closes */
  onclose?: ((event: WebSocketClose) => void) | null;
  /** Event handler called when error occurs */
  onerror?: ((error: WebSocketError) => void) | null;
  /** Event handler called when text message received */
  onmessage?: ((data: string) => void) | null;
  /** Event handler called when binary message received */
  onbinary?: ((data: ArrayBuffer) => void) | null;
}

// ============================================================================
// Browser WebSocket Transport
// ============================================================================

/**
 * WebSocket transport implementation for browsers.
 *
 * Uses the native browser `WebSocket` API for WebSocket connectivity.
 */
export class BrowserWebSocketTransport {
  private ws: WebSocket | null = null;
  private config: BrowserWebSocketTransportConfig;
  private _readyState: ReadyState = ReadyState.CLOSED;
  private timeoutManager = new TimeoutManager();

  /**
   * Create a browser WebSocket transport.
   */
  constructor(config: BrowserWebSocketTransportConfig) {
    this.config = {
      connectTimeoutMs: 30000,
      ...config,
    };
  }

  /**
   * Get the WebSocket URL.
   */
  get url(): string {
    return this.config.url;
  }

  /**
   * Get the current ready state.
   */
  get readyState(): ReadyState {
    return this._readyState;
  }

  /**
   * Get the ready state as a string.
   */
  get readyStateString(): ReadyStateString {
    return readyStateToString(this._readyState);
  }

  /**
   * Connect to a WebSocket server.
   */
  async connect(url: string): Promise<void> {
    if (this._readyState !== ReadyState.CLOSED) {
      throw new Error('Cannot connect: transport is not closed');
    }

    this._readyState = ReadyState.CONNECTING;

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      try {
        this.ws = new WebSocket(url);

        // Connection timeout
        this.timeoutManager.set(
          () => {
            if (this._readyState === ReadyState.CONNECTING) {
              this.cleanup();
              const error: WebSocketError = {
                message: `Connection timeout after ${this.config.connectTimeoutMs}ms`,
                recoverable: true,
              };
              this.handleError(error);
              if (!settled) {
                settled = true;
                reject(new Error(error.message));
              }
            }
          },
          this.config.connectTimeoutMs!,
          'ws-connect'
        );

        // Set up event handlers
        this.ws.onopen = () => {
          if (settled) return;
          settled = true;
          this.timeoutManager.clear('ws-connect');
          this._readyState = ReadyState.OPEN;
          if (this.config.onopen) {
            this.config.onopen({ url, timestamp: Date.now() });
          }
          resolve();
        };

        this.ws.onclose = (event: CloseEvent) => {
          this.timeoutManager.clear('ws-connect');
          const wasConnecting = this._readyState === ReadyState.CONNECTING;
          this._readyState = ReadyState.CLOSED;
          if (this.config.onclose) {
            this.config.onclose({
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            });
          }
          // Clean up references after close event is handled
          this.cleanup();
          if (wasConnecting && !settled) {
            settled = true;
            reject(new Error(`Connection closed: ${event.reason} (${event.code})`));
          }
        };

        this.ws.onerror = (_event: Event) => {
          this.timeoutManager.clear('ws-connect');
          const wasConnecting = this._readyState === ReadyState.CONNECTING;
          this.cleanup();
          this._readyState = ReadyState.CLOSED;
          const error: WebSocketError = {
            message: 'WebSocket error occurred',
            recoverable: true,
          };
          this.handleError(error);
          if (wasConnecting && !settled) {
            settled = true;
            reject(new Error(error.message));
          }
        };

        this.ws.onmessage = (event: MessageEvent) => {
          if (event.data instanceof ArrayBuffer) {
            if (this.config.onbinary) {
              this.config.onbinary(event.data);
            }
          } else if (typeof event.data === 'string') {
            if (this.config.onmessage) {
              this.config.onmessage(event.data);
            }
          }
        };
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Send data through the WebSocket connection.
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
   * Close the WebSocket connection.
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
   * Handle errors consistently.
   */
  private handleError(error: WebSocketError): void {
    if (this.config.onerror) {
      this.config.onerror(error);
    }
  }

  /**
   * Clean up resources.
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
 * Create a browser WebSocket transport instance.
 */
export function createBrowserWebSocketTransport(
  config: BrowserWebSocketTransportConfig
): BrowserWebSocketTransport {
  return new BrowserWebSocketTransport(config);
}

export default BrowserWebSocketTransport;
