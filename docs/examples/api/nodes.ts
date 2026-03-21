/**
 * Nodes API Examples
 *
 * Examples showing how to manage nodes:
 * - List connected nodes
 * - Invoke methods on nodes
 * - Send events to nodes
 * - Manage node pairing
 */

import { createClient } from '../../../src/index.js';

async function main() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    clientId: 'example-client',
    auth: {
      token: 'your-auth-token',
    },
  });

  await client.connect();
  console.log('✓ Connected to OpenClaw Gateway');

  // ============================================================================
  // Example 1: List Connected Nodes
  // ============================================================================

  const nodes = await client.nodes.list();
  console.log('Connected nodes:', nodes);

  // ============================================================================
  // Example 2: Invoke Method on Node
  // ============================================================================

  // Note: Requires actual nodeId and method
  // const result = await client.nodes.invoke({
  //   nodeId: 'node-123',
  //   target: 'execute',
  //   params: {
  //     code: 'return 42;',
  //   },
  // });
  // console.log('Invoke result:', result);

  // ============================================================================
  // Example 3: Send Event to Node
  // ============================================================================

  // await client.nodes.event({
  //   nodeId: 'node-123',
  //   event: 'user.login',
  //   payload: { userId: 'user-456' },
  // });
  // console.log('Event sent');

  // ============================================================================
  // Example 4: Drain Pending Queue
  // ============================================================================

  // const drainResult = await client.nodes.pendingDrain({
  //   nodeId: 'node-123',
  //   limit: 10,
  // });
  // console.log('Drained items:', drainResult);

  // ============================================================================
  // Example 5: Enqueue Item to Pending Queue
  // ============================================================================

  // const enqueueResult = await client.nodes.pendingEnqueue({
  //   nodeId: 'node-123',
  //   item: { type: 'task', data: 'something' },
  // });
  // console.log('Enqueued item:', enqueueResult);

  // ============================================================================
  // Example 6: Node Pairing - Request
  // ============================================================================

  // const pairRequest = await client.nodes.pairing.request({
  //   nodeId: 'node-to-pair',
  //   name: 'New Node',
  // });
  // console.log('Pairing requested:', pairRequest);

  // ============================================================================
  // Example 7: Node Pairing - List Pending
  // ============================================================================

  // const pending = await client.nodes.pairing.list();
  // console.log('Pending pairings:', pending);

  // ============================================================================
  // Example 8: Node Pairing - Approve/Reject
  // ============================================================================

  // Approve
  // await client.nodes.pairing.approve({
  //   pairingId: 'pair-123',
  // });

  // Reject
  // await client.nodes.pairing.reject({
  //   pairingId: 'pair-456',
  //   reason: 'Unauthorized device',
  // });

  // ============================================================================
  // Example 9: Node Pairing - Verify
  // ============================================================================

  // Verify with verification code
  // await client.nodes.pairing.verify({
  //   pairingId: 'pair-123',
  //   code: '123456',
  // });

  client.disconnect();
}

main().catch(console.error);
