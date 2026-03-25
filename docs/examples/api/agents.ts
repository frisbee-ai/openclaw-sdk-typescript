/**
 * Agents API Examples
 *
 * Examples showing how to manage agents using the SDK:
 * - List agents
 * - Create, update, delete agents
 * - Manage agent files
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
  // Example 1: List All Agents
  // ============================================================================

  const { agents } = await client.agents.list();
  console.log('Available agents:', agents);

  // ============================================================================
  // Example 2: Create a New Agent
  // ============================================================================

  const newAgent = await client.agents.create({
    name: 'my-agent',
    workspace: 'default',
    emoji: '🤖',
  });
  console.log('Created agent:', newAgent);

  // ============================================================================
  // Example 3: Update Agent Files
  // ============================================================================

  const updated = await client.agents.update({
    agentId: 'my-agent',
    name: 'my-updated-agent',
  });
  console.log('Updated agent:', updated);

  // ============================================================================
  // Example 4: List Agent Files
  // ============================================================================

  const { files } = await client.agents.files.list({
    agentId: 'my-agent',
  });
  console.log('Agent files:', files);

  // ============================================================================
  // Example 5: Get Agent File Content
  // ============================================================================

  const { content } = await client.agents.files.get({
    agentId: 'my-agent',
    path: 'main.ts',
  });
  console.log('File content:', content);

  // ============================================================================
  // Example 6: Set Agent File
  // ============================================================================

  await client.agents.files.set({
    agentId: 'my-agent',
    path: 'utils.ts',
    content: '// Utility functions\nexport function help() { return "help"; }',
  });
  console.log('File set successfully');

  // ============================================================================
  // Example 7: Verify Agent Identity
  // ============================================================================

  const identity = await client.agents.identity({
    agentId: 'my-agent',
  });
  console.log('Agent identity:', identity);

  // ============================================================================
  // Example 8: Wait for Agent
  // ============================================================================

  console.log('Waiting for agent to become available...');
  await client.agents.wait({
    agentId: 'my-agent',
    timeoutMs: 30000,
  });
  console.log('Agent is now available!');

  // ============================================================================
  // Example 9: Delete Agent
  // ============================================================================

  const deleted = await client.agents.delete({
    agentId: 'my-agent',
  });
  console.log('Deleted agent:', deleted);

  client.disconnect();
}

main().catch(console.error);
