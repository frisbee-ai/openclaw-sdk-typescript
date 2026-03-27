/**
 * System API Unit Tests
 *
 * Tests for SystemAPI methods: health, status, doctorMemoryStatus, logsTail,
 * usageStatus, usageCost, TTS methods, modelsList, updateRun, voiceWake,
 * gatewayIdentityGet, systemPresence, systemEvent, heartbeat, wake,
 * agent, send, browserRequest, wizard namespace.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SystemAPI } from './system';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('SystemAPI', () => {
  let systemAPI: SystemAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    systemAPI = new SystemAPI(mockRequest as unknown as RequestFn);
  });

  describe('health', () => {
    it('should call system.health', async () => {
      mockRequest.mockResolvedValueOnce({ status: 'healthy' });

      await systemAPI.health();

      expect(mockRequest).toHaveBeenCalledWith('system.health');
    });
  });

  describe('status', () => {
    it('should call system.status', async () => {
      mockRequest.mockResolvedValueOnce({ status: 'running' });

      await systemAPI.status();

      expect(mockRequest).toHaveBeenCalledWith('system.status');
    });
  });

  describe('doctorMemoryStatus', () => {
    it('should call doctor.memory.status', async () => {
      const result = { memory: { used: 100, total: 1000 } };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.doctorMemoryStatus();

      expect(mockRequest).toHaveBeenCalledWith('doctor.memory.status', undefined);
      expect(response).toEqual(result);
    });
  });

  describe('logsTail', () => {
    it('should call logs.tail with no params', async () => {
      const result = { logs: [] };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.logsTail();

      expect(mockRequest).toHaveBeenCalledWith('logs.tail', undefined);
      expect(response).toEqual(result);
    });
  });

  describe('usageStatus', () => {
    it('should call usage.status', async () => {
      const result = { usage: [] };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.usageStatus();

      expect(mockRequest).toHaveBeenCalledWith('usage.status', undefined);
      expect(response).toEqual(result);
    });
  });

  describe('usageCost', () => {
    it('should call usage.cost', async () => {
      const result = { cost: 0.5 };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.usageCost();

      expect(mockRequest).toHaveBeenCalledWith('usage.cost', undefined);
      expect(response).toEqual(result);
    });
  });

  describe('TTS methods', () => {
    it('should call tts.speak', async () => {
      const params = { text: 'Hello', language: 'en' };
      const result = { audio: 'base64...' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.speak(params);

      expect(mockRequest).toHaveBeenCalledWith('tts.speak', params);
      expect(response).toEqual(result);
    });

    it('should call tts.voices with no params', async () => {
      const result = { voices: [] };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.voices();

      expect(mockRequest).toHaveBeenCalledWith('tts.voices', undefined);
      expect(response).toEqual(result);
    });

    it('should call tts.status', async () => {
      const result = { enabled: true };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.ttsStatus();

      expect(mockRequest).toHaveBeenCalledWith('tts.status', undefined);
      expect(response).toEqual(result);
    });

    it('should call tts.providers', async () => {
      const result = { providers: [] };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.ttsProviders();

      expect(mockRequest).toHaveBeenCalledWith('tts.providers', undefined);
      expect(response).toEqual(result);
    });

    it('should call tts.enable', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.ttsEnable();

      expect(mockRequest).toHaveBeenCalledWith('tts.enable', undefined);
    });

    it('should call tts.disable', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.ttsDisable();

      expect(mockRequest).toHaveBeenCalledWith('tts.disable', undefined);
    });

    it('should call tts.convert', async () => {
      const params = { text: 'Hello', format: 'mp3' };
      mockRequest.mockResolvedValueOnce({ data: '...' });

      await systemAPI.ttsConvert(params);

      expect(mockRequest).toHaveBeenCalledWith('tts.convert', params);
    });

    it('should call tts.setProvider', async () => {
      const params = { provider: 'openai' };
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.ttsSetProvider(params);

      expect(mockRequest).toHaveBeenCalledWith('tts.setProvider', params);
    });
  });

  describe('modelsList', () => {
    it('should call models.list', async () => {
      const result = { models: [] };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.modelsList();

      expect(mockRequest).toHaveBeenCalledWith('models.list', undefined);
      expect(response).toEqual(result);
    });
  });

  describe('updateRun', () => {
    it('should call update.run', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.updateRun();

      expect(mockRequest).toHaveBeenCalledWith('update.run', undefined);
    });
  });

  describe('voiceWake methods', () => {
    it('should call voicewake.get', async () => {
      const result = { enabled: false };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.voiceWakeGet();

      expect(mockRequest).toHaveBeenCalledWith('voicewake.get', undefined);
      expect(response).toEqual(result);
    });

    it('should call voicewake.set', async () => {
      const params = { enabled: true };
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.voiceWakeSet(params);

      expect(mockRequest).toHaveBeenCalledWith('voicewake.set', params);
    });
  });

  describe('gatewayIdentityGet', () => {
    it('should call gateway.identity.get', async () => {
      const result = { gatewayId: 'gw-1' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.gatewayIdentityGet();

      expect(mockRequest).toHaveBeenCalledWith('gateway.identity.get', undefined);
      expect(response).toEqual(result);
    });
  });

  describe('systemPresence', () => {
    it('should call system-presence', async () => {
      const result = { presence: 'home' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.systemPresence();

      expect(mockRequest).toHaveBeenCalledWith('system-presence', undefined);
      expect(response).toEqual(result);
    });
  });

  describe('systemEvent', () => {
    it('should call system-event', async () => {
      const params = { event: 'user_arrived', data: {} };
      const result = { processed: true };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.systemEvent(params);

      expect(mockRequest).toHaveBeenCalledWith('system-event', params);
      expect(response).toEqual(result);
    });
  });

  describe('heartbeat methods', () => {
    it('should call last-heartbeat', async () => {
      const result = { timestamp: '2026-03-26T00:00:00Z' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.lastHeartbeat();

      expect(mockRequest).toHaveBeenCalledWith('last-heartbeat', undefined);
      expect(response).toEqual(result);
    });

    it('should call set-heartbeats', async () => {
      const params = { interval: 60 };
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.setHeartbeats(params);

      expect(mockRequest).toHaveBeenCalledWith('set-heartbeats', params);
    });
  });

  describe('wake', () => {
    it('should call wake', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.wake();

      expect(mockRequest).toHaveBeenCalledWith('wake', undefined);
    });
  });

  describe('low-level methods', () => {
    it('should call agent', async () => {
      const params = { method: 'test', params: {} };
      const result = { result: 'ok' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.agent(params);

      expect(mockRequest).toHaveBeenCalledWith('agent', params);
      expect(response).toEqual(result);
    });

    it('should call send', async () => {
      const params = { target: 'test', data: {} };
      const result = { sent: true };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.send(params);

      expect(mockRequest).toHaveBeenCalledWith('send', params);
      expect(response).toEqual(result);
    });

    it('should call browser.request', async () => {
      const params = { url: 'https://example.com', action: 'navigate' };
      const result = { success: true };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.browserRequest(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.request', params);
      expect(response).toEqual(result);
    });
  });

  describe('wizard namespace', () => {
    it('should call wizard.start', async () => {
      const params = { wizardId: 'setup' };
      const result = { started: true };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.wizardStart(params);

      expect(mockRequest).toHaveBeenCalledWith('wizard.start', params);
      expect(response).toEqual(result);
    });

    it('should call wizard.next', async () => {
      const params = { wizardId: 'setup' };
      const result = { step: 'next-step' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.wizardNext(params);

      expect(mockRequest).toHaveBeenCalledWith('wizard.next', params);
      expect(response).toEqual(result);
    });

    it('should call wizard.cancel', async () => {
      const params = { wizardId: 'setup' };
      mockRequest.mockResolvedValueOnce(undefined);

      await systemAPI.wizardCancel(params);

      expect(mockRequest).toHaveBeenCalledWith('wizard.cancel', params);
    });

    it('should call wizard.status', async () => {
      const params = { wizardId: 'setup' };
      const result = { status: 'active', step: 'current' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await systemAPI.wizardStatus(params);

      expect(mockRequest).toHaveBeenCalledWith('wizard.status', params);
      expect(response).toEqual(result);
    });
  });
});
