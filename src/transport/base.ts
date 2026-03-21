/**
 * Base WebSocket Transport
 *
 * Shared types and utilities for WebSocket transport implementations.
 * Types are defined here to avoid duplication across browser.ts and node.ts.
 *
 * @module
 */

import {
  ReadyState,
  readyStateToString,
  type ReadyStateString,
  type WebSocketError,
  type WebSocketClose,
  type WebSocketOpenEvent,
} from './websocket.js';

// Re-export shared types
export { ReadyState, readyStateToString };
export type { ReadyStateString, WebSocketError, WebSocketClose, WebSocketOpenEvent };

// ============================================================================
// Shared Configuration
// ============================================================================

/**
 * Default connection timeout in milliseconds
 */
export const DEFAULT_CONNECT_TIMEOUT_MS = 30000;
