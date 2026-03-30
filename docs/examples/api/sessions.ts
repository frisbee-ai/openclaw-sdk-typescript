/**
 * Sessions API Examples
 *
 * Examples showing how to manage sessions:
 * - List sessions
 * - Preview session state
 * - Reset, patch, delete sessions
 * - Manage session compaction and usage
 */

import { ClientBuilder } from '../../../src/index.js';

async function main() {
  const client = await new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .build();

  await client.connect();
  console.log('✓ Connected to OpenClaw Gateway');

  // ============================================================================
  // Example 1: List Sessions
  // ============================================================================

  const sessions = await client.sessions.list({
    limit: 20,
  });
  console.log('Sessions:', sessions);

  // ============================================================================
  // Example 2: Preview Session State
  // ============================================================================

  // Note: Requires actual sessionId
  // const preview = await client.sessions.preview({
  //   sessionId: 'session-123',
  // });
  // console.log('Session preview:', preview);

  // ============================================================================
  // Example 3: Resolve Session
  // ============================================================================

  // const resolved = await client.sessions.resolve({
  //   sessionId: 'session-123',
  // });
  // console.log('Resolved session:', resolved);

  // ============================================================================
  // Example 4: Patch Session Metadata
  // ============================================================================

  const patched = await client.sessions.patch({
    sessionId: 'session-123',
    patch: [
      { op: 'add', path: '/tags', value: ['important'] },
      { op: 'replace', path: '/priority', value: 'high' },
    ],
  });
  console.log('Patched session:', patched);

  // ============================================================================
  // Example 5: Reset Session
  // ============================================================================

  // Note: Reset clears session history
  // await client.sessions.reset({
  //   sessionId: 'session-123',
  // });
  // console.log('Session reset');

  // ============================================================================
  // Example 6: Delete Session
  // ============================================================================

  // Note: Permanent deletion
  // await client.sessions.delete({
  //   sessionId: 'session-123',
  // });
  // console.log('Session deleted');

  // ============================================================================
  // Example 7: Compact Session
  // ============================================================================

  await client.sessions.compact({
    sessionId: 'session-123',
  });
  console.log('Session compacted');

  // ============================================================================
  // Example 8: Get Session Usage Statistics
  // ============================================================================

  const usage = await client.sessions.usage({
    sessionId: 'session-123',
  });
  console.log('Session usage:', usage);

  client.disconnect();
}

main().catch(console.error);
