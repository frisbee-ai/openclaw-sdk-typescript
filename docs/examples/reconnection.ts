/**
 * Reconnection Examples
 *
 * Examples showing different reconnection strategies:
 * - Built-in auto-reconnection (recommended)
 * - Stand-alone ReconnectManager (advanced)
 */

import { createClient, createReconnectManager } from '../../src/index.js';

// ============================================================================
// Example 1: Built-in Auto-Reconnection (Recommended)
// ============================================================================

async function builtinReconnection() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    credentials: {
      deviceId: 'your-device-id',
      apiKey: 'your-api-key',
    },
    // Enable auto-reconnection
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelayMs: 1000,
  });

  // Listen to connection state changes
  client.on('connectionStateChange', state => {
    console.log('Connection state:', state);
  });

  await client.connect();
  console.log('✓ Connected with built-in reconnection');

  // Reconnection happens automatically if disconnected
}

// ============================================================================
// Example 2: Stand-alone ReconnectManager (Advanced)
// ============================================================================

async function standaloneReconnection() {
  const reconnectMgr = createReconnectManager({
    maxAttempts: 10,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    fibonacci: true, // Use Fibonacci backoff
  });

  // Listen to reconnection state changes
  reconnectMgr.on('stateChange', state => {
    if (state.phase === 'waiting') {
      console.log(`Reconnecting in ${state.delayMs}ms... (attempt ${state.attempt})`);
    } else if (state.phase === 'connected') {
      console.log('✓ Reconnected successfully');
    } else if (state.phase === 'failed') {
      console.error('Reconnection failed after', state.attempt, 'attempts');
    }
  });

  // Manual reconnection control
  reconnectMgr.start();

  // ... custom reconnection logic ...

  // Stop reconnection when done
  reconnectMgr.stop();
}

// ============================================================================
// Example 3: Custom Reconnection with Event-Driven Logic
// ============================================================================

async function customReconnection() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    credentials: {
      deviceId: 'your-device-id',
      apiKey: 'your-api-key',
    },
  });

  await client.connect();

  // Listen to disconnection events
  client.on('disconnect', async () => {
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
  await builtinReconnection();
  await standaloneReconnection();
  await customReconnection();
}

main().catch(console.error);
