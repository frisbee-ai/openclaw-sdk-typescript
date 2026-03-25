/**
 * Sessions API Unit Tests
 *
 * Tests for SessionsAPI methods: create, send, abort, subscribe, unsubscribe,
 * messagesSubscribe, messagesUnsubscribe, patch, reset, delete, compact, usage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionsAPI } from './sessions';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('SessionsAPI', () => {
  let sessionsAPI: SessionsAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    sessionsAPI = new SessionsAPI(mockRequest as unknown as RequestFn);
  });

  describe('list', () => {
    it('should call sessions.list with no params', async () => {
      mockRequest.mockResolvedValueOnce([]);

      const result = await sessionsAPI.list();

      expect(mockRequest).toHaveBeenCalledWith('sessions.list', undefined);
      expect(result).toEqual([]);
    });
  });

  describe('preview', () => {
    it('should call sessions.preview with sessionId', async () => {
      const previewParams = { sessionId: 'sess-123' };
      mockRequest.mockResolvedValueOnce({ state: {} });

      await sessionsAPI.preview(previewParams);

      expect(mockRequest).toHaveBeenCalledWith('sessions.preview', previewParams);
    });
  });

  describe('create', () => {
    it('should call sessions.create with optional params', async () => {
      const createParams = { key: 'my-session', agentId: 'agent-1', label: 'test' };
      mockRequest.mockResolvedValueOnce({ sessionId: 'sess-new' });

      await sessionsAPI.create(createParams);

      expect(mockRequest).toHaveBeenCalledWith('sessions.create', createParams);
    });

    it('should call sessions.create with no params', async () => {
      mockRequest.mockResolvedValueOnce({ sessionId: 'sess-default' });

      await sessionsAPI.create();

      expect(mockRequest).toHaveBeenCalledWith('sessions.create', undefined);
    });
  });

  describe('send', () => {
    it('should call sessions.send with key and message', async () => {
      const sendParams = { key: 'sess-123', message: 'Hello' };
      mockRequest.mockResolvedValueOnce({ ok: true });

      await sessionsAPI.send(sendParams);

      expect(mockRequest).toHaveBeenCalledWith('sessions.send', sendParams);
    });

    it('should call sessions.send with thinking and attachments', async () => {
      const sendParams = {
        key: 'sess-123',
        message: 'Hello',
        thinking: 'Let me think...',
        attachments: [{ type: 'file', name: 'doc.pdf' }],
      };
      mockRequest.mockResolvedValueOnce({ ok: true });

      await sessionsAPI.send(sendParams);

      expect(mockRequest).toHaveBeenCalledWith('sessions.send', sendParams);
    });
  });

  describe('abort', () => {
    it('should call sessions.abort with key', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await sessionsAPI.abort({ key: 'sess-123' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.abort', {
        key: 'sess-123',
        runId: undefined,
      });
    });

    it('should call sessions.abort with key and runId', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await sessionsAPI.abort({ key: 'sess-123', runId: 'run-456' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.abort', {
        key: 'sess-123',
        runId: 'run-456',
      });
    });
  });

  describe('subscribe', () => {
    it('should call sessions.subscribe with key', async () => {
      mockRequest.mockResolvedValueOnce({ subscribed: true });

      await sessionsAPI.subscribe({ key: 'sess-123' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.subscribe', { key: 'sess-123' });
    });
  });

  describe('unsubscribe', () => {
    it('should call sessions.unsubscribe with key', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await sessionsAPI.unsubscribe({ key: 'sess-123' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.unsubscribe', { key: 'sess-123' });
    });
  });

  describe('messagesSubscribe', () => {
    it('should call sessions.messages.subscribe with key', async () => {
      mockRequest.mockResolvedValueOnce({ subscribed: true });

      await sessionsAPI.messagesSubscribe({ key: 'sess-123' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.messages.subscribe', { key: 'sess-123' });
    });
  });

  describe('messagesUnsubscribe', () => {
    it('should call sessions.messages.unsubscribe with key', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await sessionsAPI.messagesUnsubscribe({ key: 'sess-123' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.messages.unsubscribe', {
        key: 'sess-123',
      });
    });
  });

  describe('patch', () => {
    it('should call sessions.patch with sessionId and patch', async () => {
      const patchParams = { sessionId: 'sess-123', patch: { label: 'updated' } };
      mockRequest.mockResolvedValueOnce({});

      await sessionsAPI.patch(patchParams);

      expect(mockRequest).toHaveBeenCalledWith('sessions.patch', patchParams);
    });
  });

  describe('reset', () => {
    it('should call sessions.reset with sessionId', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await sessionsAPI.reset({ sessionId: 'sess-123' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.reset', { sessionId: 'sess-123' });
    });
  });

  describe('delete', () => {
    it('should call sessions.delete with sessionId', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await sessionsAPI.delete({ sessionId: 'sess-123' });

      expect(mockRequest).toHaveBeenCalledWith('sessions.delete', { sessionId: 'sess-123' });
    });
  });

  describe('compact', () => {
    it('should call sessions.compact with no params', async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await sessionsAPI.compact();

      expect(mockRequest).toHaveBeenCalledWith('sessions.compact', undefined);
    });
  });

  describe('usage', () => {
    it('should call sessions.usage with no params', async () => {
      mockRequest.mockResolvedValueOnce({ totalTokens: 1000 });

      await sessionsAPI.usage();

      expect(mockRequest).toHaveBeenCalledWith('sessions.usage', undefined);
    });
  });
});
