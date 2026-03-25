/**
 * Channels API Namespace
 *
 * Provides typed methods for channel operations on the OpenClaw Gateway.
 *
 * @module api/channels
 */

import type {
  ChannelsStatusParams,
  ChannelsStatusResult,
  ChannelsLogoutParams,
  TalkConfigParams,
  TalkConfigResult,
  TalkModeParams,
  TalkStartParams,
  TalkStartResult,
  TalkStopParams,
  TalkStopResult,
} from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

/**
 * Channels API namespace.
 *
 * @example
 * ```ts
 * const { channels } = await client.channels.status();
 * await client.channels.talk.start({ language: 'en' });
 * ```
 */
export class ChannelsAPI {
  constructor(private request: RequestFn) {}

  /**
   * Get channel status.
   */
  async status(params?: ChannelsStatusParams): Promise<ChannelsStatusResult> {
    return this.request<ChannelsStatusResult>('channels.status', params);
  }

  /**
   * Logout from a channel.
   */
  async logout(params: ChannelsLogoutParams): Promise<void> {
    await this.request('channels.logout', params);
  }

  /**
   * Talk configuration.
   */
  get talk() {
    const request = this.request;
    return {
      /**
       * Get talk configuration.
       */
      async config(params?: TalkConfigParams): Promise<TalkConfigResult> {
        return request<TalkConfigResult>('talk.config', params);
      },

      /**
       * Set talk mode.
       */
      async mode(params: TalkModeParams): Promise<void> {
        await request('talk.mode', params);
      },

      /**
       * Speak text in a talk session.
       */
      async speak(params: { text: string; language?: string }): Promise<void> {
        await request('talk.speak', params);
      },

      /**
       * Start a talk session.
       */
      async start(params?: TalkStartParams): Promise<TalkStartResult> {
        return request<TalkStartResult>('talk.start', params);
      },

      /**
       * Stop a talk session.
       */
      async stop(params: TalkStopParams): Promise<TalkStopResult> {
        return request<TalkStopResult>('talk.stop', params);
      },
    };
  }
}
