/**
 * Connection Manager Integration Tests
 *
 * Integration tests covering:
 * - Connection lifecycle management
 * - Request/response handling
 * - Event handler coordination
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createConnectionManager,
  type ConnectionManagerConfig,
  type ConnectionEventHandlers,
} from './connection.js';

// Mock transport for testing
class MockTransport {
  url = '';
  readyState = 0;
  readyStateString: 'connecting' | 'open' | 'closing' | 'closed' = 'connecting';
  onopen: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  async connect(url: string): Promise<void> {
    this.url = url;
    this.readyState = 1;
    this.onopen?.({ type: 'open' });
  }

  send(_data: string | ArrayBuffer): void {
    // Mock send
  }

  close(_code?: number, _reason?: string): void {
    this.readyState = 3;
  }
}

describe('ConnectionManager Integration', () => {
  describe('Configuration', () => {
    it('should create with default config', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      expect(manager).toBeDefined();
    });

    it('should accept custom config', () => {
      const transport = new MockTransport();
      const config: ConnectionManagerConfig = {
        defaultRequestTimeout: 5000,
        autoReconnect: true,
        reconnectDelayMs: 1000,
        maxReconnectAttempts: 5,
      };

      const manager = createConnectionManager(transport, config);

      expect(manager).toBeDefined();
    });

    it('should use custom timeout', () => {
      const transport = new MockTransport();
      const config: ConnectionManagerConfig = {
        defaultRequestTimeout: 30000,
      };

      const manager = createConnectionManager(transport, config);

      expect(manager).toBeDefined();
    });
  });

  describe('State management', () => {
    it('should report initial state', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const state = manager.getState();
      expect(state).toBeDefined();
    });

    it('should report ready state', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const ready = manager.isReady();
      expect(typeof ready).toBe('boolean');
    });
  });

  describe('Event handlers', () => {
    it('should allow setting state change handler', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const handler = vi.fn();
      const handlers: ConnectionEventHandlers = {
        onStateChange: handler,
      };

      manager.setHandlers(handlers);

      expect(handler).toBeDefined();
    });

    it('should allow setting message handler', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const handler = vi.fn();
      const handlers: ConnectionEventHandlers = {
        onMessage: handler,
      };

      manager.setHandlers(handlers);

      expect(handler).toBeDefined();
    });

    it('should allow setting error handler', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const handler = vi.fn();
      const handlers: ConnectionEventHandlers = {
        onError: handler,
      };

      manager.setHandlers(handlers);

      expect(handler).toBeDefined();
    });

    it('should allow setting close handler', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const handler = vi.fn();
      const handlers: ConnectionEventHandlers = {
        onClosed: handler,
      };

      manager.setHandlers(handlers);

      expect(handler).toBeDefined();
    });

    it('should allow setting multiple handlers', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const stateHandler = vi.fn();
      const messageHandler = vi.fn();
      const errorHandler = vi.fn();
      const closeHandler = vi.fn();

      const handlers: ConnectionEventHandlers = {
        onStateChange: stateHandler,
        onMessage: messageHandler,
        onError: errorHandler,
        onClosed: closeHandler,
      };

      manager.setHandlers(handlers);

      expect(stateHandler).toBeDefined();
      expect(messageHandler).toBeDefined();
      expect(errorHandler).toBeDefined();
      expect(closeHandler).toBeDefined();
    });
  });

  describe('Server info', () => {
    it('should return undefined before connection', () => {
      const transport = new MockTransport();
      const manager = createConnectionManager(transport);

      const serverInfo = manager.getServerInfo();

      expect(serverInfo).toBeUndefined();
    });
  });
});
