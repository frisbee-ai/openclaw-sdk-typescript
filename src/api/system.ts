/**
 * System API Namespace
 *
 * Provides typed methods for system/health operations on the OpenClaw Gateway.
 *
 * @module api/system
 */

import type {
  // System types (defined in system.ts)
  TtsSpeakParams,
  TtsSpeakResult,
  TtsVoicesParams,
  TtsStatusParams,
  TtsStatusResult,
  TtsProvidersParams,
  TtsProvidersResult,
  TtsEnableParams,
  TtsDisableParams,
  TtsConvertParams,
  TtsSetProviderParams,
  LogsTailParams,
  LogsTailResult,
  DoctorMemoryStatusParams,
  DoctorMemoryStatusResult,
  ModelsListParams,
  ModelsListResult,
  GatewayIdentityGetParams,
  GatewayIdentityGetResult,
  SystemPresenceParams,
  SystemPresenceResult,
  SystemEventParams,
  SystemEventResult,
  LastHeartbeatParams,
  LastHeartbeatResult,
  SetHeartbeatsParams,
  WakeParams,
  UpdateRunParams,
  AgentParams,
  AgentResult,
  SendParams,
  SendResult,
} from '../protocol/params/system.js';
// Wizard types from config.ts
import type {
  WizardStartParams,
  WizardNextParams,
  WizardCancelParams,
  WizardStatusParams,
  WizardNextResult,
  WizardStartResult,
  WizardStatusResult,
} from '../protocol/params/config.js';
// Usage types from usage.ts
import type {
  UsageStatusParams,
  UsageStatusResult,
  UsageCostParams,
  UsageCostResult,
} from '../protocol/params/usage.js';
// VoiceWake types from skills.ts
import type { VoiceWakeGetParams, VoiceWakeSetParams } from '../protocol/params/skills.js';
// BrowserRequest types from browser.ts
import type { BrowserRequestParams, BrowserRequestResult } from '../protocol/params/browser.js';
import type { TtsVoicesResult } from '../protocol/api-common.js';

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

  // -------------------------------------------------------------------------
  // Health & Status
  // -------------------------------------------------------------------------

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
   * Get doctor memory status.
   */
  async doctorMemoryStatus(params?: DoctorMemoryStatusParams): Promise<DoctorMemoryStatusResult> {
    return this.request<DoctorMemoryStatusResult>('doctor.memory.status', params);
  }

  /**
   * Tail system logs.
   */
  async logsTail(params?: LogsTailParams): Promise<LogsTailResult> {
    return this.request<LogsTailResult>('logs.tail', params);
  }

  // -------------------------------------------------------------------------
  // Usage
  // -------------------------------------------------------------------------

  /**
   * Get usage status.
   */
  async usageStatus(params?: UsageStatusParams): Promise<UsageStatusResult> {
    return this.request<UsageStatusResult>('usage.status', params);
  }

  /**
   * Get usage cost.
   */
  async usageCost(params?: UsageCostParams): Promise<UsageCostResult> {
    return this.request<UsageCostResult>('usage.cost', params);
  }

  // -------------------------------------------------------------------------
  // TTS
  // -------------------------------------------------------------------------

  /**
   * TTS speak text.
   */
  async speak(params: TtsSpeakParams): Promise<TtsSpeakResult> {
    return this.request<TtsSpeakResult>('tts.speak', params);
  }

  /**
   * Get available TTS voices.
   *
   * @param params - Optional TTS voices parameters
   * @returns Promise resolving to available voices
   */
  async voices(params?: TtsVoicesParams): Promise<TtsVoicesResult> {
    return this.request<TtsVoicesResult>('tts.voices', params);
  }

  /**
   * Get TTS status.
   */
  async ttsStatus(params?: TtsStatusParams): Promise<TtsStatusResult> {
    return this.request<TtsStatusResult>('tts.status', params);
  }

  /**
   * Get available TTS providers.
   */
  async ttsProviders(params?: TtsProvidersParams): Promise<TtsProvidersResult> {
    return this.request<TtsProvidersResult>('tts.providers', params);
  }

  /**
   * Enable TTS.
   */
  async ttsEnable(params?: TtsEnableParams): Promise<void> {
    await this.request('tts.enable', params);
  }

  /**
   * Disable TTS.
   */
  async ttsDisable(params?: TtsDisableParams): Promise<void> {
    await this.request('tts.disable', params);
  }

  /**
   * Convert text to speech.
   */
  async ttsConvert(params: TtsConvertParams): Promise<unknown> {
    return this.request('tts.convert', params);
  }

  /**
   * Set TTS provider.
   */
  async ttsSetProvider(params: TtsSetProviderParams): Promise<void> {
    await this.request('tts.setProvider', params);
  }

  // -------------------------------------------------------------------------
  // Models
  // -------------------------------------------------------------------------

  /**
   * List available models.
   */
  async modelsList(params?: ModelsListParams): Promise<ModelsListResult> {
    return this.request<ModelsListResult>('models.list', params);
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------

  /**
   * Run system update.
   */
  async updateRun(params?: UpdateRunParams): Promise<void> {
    await this.request('update.run', params);
  }

  // -------------------------------------------------------------------------
  // VoiceWake
  // -------------------------------------------------------------------------

  /**
   * Get voice wake configuration.
   */
  async voiceWakeGet(params?: VoiceWakeGetParams): Promise<unknown> {
    return this.request('voicewake.get', params);
  }

  /**
   * Set voice wake configuration.
   */
  async voiceWakeSet(params: VoiceWakeSetParams): Promise<void> {
    await this.request('voicewake.set', params);
  }

  // -------------------------------------------------------------------------
  // Gateway Identity
  // -------------------------------------------------------------------------

  /**
   * Get gateway identity.
   */
  async gatewayIdentityGet(params?: GatewayIdentityGetParams): Promise<GatewayIdentityGetResult> {
    return this.request<GatewayIdentityGetResult>('gateway.identity.get', params);
  }

  // -------------------------------------------------------------------------
  // System Presence & Events
  // -------------------------------------------------------------------------

  /**
   * Get system presence.
   */
  async systemPresence(params?: SystemPresenceParams): Promise<SystemPresenceResult> {
    return this.request<SystemPresenceResult>('system-presence', params);
  }

  /**
   * Send a system event.
   */
  async systemEvent(params: SystemEventParams): Promise<SystemEventResult> {
    return this.request<SystemEventResult>('system-event', params);
  }

  // -------------------------------------------------------------------------
  // Heartbeat
  // -------------------------------------------------------------------------

  /**
   * Get last heartbeat.
   */
  async lastHeartbeat(params?: LastHeartbeatParams): Promise<LastHeartbeatResult> {
    return this.request<LastHeartbeatResult>('last-heartbeat', params);
  }

  /**
   * Set heartbeat interval.
   */
  async setHeartbeats(params: SetHeartbeatsParams): Promise<void> {
    await this.request('set-heartbeats', params);
  }

  // -------------------------------------------------------------------------
  // Wake
  // -------------------------------------------------------------------------

  /**
   * Wake the system.
   */
  async wake(params?: WakeParams): Promise<void> {
    await this.request('wake', params);
  }

  // -------------------------------------------------------------------------
  // Low-Level Generic Methods
  // -------------------------------------------------------------------------

  /**
   * Generic agent method.
   */
  async agent(params: AgentParams): Promise<AgentResult> {
    return this.request<AgentResult>('agent', params);
  }

  /**
   * Generic send method.
   */
  async send(params: SendParams): Promise<SendResult> {
    return this.request<SendResult>('send', params);
  }

  /**
   * Generic browser request method.
   */
  async browserRequest(params: BrowserRequestParams): Promise<BrowserRequestResult> {
    return this.request<BrowserRequestResult>('browser.request', params);
  }

  // -------------------------------------------------------------------------
  // Wizard
  // -------------------------------------------------------------------------

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
