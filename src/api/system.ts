/**
 * System API Namespace
 *
 * Provides typed methods for system/health operations on the OpenClaw Gateway.
 *
 * @module api/system
 */

import type {
  TtsSpeakParams,
  TtsSpeakResult,
  TtsVoicesParams,
  WizardStartParams,
  WizardNextParams,
  WizardCancelParams,
  WizardStatusParams,
  WizardNextResult,
  WizardStartResult,
  WizardStatusResult,
} from '../protocol/api-params.js';

import type { RequestFn } from './shared.js';

/**
 * System API namespace.
 *
 * @example
 * ```ts
 * await client.system.health();
 * await client.system.wizard.start({ wizardId: 'setup' });
 * ```
 */
export class SystemAPI {
  constructor(private request: RequestFn) {}

  /**
   * Get system health status.
   */
  async health(): Promise<unknown> {
    return this.request('system.health');
  }

  /**
   * Get system status.
   */
  async status(): Promise<unknown> {
    return this.request('system.status');
  }

  /**
   * TTS speak text.
   */
  async speak(params: TtsSpeakParams): Promise<TtsSpeakResult> {
    return this.request<TtsSpeakResult>('tts.speak', params);
  }

  /**
   * Get available TTS voices.
   */
  async voices(params?: TtsVoicesParams): Promise<unknown> {
    return this.request('tts.voices', params);
  }

  /**
   * Start a wizard flow.
   */
  async wizardStart(params: WizardStartParams): Promise<WizardStartResult> {
    return this.request<WizardStartResult>('wizard.start', params);
  }

  /**
   * Advance wizard to next step.
   */
  async wizardNext(params: WizardNextParams): Promise<WizardNextResult> {
    return this.request<WizardNextResult>('wizard.next', params);
  }

  /**
   * Cancel a wizard flow.
   */
  async wizardCancel(params: WizardCancelParams): Promise<void> {
    await this.request('wizard.cancel', params);
  }

  /**
   * Get wizard status.
   */
  async wizardStatus(params: WizardStatusParams): Promise<WizardStatusResult> {
    return this.request<WizardStatusResult>('wizard.status', params);
  }
}
