/**
 * Node.js WebSocket Transport
 *
 * WebSocket transport implementation for Node.js using the `ws` package.
 *
 * @module
 */

import { WebSocket as WS } from 'ws';
import type { TLSSocket } from 'tls';
import { TimeoutManager } from '../utils/timeoutManager.js';
import { ReadyState, readyStateToString, type ReadyStateString } from './base.js';

// ============================================================================
// Types
// ============================================================================

/**
 * WebSocket open event (Node.js version).
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
 * WebSocket error (Node.js version).
 */
export interface WebSocketError {
  /** Error message */
  message: string;
  /** Original error */
  error: Error;
}

/**
 * TLS validator function type.
 */
export type TlsValidator = (socket: TLSSocket) => boolean | void;

/**
 * Configuration for NodeWebSocketTransport.
 */
export interface NodeWebSocketTransportConfig {
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
  /** TLS validation hook */
  tlsValidator?: TlsValidator;
}

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
  private _readyState: ReadyState = ReadyState.CLOSED;
  private timeoutManager = new TimeoutManager();

  /**
   * Create a Node.js WebSocket transport.
   */
  constructor(config: NodeWebSocketTransportConfig) {
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
        const options: Record<string, unknown> = {};

        if (this.config.tlsValidator) {
          options.rejectUnauthorized = false;
        }

        this.ws = new WS(url, options);

        // Connection timeout
        this.timeoutManager.set(
          () => {
            if (this._readyState === ReadyState.CONNECTING) {
              this.cleanup();
              const error: WebSocketError = {
                message: `Connection timeout after ${this.config.connectTimeoutMs}ms`,
                error: new Error(`Connection timeout after ${this.config.connectTimeoutMs}ms`),
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

        this.ws.on('open', () => {
          if (settled) return;
          settled = true;
          this.timeoutManager.clear('ws-connect');
          this._readyState = ReadyState.OPEN;
          if (this.config.onopen) {
            this.config.onopen({ target: url });
          }
          resolve();
        });

        this.ws.on('close', (code: number, reason: Buffer) => {
          this.timeoutManager.clear('ws-connect');
          const wasConnecting = this._readyState === ReadyState.CONNECTING;
          this._readyState = ReadyState.CLOSED;
          if (this.config.onclose) {
            this.config.onclose({
              code,
              reason: reason.toString(),
              wasClean: code === 1000,
            });
          }
          this.cleanup();
          if (wasConnecting && !settled) {
            settled = true;
            reject(new Error(`Connection closed: ${reason.toString()} (${code})`));
          }
        });

        this.ws.on('error', (error: Error) => {
          this.timeoutManager.clear('ws-connect');
          const wasConnecting = this._readyState === ReadyState.CONNECTING;
          this.cleanup();
          this._readyState = ReadyState.CLOSED;
          const wsError: WebSocketError = {
            message: error.message,
            error,
          };
          this.handleError(wsError);
          if (wasConnecting && !settled) {
            settled = true;
            reject(error);
          }
        });

        this.ws.on('message', (data: Buffer, isBinary: boolean) => {
          if (isBinary && this.config.onbinary) {
            const arrayBuffer = data.buffer.slice(
              data.byteOffset,
              data.byteOffset + data.byteLength
            ) as ArrayBuffer;
            this.config.onbinary(arrayBuffer);
          } else if (!isBinary && this.config.onmessage) {
            this.config.onmessage(data.toString('utf-8'));
          }
        });
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
      if (typeof data === 'string') {
        this.ws.send(data);
      } else {
        this.ws.send(Buffer.from(data));
      }
    } catch (err) {
      const error: WebSocketError = {
        message: `Failed to send data: ${err instanceof Error ? err.message : String(err)}`,
        error: err instanceof Error ? err : new Error(String(err)),
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
 * Create a Node.js WebSocket transport instance.
 */
export function createNodeWebSocketTransport(
  config: NodeWebSocketTransportConfig
): NodeWebSocketTransport {
  return new NodeWebSocketTransport(config);
}

export default NodeWebSocketTransport;
