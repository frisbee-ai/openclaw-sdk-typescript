/**
 * Connection State Machine Integration Tests
 *
 * Integration tests covering:
 * - Full connection lifecycle state transitions
 * - Cross-component state coordination
 * - Error handling during state transitions
 */

import { describe, it, expect } from 'vitest';
import { createConnectionStateMachine } from './state.js';

describe('ConnectionStateMachine Integration', () => {
  describe('Full connection lifecycle', () => {
    it('should transition through all States in correct order', () => {
      const stateMachine = createConnectionStateMachine();
      const stateHistory: string[] = [];

      stateMachine.onChange(event => {
        stateHistory.push(`${event.previous}->${event.current}`);
      });

      // Simulate connection lifecycle following valid transitions
      // disconnected -> connecting -> handshaking -> authenticating -> ready -> disconnected
      stateMachine.connect();
      expect(stateMachine.getState()).toBe('connecting');

      stateMachine.startHandshake(); // connecting -> handshaking
      expect(stateMachine.getState()).toBe('handshaking');

      stateMachine.startAuth(); // handshaking -> authenticating
      expect(stateMachine.getState()).toBe('authenticating');

      stateMachine.ready(); // authenticating -> ready
      expect(stateMachine.getState()).toBe('ready');

      stateMachine.disconnect(); // ready -> disconnected
      expect(stateMachine.getState()).toBe('disconnected');

      // Verify state transition history
      expect(stateHistory.some(t => t.includes('disconnected->connecting'))).toBe(true);
      expect(stateHistory.some(t => t.includes('connecting->handshaking'))).toBe(true);
      expect(stateHistory.some(t => t.includes('authenticating->ready'))).toBe(true);
      expect(stateHistory.some(t => t.includes('ready->disconnected'))).toBe(true);
    });

    it('should handle rapid state transitions', () => {
      const stateMachine = createConnectionStateMachine();

      // Rapid transitions following valid path
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(stateMachine.isConnected()).toBe(true);
      expect(stateMachine.isReady()).toBe(true);
    });

    it('should track connection state correctly', () => {
      const stateMachine = createConnectionStateMachine();

      expect(stateMachine.isConnected()).toBe(false);
      expect(stateMachine.isReady()).toBe(false);

      stateMachine.connect();
      expect(stateMachine.isConnected()).toBe(true);

      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();

      expect(stateMachine.isConnected()).toBe(true);
      expect(stateMachine.isReady()).toBe(true);
    });
  });

  describe('State transition error handling', () => {
    it('should handle invalid state transitions gracefully', () => {
      const stateMachine = createConnectionStateMachine();

      // Trying to go directly to ready from disconnected should fail
      expect(() => stateMachine.ready()).toThrow();
    });

    it('should throw on invalid transition', () => {
      const stateMachine = createConnectionStateMachine();

      // Invalid: connecting -> ready (must go through handshaking -> authenticating)
      stateMachine.connect();
      expect(() => stateMachine.ready()).toThrow('Invalid state transition');
    });
  });

  describe('Reconnection flow', () => {
    it('should handle disconnect and reconnect', () => {
      const stateMachine = createConnectionStateMachine();
      const stateHistory: string[] = [];

      stateMachine.onChange(event => {
        stateHistory.push(`${event.previous}->${event.current}`);
      });

      // Initial connection
      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      expect(stateMachine.isReady()).toBe(true);

      // Disconnect
      stateMachine.disconnect();
      expect(stateMachine.isConnected()).toBe(false);

      // Reconnect
      stateMachine.connect();
      expect(stateMachine.isConnected()).toBe(true);

      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      expect(stateMachine.isReady()).toBe(true);

      // Should have recorded multiple transitions
      expect(stateHistory.length).toBeGreaterThan(4);
    });

    it('should reset state properly', () => {
      const stateMachine = createConnectionStateMachine();

      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.startAuth();
      stateMachine.ready();
      expect(stateMachine.getState()).toBe('ready');

      stateMachine.reset();
      expect(stateMachine.getState()).toBe('disconnected');
      expect(stateMachine.isConnected()).toBe(false);
      expect(stateMachine.isReady()).toBe(false);
    });
  });

  describe('State change listeners', () => {
    it('should notify listeners on state change', () => {
      const stateMachine = createConnectionStateMachine();
      const notifications: string[] = [];

      const unsubscribe = stateMachine.onChange(event => {
        notifications.push(`${event.previous}->${event.current}`);
      });

      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.disconnect();

      expect(notifications.length).toBeGreaterThanOrEqual(2);

      unsubscribe();

      // After unsubscribe, no more notifications
      const countBefore = notifications.length;
      stateMachine.connect();
      expect(notifications.length).toBe(countBefore);
    });

    it('should allow multiple listeners', () => {
      const stateMachine = createConnectionStateMachine();
      let listener1Calls = 0;
      let listener2Calls = 0;

      stateMachine.onChange(() => {
        listener1Calls++;
      });

      stateMachine.onChange(() => {
        listener2Calls++;
      });

      stateMachine.connect();

      expect(listener1Calls).toBe(1);
      expect(listener2Calls).toBe(1);
    });
  });

  describe('Close flow', () => {
    it('should transition to closed state', () => {
      const stateMachine = createConnectionStateMachine();

      stateMachine.connect();
      stateMachine.startHandshake();
      stateMachine.close();

      expect(stateMachine.getState()).toBe('closed');

      // From closed, can only go to disconnected
      stateMachine.reset();
      expect(stateMachine.getState()).toBe('disconnected');
    });
  });
});
