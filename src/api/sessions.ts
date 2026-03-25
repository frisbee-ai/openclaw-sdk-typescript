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
  SessionsPatchParams,
  SessionsPatchResult,
  SessionsResetParams,
  SessionsDeleteParams,
  SessionsCompactParams,
  SessionsUsageParams,
} from '../protocol/api-params.js';

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
