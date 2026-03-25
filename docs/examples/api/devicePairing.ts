/**
 * Device Pairing API Examples
 *
 * Examples showing how to manage device pairing:
 * - List pending pairing requests
 * - Approve new devices
 * - Reject unauthorized devices
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
  // Example 1: List Pending Pairing Requests
  // ============================================================================

  const pendingDevices = await client.devicePairing.list();
  console.log('Pending pairings:', pendingDevices);

  // ============================================================================
  // Example 2: Approve Device Pairing
  // ============================================================================

  if (pendingDevices && Array.isArray(pendingDevices) && pendingDevices.length > 0) {
    const pairingId = pendingDevices[0].id;

    // Approve the pairing
    await client.devicePairing.approve({
      nodeId: pairingId,
      requestId: pendingDevices[0].id,
    });
    console.log('Device approved:', pairingId);
  }

  // ============================================================================
  // Example 3: Reject Device Pairing
  // ============================================================================

  // To reject a pairing (e.g., unauthorized device)
  // await client.devicePairing.reject({
  //   pairingId: 'pairing-to-reject',
  //   reason: 'Device not authorized',
  // });
  // console.log('Device rejected');

  client.disconnect();
}

main().catch(console.error);
