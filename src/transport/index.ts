/**
 * Transport Module - Platform Detection and Exports
 *
 * Automatically detects the runtime environment (Node.js vs browser)
 * and exports the appropriate WebSocket transport implementation.
 */

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Detect if running in browser environment.
 *
 * Uses runtime detection (not build-time) to determine platform.
 * This allows the same bundle to work in both Node.js and browser.
 */
const isBrowser = typeof (globalThis as { window?: unknown }).window !== 'undefined';

/**
 * Get the current platform.
 *
 * Respects FORCE_PLATFORM environment variable for testing purposes.
 * - "node": Force Node.js transport
 * - "browser": Force browser transport
 * - undefined: Auto-detect based on runtime
 */
const platform: 'node' | 'browser' = ((process.env.FORCE_PLATFORM as string) ||
  (isBrowser ? 'browser' : 'node')) as 'node' | 'browser';

// ============================================================================
// Type Exports
// ============================================================================

// Re-export types from websocket.ts
export type { IWebSocketTransport, ReadyState, ReadyStateString } from './websocket.js';
import type { IWebSocketTransport } from './websocket.js';

// Import types for use in function signatures
import type { NodeWebSocketTransportConfig } from './node.js';
import type { BrowserWebSocketTransportConfig } from './browser.js';

// Re-export types from node.ts (used by both transports)
export type { NodeWebSocketTransportConfig, TlsValidator } from './node.js';

// Re-export type from browser.ts
export type { BrowserWebSocketTransportConfig } from './browser.js';

// ============================================================================
// Factory Functions (Dynamic Import)
// ============================================================================

/**
 * Create a WebSocket transport for the current platform.
 *
 * This function automatically selects the appropriate transport implementation
 * based on the runtime environment (Node.js or browser).
 *
 * @param config - Transport configuration (platform-specific)
 * @returns Promise resolving to a new transport instance
 *
 * @example
 * ```ts
 * // Works in both Node.js and browser
 * const transport = await createWebSocketTransport({
 *   url: "wss://example.com",
 *   onopen: (event) => console.log("Connected"),
 * });
 * ```
 */
export async function createWebSocketTransport(
  config: NodeWebSocketTransportConfig | BrowserWebSocketTransportConfig
): Promise<IWebSocketTransport> {
  if (platform === 'node') {
    const { createNodeWebSocketTransport } = await import('./node.js');
    return createNodeWebSocketTransport(config as NodeWebSocketTransportConfig);
  } else {
    const { createBrowserWebSocketTransport } = await import('./browser.js');
    return createBrowserWebSocketTransport(config as BrowserWebSocketTransportConfig);
  }
}

/**
 * Create a Node.js WebSocket transport.
 *
 * Use this function when you explicitly need the Node.js implementation.
 *
 * @param config - Node.js transport configuration
 * @returns Promise resolving to a new NodeWebSocketTransport instance
 */
export async function createNodeWebSocketTransport(
  config: NodeWebSocketTransportConfig
): Promise<IWebSocketTransport> {
  const { createNodeWebSocketTransport: factory } = await import('./node.js');
  return factory(config);
}

/**
 * Create a browser WebSocket transport.
 *
 * Use this function when you explicitly need the browser implementation.
 *
 * @param config - Browser transport configuration
 * @returns Promise resolving to a new BrowserWebSocketTransport instance
 */
export async function createBrowserWebSocketTransport(
  config: BrowserWebSocketTransportConfig
): Promise<IWebSocketTransport> {
  const { createBrowserWebSocketTransport: factory } = await import('./browser.js');
  return factory(config);
}

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export is the factory function for the current platform.
 */
export { createWebSocketTransport as default };
