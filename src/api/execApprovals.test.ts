/**
 * ExecApprovals API Unit Tests
 *
 * Tests for ExecApprovalsAPI methods: get, set, node namespace, approval namespace.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecApprovalsAPI } from './execApprovals';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('ExecApprovalsAPI', () => {
  let execApprovalsAPI: ExecApprovalsAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    execApprovalsAPI = new ExecApprovalsAPI(mockRequest as unknown as RequestFn);
  });

  describe('get', () => {
    it('should call exec.approvals.get with no params', async () => {
      const snapshot = { enabled: true, approvals: [] };
      mockRequest.mockResolvedValueOnce(snapshot);

      const result = await execApprovalsAPI.get();

      expect(mockRequest).toHaveBeenCalledWith('exec.approvals.get', undefined);
      expect(result).toEqual(snapshot);
    });

    it('should call exec.approvals.get with params', async () => {
      const params = { nodeId: 'node-1' };
      const snapshot = { enabled: false, approvals: [] };
      mockRequest.mockResolvedValueOnce(snapshot);

      const result = await execApprovalsAPI.get(params);

      expect(mockRequest).toHaveBeenCalledWith('exec.approvals.get', params);
      expect(result).toEqual(snapshot);
    });
  });

  describe('set', () => {
    it('should call exec.approvals.set with enabled flag', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await execApprovalsAPI.set({ enabled: true });

      expect(mockRequest).toHaveBeenCalledWith('exec.approvals.set', { enabled: true });
    });
  });

  describe('node namespace', () => {
    it('should call exec.approvals.node.get', async () => {
      const params = { nodeId: 'node-1' };
      const snapshot = { enabled: true, approvals: [] };
      mockRequest.mockResolvedValueOnce(snapshot);

      const result = await execApprovalsAPI.node.get(params);

      expect(mockRequest).toHaveBeenCalledWith('exec.approvals.node.get', params);
      expect(result).toEqual(snapshot);
    });

    it('should call exec.approvals.node.set', async () => {
      const params = { nodeId: 'node-1', enabled: false };
      mockRequest.mockResolvedValueOnce(undefined);

      await execApprovalsAPI.node.set(params);

      expect(mockRequest).toHaveBeenCalledWith('exec.approvals.node.set', params);
    });
  });

  describe('approval namespace', () => {
    it('should call exec.approval.request', async () => {
      const params = { nodeId: 'node-1', command: 'run', params: {} };
      mockRequest.mockResolvedValueOnce({ requestId: 'req-1' });

      const result = await execApprovalsAPI.approval.request(params);

      expect(mockRequest).toHaveBeenCalledWith('exec.approval.request', params);
      expect(result).toEqual({ requestId: 'req-1' });
    });

    it('should call exec.approval.waitDecision', async () => {
      const params = { requestId: 'req-1', timeout: 30000 };
      mockRequest.mockResolvedValueOnce({ approved: true });

      const result = await execApprovalsAPI.approval.waitDecision(params);

      expect(mockRequest).toHaveBeenCalledWith('exec.approval.waitDecision', params);
      expect(result).toEqual({ approved: true });
    });

    it('should call exec.approval.resolve', async () => {
      const params = { requestId: 'req-1', approved: true };
      mockRequest.mockResolvedValueOnce(undefined);

      await execApprovalsAPI.approval.resolve(params);

      expect(mockRequest).toHaveBeenCalledWith('exec.approval.resolve', params);
    });
  });
});
