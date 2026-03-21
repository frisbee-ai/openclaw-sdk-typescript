/**
 * ReconnectManager Examples
 *
 * Examples showing how to use the ReconnectManager
 * for connection recovery:
 * - Basic reconnection flow
 * - Event listeners
 * - Auth-aware retry logic
 */

import { createReconnectManager, type ReconnectEvent } from '../../../src/index.js';

// ============================================================================
// Example 1: Basic Reconnection Flow
// ============================================================================

async function basicReconnection() {
  const reconnectMgr = createReconnectManager({
    maxAttempts: 10,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    pauseOnAuthError: true,
    jitterFactor: 0.3,
  });

  console.log('Initial state:', reconnectMgr.getState());
  console.log('Is reconnecting:', reconnectMgr.isReconnecting());
}

// ============================================================================
// Example 2: Listening to Reconnection Events
// ============================================================================

async function reconnectEvents() {
  const reconnectMgr = createReconnectManager({
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    pauseOnAuthError: false,
    jitterFactor: 0,
  });

  // Listen to reconnection events
  reconnectMgr.onEvent((event: ReconnectEvent) => {
    console.log(`Event: ${event.state}, attempt: ${event.attempt}`);
    if (event.lastError) {
      console.log(`  Error: ${event.lastError.message}`);
    }
  });

  // Simulate reconnection with a failing connect function
  try {
    await reconnectMgr.reconnect(
      async () => {
        console.log('Attempting connection...');
        throw new Error('Connection failed');
      },
      async () => null
    );
  } catch (error) {
    console.log('Reconnection failed:', error);
  }
}

// ============================================================================
// Example 3: Auth-Aware Retry
// ============================================================================

async function authAwareRetry() {
  const reconnectMgr = createReconnectManager({
    maxAttempts: 3,
    maxAuthRetries: 2,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    pauseOnAuthError: true,
    jitterFactor: 0,
  });

  reconnectMgr.onEvent(event => {
    console.log(`State: ${event.state}, attempt: ${event.attempt}`);
  });

  // Simulate auth token refresh
  let tokenRefreshCount = 0;

  try {
    await reconnectMgr.reconnect(
      async () => {
        console.log('Attempting connection...');
        throw new Error('AUTH_TOKEN_EXPIRED');
      },
      async () => {
        tokenRefreshCount++;
        console.log(`Refreshing token... (attempt ${tokenRefreshCount})`);
        return { success: true, token: 'new-token' };
      }
    );
  } catch (error) {
    console.log('Final result:', error);
  }

  console.log('Token refresh attempts:', tokenRefreshCount);
}

// ============================================================================
// Example 4: Error Handler
// ============================================================================

async function errorHandling() {
  const reconnectMgr = createReconnectManager({
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    pauseOnAuthError: false,
    jitterFactor: 0,
  });

  reconnectMgr.onListenerError(({ error, event }) => {
    console.error('Listener error:', error, 'Event:', event);
  });

  // Add a buggy listener
  reconnectMgr.onEvent(() => {
    throw new Error('Listener error!');
  });

  try {
    await reconnectMgr.reconnect(
      async () => {
        console.log('Attempting connection...');
        throw new Error('Connection failed');
      },
      async () => null
    );
  } catch (error) {
    console.log('Reconnection failed:', error);
  }
}

// ============================================================================
// Example 5: State Query
// ============================================================================

async function stateQuery() {
  const reconnectMgr = createReconnectManager({
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    pauseOnAuthError: true,
    jitterFactor: 0.1,
  });

  console.log('State:', reconnectMgr.getState());
  console.log('Attempt:', reconnectMgr.getAttempt());
  console.log('Is reconnecting:', reconnectMgr.isReconnecting());

  // Add listener to track state changes
  reconnectMgr.onEvent(event => {
    console.log(`State changed to: ${event.state}`);
  });
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('=== Example 1: Basic Reconnection Flow ===');
  await basicReconnection();

  console.log('\n=== Example 2: Listening to Reconnection Events ===');
  await reconnectEvents();

  console.log('\n=== Example 3: Auth-Aware Retry ===');
  await authAwareRetry();

  console.log('\n=== Example 4: Error Handler ===');
  await errorHandling();

  console.log('\n=== Example 5: State Query ===');
  await stateQuery();
}

main().catch(console.error);
