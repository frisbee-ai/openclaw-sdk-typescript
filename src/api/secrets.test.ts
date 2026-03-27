/**
 * Secrets API Unit Tests
 *
 * Tests for SecretsAPI methods: reload, resolve.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecretsAPI } from './secrets';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('SecretsAPI', () => {
  let secretsAPI: SecretsAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    secretsAPI = new SecretsAPI(mockRequest as unknown as RequestFn);
  });

  describe('reload', () => {
    it('should call secrets.reload with no params', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await secretsAPI.reload();

      expect(mockRequest).toHaveBeenCalledWith('secrets.reload', undefined);
    });

    it('should call secrets.reload with params', async () => {
      const params = { force: true };
      mockRequest.mockResolvedValueOnce(undefined);

      await secretsAPI.reload(params);

      expect(mockRequest).toHaveBeenCalledWith('secrets.reload', params);
    });
  });

  describe('resolve', () => {
    it('should call secrets.resolve with key', async () => {
      const params = { key: 'API_KEY' };
      const resolveResult = { value: 'secret-value' };
      mockRequest.mockResolvedValueOnce(resolveResult);

      const result = await secretsAPI.resolve(params);

      expect(mockRequest).toHaveBeenCalledWith('secrets.resolve', params);
      expect(result).toEqual(resolveResult);
    });
  });
});
