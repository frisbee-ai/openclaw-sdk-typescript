/**
 * Chat API Parameter Types
 *
 * Parameter and result types for chat operations.
 *
 * @module protocol/params/chat
 */

import type { SessionsSendParams } from './sessions.js';

/**
 * @deprecated Use SessionsSendParams instead. Will be removed in v2.0.
 */
export type ChatInjectParams = SessionsSendParams;

export interface ChatListParams {}

export interface ChatHistoryParams {
  chatId: string;
  limit?: number;
  before?: string;
}

export interface ChatHistoryResult {
  messages: unknown[];
}

export interface ChatDeleteParams {
  chatId: string;
}

export interface ChatDeleteResult {}

export interface ChatTitleParams {
  chatId: string;
}

export interface ChatTitleResult {
  title: string;
}

export interface ChatAbortParams {
  chatId: string;
}

export interface ChatSendParams {
  chatId: string;
  message: unknown;
}
