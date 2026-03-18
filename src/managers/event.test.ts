/**
 * Event Manager Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EventManager,
  createEventManager,
  MAX_EVENT_NAME_LENGTH,
} from "./event.js";

describe("EventManager", () => {
  let events: EventManager;

  beforeEach(() => {
    events = createEventManager();
  });

  describe("onListenerError", () => {
    it("should call custom error handler when event handler throws", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      const badHandler = () => {
        throw new Error("Handler error");
      };

      events.on("test", badHandler);
      events.emit("test", { data: "test" });

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        eventName: "test",
        pattern: "test",
      });
      expect(
        (errorHandler.mock.calls[0][0] as { error: Error }).error.message,
      ).toBe("Handler error");
    });

    it("should include event name and pattern in error handler call", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      events.on("agent:*", () => {
        throw new Error("Wildcard handler error");
      });

      events.emit("agent:created", { id: 123 });

      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        eventName: "agent:created",
        pattern: "agent:*",
      });
    });

    it("should call error handler for global wildcard handlers", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      events.on("*", () => {
        throw new Error("Global wildcard error");
      });

      events.emit("any-event", { data: "test" });

      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        eventName: "any-event",
        pattern: "*",
      });
    });

    it("should allow removing error handler by passing null", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);
      events.onListenerError(null);

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      events.on("test", () => {
        throw new Error("Handler error");
      });

      events.emit("test", {});

      // Should fall back to console.error when no handler is set
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(errorHandler).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should log to console by default when no error handler is set", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      events.on("test", () => {
        throw new Error("Default logging test");
      });

      events.emit("test", { data: "value" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in event handler for pattern "test" on event "test":',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should continue processing other handlers after one throws", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      const results: string[] = [];

      events.on("test", () => {
        results.push("handler1");
      });

      events.on("test", () => {
        results.push("handler2");
        throw new Error("Handler2 error");
      });

      events.on("test", () => {
        results.push("handler3");
      });

      events.emit("test", {});

      expect(results).toEqual(["handler1", "handler2", "handler3"]);
      expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle errors in prefix wildcard matches", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      events.on("agent:*", () => {
        throw new Error("Prefix wildcard error");
      });

      events.emit("agent:created", { id: 1 });

      expect(errorHandler).toHaveBeenCalledWith({
        error: expect.any(Error),
        eventName: "agent:created",
        pattern: "agent:*",
      });
    });

    it("should handle multiple errors from different handlers", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      events.on("test", () => {
        throw new Error("Error 1");
      });

      events.on("test", () => {
        throw new Error("Error 2");
      });

      events.emit("test", {});

      expect(errorHandler).toHaveBeenCalledTimes(2);
      expect(
        (errorHandler.mock.calls[0][0] as { error: Error }).error.message,
      ).toBe("Error 1");
      expect(
        (errorHandler.mock.calls[1][0] as { error: Error }).error.message,
      ).toBe("Error 2");
    });

    it("should work with once() handlers that throw", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      events.once("test", () => {
        throw new Error("Once handler error");
      });

      events.emit("test", {});

      expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    it("should not call error handler for successful handlers", () => {
      const errorHandler = vi.fn();
      events.onListenerError(errorHandler);

      events.on("test", () => {
        // Successful handler
      });

      events.emit("test", {});

      expect(errorHandler).not.toHaveBeenCalled();
    });
  });

  describe("basic functionality", () => {
    it("should subscribe and emit events", () => {
      const handler = vi.fn();
      events.on("test", handler);
      events.emit("test", { data: "value" });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: "value" });
    });

    it("should support wildcard patterns", () => {
      const handler = vi.fn();
      events.on("agent:*", handler);

      events.emit("agent:created", { id: 1 });
      events.emit("agent:updated", { id: 2 });
      events.emit("other:event", { data: "ignored" });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should support global wildcard", () => {
      const handler = vi.fn();
      events.on("*", handler);

      events.emit("event1", {});
      events.emit("event2", {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should unsubscribe with returned function", () => {
      const handler = vi.fn();
      const unsub = events.on("test", handler);

      events.emit("test", {});
      expect(handler).toHaveBeenCalledTimes(1);

      unsub();
      events.emit("test", {});
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should support once() subscription", () => {
      const handler = vi.fn();
      events.once("test", handler);

      events.emit("test", {});
      events.emit("test", {});

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should prevent handler deduplication with same handler on different patterns", () => {
      let count = 0;
      const handler = () => {
        count++;
      };

      events.on("test", handler);
      events.on("test:*", handler);

      events.emit("test:event", {});

      // Handler should be called once due to deduplication
      expect(count).toBe(1);
    });
  });

  describe("validation", () => {
    it("should reject event patterns exceeding max length", () => {
      const longPattern = "a".repeat(MAX_EVENT_NAME_LENGTH + 1);

      expect(() => {
        events.on(longPattern, () => {});
      }).toThrow("exceeds max length");
    });

    it("should drop event names exceeding max length on emit", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const handler = vi.fn();

      events.on("test", handler);

      const longEventName = "x".repeat(MAX_EVENT_NAME_LENGTH + 1);
      events.emit(longEventName, {});

      expect(handler).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should accept event names at max length boundary", () => {
      const handler = vi.fn();
      const maxPattern = "a".repeat(MAX_EVENT_NAME_LENGTH);

      expect(() => {
        events.on(maxPattern, handler);
      }).not.toThrow();

      events.emit(maxPattern, {});
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("handlerCount", () => {
    it("should return total handler count when no pattern specified", () => {
      events.on("event1", () => {});
      events.on("event2", () => {});
      events.on("*", () => {});

      expect(events.handlerCount()).toBe(3);
    });

    it("should return count for specific pattern", () => {
      events.on("test", () => {});
      events.on("test", () => {});

      expect(events.handlerCount("test")).toBe(2);
    });

    it("should return count for wildcard patterns", () => {
      events.on("agent:*", () => {});
      events.on("agent:*", () => {});

      expect(events.handlerCount("agent:*")).toBe(2);
    });

    it("should return count for global wildcard", () => {
      events.on("*", () => {});
      events.on("*", () => {});

      expect(events.handlerCount("*")).toBe(2);
    });
  });

  describe("namespaces", () => {
    it("should isolate handlers by namespace", () => {
      const ns1Handler = vi.fn();
      const ns2Handler = vi.fn();

      events.on("test", ns1Handler, "ns1");
      events.on("test", ns2Handler, "ns2");

      events.emit("test", {});

      expect(ns1Handler).toHaveBeenCalledTimes(1);
      expect(ns2Handler).toHaveBeenCalledTimes(1);
    });

    it("should support namespace isolation with wildcards", () => {
      const ns1Handler = vi.fn();
      const ns2Handler = vi.fn();

      events.on("*", ns1Handler, "ns1");
      events.on("*", ns2Handler, "ns2");

      events.emit("test", {});

      expect(ns1Handler).toHaveBeenCalledTimes(1);
      expect(ns2Handler).toHaveBeenCalledTimes(1);
    });

    it("should clear only namespace handlers when unsubscribing with namespace", () => {
      const ns1Handler = vi.fn();
      const ns2Handler = vi.fn();

      events.on("test", ns1Handler, "ns1");
      events.on("test", ns2Handler, "ns2");

      events.off("test", undefined, "ns1");

      events.emit("test", {});

      expect(ns1Handler).not.toHaveBeenCalled();
      expect(ns2Handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("off", () => {
    it("should remove specific handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      events.on("test", handler1);
      events.on("test", handler2);

      events.off("test", handler1);

      events.emit("test", {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should clear all handlers for pattern when handler not specified", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      events.on("test", handler1);
      events.on("test", handler2);

      events.off("test");

      events.emit("test", {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it("should clear all handlers when no pattern specified", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      events.on("test1", handler1);
      events.on("test2", handler2);

      events.off();

      events.emit("test1", {});
      events.emit("test2", {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("emitFrame", () => {
    it("should emit event frame", () => {
      const handler = vi.fn();
      events.on("test", handler);

      const frame = {
        type: "event" as const,
        event: "test",
        payload: { data: "value" },
      };

      events.emitFrame(frame);

      expect(handler).toHaveBeenCalledWith(frame);
    });
  });
});

describe("createEventManager", () => {
  it("should create a new event manager instance", () => {
    const events = createEventManager();

    expect(events).toBeInstanceOf(EventManager);
  });
});
