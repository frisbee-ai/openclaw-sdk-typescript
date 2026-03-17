/**
 * WebSocket Transport Tests
 *
 * Tests for the WebSocket transport implementation using mocks
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  WebSocketTransport,
  ReadyState,
  readyStateToString,
  createWebSocketTransport,
  type IWebSocketTransport,
  type WebSocketTransportConfig,
  type WebSocketOpenEvent,
  type WebSocketClose,
  type WebSocketError,
} from "../websocket.ts";

// ============================================================================
// Mock WebSocket Implementation
// ============================================================================

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private sentMessages: Array<string | ArrayBuffer> = [];

  constructor(url: string) {
    this.url = url;
    // Set the global reference for test access
    (globalThis as any).__currentMockWs = this;
  }

  // Simulate opening the connection
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }

  // Simulate closing the connection
  simulateClose(code: number = 1000, reason: string = ""): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const event = new CloseEvent("close", { code, reason, wasClean: code === 1000 });
      this.onclose(event);
    }
  }

  // Simulate an error
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }

  // Simulate receiving a text message
  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  // Simulate receiving a binary message
  simulateBinaryMessage(data: ArrayBuffer): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  send(data: string | ArrayBuffer): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        const event = new CloseEvent("close", {
          code: code ?? 1000,
          reason: reason ?? "",
          wasClean: true,
        });
        this.onclose(event);
      }
    }, 0);
  }

  getSentMessages(): Array<string | ArrayBuffer> {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}

// Helper function to get the current mock instance
function getCurrentMockWs(): MockWebSocket | null {
  return (globalThis as any).__currentMockWs || null;
}

// Helper function to clear the current mock instance
function clearCurrentMockWs(): void {
  delete (globalThis as any).__currentMockWs;
}

afterEach(() => {
  clearCurrentMockWs();
});

// ============================================================================
// Tests
// ============================================================================

describe("WebSocket Transport", () => {
  describe("ReadyState", () => {
    it("should have correct numeric values", () => {
      expect(ReadyState.CONNECTING).toBe(0);
      expect(ReadyState.OPEN).toBe(1);
      expect(ReadyState.CLOSING).toBe(2);
      expect(ReadyState.CLOSED).toBe(3);
    });

    it("should convert ready state to string", () => {
      expect(readyStateToString(ReadyState.CONNECTING)).toBe("connecting");
      expect(readyStateToString(ReadyState.OPEN)).toBe("open");
      expect(readyStateToString(ReadyState.CLOSING)).toBe("closing");
      expect(readyStateToString(ReadyState.CLOSED)).toBe("closed");
    });
  });

  describe("WebSocketTransport", () => {
    describe("initialization", () => {
      it("should create a transport instance", () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });

        expect(transport).toBeDefined();
        expect(transport.url).toBe("");
        expect(transport.readyState).toBe(ReadyState.CLOSED);
        expect(transport.readyStateString).toBe("closed");
      });

      it("should accept custom configuration", () => {
        const customTransport = new WebSocketTransport({
          connectTimeoutMs: 10000,
          useBinary: true,
          WebSocketImpl: MockWebSocket as any,
        });
        expect(customTransport).toBeDefined();
      });
    });

    describe("connect", () => {
      it("should connect to a WebSocket URL", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        // Simulate the connection opening
        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        expect(transport.readyState).toBe(ReadyState.OPEN);
        expect(transport.url).toBe("ws://localhost:8080");
      });

      it("should call onopen handler when connection is established", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const openSpy = vi.fn();

        transport.onopen = openSpy;
        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        expect(openSpy).toHaveBeenCalledTimes(1);
        const openEvent = openSpy.mock.calls[0][0] as WebSocketOpenEvent;
        expect(openEvent.url).toBe("ws://localhost:8080");
        expect(openEvent.timestamp).toBeGreaterThan(0);
      });

      it("should reject if connection times out", async () => {
        const timeoutTransport = new WebSocketTransport({
          connectTimeoutMs: 100,
          WebSocketImpl: MockWebSocket as any,
        });

        const connectPromise = timeoutTransport.connect("ws://localhost:8080");

        // Wait for timeout
        await expect(connectPromise).rejects.toThrow("Connection timeout");

        expect(timeoutTransport.readyState).toBe(ReadyState.CLOSED);
      });

      it("should reject if connection closes before opening", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateClose(1006, "Connection refused");

        await expect(connectPromise).rejects.toThrow();

        expect(transport.readyState).toBe(ReadyState.CLOSED);
      });

      it("should reject if connection errors before opening", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateError();

        await expect(connectPromise).rejects.toThrow("WebSocket error");

        expect(transport.readyState).toBe(ReadyState.CLOSED);
      });

      it("should reject if already connected", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        // Simulate opening to complete the first connection
        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        await expect(transport.connect("ws://localhost:8081")).rejects.toThrow(
          "Already connected or connecting"
        );
      });

      it("should reject if already connecting", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        transport.connect("ws://localhost:8080");

        await expect(transport.connect("ws://localhost:8081")).rejects.toThrow(
          "Already connected or connecting"
        );
      });
    });

    describe("send", () => {
      it("should send string data", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        transport.send("Hello, World!");

        const sentMessages = mockWs?.getSentMessages() || [];
        expect(sentMessages).toHaveLength(1);
        expect(sentMessages[0]).toBe("Hello, World!");
      });

      it("should send binary data", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        const buffer = new ArrayBuffer(8);
        const view = new Uint8Array(buffer);
        view[0] = 0x01;
        view[1] = 0x02;

        transport.send(buffer);

        const sentMessages = mockWs?.getSentMessages() || [];
        expect(sentMessages).toHaveLength(1);
        expect(sentMessages[0]).toBe(buffer);
      });

      it("should throw if not connected", () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });

        expect(() => transport.send("test")).toThrow(
          "Cannot send data: connection is closed"
        );
      });
    });

    describe("close", () => {
      it("should close the connection with default code and reason", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        transport.close();

        expect(transport.readyState).toBe(ReadyState.CLOSING);
      });

      it("should close the connection with custom code and reason", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        transport.close(4000, "Custom reason");

        expect(transport.readyState).toBe(ReadyState.CLOSING);
      });

      it("should be idempotent when already closed", () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });

        expect(() => transport.close()).not.toThrow();
      });
    });

    describe("event handlers", () => {
      it("should call onclose when connection closes", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const closeSpy = vi.fn();

        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        transport.onclose = closeSpy;

        mockWs?.simulateClose(1000, "Normal closure");

        expect(closeSpy).toHaveBeenCalledTimes(1);
        const closeEvent = closeSpy.mock.calls[0][0] as WebSocketClose;
        expect(closeEvent.code).toBe(1000);
        expect(closeEvent.reason).toBe("Normal closure");
        expect(closeEvent.wasClean).toBe(true);
      });

      it("should call onerror when error occurs", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const errorSpy = vi.fn();

        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        transport.onerror = errorSpy;

        mockWs?.simulateError();

        expect(errorSpy).toHaveBeenCalledTimes(1);
        const error = errorSpy.mock.calls[0][0] as WebSocketError;
        expect(error.message).toBe("WebSocket error occurred");
        expect(error.recoverable).toBe(true);
      });

      it("should call onmessage when text message is received", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const messageSpy = vi.fn();

        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        transport.onmessage = messageSpy;

        mockWs?.simulateMessage('{"type": "test"}');

        expect(messageSpy).toHaveBeenCalledTimes(1);
        expect(messageSpy).toHaveBeenCalledWith('{"type": "test"}');
      });

      it("should call onbinary when binary message is received", async () => {
        const transport = new WebSocketTransport({
          WebSocketImpl: MockWebSocket as any,
        });
        const binarySpy = vi.fn();

        const connectPromise = transport.connect("ws://localhost:8080");

        const mockWs = getCurrentMockWs();
        mockWs?.simulateOpen();

        await connectPromise;

        transport.onbinary = binarySpy;

        const buffer = new ArrayBuffer(4);
        mockWs?.simulateBinaryMessage(buffer);

        expect(binarySpy).toHaveBeenCalledTimes(1);
        expect(binarySpy).toHaveBeenCalledWith(buffer);
      });
    });
  });

  describe("createWebSocketTransport", () => {
    it("should create a WebSocket transport instance", () => {
      const transport = createWebSocketTransport({
        WebSocketImpl: MockWebSocket as any,
      });

      expect(transport).toBeInstanceOf(WebSocketTransport);
    });

    it("should pass configuration to the transport", () => {
      const config: WebSocketTransportConfig = {
        connectTimeoutMs: 15000,
        useBinary: true,
        WebSocketImpl: MockWebSocket as any,
      };

      const transport = createWebSocketTransport(config);

      expect(transport).toBeDefined();
    });
  });

  describe("interface compliance", () => {
    it("should implement IWebSocketTransport interface", () => {
      const transport: IWebSocketTransport = new WebSocketTransport({
        WebSocketImpl: MockWebSocket as any,
      });

      expect(transport.connect).toBeDefined();
      expect(transport.send).toBeDefined();
      expect(transport.close).toBeDefined();
      expect(transport.url).toBeDefined();
      expect(transport.readyState).toBeDefined();
      expect(transport.readyStateString).toBeDefined();
    });
  });
});
