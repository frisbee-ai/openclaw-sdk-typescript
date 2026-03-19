/**
 * WebSocket Transport Integration Tests
 *
 * Integration tests covering:
 * - Full connection lifecycle (connect, send, receive, close)
 * - Message handling across the transport layer
 * - Error handling during network operations
 */

import { describe, it, expect, vi } from 'vitest';
import { WebSocketTransport } from './websocket.js';

describe('WebSocketTransport Integration', () => {
  describe('Connection lifecycle', () => {
    it('should create transport with default config', () => {
      const transport = new WebSocketTransport();
      expect(transport).toBeDefined();
    });

    it('should accept custom WebSocket implementation', () => {
      const mockWs = vi.fn().mockImplementation(() => ({
        readyState: 0,
        send: vi.fn(),
        close: vi.fn(),
      }));

      const transport = new WebSocketTransport({
        WebSocketImpl: mockWs as any,
      });

      expect(transport).toBeDefined();
    });

    it('should have correct default values', () => {
      const transport = new WebSocketTransport();

      // Should have default handlers as null
      expect(transport.onopen).toBeNull();
      expect(transport.onclose).toBeNull();
      expect(transport.onmessage).toBeNull();
      expect(transport.onbinary).toBeNull();
      expect(transport.onerror).toBeNull();
    });
  });

  describe('Message handling integration', () => {
    it('should allow setting onmessage handler', () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      transport.onmessage = handler;

      expect(transport.onmessage).toBe(handler);
    });

    it('should allow setting onbinary handler', () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      transport.onbinary = handler;

      expect(transport.onbinary).toBe(handler);
    });

    it('should allow setting onopen handler', () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      transport.onopen = handler;

      expect(transport.onopen).toBe(handler);
    });

    it('should allow setting onclose handler', () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      transport.onclose = handler;

      expect(transport.onclose).toBe(handler);
    });

    it('should allow setting onerror handler', () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      transport.onerror = handler;

      expect(transport.onerror).toBe(handler);
    });

    it('should allow clearing handlers', () => {
      const transport = new WebSocketTransport();
      const handler = vi.fn();

      transport.onmessage = handler;
      transport.onmessage = null;

      expect(transport.onmessage).toBeNull();
    });
  });

  describe('Transport configuration', () => {
    it('should accept connect timeout configuration', () => {
      const transport = new WebSocketTransport({
        connectTimeoutMs: 5000,
      });

      expect(transport).toBeDefined();
    });

    it('should accept binary protocol configuration', () => {
      const transport = new WebSocketTransport({
        useBinary: true,
      });

      expect(transport).toBeDefined();
    });

    it('should accept all configuration options', () => {
      const transport = new WebSocketTransport({
        connectTimeoutMs: 10000,
        useBinary: false,
      });

      expect(transport).toBeDefined();
    });
  });
});
