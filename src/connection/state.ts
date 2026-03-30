/**
 * Connection State Types
 *
 * @module
 */

import type { ConnectionState } from '../protocol/connection-state.js';
import type { MetricsCollector } from '../metrics/collector.js';
import { type Logger, LogLevel } from '../types/logger.js';

// ============================================================================
// Types
// ============================================================================

/** Valid state transitions map */
const VALID_TRANSITIONS: Record<ConnectionState, ConnectionState[]> = {
  disconnected: ['connecting'],
  connecting: ['handshaking', 'disconnected', 'closed'],
  handshaking: ['authenticating', 'reconnecting', 'disconnected', 'closed'],
  authenticating: ['ready', 'reconnecting', 'disconnected', 'closed'],
  ready: ['reconnecting', 'disconnected', 'closed'],
  reconnecting: ['connecting', 'handshaking', 'authenticating', 'ready', 'disconnected', 'closed'],
  closed: ['disconnected'],
};

/** State change event */
export interface StateChangeEvent {
  previous: ConnectionState;
  current: ConnectionState;
}

/** State change listener */
export type StateChangeListener = (event: StateChangeEvent) => void;

/** Error handler for listener errors */
export type StateChangeListenerErrorHandler = (error: {
  error: unknown;
  event: StateChangeEvent;
}) => void;

// ============================================================================
// State Machine
// ============================================================================

/**
 * Connection state machine with valid transition enforcement.
 *
 * States:
 * - `disconnected`: Initial state, no connection
 * - `connecting`: TCP/TLS connection in progress
 * - `handshaking`: Protocol handshake in progress
 * - `authenticating`: Authentication in progress
 * - `ready`: Fully connected and authenticated
 * - `reconnecting`: Attempting to reconnect after disconnect
 * - `closed`: Connection closed (terminal state)
 */
export class ConnectionStateMachine {
  private state: ConnectionState = 'disconnected';
  private listeners: Set<StateChangeListener> = new Set();
  private listenerErrorHandler: StateChangeListenerErrorHandler | null = null;
  private logger: Logger;
  private lastStateAt: number = Date.now();
  private metricsCollector: MetricsCollector | undefined;

  constructor(logger?: Logger) {
    this.logger = logger ?? {
      name: 'state-machine',
      level: LogLevel.Error,
      debug() {},
      info() {},
      warn() {},
       
      error(message: string, meta?: Record<string, unknown>) {
        console.error(message, meta ?? '');
      },
    };
  }

  /**
   * Set the metrics collector for observability reporting.
   *
   * @param collector - Metrics collector instance or undefined to disable
   */
  setMetricsCollector(collector: MetricsCollector | undefined): void {
    this.metricsCollector = collector;
  }

  /**
   * Get current state.
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if currently connected (handshaking or later).
   */
  isConnected(): boolean {
    return (
      this.state === 'connecting' ||
      this.state === 'handshaking' ||
      this.state === 'authenticating' ||
      this.state === 'ready'
    );
  }

  /**
   * Check if ready for requests.
   */
  isReady(): boolean {
    return this.state === 'ready';
  }

  /**
   * Check if can transition to a new state.
   */
  canTransitionTo(newState: ConnectionState): boolean {
    const valid = VALID_TRANSITIONS[this.state];
    return valid.includes(newState);
  }

  /**
   * Transition to a new state.
   *
   * @param newState Target state
   * @throws Error if transition is invalid
   */
  transitionTo(newState: ConnectionState): void {
    if (!this.canTransitionTo(newState)) {
      throw new Error(`Invalid state transition from '${this.state}' to '${newState}'`);
    }

    const previous = this.state;
    this.state = newState;
    this.emit({ previous, current: newState });
  }

  /**
   * Transition to connecting (convenience method).
   */
  connect(): void {
    this.transitionTo('connecting');
  }

  /**
   * Transition to handshaking (convenience method).
   */
  startHandshake(): void {
    this.transitionTo('handshaking');
  }

  /**
   * Transition to authenticating (convenience method).
   */
  startAuth(): void {
    this.transitionTo('authenticating');
  }

  /**
   * Transition to ready (convenience method).
   */
  ready(): void {
    this.transitionTo('ready');
  }

  /**
   * Transition to reconnecting (convenience method).
   */
  startReconnect(): void {
    this.transitionTo('reconnecting');
  }

  /**
   * Transition to disconnected (convenience method).
   */
  disconnect(): void {
    this.transitionTo('disconnected');
  }

  /**
   * Close connection (terminal state).
   */
  close(): void {
    this.transitionTo('closed');
  }

  /**
   * Reset to disconnected state.
   * Does NOT emit events - designed to be called after disconnect() already
   * triggered a state change, to ensure state machine is in consistent state.
   */
  reset(): void {
    // Reset state without emitting events.
    // This is called after ConnectionManager.disconnect() already triggered
    // the state change event, to ensure state machine is in known state.
    this.state = 'disconnected';
  }

  /**
   * Add a state change listener.
   */
  onChange(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Set a callback for handling errors thrown by state change listeners.
   *
   * By default, listener errors are silently ignored to prevent one buggy
   * listener from breaking the entire state machine flow. Use this method to
   * customize error handling (e.g., logging to error tracking service).
   *
   * @param handler - Callback function to handle listener errors
   */
  onListenerError(handler: StateChangeListenerErrorHandler | null): void {
    this.listenerErrorHandler = handler;
  }

  /**
   * Emit state change event.
   */
  private emit(event: StateChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        if (this.listenerErrorHandler) {
          this.listenerErrorHandler({ error, event });
        } else {
          this.logger.error('Error in state change listener:', { error: String(error) });
        }
      }
    }

    // Report state change metrics if collector is registered
    if (this.metricsCollector) {
      const durationMs = Date.now() - this.lastStateAt;
      this.metricsCollector.onConnectionStateChange?.(event.current, durationMs);
      this.lastStateAt = Date.now();
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a connection state machine.
 *
 * @returns A new ConnectionStateMachine instance
 *
 * @example
 * ```ts
 * import { createConnectionStateMachine } from './connection/state.js';
 *
 * const stateMachine = createConnectionStateMachine();
 *
 * stateMachine.onChange((event) => {
 *   console.log(`State: ${event.previous} -> ${event.current}`);
 * });
 *
 * stateMachine.transitionTo('connecting');
 * ```
 */
export function createConnectionStateMachine(logger?: Logger): ConnectionStateMachine {
  return new ConnectionStateMachine(logger);
}
