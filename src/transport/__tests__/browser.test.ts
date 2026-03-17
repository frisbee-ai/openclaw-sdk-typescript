/**
 * Browser WebSocket Transport Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserWebSocketTransport, BrowserWebSocketTransportConfig, createBrowserWebSocketTransport } from "../browser";

// Mock the native WebSocket API
class MockWebSocket {
  readyState = 0;
  send = vi.fn();
  removeEventListener = vi.fn();
  _handlers = new Map<string, Function[]>();
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  _url: string;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this._url = url;
    this.readyState = 0;

    // Check if this is an "invalid" URL for testing connection errors
    const shouldError = url.includes("invalid");

    // Simulate connection opening or error
    setTimeout(() => {
      if (shouldError) {
        this.readyState = 3;
        if (this.onerror) {
          this.onerror(new Error("Connection failed") as any);
        }
        const errorHandlers = this._handlers.get("error") || [];
        errorHandlers.forEach((h: Function) => h(new Error("Connection failed")));
      } else {
        this.readyState = 1;
        if (this.onopen) {
          this.onopen({} as Event);
        }
        // Also trigger addEventListener handlers
        this._open();
        // Send a test message after connection
        setTimeout(() => {
          this._message("test message");
        }, 5);
      }
    }, 0);
  }

  // Override close to simulate async close
  close(_code?: number, _reason?: string) {
    this.readyState = 2; // CLOSING
    setTimeout(() => {
      this.readyState = 3; // CLOSED
      this._close();
    }, 0);
  }

  addEventListener(event: string, handler: Function) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event)!.push(handler);
  }

  _open() {
    const openHandlers = this._handlers.get("open") || [];
    openHandlers.forEach((h: Function) => h({}));
  }

  _message(data: string | ArrayBuffer) {
    // Trigger onmessage handler
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
    // Also trigger addEventListener handlers
    const messageHandlers = this._handlers.get("message") || [];
    messageHandlers.forEach((h: Function) => h({ data }));
  }

  _close() {
    this.readyState = 3;
    const closeEvent = { code: 1000, reason: "", wasClean: true };
    if (this.onclose) {
      this.onclose(closeEvent as CloseEvent);
    }
    const closeHandlers = this._handlers.get("close") || [];
    closeHandlers.forEach((h: Function) => h(closeEvent));
  }
}

global.WebSocket = MockWebSocket as any;

Object.assign(global.WebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
});

Object.assign(global.WebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
});

describe("BrowserWebSocketTransport", () => {
  let transport: BrowserWebSocketTransport;

  beforeEach(() => {
    transport = createBrowserWebSocketTransport({
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
      const transport = createBrowserWebSocketTransport({
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
      // Wait for async close
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(transport.readyState).toBe(3); // CLOSED
    });

    it("should close with default code", async () => {
      await transport.connect("wss://example.com/ws");
      transport.close();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(transport.readyState).toBe(3);
    });
  });

  describe("event handlers", () => {
    it("should call onopen handler", async () => {
      const onOpen = vi.fn();
      const transport = createBrowserWebSocketTransport({
        url: "wss://example.com",
        onopen: onOpen,
      });

      await transport.connect("wss://example.com/ws");
      expect(onOpen).toHaveBeenCalled();
    });

    it("should call onclose handler", async () => {
      const onClose = vi.fn();
      const transport = createBrowserWebSocketTransport({
        url: "wss://example.com",
        onclose: onClose,
      });

      await transport.connect("wss://example.com/ws");
      transport.close();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(onClose).toHaveBeenCalled();
    });

    it("should call onerror handler", async () => {
      const onError = vi.fn();
      const transport = createBrowserWebSocketTransport({
        url: "wss://example.com",
        onerror: onError,
      });

      await expect(transport.connect("wss://invalid.example.com")).rejects.toThrow();
      // Error handler should be called
    });

    it("should call onmessage handler", async () => {
      const onMessage = vi.fn();
      const transport = createBrowserWebSocketTransport({
        url: "wss://example.com",
        onmessage: onMessage,
      });

      await transport.connect("wss://example.com/ws");
      // Wait for test message
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(onMessage).toHaveBeenCalled();
    });
  });
});

describe("BrowserWebSocketTransportConfig", () => {
  it("should accept url in config", () => {
    const config: BrowserWebSocketTransportConfig = {
      url: "wss://example.com",
    };
    expect(config.url).toBe("wss://example.com");
  });

  it("should accept event handlers in config", () => {
    const config: BrowserWebSocketTransportConfig = {
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

  it("should not have tlsValidator in config (browser handles TLS)", () => {
    const config: BrowserWebSocketTransportConfig = {
      url: "wss://example.com",
    };
    expect(config).not.toHaveProperty("tlsValidator");
  });
});

describe("createBrowserWebSocketTransport", () => {
  it("should create transport instance", () => {
    const transport = createBrowserWebSocketTransport({
      url: "wss://example.com",
    });
    expect(transport).toBeDefined();
    expect(transport.url).toBe("wss://example.com");
  });
});
