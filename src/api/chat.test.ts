/**
 * Chat API Unit Tests
 *
 * Tests for ChatAPI methods: list, inject, history, delete, title, abort, send.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatAPI } from './chat';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('ChatAPI', () => {
  let chatAPI: ChatAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    chatAPI = new ChatAPI(mockRequest as unknown as RequestFn);
  });

  describe('list', () => {
    it('should call chat.list with no params', async () => {
      const listResult = { chats: [] };
      mockRequest.mockResolvedValueOnce(listResult);

      const result = await chatAPI.list();

      expect(mockRequest).toHaveBeenCalledWith('chat.list', undefined);
      expect(result).toEqual(listResult);
    });

    it('should call chat.list with params', async () => {
      const params = { limit: 10 };
      const listResult = { chats: [{ chatId: 'chat-1' }] };
      mockRequest.mockResolvedValueOnce(listResult);

      const result = await chatAPI.list(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.list', params);
      expect(result).toEqual(listResult);
    });
  });

  describe('inject', () => {
    it('should call chat.inject with chatId and message', async () => {
      const params = {
        chatId: 'chat-1',
        message: { role: 'user', content: 'Hello' },
      };
      mockRequest.mockResolvedValueOnce(undefined);

      await chatAPI.inject(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.inject', params);
    });
  });

  describe('history', () => {
    it('should call chat.history with chatId', async () => {
      const params = { chatId: 'chat-1' };
      const historyResult = { messages: [] };
      mockRequest.mockResolvedValueOnce(historyResult);

      const result = await chatAPI.history(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.history', params);
      expect(result).toEqual(historyResult);
    });
  });

  describe('delete', () => {
    it('should call chat.delete with chatId', async () => {
      const params = { chatId: 'chat-1' };
      const deleteResult = { deleted: true };
      mockRequest.mockResolvedValueOnce(deleteResult);

      const result = await chatAPI.delete(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.delete', params);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('title', () => {
    it('should call chat.title with chatId', async () => {
      const params = { chatId: 'chat-1' };
      const titleResult = { title: 'My Chat' };
      mockRequest.mockResolvedValueOnce(titleResult);

      const result = await chatAPI.title(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.title', params);
      expect(result).toEqual(titleResult);
    });

    it('should call chat.title with chatId and title', async () => {
      const params = { chatId: 'chat-1', title: 'New Title' };
      const titleResult = { title: 'New Title' };
      mockRequest.mockResolvedValueOnce(titleResult);

      const result = await chatAPI.title(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.title', params);
      expect(result).toEqual(titleResult);
    });
  });

  describe('abort', () => {
    it('should call chat.abort with chatId', async () => {
      const params = { chatId: 'chat-1' };
      mockRequest.mockResolvedValueOnce(undefined);

      await chatAPI.abort(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.abort', params);
    });
  });

  describe('send', () => {
    it('should call chat.send with chatId and message', async () => {
      const params = { chatId: 'chat-1', message: 'Hello' };
      mockRequest.mockResolvedValueOnce(undefined);

      await chatAPI.send(params);

      expect(mockRequest).toHaveBeenCalledWith('chat.send', params);
    });
  });
});
