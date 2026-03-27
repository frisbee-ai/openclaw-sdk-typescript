/**
 * Browser API Unit Tests
 *
 * Tests for BrowserAPI methods: open, list, screenshot, eval.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserAPI } from './browser';

type RequestFn = <T = unknown>(method: string, params?: unknown) => Promise<T>;

describe('BrowserAPI', () => {
  let browserAPI: BrowserAPI;
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = vi.fn() as ReturnType<typeof vi.fn>;
    browserAPI = new BrowserAPI(mockRequest as unknown as RequestFn);
  });

  describe('open', () => {
    it('should call browser.open with url', async () => {
      const params = { url: 'https://example.com' };
      const result = { tabId: 'tab-1' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.open(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.open', params);
      expect(response).toEqual(result);
    });

    it('should call browser.open with url and options', async () => {
      const params = { url: 'https://example.com', headless: true };
      const result = { tabId: 'tab-1' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.open(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.open', params);
      expect(response).toEqual(result);
    });
  });

  describe('list', () => {
    it('should call browser.list with no params', async () => {
      const result = { tabs: [] };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.list();

      expect(mockRequest).toHaveBeenCalledWith('browser.list', undefined);
      expect(response).toEqual(result);
    });

    it('should call browser.list with params', async () => {
      const params = { status: 'open' };
      const result = { tabs: [{ tabId: 'tab-1' }] };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.list(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.list', params);
      expect(response).toEqual(result);
    });
  });

  describe('screenshot', () => {
    it('should call browser.screenshot with tabId', async () => {
      const params = { tabId: 'tab-1' };
      const result = { data: 'base64-image-data' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.screenshot(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.screenshot', params);
      expect(response).toEqual(result);
    });

    it('should call browser.screenshot with tabId and format', async () => {
      const params = { tabId: 'tab-1', format: 'png' };
      const result = { data: 'base64-image-data' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.screenshot(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.screenshot', params);
      expect(response).toEqual(result);
    });
  });

  describe('evaluate script', () => {
    it('should call browser.eval with tabId and code', async () => {
      const params = { tabId: 'tab-1', code: 'document.title' };
      const result = { result: 'Example Domain' };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.eval(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.eval', params);
      expect(response).toEqual(result);
    });

    it('should call browser.eval with tabId, code and options', async () => {
      const params = { tabId: 'tab-1', code: '1 + 1', timeout: 5000 };
      const result = { result: 2 };
      mockRequest.mockResolvedValueOnce(result);

      const response = await browserAPI.eval(params);

      expect(mockRequest).toHaveBeenCalledWith('browser.eval', params);
      expect(response).toEqual(result);
    });
  });
});
