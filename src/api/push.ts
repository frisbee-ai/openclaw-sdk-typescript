/**
 * Push API Namespace
 *
 * Provides typed methods for push notification operations on the OpenClaw Gateway.
 *
 * @module api/push
 */

import type {
  PushRegisterParams,
  PushRegisterResult,
  PushUnregisterParams,
  PushUnregisterResult,
  PushSendParams,
  PushSendResult,
} from '../protocol/params/push.js';

import type { RequestFn } from './shared.js';

/**
 * Push API namespace.
 *
 * @example
 * ```ts
 * await client.push.register({ token: '...', platform: 'ios' });
 * await client.push.send({ target: 'user-123', title: 'Hello', body: 'World' });
 * ```
 */
export class PushAPI {
  constructor(private request: RequestFn) {}

  /**
   * Register for push notifications.
   */
  async register(params: PushRegisterParams): Promise<PushRegisterResult> {
    return this.request<PushRegisterResult>('push.register', params);
  }

  /**
   * Unregister from push notifications.
   */
  async unregister(params: PushUnregisterParams): Promise<PushUnregisterResult> {
    return this.request<PushUnregisterResult>('push.unregister', params);
  }

  /**
   * Send a push notification.
   */
  async send(params: PushSendParams): Promise<PushSendResult> {
    return this.request<PushSendResult>('push.send', params);
  }
}
