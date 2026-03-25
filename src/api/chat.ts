/**
 * Chat API Namespace
 *
 * Provides typed methods for chat operations on the OpenClaw Gateway.
 *
 * @module api/chat
 */

import type {
  ChatListParams,
  ChatInjectParams,
  ChatHistoryParams,
  ChatHistoryResult,
  ChatDeleteParams,
  ChatDeleteResult,
  ChatTitleParams,
  ChatTitleResult,
  ChatAbortParams,
} from '../protocol/api-params.js';
import type { ChatListResult } from '../protocol/api-common.js';

import type { RequestFn } from './shared.js';

/**
 * Chat API namespace.
 *
 * Provides typed methods for chat operations.
 *
 * @example
 * ```ts
 * const client = createClient({ url: "ws://localhost:8080", clientId: "my-app" });
 * await client.connect();
 *
 * // List chats
 * const { chats } = await client.chat.list();
 *
 * // Get chat history
 * const { messages } = await client.chat.history({ chatId: "chat-123" });
 *
 * // Inject a message
 * await client.chat.inject({ chatId: "chat-123", message: { role: "user", content: "Hello" } });
 * ```
 */
export class ChatAPI {
  constructor(private request: RequestFn) {}

  /**
   * Inject a message into a chat session.
   *
   * @param params - Chat injection parameters
   */
  async inject(params: ChatInjectParams): Promise<void> {
    await this.request('chat.inject', params);
  }

  /**
   * Abort a running chat.
   *
   * @param params - Chat abort parameters
   */
  async abort(params: ChatAbortParams): Promise<void> {
    await this.request('chat.abort', params);
  }

  /**
   * List all chat sessions.
   *
   * @param params - Optional list parameters
   * @returns List of chats
   */
  async list(params?: ChatListParams): Promise<ChatListResult> {
    return this.request<ChatListResult>('chat.list', params);
  }

  /**
   * Get chat message history.
   *
   * @param params - Chat history parameters
   * @returns Chat messages
   */
  async history(params: ChatHistoryParams): Promise<ChatHistoryResult> {
    return this.request<ChatHistoryResult>('chat.history', params);
  }

  /**
   * Delete a chat session.
   *
   * @param params - Chat delete parameters
   */
  async delete(params: ChatDeleteParams): Promise<ChatDeleteResult> {
    return this.request<ChatDeleteResult>('chat.delete', params);
  }

  /**
   * Get or set a chat title.
   *
   * @param params - Chat title parameters
   * @returns Chat title
   */
  async title(params: ChatTitleParams): Promise<ChatTitleResult> {
    return this.request<ChatTitleResult>('chat.title', params);
  }
}
