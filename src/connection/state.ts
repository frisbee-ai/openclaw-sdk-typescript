/**
 * Connection State Machine
 *
 * Manages connection state transitions with valid transition enforcement.
 */

import type { ConnectionState } from '../protocol/types.js';

// ============================================================================
// Types
// ============================================================================

export type ClientConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'handshaking'
  | 'authenticating'
  | 'ready'
  | 'reconnecting'
  | 'closed';

/** Valid state transitions map */
const VALID_TRANSITIONS: Record<ClientConnectionState, ClientConnectionState[]> = {
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
  previous: ClientConnectionState;
  current: ClientConnectionState;
}

/** State change listener */
export type StateChangeListener = (event: StateChangeEvent) => void;

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
  private state: ClientConnectionState = 'disconnected';
  private listeners: Set<StateChangeListener> = new Set();

  /**
   * Get current state.
   */
  getState(): ClientConnectionState {
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
  canTransitionTo(newState: ClientConnectionState): boolean {
    const valid = VALID_TRANSITIONS[this.state];
    return valid.includes(newState);
  }

  /**
   * Transition to a new state.
   *
   * @param newState Target state
   * @throws Error if transition is invalid
   */
  transitionTo(newState: ClientConnectionState): void {
    if (!this.canTransitionTo(newState)) {
      throw new Error(
        `Invalid state transition from '${this.state}' to '${newState}'`
      );
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
   */
  reset(): void {
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
   * Emit state change event.
   */
  private emit(event: StateChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a connection state machine.
 */
export function createConnectionStateMachine(): ConnectionStateMachine {
  return new ConnectionStateMachine();
}
