/**
 * Connection State Machine Examples
 *
 * Examples showing how to use the standalone ConnectionStateMachine:
 * - Basic state transitions
 * - Listening to state changes
 * - Error handling
 * - State validation
 */

import { createConnectionStateMachine } from '../../../src/index.js';

// ============================================================================
// Example 1: Basic State Transitions
// ============================================================================

async function basicStateTransitions() {
  const stateMachine = createConnectionStateMachine();

  console.log('Initial state:', stateMachine.getState());

  // Valid transition: disconnected -> connecting
  stateMachine.transitionTo('connecting');
  console.log('After connecting:', stateMachine.getState());

  // Valid transition: connecting -> handshaking
  stateMachine.transitionTo('handshaking');
  console.log('After handshaking:', stateMachine.getState());

  // Valid transition: handshaking -> authenticating
  stateMachine.transitionTo('authenticating');
  console.log('After authenticating:', stateMachine.getState());

  // Valid transition: authenticating -> ready
  stateMachine.transitionTo('ready');
  console.log('After ready:', stateMachine.getState());

  // Reset to initial state
  stateMachine.reset();
  console.log('After reset:', stateMachine.getState());
}

// ============================================================================
// Example 2: Listening to State Changes
// ============================================================================

async function stateChangeListener() {
  const stateMachine = createConnectionStateMachine();

  // Listen to all state changes using onChange()
  const unsubscribe = stateMachine.onChange(event => {
    console.log(`State changed: ${event.previous} -> ${event.current}`);
  });

  // Perform some transitions
  stateMachine.transitionTo('connecting');
  stateMachine.transitionTo('handshaking');
  stateMachine.transitionTo('authenticating');
  stateMachine.transitionTo('ready');

  // Cleanup
  unsubscribe();

  // Verify no more notifications after unsubscribe
  stateMachine.transitionTo('reconnecting'); // Won't trigger the listener
  console.log('Current state:', stateMachine.getState());

  stateMachine.reset();
}

// ============================================================================
// Example 3: Error Handling for Listener Errors
// ============================================================================

async function listenerErrorHandling() {
  const stateMachine = createConnectionStateMachine();

  // Configure custom error handler for listener errors
  stateMachine.onListenerError(({ error, event }) => {
    console.error(`Listener error during ${event.previous} -> ${event.current}:`, error);
    // Send to error tracking service, etc.
  });

  // Add a listener that throws an error
  stateMachine.onChange(event => {
    if (event.current === 'handshaking') {
      throw new Error('Simulated error during handshaking');
    }
  });

  // This transition will trigger the error handler
  stateMachine.transitionTo('connecting');
  stateMachine.transitionTo('handshaking'); // Error caught by error handler

  stateMachine.reset();
}

// ============================================================================
// Example 4: State Validation
// ============================================================================

async function stateValidation() {
  const stateMachine = createConnectionStateMachine();

  console.log('Initial state:', stateMachine.getState());

  // Can only transition to valid next states
  // disconnected -> connecting is valid
  const canConnect = stateMachine.canTransitionTo('connecting');
  console.log('Can transition to connecting:', canConnect); // true

  // ready -> disconnected is NOT a valid transition (must go through reconnecting)
  stateMachine.transitionTo('connecting');
  stateMachine.transitionTo('handshaking');
  stateMachine.transitionTo('authenticating');
  stateMachine.transitionTo('ready');

  const canGoDirectlyToDisconnected = stateMachine.canTransitionTo('disconnected');
  console.log('Can transition directly to disconnected:', canGoDirectlyToDisconnected); // false

  stateMachine.reset();
}

// ============================================================================
// Example 5: Simulating Full Connection Lifecycle
// ============================================================================

async function connectionLifecycle() {
  const stateMachine = createConnectionStateMachine();

  stateMachine.onChange(event => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${event.previous} -> ${event.current}`);
  });

  // Simulate connection lifecycle using convenience methods
  stateMachine.connect();
  await new Promise(resolve => setTimeout(resolve, 100));

  stateMachine.startHandshake();
  await new Promise(resolve => setTimeout(resolve, 100));

  stateMachine.startAuth();
  await new Promise(resolve => setTimeout(resolve, 100));

  stateMachine.ready();
  console.log('\nConnected! Current state:', stateMachine.getState());

  // Simulate disconnect
  stateMachine.startReconnect();
  await new Promise(resolve => setTimeout(resolve, 100));

  stateMachine.connect();
  await new Promise(resolve => setTimeout(resolve, 100));

  stateMachine.startHandshake();
  await new Promise(resolve => setTimeout(resolve, 100));

  stateMachine.startAuth();
  await new Promise(resolve => setTimeout(resolve, 100));

  stateMachine.ready();

  stateMachine.reset();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('=== Example 1: Basic State Transitions ===');
  await basicStateTransitions();

  console.log('\n=== Example 2: State Change Listener ===');
  await stateChangeListener();

  console.log('\n=== Example 3: Listener Error Handling ===');
  await listenerErrorHandling();

  console.log('\n=== Example 4: State Validation ===');
  await stateValidation();

  console.log('\n=== Example 5: Connection Lifecycle ===');
  await connectionLifecycle();
}

main().catch(console.error);
