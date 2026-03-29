/**
 * Sessions API Namespace
 *
 * Provides typed methods for session operations on the OpenClaw Gateway.
 *
 * @module api/sessions
 */

import type {
  SessionsListParams,
  SessionsPreviewParams,
  SessionsCreateParams,
  SessionsSendParams,
  SessionsPatchParams,
  SessionsPatchResult,
  SessionsResetParams,
  SessionsDeleteParams,
  SessionsCompactParams,
  SessionsUsageParams,
} from '../protocol/params/sessions.js';

import type { RequestFn } from './shared.js';

/**
 * Sessions API namespace.
 *
 * @example
 * ```ts
 * const sessions = await client.sessions.list();
 * await client.sessions.reset({ sessionId: "sess-123" });
 * ```
 */
export class SessionsAPI {
  constructor(private request: RequestFn) {}

  /**
   * List all sessions.
   */
  async list(params?: SessionsListParams): Promise<unknown> {
    return this.request('sessions.list', params);
  }

  /**
   * Preview a session's state.
   */
  async preview(params: SessionsPreviewParams): Promise<unknown> {
    return this.request('sessions.preview', params);
  }

  /**
   * Create a new session.
   */
  async create(params?: SessionsCreateParams): Promise<unknown> {
    return this.request('sessions.create', params);
  }

  /**
   * Send a message to a session.
   */
  async send(params: SessionsSendParams): Promise<unknown> {
    return this.request('sessions.send', params);
  }

  /**
   * Abort a running session.
   */
  async abort(params: { key: string; runId?: string }): Promise<void> {
    await this.request('sessions.abort', params);
  }

  /**
   * Subscribe to session events.
   */
  async subscribe(params: { key: string }): Promise<unknown> {
    return this.request('sessions.subscribe', params);
  }

  /**
   * Unsubscribe from session events.
   */
  async unsubscribe(params: { key: string }): Promise<void> {
    await this.request('sessions.unsubscribe', params);
  }

  /**
   * Subscribe to session messages.
   */
  async messagesSubscribe(params: { key: string }): Promise<unknown> {
    return this.request('sessions.messages.subscribe', params);
  }

  /**
   * Unsubscribe from session messages.
   */
  async messagesUnsubscribe(params: { key: string }): Promise<void> {
    await this.request('sessions.messages.unsubscribe', params);
  }

  /**
   * Patch a session.
   */
  async patch(params: SessionsPatchParams): Promise<SessionsPatchResult> {
    return this.request<SessionsPatchResult>('sessions.patch', params);
  }

  /**
   * Reset a session.
   */
  async reset(params: SessionsResetParams): Promise<void> {
    await this.request('sessions.reset', params);
  }

  /**
   * Delete a session.
   */
  async delete(params: SessionsDeleteParams): Promise<void> {
    await this.request('sessions.delete', params);
  }

  /**
   * Compact a session.
   */
  async compact(params?: SessionsCompactParams): Promise<void> {
    await this.request('sessions.compact', params);
  }

  /**
   * Get session usage statistics.
   */
  async usage(params?: SessionsUsageParams): Promise<unknown> {
    return this.request('sessions.usage', params);
  }
}
