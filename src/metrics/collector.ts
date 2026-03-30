/**
 * Metrics Collector Interface
 *
 * @module metrics/collector
 * @beta
 *
 * Optional hook interface for collecting SDK observability metrics.
 * Consumers can provide a MetricsCollector implementation to receive
 * telemetry about request latency, connection state changes, and message
 * throughput.
 *
 * When metricsCollector is not provided, the SDK has zero overhead.
 *
 * @example
 * ```ts
 * import { createClient, type MetricsCollector } from 'openclaw-sdk';
 *
 * const myMetrics: MetricsCollector = {
 *   onRequestLatency(method, latencyMs) {
 *     console.log(`Request ${method} took ${latencyMs}ms`);
 *   },
 *   onConnectionStateChange(state, durationMs) {
 *     console.log(`Connection state: ${state} after ${durationMs}ms`);
 *   },
 *   onMessageThroughput(count, periodMs) {
 *     console.log(`${count} messages in ${periodMs}ms`);
 *   },
 * };
 *
 * const client = createClient({
 *   url: "ws://localhost:8080",
 *   clientId: "my-app",
 *   metricsCollector: myMetrics,
 * });
 * ```
 */

/**
 * Metrics Collector callback interface.
 *
 * Implement this interface to receive observability signals from the SDK.
 * All methods are optional — the SDK checks for method existence before
 * calling, ensuring zero overhead when metricsCollector is not provided.
 *
 * @beta
 */
export interface MetricsCollector {
  /**
   * Called after each SDK request completes.
   *
   * @param method - The API method name (e.g., 'chat.send', 'agents.create')
   * @param latencyMs - Request latency in milliseconds
   */
  onRequestLatency?(method: string, latencyMs: number): void;

  /**
   * Called when the connection state changes.
   *
   * @param state - The new connection state (e.g., 'connecting', 'connected', 'disconnected')
   * @param durationMs - Optional time spent in the previous state (milliseconds)
   */
  onConnectionStateChange?(state: string, durationMs?: number): void;

  /**
   * Called periodically with message throughput metrics.
   *
   * @param count - Number of messages in the period
   * @param periodMs - Duration of the measurement period in milliseconds (default 1000)
   */
  onMessageThroughput?(count: number, periodMs: number): void;
}

/**
 * Type guard to check if a value implements MetricsCollector.
 *
 * @param value - Value to check
 * @returns True if value implements MetricsCollector interface
 *
 * @beta
 *
 * @example
 * ```ts
 * import { isMetricsCollector } from 'openclaw-sdk';
 *
 * if (isMetricsCollector(maybeMetrics)) {
 *   maybeMetrics.onRequestLatency('chat.send', 42);
 * }
 * ```
 */
export function isMetricsCollector(value: unknown): value is MetricsCollector {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const mc = value as MetricsCollector;
  // All methods must be functions if present
  if (mc.onRequestLatency !== undefined && typeof mc.onRequestLatency !== 'function') {
    return false;
  }
  if (mc.onConnectionStateChange !== undefined && typeof mc.onConnectionStateChange !== 'function') {
    return false;
  }
  if (mc.onMessageThroughput !== undefined && typeof mc.onMessageThroughput !== 'function') {
    return false;
  }
  return true;
}
