/**
 * Reconnection Examples
 *
 * Examples showing different reconnection strategies:
 * - Built-in auto-reconnection (recommended)
 * - Stand-alone ReconnectManager (advanced)
 */

import { ClientBuilder, createReconnectManager } from '../../../src/index.js';

// ============================================================================
// Example 1: Built-in Auto-Reconnection (Recommended)
// ============================================================================

async function builtinReconnection() {
  const client = await new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .withReconnect({
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelayMs: 1000,
    })
    .build();

  // Listen to connection state changes
  client.onStateChange(state => {
    console.log('Connection state:', state);
  });

  await client.connect();
  console.log('✓ Connected with built-in reconnection');

  // Reconnection happens automatically if disconnected
  client.disconnect();
}

// ============================================================================
// Example 2: Stand-alone ReconnectManager (Advanced)
// ============================================================================

async function standaloneReconnection() {
  const reconnectMgr = createReconnectManager({
    maxAttempts: 10,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    pauseOnAuthError: true,
    jitterFactor: 0.3,
  });

  // Listen to reconnection events
  reconnectMgr.onEvent(event => {
    console.log(`Reconnect event: ${event.state}, attempt: ${event.attempt}`);
    if (event.lastError) {
      console.log(`  Error: ${event.lastError.message}`);
    }
  });

  console.log('ReconnectManager initialized');
  console.log('State:', reconnectMgr.getState());
  console.log('Is reconnecting:', reconnectMgr.isReconnecting());
}

// ============================================================================
// Example 3: Custom Reconnection with Event-Driven Logic
// ============================================================================

async function customReconnection() {
  const client = await new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .build();

  await client.connect();

  // Listen to disconnection events
  client.onClosed(async () => {
    console.log('Disconnected, attempting manual reconnection...');

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const delay = Math.pow(2, attempts) * 1000; // Exponential backoff

      console.log(`Reconnection attempt ${attempts}/${maxAttempts} in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        await client.connect();
        console.log('✓ Reconnected successfully');
        break;
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }

    if (attempts >= maxAttempts) {
      console.error('Failed to reconnect after', maxAttempts, 'attempts');
    }
  });
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('=== Example 1: Built-in Auto-Reconnection ===');
  await builtinReconnection();

  console.log('\n=== Example 2: Stand-alone ReconnectManager ===');
  await standaloneReconnection();

  console.log('\n=== Example 3: Custom Reconnection ===');
  await customReconnection();
}

main().catch(console.error);
