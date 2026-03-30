/**
 * Node.js WebSocket Transport
 *
 * WebSocket transport implementation for Node.js using the `ws` package.
 * Thin subclass: only createWebSocketInstance() and serialize() differ from base.
 *
 * @module
 */

import { WebSocket as WS } from 'ws';
import type { TLSSocket } from 'tls';
import {
  WebSocketTransport,
  type WebSocketTransportConfig,
  type WebSocketOpenEvent,
  type WebSocketClose,
  type WebSocketError as BaseWebSocketError,
} from './websocket.js';
import { ReadyState, readyStateToString, type ReadyStateString } from './base.js';

// ============================================================================
// Types
// ============================================================================

/**
 * TLS validator function type.
 */
export type TlsValidator = (socket: TLSSocket) => boolean | void;

/**
 * Configuration for NodeWebSocketTransport.
 */
export interface NodeWebSocketTransportConfig extends WebSocketTransportConfig {
  /** WebSocket URL */
  url: string;
  /** Event handler called when connection opens */
  onopen?: ((event: WebSocketOpenEvent) => void) | null;
  /** Event handler called when connection closes */
  onclose?: ((event: WebSocketClose) => void) | null;
  /** Event handler called when error occurs */
  onerror?: ((error: BaseWebSocketError) => void) | null;
  /** Event handler called when text message received */
  onmessage?: ((data: string) => void) | null;
  /** Event handler called when binary message received */
  onbinary?: ((data: ArrayBuffer) => void) | null;
  /** TLS validation hook */
  tlsValidator?: TlsValidator;
}

// ============================================================================
// Node.js WebSocket Transport (Thin Subclass)
// ============================================================================

/**
 * WebSocket transport implementation for Node.js.
 *
 * Thin subclass: all shared behavior (connect, send, close, error handling)
 * is inherited from WebSocketTransport. This class only overrides:
 *   - createWebSocketInstance() — how WS is instantiated
 *   - serialize() — how binary data is formatted for ws
 *
 * Uses the `ws` package for WebSocket connectivity.
 */
export class NodeWebSocketTransport extends WebSocketTransport {
  private nodeConfig: Required<NodeWebSocketTransportConfig>;

  constructor(config: NodeWebSocketTransportConfig) {
    const { url, tlsValidator, ...rest } = config;
    super({ connectTimeoutMs: rest.connectTimeoutMs ?? 30000 });
    this.nodeConfig = {
      ...rest,
      url,
      connectTimeoutMs: rest.connectTimeoutMs ?? 30000,
      onopen: rest.onopen ?? null,
      onclose: rest.onclose ?? null,
      onerror: rest.onerror ?? null,
      onmessage: rest.onmessage ?? null,
      onbinary: rest.onbinary ?? null,
      ...(tlsValidator ? { tlsValidator } : {}),
    } as Required<NodeWebSocketTransportConfig>;
    // Wire config handlers to base class's public handlers
    this.onopen = this.nodeConfig.onopen;
    this.onclose = this.nodeConfig.onclose;
    this.onerror = this.nodeConfig.onerror;
    this.onmessage = this.nodeConfig.onmessage;
    this.onbinary = this.nodeConfig.onbinary;
  }

  get url(): string {
    return this.nodeConfig.url;
  }

  get readyState(): ReadyState {
    return super.readyState;
  }

  get readyStateString(): ReadyStateString {
    return readyStateToString(super.readyState);
  }

  protected createWebSocketInstance(url: string, _options?: Record<string, unknown>): WebSocket {
    const options: Record<string, unknown> = {};
    if (this.nodeConfig.tlsValidator !== undefined) {
      options.rejectUnauthorized = false;
    }
    return new WS(url, options) as unknown as WebSocket;
  }

  protected serialize(data: string | ArrayBuffer): string | ArrayBuffer {
    return typeof data === 'string' ? data : (Buffer.from(data) as unknown as ArrayBuffer);
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
