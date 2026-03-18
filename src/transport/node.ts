/**
 * Node.js WebSocket Transport
 *
 * WebSocket transport implementation for Node.js using the `ws` package.
 */

import { WebSocket as WS } from "ws";
import type { TLSSocket } from "tls";
import {
  ReadyState,
  readyStateToString,
  type ReadyStateString,
} from "./websocket.js";

// ============================================================================
// Types
// ============================================================================

/**
 * TLS validator function type.
 *
 * @param socket - The TLS socket to validate
 * @returns true to accept connection, false to reject
 */
export type TlsValidator = (socket: TLSSocket) => boolean | void;

/**
 * Configuration for NodeWebSocketTransport.
 */
export interface NodeWebSocketTransportConfig {
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
  /** TLS validation hook */
  tlsValidator?: TlsValidator;
}

/**
 * WebSocket open event.
 */
export interface WebSocketOpenEvent {
  /** The target URL */
  target: string;
}

/**
 * WebSocket close event.
 */
export interface WebSocketClose {
  /** Close code */
  code: number;
  /** Close reason */
  reason: string;
  /** Whether close was clean */
  wasClean: boolean;
}

/**
 * WebSocket error.
 */
export interface WebSocketError {
  /** Error message */
  message: string;
  /** Original error */
  error: Error;
}

// Re-export ReadyStateString from websocket module for consistency
export type { ReadyStateString } from "./websocket.js";

// ============================================================================
// Node.js WebSocket Transport
// ============================================================================

/**
 * WebSocket transport implementation for Node.js.
 *
 * Uses the `ws` package for WebSocket connectivity.
 */
export class NodeWebSocketTransport {
  private ws: WS | null = null;
  private config: NodeWebSocketTransportConfig;

  // Ready state
  private _readyState: ReadyState = ReadyState.CLOSED;

  /**
   * Create a Node.js WebSocket transport.
   *
   * @param config - Transport configuration
   */
  constructor(config: NodeWebSocketTransportConfig) {
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
      throw new Error("Cannot connect: transport is not closed");
    }

    this._readyState = ReadyState.CONNECTING;

    return new Promise<void>((resolve, reject) => {
      try {
        // Prepare WebSocket options
        const options: Record<string, unknown> = {};

        // Add TLS validator if provided
        if (this.config.tlsValidator) {
          options.rejectUnauthorized = false;
        }

        this.ws = new WS(url, options);

        // Set up event handlers
        this.ws.on("open", () => {
          this._readyState = ReadyState.OPEN;
          if (this.config.onopen) {
            this.config.onopen({ target: url });
          }
          resolve();
        });

        this.ws.on("close", (code: number, reason: Buffer) => {
          this._readyState = ReadyState.CLOSED;
          if (this.config.onclose) {
            this.config.onclose({
              code,
              reason: reason.toString(),
              wasClean: code === 1000,
            });
          }
        });

        this.ws.on("error", (error: Error) => {
          if (this._readyState === ReadyState.CONNECTING) {
            reject(error);
          }
          if (this.config.onerror) {
            this.config.onerror({ message: error.message, error });
          }
        });

        this.ws.on("message", (data: Buffer, isBinary: boolean) => {
          if (isBinary && this.config.onbinary) {
            // Convert Buffer to ArrayBuffer
            const arrayBuffer = data.buffer.slice(
              data.byteOffset,
              data.byteOffset + data.byteLength,
            ) as ArrayBuffer;
            this.config.onbinary(arrayBuffer);
          } else if (!isBinary && this.config.onmessage) {
            this.config.onmessage(data.toString("utf-8"));
          }
        });
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
      throw new Error("Cannot send: transport is not open");
    }

    if (typeof data === "string") {
      this.ws.send(data);
    } else {
      // Convert ArrayBuffer to Buffer for ws package
      this.ws.send(Buffer.from(data));
    }
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
 * Create a Node.js WebSocket transport instance.
 *
 * @param config - Transport configuration
 * @returns A new transport instance
 */
export function createNodeWebSocketTransport(
  config: NodeWebSocketTransportConfig,
): NodeWebSocketTransport {
  return new NodeWebSocketTransport(config);
}

// ============================================================================
// Re-exports
// ============================================================================

export default NodeWebSocketTransport;
