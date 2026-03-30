/**
 * Quick Start Example
 *
 * Basic example showing how to connect to OpenClaw Gateway
 * and make a simple request.
 */

import { ClientBuilder } from '../../src/index.js';

async function main() {
  // Create a client with your credentials
  const client = await new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .build();

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
