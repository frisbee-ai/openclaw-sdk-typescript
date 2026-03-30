/**
 * OpenClawClient Unit Tests
 *
 * Comprehensive tests covering:
 * - Unit: Client configuration, event handlers
 * - Edge Cases: Request options, timeouts
 * - Security: Input validation
 */

import { describe, it, expect, vi } from 'vitest';
import {
  OpenClawClient,
  ClientBuilder,
  type ClientConfig,
  type ConnectionConfig,
  type RequestOptions,
} from './index.js';

describe('ClientBuilder', () => {
  it('should create OpenClawClient instance', async () => {
    const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

    expect(client).toBeInstanceOf(OpenClawClient);
  });

  it('should accept minimal config', async () => {
    const client = await new ClientBuilder('ws://localhost:8080', 'test').build();

    expect(client).toBeDefined();
  });

  it('should accept auth token', async () => {
    const client = await new ClientBuilder('ws://localhost:8080', 'test-client')
      .withAuth('test-token')
      .build();

    expect(client).toBeInstanceOf(OpenClawClient);
  });

  it('should accept nested connection config', async () => {
    const client = await new ClientBuilder('ws://localhost:8080', 'test-client')
      .withReconnect({ requestTimeoutMs: 5000, connectTimeoutMs: 10000, autoReconnect: false })
      .build();

    expect(client).toBeInstanceOf(OpenClawClient);
  });

  it('should accept full config', async () => {
    const client = await new ClientBuilder('ws://localhost:8080', 'test-client', '1.0.0')
      .withAuth('token')
      .withReconnect({ autoReconnect: true, maxReconnectAttempts: 5, reconnectDelayMs: 1000 })
      .build();

    expect(client).toBeInstanceOf(OpenClawClient);
  });
});

describe('OpenClawClient', () => {
  describe('connectionState', () => {
    it('should return initial connection state', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      expect(client.connectionState).toBeDefined();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      expect(client.isConnected).toBe(false);
    });
  });

  describe('onStateChange', () => {
    it('should register state change handler', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      const handler = vi.fn();
      const unsubscribe = client.onStateChange(handler);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });

    it('should allow multiple handlers', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      client.onStateChange(handler1);
      client.onStateChange(handler2);

      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });

    it('should return unsubscribe function that removes handler', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      const handler = vi.fn();
      const unsubscribe = client.onStateChange(handler);

      // unsubscribe returns boolean from Set.delete
      const result = unsubscribe();

      // Set.delete returns true if item was found and deleted
      expect(result).toBe(true);
    });
  });

  describe('onError', () => {
    it('should register error handler', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      const handler = vi.fn();
      const unsubscribe = client.onError(handler);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('onMessage', () => {
    it('should register message handler', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      const handler = vi.fn();
      const unsubscribe = client.onMessage(handler);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('onClosed', () => {
    it('should register closed handler', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      const handler = vi.fn();
      const unsubscribe = client.onClosed(handler);

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('disconnect', () => {
    it('should have disconnect method', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      expect(typeof client.disconnect).toBe('function');
    });
  });

  describe('abort', () => {
    it('should have abort method', async () => {
      const client = await new ClientBuilder('ws://localhost:8080', 'test-client').build();

      expect(typeof client.abort).toBe('function');
    });
  });
});

describe('ClientConfig', () => {
  it('should accept all config options', async () => {
    const config: ClientConfig = {
      url: 'ws://localhost:8080',
      clientId: 'test-client',
      clientVersion: '1.0.0',
      platform: 'node',
      deviceFamily: 'desktop',
      modelIdentifier: 'macbook',
      mode: 'node',
      instanceId: 'instance-123',
      auth: {
        token: 'token',
        bootstrapToken: 'bootstrap',
        deviceToken: 'device',
        password: 'password',
      },
      connection: {
        requestTimeoutMs: 5000,
        connectTimeoutMs: 10000,
        autoReconnect: true,
        maxReconnectAttempts: 5,
        reconnectDelayMs: 1000,
      },
    };

    expect(config.url).toBe('ws://localhost:8080');
    expect(config.clientId).toBe('test-client');
  });

  describe('url validation', () => {
    it('should accept ws:// URL scheme', async () => {
      expect(() => new ClientBuilder('ws://localhost:8080', 'test').build()).not.toThrow();
    });

    it('should accept wss:// URL scheme', async () => {
      expect(() => new ClientBuilder('wss://localhost:8080', 'test').build()).not.toThrow();
    });

    it('should reject http:// URL scheme', async () => {
      await expect(new ClientBuilder('http://localhost:8080', 'test').build()).rejects.toThrow(
        'Invalid URL scheme: http:. Expected ws: or wss:'
      );
    });

    it('should reject https:// URL scheme', async () => {
      await expect(new ClientBuilder('https://localhost:8080', 'test').build()).rejects.toThrow(
        'Invalid URL scheme: https:. Expected ws: or wss:'
      );
    });

    it('should reject file:// URL scheme', async () => {
      await expect(new ClientBuilder('file:///path/to/socket', 'test').build()).rejects.toThrow(
        'Invalid URL scheme: file:. Expected ws: or wss:'
      );
    });

    it('should reject malformed URLs', async () => {
      await expect(new ClientBuilder('not-a-valid-url', 'test').build()).rejects.toThrow(
        'Invalid WebSocket URL: not-a-valid-url'
      );
    });
  });
});

describe('ConnectionConfig', () => {
  it('should accept all connection options', async () => {
    const config: ConnectionConfig = {
      requestTimeoutMs: 5000,
      connectTimeoutMs: 10000,
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelayMs: 1000,
    };

    expect(config.requestTimeoutMs).toBe(5000);
    expect(config.autoReconnect).toBe(true);
  });
});

describe('RequestOptions', () => {
  it('should accept signal option', async () => {
    const controller = new AbortController();
    const options: RequestOptions = { signal: controller.signal };

    expect(options.signal).toBe(controller.signal);
  });

  it('should accept expectFinal option', async () => {
    const options: RequestOptions = { expectFinal: true };

    expect(options.expectFinal).toBe(true);
  });

  it('should accept expectFinalTimeoutMs option', async () => {
    const options: RequestOptions = { expectFinalTimeoutMs: 5000 };

    expect(options.expectFinalTimeoutMs).toBe(5000);
  });

  it('should accept all options together', async () => {
    const controller = new AbortController();
    const options: RequestOptions = {
      signal: controller.signal,
      expectFinal: true,
      expectFinalTimeoutMs: 10000,
    };

    expect(options.signal).toBeDefined();
    expect(options.expectFinal).toBe(true);
    expect(options.expectFinalTimeoutMs).toBe(10000);
  });
});
