/**
 * Event Subscription Examples
 *
 * Examples showing how to subscribe to gateway events:
 * - Specific event subscription
 * - Wildcard subscription
 * - Pattern-based subscription
 */

import { ClientBuilder, type EventFrame } from '../../src/index.js';

async function main() {
  const client = await new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .build();

  await client.connect();
  console.log('✓ Connected to OpenClaw Gateway');

  // ============================================================================
  // Example 1: Subscribe to specific event
  // ============================================================================

  const unsubscribe1 = client.on('agent.status', (event: EventFrame) => {
    console.log('Agent status changed:', event.payload);
  });

  // ============================================================================
  // Example 2: Wildcard subscription (all agent events)
  // ============================================================================

  const unsubscribe2 = client.on('agent.*', (event: EventFrame) => {
    console.log('Agent event:', event.type, event.payload);
  });

  // ============================================================================
  // Example 3: Subscribe to all events
  // ============================================================================

  const unsubscribe3 = client.on('*', (event: EventFrame) => {
    console.log('All events:', event.type, event.payload);
  });

  // ============================================================================
  // Example 4: Pattern-based subscription
  // ============================================================================

  const unsubscribe4 = client.on('*.updated', (event: EventFrame) => {
    console.log('Something updated:', event.type, event.payload);
  });

  // Keep connection open for a bit to receive events
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Unsubscribe from events
  unsubscribe1();
  unsubscribe2();
  unsubscribe3();
  unsubscribe4();

  client.disconnect();
}

main().catch(console.error);
