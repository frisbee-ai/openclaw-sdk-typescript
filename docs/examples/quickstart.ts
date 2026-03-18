/**
 * Quick Start Example
 *
 * Basic example showing how to connect to OpenClaw Gateway
 * and make a simple request.
 */

import { createClient } from '../../src/index.js';

async function main() {
  // Create a client with your credentials
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    credentials: {
      deviceId: 'your-device-id',
      apiKey: 'your-api-key',
    },
  });

  try {
    // Connect to the gateway
    await client.connect();
    console.log('✓ Connected to OpenClaw Gateway');

    // Make a request (example: list agents)
    const result = await client.request('agents.list', {});

    console.log('Agents:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect when done
    client.disconnect();
  }
}

// Run the example
main().catch(console.error);
