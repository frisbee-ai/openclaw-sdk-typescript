/**
 * Browser WebSocket Transport
 *
 * WebSocket transport implementation for browsers using the native `WebSocket` API.
 * Thin subclass: only createWebSocketInstance() and serialize() differ from base.
 *
 * @module
 */

import {
  WebSocketTransport,
  type WebSocketTransportConfig,
  type WebSocketOpenEvent,
  type WebSocketClose,
  type WebSocketError,
  type ReadyStateString,
} from './websocket.js';
import { ReadyState, readyStateToString } from './base.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for BrowserWebSocketTransport.
 */
export interface BrowserWebSocketTransportConfig extends WebSocketTransportConfig {
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
// Browser WebSocket Transport (Thin Subclass)
// ============================================================================

/**
 * WebSocket transport implementation for browsers.
 *
 * Thin subclass: all shared behavior (connect, send, close, error handling)
 * is inherited from WebSocketTransport. This class only overrides:
 *   - createWebSocketInstance() — how WebSocket is instantiated
 *   - serialize() — how binary data is formatted for sending
 *
 * Uses the native browser `WebSocket` API for WebSocket connectivity.
 */
export class BrowserWebSocketTransport extends WebSocketTransport {
  private browserConfig: Required<BrowserWebSocketTransportConfig>;

  constructor(config: BrowserWebSocketTransportConfig) {
    const { url, ...rest } = config;
    super({ connectTimeoutMs: rest.connectTimeoutMs ?? 30000 });
    this.browserConfig = {
      ...rest,
      url,
      connectTimeoutMs: rest.connectTimeoutMs ?? 30000,
      onopen: rest.onopen ?? null,
      onclose: rest.onclose ?? null,
      onerror: rest.onerror ?? null,
      onmessage: rest.onmessage ?? null,
      onbinary: rest.onbinary ?? null,
    } as Required<BrowserWebSocketTransportConfig>;
    // Wire config handlers to base class's public handlers
    this.onopen = this.browserConfig.onopen;
    this.onclose = this.browserConfig.onclose;
    this.onerror = this.browserConfig.onerror;
    this.onmessage = this.browserConfig.onmessage;
    this.onbinary = this.browserConfig.onbinary;
  }

  get url(): string {
    return this.browserConfig.url;
  }

  get readyState(): ReadyState {
    return super.readyState;
  }

  get readyStateString(): ReadyStateString {
    return readyStateToString(super.readyState);
  }

  protected createWebSocketInstance(url: string, _options?: Record<string, unknown>): WebSocket {
    // Browser: native WebSocket, no options needed
    return new WebSocket(url);
  }

  protected serialize(data: string | ArrayBuffer): string | ArrayBuffer {
    // Browser: ArrayBuffer is natively supported, return as-is
    return data;
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
