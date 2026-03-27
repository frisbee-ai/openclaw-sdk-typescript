/**
 * Device Pairing API Unit Tests
 *
 * Tests for DevicePairingAPI methods: list, approve, reject, remove, token namespace.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevicePairingAPI } from './devicePairing';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('DevicePairingAPI', () => {
  let devicePairingAPI: DevicePairingAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    devicePairingAPI = new DevicePairingAPI(mockRequest as unknown as RequestFn);
  });

  describe('list', () => {
    it('should call device.pair.list with no params', async () => {
      mockRequest.mockResolvedValueOnce([]);

      const result = await devicePairingAPI.list();

      expect(mockRequest).toHaveBeenCalledWith('device.pair.list', undefined);
      expect(result).toEqual([]);
    });

    it('should call device.pair.list with params', async () => {
      const params = { status: 'pending' };
      mockRequest.mockResolvedValueOnce([{ pairingId: 'pair-1' }]);

      await devicePairingAPI.list(params);

      expect(mockRequest).toHaveBeenCalledWith('device.pair.list', params);
    });
  });

  describe('approve', () => {
    it('should call device.pair.approve with pairingId', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await devicePairingAPI.approve({ pairingId: 'pair-1' });

      expect(mockRequest).toHaveBeenCalledWith('device.pair.approve', { pairingId: 'pair-1' });
    });
  });

  describe('reject', () => {
    it('should call device.pair.reject with pairingId', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await devicePairingAPI.reject({ pairingId: 'pair-1' });

      expect(mockRequest).toHaveBeenCalledWith('device.pair.reject', { pairingId: 'pair-1' });
    });
  });

  describe('remove', () => {
    it('should call device.pair.remove with pairingId', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await devicePairingAPI.remove({ pairingId: 'pair-1' });

      expect(mockRequest).toHaveBeenCalledWith('device.pair.remove', { pairingId: 'pair-1' });
    });
  });

  describe('token namespace', () => {
    it('should call device.token.rotate', async () => {
      const params = { deviceId: 'dev-1' };
      mockRequest.mockResolvedValueOnce(undefined);

      await devicePairingAPI.token.rotate(params);

      expect(mockRequest).toHaveBeenCalledWith('device.token.rotate', params);
    });

    it('should call device.token.revoke', async () => {
      const params = { tokenId: 'token-1' };
      mockRequest.mockResolvedValueOnce(undefined);

      await devicePairingAPI.token.revoke(params);

      expect(mockRequest).toHaveBeenCalledWith('device.token.revoke', params);
    });
  });
});
