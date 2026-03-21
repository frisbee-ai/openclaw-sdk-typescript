/**
 * Chat API Examples
 *
 * Examples showing how to use chat operations:
 * - List chat sessions
 * - Get chat history
 * - Inject messages
 * - Manage chat titles
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
  // Example 1: List Chat Sessions
  // ============================================================================

  const { chats } = await client.chat.list({
    limit: 20,
  });
  console.log('Chat sessions:', chats);

  // ============================================================================
  // Example 2: Get Chat History
  // ============================================================================

  if (chats.length > 0) {
    const chatId = chats[0].chatId;

    const { messages } = await client.chat.history({
      chatId,
      limit: 50,
    });
    console.log(`Chat ${chatId} messages:`, messages);

    // ============================================================================
    // Example 3: Inject a Message into Chat
    // ============================================================================

    await client.chat.inject({
      chatId,
      message: {
        role: 'user',
        content: 'Hello, agent!',
      },
    });
    console.log('Message injected');

    // ============================================================================
    // Example 4: Get Chat Title
    // ============================================================================

    const titleResult = await client.chat.title({
      chatId,
    });
    console.log('Current title:', titleResult.title);
  }

  // ============================================================================
  // Example 5: Delete Chat Session
  // ============================================================================

  // Note: In production, you would use an actual chatId
  // await client.chat.delete({ chatId: 'chat-to-delete' });
  console.log('Delete example (skipped - requires actual chatId)');

  client.disconnect();
}

main().catch(console.error);
