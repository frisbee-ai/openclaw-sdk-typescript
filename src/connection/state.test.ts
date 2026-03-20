/**
 * Connection State Machine Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionStateMachine, createConnectionStateMachine } from './state.js';
import type { ConnectionState } from '../protocol/types.js';

describe('ConnectionStateMachine', () => {
  let stateMachine: ConnectionStateMachine;

  beforeEach(() => {
    stateMachine = createConnectionStateMachine();
  });

  describe('onListenerError', () => {
    it('should call custom error handler when listener throws', () => {
      const errorHandler = vi.fn();
      stateMachine.onListenerError(errorHandler);

      const badListener = () => {
        throw new Error('Listener error');
      };

      stateMachine.onChange(badListener);
      stateMachine.transitionTo('connecting');

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        event: expect.objectContaining({
          previous: 'disconnected',
          current: 'connecting',
        }),
      });
      expect((errorHandler.mock.calls[0][0] as { error: Error }).error.message).toBe(
        'Listener error'
      );
    });

    it('should include state change event details in error handler call', () => {
      const errorHandler = vi.fn();
      stateMachine.onListenerError(errorHandler);

      stateMachine.onChange(() => {
        throw new Error('Test error');
      });

      stateMachine.transitionTo('connecting');

      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        event: expect.objectContaining({
          previous: 'disconnected',
          current: 'connecting',
        }),
      });
    });

    it('should allow removing error handler by passing null', () => {
      const errorHandler = vi.fn();
      stateMachine.onListenerError(errorHandler);
      stateMachine.onListenerError(null);

      stateMachine.onChange(() => {
        throw new Error('Should not be caught');
      });

      stateMachine.transitionTo('connecting');

      // Should not call the error handler when it's null
      expect(errorHandler).not.toHaveBeenCalled();
    });

    it('should continue processing other listeners after one throws', () => {
      const errorHandler = vi.fn();
      stateMachine.onListenerError(errorHandler);

      const results: string[] = [];

      stateMachine.onChange(() => {
        results.push('listener1');
      });

      stateMachine.onChange(() => {
        results.push('listener2');
        throw new Error('Listener2 error');
      });

      stateMachine.onChange(() => {
        results.push('listener3');
      });

      stateMachine.transitionTo('connecting');

      expect(results).toEqual(['listener1', 'listener2', 'listener3']);
      expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple errors from different listeners', () => {
      const errorHandler = vi.fn();
      stateMachine.onListenerError(errorHandler);

      stateMachine.onChange(() => {
        throw new Error('Error 1');
      });

      stateMachine.onChange(() => {
        throw new Error('Error 2');
      });

      stateMachine.transitionTo('connecting');

      expect(errorHandler).toHaveBeenCalledTimes(2);
      expect((errorHandler.mock.calls[0][0] as { error: Error }).error.message).toBe('Error 1');
      expect((errorHandler.mock.calls[1][0] as { error: Error }).error.message).toBe('Error 2');
    });

    it('should not call error handler for successful listeners', () => {
      const errorHandler = vi.fn();
      stateMachine.onListenerError(errorHandler);

      stateMachine.onChange(() => {
        // Successful listener
      });

      stateMachine.transitionTo('connecting');

      expect(errorHandler).not.toHaveBeenCalled();
    });

    it('should include full state change details in error context', () => {
      const errorHandler = vi.fn();
      stateMachine.onListenerError(errorHandler);

      stateMachine.onChange(() => {
        throw new Error('State change error');
      });

      // Chain multiple transitions
      stateMachine.transitionTo('connecting');
      stateMachine.transitionTo('handshaking');

      expect(errorHandler).toHaveBeenCalledTimes(2);

      // First call
      expect(
        (
          errorHandler.mock.calls[0][0] as {
            event: { previous: string; current: string };
          }
        ).event
      ).toEqual({
        previous: 'disconnected',
        current: 'connecting',
      });

      // Second call
      expect(
        (
          errorHandler.mock.calls[1][0] as {
            event: { previous: string; current: string };
          }
        ).event
      ).toEqual({
        previous: 'connecting',
        current: 'handshaking',
      });
    });
  });

  describe('initial state', () => {
    it('should start in disconnected state', () => {
      expect(stateMachine.getState()).toBe('disconnected');
    });

    it('should not be connected initially', () => {
      expect(stateMachine.isConnected()).toBe(false);
    });

    it('should not be ready initially', () => {
      expect(stateMachine.isReady()).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('should transition from disconnected to connecting', () => {
      stateMachine.connect();

      expect(stateMachine.getState()).toBe('connecting');
    });

    it('should transition from connecting to handshaking', () => {
      stateMachine.connect();
      stateMachine.startHandshake();

      expect(stateMachine.getState()).toBe('handshaking');
    });

    it('should transition from handshaking to authenticating', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();

      expect(stateMachine.getState()).toBe('authenticating');
    });

    it('should transition from authenticating to ready', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(stateMachine.getState()).toBe('ready');
    });

    it('should transition from ready to reconnecting', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      stateMachine.startReconnect();

      expect(stateMachine.getState()).toBe('reconnecting');
    });

    it('should transition from reconnecting back to connecting', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      stateMachine.startReconnect();
      stateMachine.connect();

      expect(stateMachine.getState()).toBe('connecting');
    });

    it('should transition to disconnected from any state', () => {
      stateMachine.connect();
      stateMachine.disconnect();

      expect(stateMachine.getState()).toBe('disconnected');

      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.disconnect();

      expect(stateMachine.getState()).toBe('disconnected');
    });

    it('should transition to closed from most states', () => {
      stateMachine.connect();
      stateMachine.close();

      expect(stateMachine.getState()).toBe('closed');
    });

    it('should allow transition from closed to disconnected', () => {
      stateMachine.connect();
      stateMachine.close();
      stateMachine.disconnect(); // Must go through disconnected first

      expect(stateMachine.getState()).toBe('disconnected');

      // Now can connect again
      stateMachine.connect();
      expect(stateMachine.getState()).toBe('connecting');
    });
  });

  describe('invalid transitions', () => {
    it('should reject transition from ready to handshaking', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(() => {
        stateMachine.startHandshake();
      }).toThrow('Invalid state transition');
    });

    it('should reject transition from connecting to ready', () => {
      stateMachine.connect();

      expect(() => {
        stateMachine.ready();
      }).toThrow('Invalid state transition');
    });

    it('should reject transition from disconnected to ready', () => {
      expect(() => {
        stateMachine.ready();
      }).toThrow('Invalid state transition');
    });

    it('should reject transition from closed to ready', () => {
      stateMachine.connect();
      stateMachine.close();

      expect(() => {
        stateMachine.ready();
      }).toThrow('Invalid state transition');
    });
  });

  describe('state query methods', () => {
    it('should return true for isConnected when in connecting state', () => {
      stateMachine.connect();

      expect(stateMachine.isConnected()).toBe(true);
    });

    it('should return true for isConnected when in handshaking state', () => {
      stateMachine.connect();
      stateMachine.startHandshake();

      expect(stateMachine.isConnected()).toBe(true);
    });

    it('should return true for isConnected when in authenticating state', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();

      expect(stateMachine.isConnected()).toBe(true);
    });

    it('should return true for isConnected when in ready state', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(stateMachine.isConnected()).toBe(true);
    });

    it('should return false for isConnected when in disconnected state', () => {
      expect(stateMachine.isConnected()).toBe(false);
    });

    it('should return false for isConnected when in closed state', () => {
      stateMachine.connect();
      stateMachine.close();

      expect(stateMachine.isConnected()).toBe(false);
    });

    it('should return true for isReady only in ready state', () => {
      stateMachine.connect();
      expect(stateMachine.isReady()).toBe(false);

      stateMachine.startHandshake();
      expect(stateMachine.isReady()).toBe(false);

      stateMachine.startAuth();
      expect(stateMachine.isReady()).toBe(false);

      stateMachine.ready();
      expect(stateMachine.isReady()).toBe(true);

      stateMachine.disconnect();
      expect(stateMachine.isReady()).toBe(false);
    });
  });

  describe('canTransitionTo', () => {
    it('should return true for valid transitions', () => {
      stateMachine.connect();

      expect(stateMachine.canTransitionTo('handshaking')).toBe(true);
      expect(stateMachine.canTransitionTo('disconnected')).toBe(true);
      expect(stateMachine.canTransitionTo('closed')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      stateMachine.connect();

      expect(stateMachine.canTransitionTo('ready')).toBe(false);
      expect(stateMachine.canTransitionTo('authenticating')).toBe(false);
    });

    it('should allow all transitions from reconnecting', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      stateMachine.startReconnect();

      // From reconnecting, can go to many states
      expect(stateMachine.canTransitionTo('connecting')).toBe(true);
      expect(stateMachine.canTransitionTo('handshaking')).toBe(true);
      expect(stateMachine.canTransitionTo('authenticating')).toBe(true);
      expect(stateMachine.canTransitionTo('ready')).toBe(true);
      expect(stateMachine.canTransitionTo('disconnected')).toBe(true);
      expect(stateMachine.canTransitionTo('closed')).toBe(true);
    });
  });

  describe('state change listeners', () => {
    it('should notify listeners on state change', () => {
      const listener = vi.fn();

      stateMachine.onChange(listener);
      stateMachine.connect();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        previous: 'disconnected',
        current: 'connecting',
      });
    });

    it('should notify multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      stateMachine.onChange(listener1);
      stateMachine.onChange(listener2);

      stateMachine.connect();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = stateMachine.onChange(listener);

      stateMachine.connect();
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();

      stateMachine.startHandshake();
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle multiple sequential transitions', () => {
      const listener = vi.fn();
      const expectedTransitions: Array<{
        previous: ConnectionState;
        current: ConnectionState;
      }> = [
        { previous: 'disconnected', current: 'connecting' },
        { previous: 'connecting', current: 'handshaking' },
        { previous: 'handshaking', current: 'authenticating' },
        { previous: 'authenticating', current: 'ready' },
      ];

      stateMachine.onChange(listener);

      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(listener).toHaveBeenCalledTimes(4);
      expect(listener.mock.calls).toEqual(expectedTransitions.map(t => [t]));
    });
  });

  describe('reset', () => {
    it('should reset to disconnected state', () => {
      stateMachine.connect();
      stateMachine.startHandshake();

      stateMachine.reset();

      expect(stateMachine.getState()).toBe('disconnected');
    });

    it('should not emit events when resetting', () => {
      const listener = vi.fn();

      stateMachine.onChange(listener);
      stateMachine.connect();

      expect(listener).toHaveBeenCalledTimes(1);

      stateMachine.reset();

      // Listener count should still be 1 (not incremented by reset)
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('convenience methods', () => {
    it('should provide connect() method', () => {
      stateMachine.connect();

      expect(stateMachine.getState()).toBe('connecting');
    });

    it('should provide startHandshake() method', () => {
      stateMachine.connect();
      stateMachine.startHandshake();

      expect(stateMachine.getState()).toBe('handshaking');
    });

    it('should provide startAuth() method', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();

      expect(stateMachine.getState()).toBe('authenticating');
    });

    it('should provide ready() method', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(stateMachine.getState()).toBe('ready');
    });

    it('should provide startReconnect() method', () => {
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      stateMachine.startReconnect();

      expect(stateMachine.getState()).toBe('reconnecting');
    });

    it('should provide disconnect() method', () => {
      stateMachine.connect();
      stateMachine.disconnect();

      expect(stateMachine.getState()).toBe('disconnected');
    });

    it('should provide close() method', () => {
      stateMachine.connect();
      stateMachine.close();

      expect(stateMachine.getState()).toBe('closed');
    });
  });

  describe('edge cases', () => {
    it('should handle same state transition attempt gracefully', () => {
      stateMachine.connect();

      // Attempting same transition should fail as it's not in valid transitions
      expect(() => {
        stateMachine.transitionTo('connecting');
      }).toThrow('Invalid state transition');
    });

    it('should handle rapid state changes', () => {
      const listener = vi.fn();

      stateMachine.onChange(listener);

      // Rapid changes
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      stateMachine.disconnect();

      expect(listener).toHaveBeenCalledTimes(5);
    });

    it('should handle unsubscribe during state change', () => {
      let unsub: (() => void) | null = null;

      const listener = vi.fn(() => {
        if (unsub) {
          unsub();
        }
      });

      unsub = stateMachine.onChange(listener);
      stateMachine.connect();

      // Listener should have been called
      expect(listener).toHaveBeenCalledTimes(1);

      // Further transitions should not call this listener
      stateMachine.startHandshake();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('full connection flow', () => {
    it('should transition through full connection lifecycle', () => {
      const transitions: Array<{
        previous: ConnectionState;
        current: ConnectionState;
      }> = [];

      stateMachine.onChange(event => {
        transitions.push({ ...event });
      });

      // Full connection flow
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(transitions).toEqual([
        { previous: 'disconnected', current: 'connecting' },
        { previous: 'connecting', current: 'handshaking' },
        { previous: 'handshaking', current: 'authenticating' },
        { previous: 'authenticating', current: 'ready' },
      ]);

      expect(stateMachine.isReady()).toBe(true);
      expect(stateMachine.isConnected()).toBe(true);
    });

    it('should handle disconnect and reconnect flow', () => {
      const transitions: Array<{
        previous: ConnectionState;
        current: ConnectionState;
      }> = [];

      stateMachine.onChange(event => {
        transitions.push({ ...event });
      });

      // Connect
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      // Disconnect
      stateMachine.disconnect();

      // Reconnect
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(stateMachine.isReady()).toBe(true);
      expect(transitions.length).toBeGreaterThan(5);
    });
  });
});

describe('createConnectionStateMachine', () => {
  it('should create a new state machine instance', () => {
    const stateMachine = createConnectionStateMachine();

    expect(stateMachine).toBeInstanceOf(ConnectionStateMachine);
    expect(stateMachine.getState()).toBe('disconnected');
  });
});
