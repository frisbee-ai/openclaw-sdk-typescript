/**
 * Usage API Unit Tests
 *
 * Tests for UsageAPI methods: status, cost.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageAPI } from './usage';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('UsageAPI', () => {
  let usageAPI: UsageAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    usageAPI = new UsageAPI(mockRequest as unknown as RequestFn);
  });

  describe('status', () => {
    it('should call usage.status with no params', async () => {
      const statusResult = { status: 'active', usage: [] };
      mockRequest.mockResolvedValueOnce(statusResult);

      const result = await usageAPI.status();

      expect(mockRequest).toHaveBeenCalledWith('usage.status', undefined);
      expect(result).toEqual(statusResult);
    });

    it('should call usage.status with params', async () => {
      const params = { nodeId: 'node-1' };
      const statusResult = { status: 'active', usage: [] };
      mockRequest.mockResolvedValueOnce(statusResult);

      const result = await usageAPI.status(params);

      expect(mockRequest).toHaveBeenCalledWith('usage.status', params);
      expect(result).toEqual(statusResult);
    });
  });

  describe('cost', () => {
    it('should call usage.cost with no params', async () => {
      const costResult = { totalCost: 0.5, currency: 'USD' };
      mockRequest.mockResolvedValueOnce(costResult);

      const result = await usageAPI.cost();

      expect(mockRequest).toHaveBeenCalledWith('usage.cost', undefined);
      expect(result).toEqual(costResult);
    });

    it('should call usage.cost with params', async () => {
      const params = { startDate: '2026-01-01', endDate: '2026-01-31' };
      const costResult = { totalCost: 10.5, currency: 'USD' };
      mockRequest.mockResolvedValueOnce(costResult);

      const result = await usageAPI.cost(params);

      expect(mockRequest).toHaveBeenCalledWith('usage.cost', params);
      expect(result).toEqual(costResult);
    });
  });
});
