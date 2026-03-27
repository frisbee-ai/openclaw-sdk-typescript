/**
 * Channels API Unit Tests
 *
 * Tests for ChannelsAPI methods: status, logout, talk namespace.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelsAPI } from './channels';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('ChannelsAPI', () => {
  let channelsAPI: ChannelsAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    channelsAPI = new ChannelsAPI(mockRequest as unknown as RequestFn);
  });

  describe('status', () => {
    it('should call channels.status with no params', async () => {
      const statusResult = { channels: [] };
      mockRequest.mockResolvedValueOnce(statusResult);

      const result = await channelsAPI.status();

      expect(mockRequest).toHaveBeenCalledWith('channels.status', undefined);
      expect(result).toEqual(statusResult);
    });

    it('should call channels.status with params', async () => {
      const params = { channelId: 'channel-1' };
      const statusResult = { channels: [{ channelId: 'channel-1' }] };
      mockRequest.mockResolvedValueOnce(statusResult);

      const result = await channelsAPI.status(params);

      expect(mockRequest).toHaveBeenCalledWith('channels.status', params);
      expect(result).toEqual(statusResult);
    });
  });

  describe('logout', () => {
    it('should call channels.logout with channelId', async () => {
      const params = { channelId: 'channel-1' };
      mockRequest.mockResolvedValueOnce(undefined);

      await channelsAPI.logout(params);

      expect(mockRequest).toHaveBeenCalledWith('channels.logout', params);
    });
  });

  describe('talk namespace', () => {
    it('should call talk.config with no params', async () => {
      const configResult = { language: 'en', mode: 'text' };
      mockRequest.mockResolvedValueOnce(configResult);

      const result = await channelsAPI.talk.config();

      expect(mockRequest).toHaveBeenCalledWith('talk.config', undefined);
      expect(result).toEqual(configResult);
    });

    it('should call talk.mode', async () => {
      const params = { mode: 'voice' };
      mockRequest.mockResolvedValueOnce(undefined);

      await channelsAPI.talk.mode(params);

      expect(mockRequest).toHaveBeenCalledWith('talk.mode', params);
    });

    it('should call talk.speak', async () => {
      const params = { text: 'Hello world', language: 'en' };
      mockRequest.mockResolvedValueOnce(undefined);

      await channelsAPI.talk.speak(params);

      expect(mockRequest).toHaveBeenCalledWith('talk.speak', params);
    });

    it('should call talk.start with no params', async () => {
      const startResult = { sessionId: 'session-1' };
      mockRequest.mockResolvedValueOnce(startResult);

      const result = await channelsAPI.talk.start();

      expect(mockRequest).toHaveBeenCalledWith('talk.start', undefined);
      expect(result).toEqual(startResult);
    });

    it('should call talk.start with params', async () => {
      const params = { language: 'en' };
      const startResult = { sessionId: 'session-1' };
      mockRequest.mockResolvedValueOnce(startResult);

      const result = await channelsAPI.talk.start(params);

      expect(mockRequest).toHaveBeenCalledWith('talk.start', params);
      expect(result).toEqual(startResult);
    });

    it('should call talk.stop', async () => {
      const params = { sessionId: 'session-1' };
      const stopResult = { stopped: true };
      mockRequest.mockResolvedValueOnce(stopResult);

      const result = await channelsAPI.talk.stop(params);

      expect(mockRequest).toHaveBeenCalledWith('talk.stop', params);
      expect(result).toEqual(stopResult);
    });
  });
});
