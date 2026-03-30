/**
 * Connection Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TextDecoder } from 'node:util';
import type { ConnectionState } from '../../src/protocol/types';
import { ConnectionManager, createConnectionManager } from '../../src/managers/connection';
import { ReadyState } from '../../src/transport/websocket';
import type { IWebSocketTransport } from '../../src/transport/websocket';
import type { ConnectParams, GatewayFrame, HelloOk } from '../../src/protocol/types';

// Helper to create a connect params
const createConnectParams = (): ConnectParams => ({
  minProtocol: 1,
  maxProtocol: 1,
  client: {
    id: 'test-client',
    version: '1.0.0',
    platform: 'test',
    mode: 'test',
  },
});

describe('ConnectionManager', () => {
  let manager: ConnectionManager;
  let transport: IWebSocketTransport;

  beforeEach(() => {
    // Create a mock transport that simulates the full WebSocket lifecycle
    const mockTransport = {
      url: 'ws://localhost:8080',
      readyState: ReadyState.CLOSED,
      readyStateString: 'closed' as const,
      connect: vi.fn(async (_url: string) => {
        mockTransport.url = _url;
        mockTransport.readyState = ReadyState.CONNECTING;
        mockTransport.readyStateString = 'connecting';
        // Simulate async connection
        await new Promise<void>(resolve => setTimeout(resolve, 5));
        mockTransport.readyState = ReadyState.OPEN;
        mockTransport.readyStateString = 'open';
        // Trigger onopen
        if (mockTransport.onopen) {
          mockTransport.onopen({ url: _url, timestamp: Date.now() });
        }
      }),
      send: vi.fn((data: string | ArrayBuffer) => {
        // Parse the sent frame and simulate response
        const frameStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
        try {
          const frame = JSON.parse(frameStr);
          // Simulate hello-ok response for connect requests
          if (frame.type === 'req' && frame.method === 'connect') {
            setTimeout(() => {
              if (mockTransport.onmessage) {
                const response: GatewayFrame = {
                  type: 'res',
                  id: frame.id,
                  ok: true,
                  payload: {
                    type: 'hello-ok',
                    protocol: 1,
                    server: { version: '1.0.0', connId: 'test-conn' },
                    features: { methods: ['test'], events: ['test'] },
                    snapshot: { agents: {}, nodes: {} },
                    policy: {
                      maxPayload: 1024,
                      maxBufferedBytes: 4096,
                      tickIntervalMs: 1000,
                    },
                  } as HelloOk,
                };
                mockTransport.onmessage(JSON.stringify(response));
              }
            }, 5);
          }
        } catch {
          // Ignore non-JSON frames
        }
      }),
      close: vi.fn(() => {
        mockTransport.readyState = ReadyState.CLOSED;
        mockTransport.readyStateString = 'closed';
        if (mockTransport.onclose) {
          mockTransport.onclose({ code: 1000, reason: '', wasClean: true });
        }
      }),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      onbinary: null,
    } as any as IWebSocketTransport;

    transport = mockTransport;
    manager = createConnectionManager(transport, {
      autoReconnect: false,
    });
  });

  afterEach(() => {
    if (manager) {
      manager.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create a new connection manager', () => {
      expect(manager).toBeInstanceOf(ConnectionManager);
      expect(manager.getState()).toBe('disconnected');
    });

    it('should use default config', () => {
      const defaultManager = createConnectionManager(transport);
      expect(defaultManager).toBeInstanceOf(ConnectionManager);
      defaultManager.disconnect();
    });
  });

  describe('connect', () => {
    it('should connect and transition through states', async () => {
      const stateChanges: ConnectionState[] = [];
      manager.setHandlers({
        onStateChange: event => {
          stateChanges.push(event.newState);
        },
      });

      const connectPromise = manager.connect('ws://localhost:8080', createConnectParams());

      // Should transition to connecting
      expect(manager.getState()).toBe('connecting');

      await connectPromise;

      // Should transition through handshaking to ready
      expect(stateChanges).toContain('handshaking');
      expect(manager.getState()).toBe('ready');
    });

    it('should reject if already connecting', async () => {
      const connectPromise = manager.connect('ws://localhost:8080', createConnectParams());

      await expect(manager.connect('ws://localhost:8081', createConnectParams())).rejects.toThrow(
        'Already connecting'
      );

      // Clean up
      await connectPromise;
      manager.disconnect();
    });

    it('should reject if already ready', async () => {
      await manager.connect('ws://localhost:8080', createConnectParams());

      await expect(manager.connect('ws://localhost:8081', createConnectParams())).rejects.toThrow(
        'Already connected'
      );
    });

    it('should handle connection errors', async () => {
      const errorTransport: IWebSocketTransport = {
        url: 'ws://localhost:8080',
        readyState: ReadyState.CLOSED,
        readyStateString: 'closed' as const,
        connect: vi.fn(async () => {
          // Simulate error during connection
          await new Promise((_, reject) => setTimeout(reject, 5));
        }),
        send: vi.fn(),
        close: vi.fn(),
        onerror: null,
        onopen: null,
        onclose: null,
        onmessage: null,
        onbinary: null,
      };

      const errorManager = createConnectionManager(errorTransport, {
        autoReconnect: false,
      });

      await expect(
        errorManager.connect('ws://localhost:8080', createConnectParams())
      ).rejects.toThrow();

      expect(errorManager.getState()).toBe('disconnected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from the server', async () => {
      await manager.connect('ws://localhost:8080', createConnectParams());
      expect(manager.getState()).toBe('ready');

      manager.disconnect();
      expect(manager.getState()).toBe('disconnected');
    });

    it('should handle disconnect when not connected', () => {
      expect(() => manager.disconnect()).not.toThrow();
    });

    it('should cancel pending reconnection', async () => {
      const reconnectManager = createConnectionManager(transport, {
        autoReconnect: true,
        reconnectDelayMs: 100,
      });

      await reconnectManager.connect('ws://localhost:8080', createConnectParams());

      // Force disconnect
      transport.close();

      // Should start reconnecting
      expect(reconnectManager.getState()).toBe('reconnecting');

      // Disconnect before reconnection happens
      reconnectManager.disconnect();

      expect(reconnectManager.getState()).toBe('disconnected');
    });
  });

  describe('getState', () => {
    it('should return the current state', async () => {
      expect(manager.getState()).toBe('disconnected');

      const connectPromise = manager.connect('ws://localhost:8080', createConnectParams());
      expect(manager.getState()).toBe('connecting');

      await connectPromise;
      expect(manager.getState()).toBe('ready');
    });
  });

  describe('isReady', () => {
    it('should return true when ready', async () => {
      expect(manager.isReady()).toBe(false);

      await manager.connect('ws://localhost:8080', createConnectParams());
      expect(manager.isReady()).toBe(true);
    });

    it('should return false when not ready', () => {
      expect(manager.isReady()).toBe(false);
    });
  });

  describe('send', () => {
    it('should send a frame when ready', async () => {
      await manager.connect('ws://localhost:8080', createConnectParams());

      const frame: GatewayFrame = {
        type: 'event',
        event: 'test',
        payload: { data: 'test' },
      };

      expect(() => manager.send(frame)).not.toThrow();
    });

    it('should throw when not ready', () => {
      const frame: GatewayFrame = {
        type: 'event',
        event: 'test',
        payload: { data: 'test' },
      };

      expect(() => manager.send(frame)).toThrow('Cannot send');
    });
  });

  describe('event handlers', () => {
    it('should emit state change events', async () => {
      const stateChanges: Array<{
        previous: ConnectionState;
        new: ConnectionState;
      }> = [];

      manager.setHandlers({
        onStateChange: event => {
          stateChanges.push({
            previous: event.previousState,
            new: event.newState,
          });
        },
      });

      await manager.connect('ws://localhost:8080', createConnectParams());

      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges.some(s => s.new === 'ready')).toBe(true);
    });

    it('should emit message events', async () => {
      manager.setHandlers({
        onMessage: () => {
          // Message received
        },
      });

      await manager.connect('ws://localhost:8080', createConnectParams());

      // Send a test event
      const frame: GatewayFrame = {
        type: 'event',
        event: 'test',
      };

      // The message won't be echoed back for events, so this just tests no errors
      expect(() => manager.send(frame)).not.toThrow();
    });

    it('should emit closed events', async () => {
      let closedCalled = false;

      manager.setHandlers({
        onClosed: () => {
          closedCalled = true;
        },
      });

      await manager.connect('ws://localhost:8080', createConnectParams());
      transport.close();

      expect(closedCalled).toBe(true);
    });

    it('should emit error events', async () => {
      const errorTransport: IWebSocketTransport = {
        url: 'ws://localhost:8080',
        readyState: ReadyState.CLOSED,
        readyStateString: 'closed' as const,
        connect: vi.fn(async (_url: string) => {
          // Simulate connection error - first call onerror, then reject
          // Like real NodeWebSocketTransport which calls handleError before rejecting
          await new Promise<void>(resolve => setTimeout(resolve, 5));
          if (errorTransport.onerror) {
            errorTransport.onerror({
              message: 'Connection error',
              original: new Error('Connection error'),
            });
          }
          throw new Error('Connection error');
        }),
        send: vi.fn(),
        close: vi.fn(),
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
        onbinary: null,
      };

      let errorReceived = false;
      const errorManager = createConnectionManager(errorTransport, {
        autoReconnect: false,
      });

      errorManager.setHandlers({
        onError: () => {
          errorReceived = true;
        },
      });

      try {
        await errorManager.connect('ws://localhost:8080', createConnectParams());
      } catch {
        // Expected to fail due to connection error
      }

      expect(errorReceived).toBe(true);
    });
  });

  describe('getServerInfo', () => {
    it('should return server info after connection', async () => {
      expect(manager.getServerInfo()).toBeUndefined();

      await manager.connect('ws://localhost:8080', createConnectParams());

      const serverInfo = manager.getServerInfo();
      expect(serverInfo).toBeDefined();
      expect(serverInfo?.type).toBe('hello-ok');
      expect(serverInfo?.server.version).toBeDefined();
    });
  });

  describe('handleMessage - JSON parse errors', () => {
    it('should handle invalid JSON with detailed error including data preview', async () => {
      const errors: Array<{
        message: string;
        original?: Error;
        recoverable: boolean;
      }> = [];

      manager.setHandlers({
        onError: event => {
          errors.push({
            message: event.message,
            original: event.original as Error,
            recoverable: event.recoverable,
          });
        },
      });

      await manager.connect('ws://localhost:8080', createConnectParams());

      // Simulate receiving invalid JSON
      const transport = (manager as any).transport as IWebSocketTransport;
      if (transport.onmessage) {
        transport.onmessage('{invalid json');
      }

      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain('Failed to parse incoming message');
      expect(errors[0].message).toContain('{invalid json'); // Should include data preview
      expect(errors[0].recoverable).toBe(false);
      // Original error should be a SyntaxError from JSON.parse
      expect(errors[0].original).toBeInstanceOf(SyntaxError);
    });

    it('should handle empty data with specific error message', async () => {
      const errors: Array<{ message: string }> = [];

      manager.setHandlers({
        onError: event => {
          errors.push({ message: event.message });
        },
      });

      await manager.connect('ws://localhost:8080', createConnectParams());

      const transport = (manager as any).transport as IWebSocketTransport;
      if (transport.onmessage) {
        transport.onmessage('');
      }

      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain('empty');
    });

    it('should truncate very long invalid JSON in error message', async () => {
      const errors: Array<{ message: string }> = [];

      manager.setHandlers({
        onError: event => {
          errors.push({ message: event.message });
        },
      });

      await manager.connect('ws://localhost:8080', createConnectParams());

      // Create a very long invalid JSON string (longer than typical preview)
      const longInvalidJson = '{"data": "' + 'x'.repeat(500) + ' broken';

      const transport = (manager as any).transport as IWebSocketTransport;
      if (transport.onmessage) {
        transport.onmessage(longInvalidJson);
      }

      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain('...');
      // Message should be much shorter than original
      expect(errors[0].message.length).toBeLessThan(longInvalidJson.length);
    });

    it('should handle non-JSON text data', async () => {
      const errors: Array<{ message: string }> = [];

      manager.setHandlers({
        onError: event => {
          errors.push({ message: event.message });
        },
      });

      await manager.connect('ws://localhost:8080', createConnectParams());

      const transport = (manager as any).transport as IWebSocketTransport;
      if (transport.onmessage) {
        transport.onmessage('plain text message');
      }

      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain('Failed to parse');
      expect(errors[0].message).toContain('plain text');
    });
  });
});

describe('createConnectionManager', () => {
  it('should create a new connection manager instance', () => {
    const transport: IWebSocketTransport = {
      url: '',
      readyState: ReadyState.CLOSED,
      readyStateString: 'closed' as const,
      connect: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
      onbinary: null,
    };
    const manager = createConnectionManager(transport);

    expect(manager).toBeInstanceOf(ConnectionManager);
    expect(manager.getState()).toBe('disconnected');

    manager.disconnect();
  });
});
