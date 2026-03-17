/**
 * Connection Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { ConnectionState } from "../../src/protocol/types";
import {
  ConnectionManager,
  createConnectionManager,
} from "../../src/managers/connection";
import { WebSocketTransport, ReadyState } from "../../src/transport/websocket";
import type { IWebSocketTransport } from "../../src/transport/websocket";
import type { ConnectParams, GatewayFrame, HelloOk } from "../../src/protocol/types";

// Mock WebSocket class
class MockWebSocket {
  static readyState = ReadyState.CLOSED;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.readyState = ReadyState.CONNECTING;
    // Simulate connection on next tick
    setTimeout(() => {
      MockWebSocket.readyState = ReadyState.OPEN;
      if (this.onopen) {
        this.onopen();
      }
    }, 0);
  }

  send(data: string): void {
    // Echo back for testing
    if (this.onmessage) {
      const parsed = JSON.parse(data);
      // Simulate response
      if (parsed.type === "req") {
        setTimeout(() => {
          if (this.onmessage) {
            const responsePayload: HelloOk = {
              type: "hello-ok",
              protocol: 1,
              server: {
                version: "1.0.0",
                connId: "test-conn",
              },
              features: {
                methods: ["test"],
                events: ["test"],
              },
              snapshot: {
                agents: {},
                nodes: {},
              },
              policy: {
                maxPayload: 1024,
                maxBufferedBytes: 4096,
                tickIntervalMs: 1000,
              },
            };

            const responseFrame: GatewayFrame = {
              type: "res",
              id: parsed.id,
              ok: true,
              payload: responsePayload,
            };

            this.onmessage({
              data: JSON.stringify(responseFrame),
            } as MessageEvent);
          }
        }, 10);
      }
    }
  }

  close(code?: number, reason?: string): void {
    MockWebSocket.readyState = ReadyState.CLOSED;
    if (this.onclose) {
      // Create a proper CloseEvent-like object
      const closeEvent = {
        code: code ?? 1000,
        reason: reason ?? "",
        wasClean: true,
      } as CloseEvent;
      this.onclose(closeEvent);
    }
  }
}

// Helper to create a connect params
const createConnectParams = (): ConnectParams => ({
  minProtocol: 1,
  maxProtocol: 1,
  client: {
    id: "test-client",
    version: "1.0.0",
    platform: "test",
    mode: "test",
  },
});

describe("ConnectionManager", () => {
  let manager: ConnectionManager;
  let transport: IWebSocketTransport;

  beforeEach(() => {
    transport = new WebSocketTransport({
      WebSocketImpl: MockWebSocket as typeof WebSocket,
    });
    manager = createConnectionManager(transport, {
      autoReconnect: false,
    });
  });

  afterEach(() => {
    if (manager) {
      manager.disconnect();
    }
  });

  describe("constructor", () => {
    it("should create a new connection manager", () => {
      expect(manager).toBeInstanceOf(ConnectionManager);
      expect(manager.getState()).toBe("disconnected");
    });

    it("should use default config", () => {
      const defaultManager = createConnectionManager(transport);
      expect(defaultManager).toBeInstanceOf(ConnectionManager);
      defaultManager.disconnect();
    });
  });

  describe("connect", () => {
    it("should connect and transition through states", async () => {
      const stateChanges: ConnectionState[] = [];
      manager.setHandlers({
        onStateChange: (event) => {
          stateChanges.push(event.newState);
        },
      });

      const connectPromise = manager.connect("ws://localhost:8080", createConnectParams());

      // Should transition to connecting
      expect(manager.getState()).toBe("connecting");

      await connectPromise;

      // Should transition through handshaking to ready
      expect(stateChanges).toContain("handshaking");
      expect(manager.getState()).toBe("ready");
    });

    it("should reject if already connecting", async () => {
      const connectPromise = manager.connect("ws://localhost:8080", createConnectParams());

      await expect(
        manager.connect("ws://localhost:8081", createConnectParams())
      ).rejects.toThrow("Already connecting");

      // Clean up
      await connectPromise;
      manager.disconnect();
    });

    it("should reject if already ready", async () => {
      await manager.connect("ws://localhost:8080", createConnectParams());

      await expect(
        manager.connect("ws://localhost:8081", createConnectParams())
      ).rejects.toThrow("Already connected");
    });

    it("should handle connection errors", async () => {
      const errorTransport = new WebSocketTransport({
        WebSocketImpl: class ErrorWebSocket {
          onopen: (() => void) | null = null;
          onclose: (() => void) | null = null;
          onerror: ((error: Event) => void) | null = null;
          onmessage: ((event: MessageEvent) => void) | null = null;

          constructor(public url: string) {
            // Simulate immediate error
            setTimeout(() => {
              if (this.onerror) {
                this.onerror(new Event("error"));
              }
            }, 0);
          }

          send(): void {
            throw new Error("Not connected");
          }

          close(): void {
            // No-op
          }
        } as typeof WebSocket,
      });

      const errorManager = createConnectionManager(errorTransport, { autoReconnect: false });

      await expect(
        errorManager.connect("ws://localhost:8080", createConnectParams())
      ).rejects.toThrow();

      expect(errorManager.getState()).toBe("disconnected");
    });
  });

  describe("disconnect", () => {
    it("should disconnect from the server", async () => {
      await manager.connect("ws://localhost:8080", createConnectParams());
      expect(manager.getState()).toBe("ready");

      manager.disconnect();
      expect(manager.getState()).toBe("disconnected");
    });

    it("should handle disconnect when not connected", () => {
      expect(() => manager.disconnect()).not.toThrow();
    });

    it("should cancel pending reconnection", async () => {
      const reconnectManager = createConnectionManager(transport, {
        autoReconnect: true,
        reconnectDelayMs: 100,
      });

      await reconnectManager.connect("ws://localhost:8080", createConnectParams());

      // Force disconnect
      transport.close();

      // Should start reconnecting
      expect(reconnectManager.getState()).toBe("reconnecting");

      // Disconnect before reconnection happens
      reconnectManager.disconnect();

      expect(reconnectManager.getState()).toBe("disconnected");
    });
  });

  describe("getState", () => {
    it("should return the current state", async () => {
      expect(manager.getState()).toBe("disconnected");

      const connectPromise = manager.connect("ws://localhost:8080", createConnectParams());
      expect(manager.getState()).toBe("connecting");

      await connectPromise;
      expect(manager.getState()).toBe("ready");
    });
  });

  describe("isReady", () => {
    it("should return true when ready", async () => {
      expect(manager.isReady()).toBe(false);

      await manager.connect("ws://localhost:8080", createConnectParams());
      expect(manager.isReady()).toBe(true);
    });

    it("should return false when not ready", () => {
      expect(manager.isReady()).toBe(false);
    });
  });

  describe("send", () => {
    it("should send a frame when ready", async () => {
      await manager.connect("ws://localhost:8080", createConnectParams());

      const frame: GatewayFrame = {
        type: "event",
        event: "test",
        payload: { data: "test" },
      };

      expect(() => manager.send(frame)).not.toThrow();
    });

    it("should throw when not ready", () => {
      const frame: GatewayFrame = {
        type: "event",
        event: "test",
        payload: { data: "test" },
      };

      expect(() => manager.send(frame)).toThrow("Cannot send");
    });
  });

  describe("event handlers", () => {
    it("should emit state change events", async () => {
      const stateChanges: Array<{ previous: ConnectionState; new: ConnectionState }> = [];

      manager.setHandlers({
        onStateChange: (event) => {
          stateChanges.push({ previous: event.previousState, new: event.newState });
        },
      });

      await manager.connect("ws://localhost:8080", createConnectParams());

      expect(stateChanges.length).toBeGreaterThan(0);
      expect(stateChanges.some((s) => s.new === "ready")).toBe(true);
    });

    it("should emit message events", async () => {
      let receivedMessage: GatewayFrame | undefined;

      manager.setHandlers({
        onMessage: (frame) => {
          receivedMessage = frame;
        },
      });

      await manager.connect("ws://localhost:8080", createConnectParams());

      // Send a test event
      const frame: GatewayFrame = {
        type: "event",
        event: "test",
      };

      // The message won't be echoed back for events, so this just tests no errors
      expect(() => manager.send(frame)).not.toThrow();
    });

    it("should emit closed events", async () => {
      let closedCalled = false;

      manager.setHandlers({
        onClosed: () => {
          closedCalled = true;
        },
      });

      await manager.connect("ws://localhost:8080", createConnectParams());
      transport.close();

      expect(closedCalled).toBe(true);
    });

    it("should emit error events", async () => {
      const errorTransport = new WebSocketTransport({
        WebSocketImpl: class ErrorWebSocket {
          onopen: (() => void) | null = null;
          onclose: (() => void) | null = null;
          onerror: ((error: Event) => void) | null = null;
          onmessage: ((event: MessageEvent) => void) | null = null;

          constructor(public url: string) {
            setTimeout(() => {
              if (this.onerror) {
                this.onerror(new Event("error"));
              }
            }, 0);
          }

          send(): void {
            throw new Error("Not connected");
          }

          close(): void {
            // No-op
          }
        } as typeof WebSocket,
      });

      let errorReceived = false;
      const errorManager = createConnectionManager(errorTransport, { autoReconnect: false });

      errorManager.setHandlers({
        onError: () => {
          errorReceived = true;
        },
      });

      try {
        await errorManager.connect("ws://localhost:8080", createConnectParams());
      } catch {
        // Expected to fail
      }

      expect(errorReceived).toBe(true);
    });
  });

  describe("getServerInfo", () => {
    it("should return server info after connection", async () => {
      expect(manager.getServerInfo()).toBeUndefined();

      await manager.connect("ws://localhost:8080", createConnectParams());

      const serverInfo = manager.getServerInfo();
      expect(serverInfo).toBeDefined();
      expect(serverInfo?.type).toBe("hello-ok");
      expect(serverInfo?.server.version).toBeDefined();
    });
  });
});

describe("createConnectionManager", () => {
  it("should create a new connection manager instance", () => {
    const transport = new WebSocketTransport();
    const manager = createConnectionManager(transport);

    expect(manager).toBeInstanceOf(ConnectionManager);
    expect(manager.getState()).toBe("disconnected");

    manager.disconnect();
  });
});
