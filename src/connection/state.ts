/**
 * Connection State Types
 *
 * @module
 */

// ============================================================================
// Types
// ============================================================================

/** Client connection states */
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
  private state: ClientConnectionState = 'disconnected';
  private listeners: Set<StateChangeListener> = new Set();
  private listenerErrorHandler: StateChangeListenerErrorHandler | null = null;

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
   * Emits a state change event from the previous state to 'disconnected'.
   */
  reset(): void {
    const previous = this.state;
    this.state = 'disconnected';
    if (previous !== 'disconnected') {
      this.emit({ previous, current: 'disconnected' });
    }
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
          console.error('Error in state change listener:', error);
        }
      }
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
 * stateMachine.onStateChange((event) => {
 *   console.log(`State: ${event.previousState} -> ${event.newState}`);
 * });
 *
 * stateMachine.transition('connecting');
 * ```
 */
export function createConnectionStateMachine(): ConnectionStateMachine {
  return new ConnectionStateMachine();
}
