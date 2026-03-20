/**
 * Browser WebSocket Transport
 *
 * WebSocket transport implementation for browsers using the native `WebSocket` API.
 *
 * @module
 */

import type { IWebSocketTransport, ReadyStateString } from './websocket.js';
import { ReadyState, readyStateToString } from './websocket.js';
import type { WebSocketOpenEvent, WebSocketClose, WebSocketError } from './websocket.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for BrowserWebSocketTransport.
 */
export interface BrowserWebSocketTransportConfig {
  /** WebSocket URL */
  url: string;
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
export class BrowserWebSocketTransport implements IWebSocketTransport {
  private ws: WebSocket | null = null;
  private config: BrowserWebSocketTransportConfig;

  // Ready state
  private _readyState: ReadyState = ReadyState.CLOSED;

  /**
   * Create a browser WebSocket transport.
   *
   * @param config - Transport configuration
   */
  constructor(config: BrowserWebSocketTransportConfig) {
    this.config = config;
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
   *
   * @param url - The WebSocket URL to connect to
   * @returns Promise that resolves when connected
   */
  async connect(url: string): Promise<void> {
    if (this._readyState !== ReadyState.CLOSED) {
      throw new Error('Cannot connect: transport is not closed');
    }

    this._readyState = ReadyState.CONNECTING;

    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        // Connection timeout
        const timeoutId = setTimeout(() => {
          if (this._readyState === ReadyState.CONNECTING) {
            this._readyState = ReadyState.CLOSED;
            if (this.ws) {
              this.ws.close();
              this.ws = null;
            }
            reject(new Error('WebSocket connection timeout'));
          }
        }, 30000);

        // Set up event handlers
        this.ws.onopen = () => {
          clearTimeout(timeoutId);
          this._readyState = ReadyState.OPEN;
          if (this.config.onopen) {
            this.config.onopen({ url, timestamp: Date.now() });
          }
          resolve();
        };

        this.ws.onclose = (event: CloseEvent) => {
          this._readyState = ReadyState.CLOSED;
          if (this.config.onclose) {
            this.config.onclose({
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            });
          }
          // Clean up references after close event is handled
          if (this.ws) {
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws = null;
          }
        };

        this.ws.onerror = (_event: Event) => {
          clearTimeout(timeoutId);
          // Check state before modifying it
          const wasConnecting = this._readyState === ReadyState.CONNECTING;
          // Clean up WebSocket to prevent resource leaks
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
          this._readyState = ReadyState.CLOSED;
          if (wasConnecting) {
            reject(new Error('WebSocket connection failed'));
          }
          if (this.config.onerror) {
            this.config.onerror({
              message: 'WebSocket error',
              original: new Error('WebSocket error'),
              recoverable: true,
            });
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
        reject(error);
      }
    });
  }

  /**
   * Send data through the WebSocket connection.
   *
   * @param data - Data to send (string or ArrayBuffer)
   * @throws Error if the connection is not open
   */
  send(data: string | ArrayBuffer): void {
    if (this._readyState !== ReadyState.OPEN || !this.ws) {
      throw new Error('Cannot send: transport is not open');
    }

    this.ws.send(data);
  }

  /**
   * Close the WebSocket connection.
   *
   * @param code - Optional close status code (default: 1000)
   * @param reason - Optional close reason
   */
  close(code?: number, reason?: string): void {
    if (this.ws) {
      this.ws.close(code, reason);
      this._readyState = ReadyState.CLOSING;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a browser WebSocket transport instance.
 *
 * @param config - Transport configuration
 * @returns A new transport instance
 *
 * @example
 * ```ts
 * import { createBrowserWebSocketTransport } from './transport/browser.js';
 *
 * const transport = createBrowserWebSocketTransport({
 *   url: "ws://localhost:8080"
 * });
 * ```
 */
export function createBrowserWebSocketTransport(
  config: BrowserWebSocketTransportConfig
): BrowserWebSocketTransport {
  return new BrowserWebSocketTransport(config);
}

// ============================================================================
// Re-exports
// ============================================================================

export default BrowserWebSocketTransport;
