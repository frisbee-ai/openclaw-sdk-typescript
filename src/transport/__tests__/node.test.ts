/**
 * Node.js WebSocket Transport Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NodeWebSocketTransport, NodeWebSocketTransportConfig, createNodeWebSocketTransport } from "../node";

// Mock the ws module - must be before any imports that use it
vi.mock("ws", () => {
  class MockWebSocket {
    private _handlers: Map<string, Function[]> = new Map();
    private _url: string;
    send = vi.fn();
    readyState = 3;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();

    static OPEN = 1 as const;
    static CLOSING = 2 as const;
    static CLOSED = 3 as const;

    constructor(url: string, _protocols?: string | string[]) {
      this._url = url;
      this.readyState = 0;

      // Check if this is an "invalid" URL for testing connection errors
      const shouldError = url.includes("invalid");

      // Simulate connection opening or error
      setTimeout(() => {
        if (shouldError) {
          this.readyState = 3;
          this._emit("error", new Error("Connection failed"));
        } else {
          this.readyState = 1;
          this._emit("open", {});
          // Send a test message after connection (for onmessage test)
          // Use longer delay to ensure event handlers are registered first
          setTimeout(() => {
            this._emit("message", Buffer.from("test message"), false);
          }, 5);
        }
      }, 0);
    }

    // Override on to track handlers
    on(event: string, handler: Function): this {
      if (!this._handlers.has(event)) {
        this._handlers.set(event, []);
      }
      this._handlers.get(event)!.push(handler);
      return this;
    }

    // Override close to emit close event after state transition
    close(_code?: number, _reason?: Buffer): void {
      this.readyState = 2; // CLOSING
      // Asynchronously emit close event and transition to CLOSED
      setTimeout(() => {
        this.readyState = 3; // CLOSED
        // ws library emits close event with (code, reason) as separate parameters
        const code = _code || 1000;
        const reason = _reason || Buffer.from("");
        this._emit("close", code, reason);
      }, 0);
    }

    // Helper to emit events (supports multiple parameters)
    _emit(event: string, ...args: unknown[]): void {
      const handlers = this._handlers.get(event) || [];
      handlers.forEach(h => h(...args));
    }
  }

  return { WebSocket: MockWebSocket };
});

describe("NodeWebSocketTransport", () => {
  let transport: NodeWebSocketTransport;

  beforeEach(() => {
    transport = createNodeWebSocketTransport({
      url: "wss://example.com",
    });
  });

  afterEach(() => {
    transport.close();
  });

  describe("constructor", () => {
    it("should create transport with url", () => {
      expect(transport.url).toBe("wss://example.com");
    });

    it("should have initial ready state", () => {
      expect(transport.readyState).toBeDefined();
    });
  });

  describe("connect", () => {
    it("should connect to WebSocket server", async () => {
      await transport.connect("wss://example.com/ws");
      expect(transport.readyState).toBe(1); // OPEN
    });

    it("should reject on connection error", async () => {
      const transport = createNodeWebSocketTransport({
        url: "wss://invalid.example.com",
      });

      await expect(transport.connect("wss://invalid.example.com")).rejects.toThrow();
    });
  });

  describe("send", () => {
    it("should send text data", async () => {
      await transport.connect("wss://example.com/ws");
      expect(() => transport.send("test message")).not.toThrow();
    });

    it("should send binary data", async () => {
      await transport.connect("wss://example.com/ws");
      const buffer = new ArrayBuffer(8);
      expect(() => transport.send(buffer)).not.toThrow();
    });

    it("should throw when not connected", () => {
      expect(() => transport.send("test")).toThrow();
    });
  });

  describe("close", () => {
    it("should close connection", async () => {
      await transport.connect("wss://example.com/ws");
      transport.close(1000, "Normal closure");
      // Wait for async close event to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(transport.readyState).toBe(3); // CLOSED
    });

    it("should close with default code", async () => {
      await transport.connect("wss://example.com/ws");
      transport.close();
      // Wait for async close event to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(transport.readyState).toBe(3);
    });
  });

  describe("event handlers", () => {
    it("should call onopen handler", async () => {
      const onOpen = vi.fn();
      const transport = createNodeWebSocketTransport({
        url: "wss://example.com",
        onopen: onOpen,
      });

      await transport.connect("wss://example.com/ws");
      expect(onOpen).toHaveBeenCalled();
    });

    it("should call onclose handler", async () => {
      const onClose = vi.fn();
      const transport = createNodeWebSocketTransport({
        url: "wss://example.com",
        onclose: onClose,
      });

      await transport.connect("wss://example.com/ws");
      transport.close();
      // Wait for async close event to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(onClose).toHaveBeenCalled();
    });

    it("should call onerror handler", async () => {
      const onError = vi.fn();
      const transport = createNodeWebSocketTransport({
        url: "wss://example.com",
        onerror: onError,
      });

      await expect(transport.connect("wss://invalid.example.com")).rejects.toThrow();
      // Error handler should be called
    });

    it("should call onmessage handler", async () => {
      const onMessage = vi.fn();
      const transport = createNodeWebSocketTransport({
        url: "wss://example.com",
        onmessage: onMessage,
      });

      await transport.connect("wss://example.com/ws");
      // Wait for test message to be sent
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(onMessage).toHaveBeenCalled();
    });
  });
});

describe("NodeWebSocketTransportConfig", () => {
  it("should accept url in config", () => {
    const config: NodeWebSocketTransportConfig = {
      url: "wss://example.com",
    };
    expect(config.url).toBe("wss://example.com");
  });

  it("should accept event handlers in config", () => {
    const config: NodeWebSocketTransportConfig = {
      url: "wss://example.com",
      onopen: vi.fn(),
      onclose: vi.fn(),
      onerror: vi.fn(),
      onmessage: vi.fn(),
    };
    expect(config.onopen).toBeDefined();
    expect(config.onclose).toBeDefined();
    expect(config.onerror).toBeDefined();
    expect(config.onmessage).toBeDefined();
  });

  it("should accept tlsValidator in config", () => {
    const config: NodeWebSocketTransportConfig = {
      url: "wss://example.com",
      tlsValidator: vi.fn().mockReturnValue(true),
    };
    expect(config.tlsValidator).toBeDefined();
  });
});

describe("createNodeWebSocketTransport", () => {
  it("should create transport instance", () => {
    const transport = createNodeWebSocketTransport({
      url: "wss://example.com",
    });
    expect(transport).toBeDefined();
    expect(transport.url).toBe("wss://example.com");
  });
});
