import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushAPI } from './push';
import type { PushRegisterResult, PushUnregisterResult, PushSendResult } from '../protocol/params/push.js';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('PushAPI', () => {
  let api: PushAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as unknown as RequestFn;
    api = new PushAPI(mockRequest as unknown as RequestFn);
  });

  describe('register', () => {
    it('registers for push notifications', async () => {
      const result: PushRegisterResult = { success: true };
      mockRequest.mockResolvedValue(result);

      const response = await api.register({ token: 'device-token-abc', platform: 'ios' });

      expect(mockRequest).toHaveBeenCalledWith('push.register', { token: 'device-token-abc', platform: 'ios' });
      expect(response).toEqual(result);
    });

    it('registers with required params', async () => {
      const result: PushRegisterResult = {};
      mockRequest.mockResolvedValue(result);

      const response = await api.register({ token: 'token', platform: 'android' });

      expect(mockRequest).toHaveBeenCalledWith('push.register', { token: 'token', platform: 'android' });
      expect(response).toEqual(result);
    });
  });

  describe('unregister', () => {
    it('unregisters from push notifications', async () => {
      const result: PushUnregisterResult = { success: true };
      mockRequest.mockResolvedValue(result);

      const response = await api.unregister({ token: 'device-token-abc' });

      expect(mockRequest).toHaveBeenCalledWith('push.unregister', { token: 'device-token-abc' });
      expect(response).toEqual(result);
    });
  });

  describe('send', () => {
    it('sends a push notification', async () => {
      const result: PushSendResult = { messageId: 'msg-123' };
      mockRequest.mockResolvedValue(result);

      const response = await api.send({ target: 'user-123', title: 'Hello', body: 'World' });

      expect(mockRequest).toHaveBeenCalledWith('push.send', { target: 'user-123', title: 'Hello', body: 'World' });
      expect(response).toEqual(result);
    });

    it('sends push with optional params', async () => {
      const result: PushSendResult = { messageId: 'msg-456' };
      mockRequest.mockResolvedValue(result);

      const response = await api.send({ target: 'user-123', title: 'Alert', body: 'Something happened', data: { key: 'value' } });

      expect(mockRequest).toHaveBeenCalledWith('push.send', { target: 'user-123', title: 'Alert', body: 'Something happened', data: { key: 'value' } });
      expect(response).toEqual(result);
    });
  });
});
