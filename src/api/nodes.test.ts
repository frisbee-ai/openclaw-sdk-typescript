/**
 * Nodes API Unit Tests
 *
 * Tests for NodesAPI methods: list, invoke, event, pendingDrain, pendingEnqueue,
 * describe, pendingPull, pendingAck, rename, and pairing namespace.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodesAPI } from './nodes';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('NodesAPI', () => {
  let nodesAPI: NodesAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    nodesAPI = new NodesAPI(mockRequest as unknown as RequestFn);
  });

  describe('list', () => {
    it('should call node.list', async () => {
      mockRequest.mockResolvedValueOnce([]);

      await nodesAPI.list();

      expect(mockRequest).toHaveBeenCalledWith('node.list', undefined);
    });
  });

  describe('invoke', () => {
    it('should call node.invoke with nodeId and target', async () => {
      const params = { nodeId: 'node-1', target: 'run', params: { key: 'value' } };
      mockRequest.mockResolvedValueOnce({ result: 'done' });

      await nodesAPI.invoke(params);

      expect(mockRequest).toHaveBeenCalledWith('node.invoke', params);
    });
  });

  describe('event', () => {
    it('should call node.event', async () => {
      const params = { nodeId: 'node-1', event: 'started', payload: {} };
      mockRequest.mockResolvedValueOnce(undefined);

      await nodesAPI.event(params);

      expect(mockRequest).toHaveBeenCalledWith('node.event', params);
    });
  });

  describe('pendingDrain', () => {
    it('should call node.pending.drain', async () => {
      const params = { nodeId: 'node-1', max: 10 };
      mockRequest.mockResolvedValueOnce({ items: [] });

      await nodesAPI.pendingDrain(params);

      expect(mockRequest).toHaveBeenCalledWith('node.pending.drain', params);
    });
  });

  describe('pendingEnqueue', () => {
    it('should call node.pending.enqueue', async () => {
      const params = { nodeId: 'node-1', item: { type: 'task' } };
      mockRequest.mockResolvedValueOnce({});

      await nodesAPI.pendingEnqueue(params);

      expect(mockRequest).toHaveBeenCalledWith('node.pending.enqueue', params);
    });
  });

  describe('describe', () => {
    it('should call node.describe with nodeId', async () => {
      const params = { nodeId: 'node-1' };
      mockRequest.mockResolvedValueOnce({ nodeId: 'node-1', status: 'online' });

      await nodesAPI.describe(params);

      expect(mockRequest).toHaveBeenCalledWith('node.describe', params);
    });
  });

  describe('pendingPull', () => {
    it('should call node.pending.pull with nodeId and max', async () => {
      const params = { nodeId: 'node-1', max: 5 };
      mockRequest.mockResolvedValueOnce({ items: [{ id: 'item-1' }] });

      await nodesAPI.pendingPull(params);

      expect(mockRequest).toHaveBeenCalledWith('node.pending.pull', params);
    });
  });

  describe('pendingAck', () => {
    it('should call node.pending.ack with nodeId and itemId', async () => {
      const params = { nodeId: 'node-1', itemId: 'item-1' };
      mockRequest.mockResolvedValueOnce(undefined);

      await nodesAPI.pendingAck(params);

      expect(mockRequest).toHaveBeenCalledWith('node.pending.ack', params);
    });
  });

  describe('rename', () => {
    it('should call node.rename with nodeId and name', async () => {
      const params = { nodeId: 'node-1', name: 'new-name' };
      mockRequest.mockResolvedValueOnce(undefined);

      await nodesAPI.rename(params);

      expect(mockRequest).toHaveBeenCalledWith('node.rename', params);
    });
  });

  describe('pairing namespace', () => {
    it('should call node.pair.request', async () => {
      mockRequest.mockResolvedValueOnce({});

      await nodesAPI.pairing.request({ nodeId: 'node-1' });

      expect(mockRequest).toHaveBeenCalledWith('node.pair.request', { nodeId: 'node-1' });
    });

    it('should call node.pair.list', async () => {
      mockRequest.mockResolvedValueOnce([]);

      await nodesAPI.pairing.list({ nodeId: 'node-1' });

      expect(mockRequest).toHaveBeenCalledWith('node.pair.list', { nodeId: 'node-1' });
    });

    it('should call node.pair.approve', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await nodesAPI.pairing.approve({ nodeId: 'node-1', pairingId: 'pair-1' });

      expect(mockRequest).toHaveBeenCalledWith('node.pair.approve', {
        nodeId: 'node-1',
        pairingId: 'pair-1',
      });
    });

    it('should call node.pair.reject', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await nodesAPI.pairing.reject({ nodeId: 'node-1', pairingId: 'pair-1' });

      expect(mockRequest).toHaveBeenCalledWith('node.pair.reject', {
        nodeId: 'node-1',
        pairingId: 'pair-1',
      });
    });

    it('should call node.pair.verify', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await nodesAPI.pairing.verify({ nodeId: 'node-1', pairingId: 'pair-1', code: '123456' });

      expect(mockRequest).toHaveBeenCalledWith('node.pair.verify', {
        nodeId: 'node-1',
        pairingId: 'pair-1',
        code: '123456',
      });
    });
  });
});
