/**
 * Event Manager
 *
 * Event subscription system with wildcard support for server-sent events.
 *
 * @module
 */

import type { EventFrame } from '../protocol/frames.js';
import { type Logger, LogLevel } from '../types/logger.js';

// ============================================================================
// Types
// ============================================================================

/** Maximum event name length to prevent ReDoS */
export const MAX_EVENT_NAME_LENGTH = 128;

/** Event handler function type */
export type EventHandler<T = unknown> = (event: T) => void;

/** Unsubscribe function */
export type UnsubscribeFn = () => void;

/** Event pattern */
export type EventPattern = string;

/** Error handler for listener errors */
export type ListenerErrorHandler = (error: {
  error: unknown;
  eventName: string;
  pattern: EventPattern;
}) => void;

/**
 * Subscription entry
 */
interface SubscriptionEntry {
  pattern: EventPattern;
  handler: EventHandler<unknown>;
  namespace?: string;
  priority: number;
}

// ============================================================================
// Event Manager
// ============================================================================

/**
 * Event manager for client-side event handling.
 *
 * Supports:
 * - Exact match: 'tick' matches only 'tick'
 * - Prefix wildcard: 'agent:*' matches 'agent.event', 'agent.created'
 * - Global wildcard: '*' matches all events
 */
export class EventManager {
  private subscriptions: Map<string, SubscriptionEntry[]> = new Map();
  private wildcardSubscriptions: SubscriptionEntry[] = [];
  private prefixSubscriptions: Map<string, SubscriptionEntry[]> = new Map();
  private defaultNamespace = '__default__';
  private listenerErrorHandler: ListenerErrorHandler | null = null;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? {
      name: 'event-manager',
      level: LogLevel.Error,
      debug() {},
      info() {},

      warn(message: string, meta?: Record<string, unknown>) {
        console.warn(message, meta ?? '');
      },

      error(message: string, meta?: Record<string, unknown>) {
        console.error(message, meta ?? '');
      },
    };
  }

  /**
   * Set a callback for handling errors thrown by event listeners.
   *
   * By default, listener errors are logged to console.error. Use this method
   * to customize error handling (e.g., send to error tracking service).
   *
   * @param handler - Callback function to handle listener errors
   *
   * @example
   * ```ts
   * events.onListenerError(({ error, eventName, pattern }) => {
   *   console.error(`Handler for pattern "${pattern}" failed on event "${eventName}":`, error);
   *   // Send to error tracking service
   *   Sentry.captureException(error);
   * });
   * ```
   */
  onListenerError(handler: ListenerErrorHandler | null): void {
    this.listenerErrorHandler = handler;
  }

  /**
   * Subscribe to events.
   *
   * @param pattern Event pattern ('*', 'agent:*', 'event.name')
   * @param handler Event handler function
   * @param namespace Optional namespace for isolation
   * @returns Unsubscribe function
   *
   * @example
   * ```ts
   * const unsub1 = events.on('*', (payload) => console.log(payload));
   * const unsub2 = events.on('agent:*', (payload) => console.log(payload));
   * const unsub3 = events.on('tick', (payload) => console.log(payload));
   * ```
   */
  on<T = unknown>(
    pattern: EventPattern,
    handler: EventHandler<T>,
    namespace?: string
  ): UnsubscribeFn {
    // Validate event name
    if (pattern.length > MAX_EVENT_NAME_LENGTH) {
      throw new Error(`Event pattern exceeds max length of ${MAX_EVENT_NAME_LENGTH}`);
    }

    const entry: SubscriptionEntry = {
      pattern,
      handler: handler as EventHandler<unknown>,
      namespace: namespace ?? this.defaultNamespace,
      priority: 0,
    };

    if (pattern === '*') {
      this.wildcardSubscriptions.push(entry);
    } else if (pattern.endsWith(':*')) {
      // Prefix wildcard - store in separate map for O(1) lookup
      const prefix = pattern.slice(0, -2);
      const existing = this.prefixSubscriptions.get(prefix) ?? [];
      existing.push(entry);
      this.prefixSubscriptions.set(prefix, existing);
    } else {
      // Exact match
      const existing = this.subscriptions.get(pattern) ?? [];
      existing.push(entry);
      this.subscriptions.set(pattern, existing);
    }

    // Return unsubscribe function
    return () => this.off(pattern, handler, namespace);
  }

  /**
   * Subscribe to event once.
   */
  once<T = unknown>(
    pattern: EventPattern,
    handler: EventHandler<T>,
    namespace?: string
  ): UnsubscribeFn {
    const wrapped: EventHandler<T> = event => {
      this.off(pattern, wrapped, namespace);
      handler(event);
    };
    return this.on(pattern, wrapped, namespace);
  }

  /**
   * Unsubscribe from events.
   */
  off<T = unknown>(pattern?: EventPattern, handler?: EventHandler<T>, namespace?: string): void {
    if (!pattern) {
      // Clear all
      if (namespace) {
        this.clearNamespace(namespace);
      } else {
        this.subscriptions.clear();
        this.wildcardSubscriptions = [];
      }
      return;
    }

    // When namespace is specified: remove only that namespace's entries
    // When namespace is NOT specified: remove ALL namespaces' matching entries (symmetric with on())
    const shouldRemove = (e: SubscriptionEntry): boolean => {
      if (handler !== undefined) {
        // Handler specified: match by handler AND namespace (if provided)
        if (namespace !== undefined) {
          return e.handler === handler && e.namespace === namespace;
        }
        return e.handler === handler;
      }
      // No handler: when namespace specified, remove only that namespace; otherwise remove all
      if (namespace !== undefined) {
        return e.namespace === namespace;
      }
      return true; // Remove all entries (will be filtered out)
    };

    const filterByHandler = (e: SubscriptionEntry) => !shouldRemove(e);

    if (pattern === '*') {
      this.wildcardSubscriptions = this.wildcardSubscriptions.filter(filterByHandler);
    } else if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      const existing = this.prefixSubscriptions.get(prefix);
      if (existing) {
        const filtered = existing.filter(filterByHandler);
        if (filtered.length === 0) {
          this.prefixSubscriptions.delete(prefix);
        } else {
          this.prefixSubscriptions.set(prefix, filtered);
        }
      }
    } else {
      const existing = this.subscriptions.get(pattern);
      if (existing) {
        this.subscriptions.set(pattern, existing.filter(filterByHandler));
      }
    }
  }

  /**
   * Emit an event to all matching handlers.
   */
  emit<T = unknown>(eventName: string, payload: T): void {
    // Validate incoming event name length
    if (eventName.length > MAX_EVENT_NAME_LENGTH) {
      this.logger.warn(`Received event name exceeds max length (${eventName.length}), dropping`);
      return;
    }

    const called = new Set<EventHandler>();

    // 1. Exact match
    const exactHandlers = this.subscriptions.get(eventName);
    if (exactHandlers) {
      for (const entry of exactHandlers) {
        called.add(entry.handler);
        this.safeCall(entry.handler, payload, eventName, entry.pattern);
      }
    }

    // 2. Prefix wildcard matches — O(k) where k is number of registered prefixes
    for (const [prefix, entries] of this.prefixSubscriptions) {
      if (eventName.startsWith(prefix + ':')) {
        for (const entry of entries) {
          if (!called.has(entry.handler)) {
            called.add(entry.handler);
            this.safeCall(entry.handler, payload, eventName, entry.pattern);
          }
        }
      }
    }

    // 3. Global wildcard
    for (const entry of this.wildcardSubscriptions) {
      if (!called.has(entry.handler)) {
        this.safeCall(entry.handler, payload, eventName, entry.pattern);
      }
    }
  }

  /**
   * Emit a protocol EventFrame.
   */
  emitFrame(frame: EventFrame): void {
    this.emit(frame.event, frame);
  }

  /**
   * Get handler count.
   */
  handlerCount(pattern?: EventPattern, namespace?: string): number {
    const countNs = (entries: SubscriptionEntry[]): number =>
      namespace ? entries.filter(h => h.namespace === namespace).length : entries.length;

    if (!pattern) {
      let count = countNs(this.wildcardSubscriptions);
      for (const handlers of this.subscriptions.values()) {
        count += countNs(handlers);
      }
      for (const handlers of this.prefixSubscriptions.values()) {
        count += countNs(handlers);
      }
      return count;
    }

    if (pattern === '*') {
      return countNs(this.wildcardSubscriptions);
    }

    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      const handlers = this.prefixSubscriptions.get(prefix);
      return handlers ? countNs(handlers) : 0;
    }

    const handlers = this.subscriptions.get(pattern);
    if (!handlers) return 0;

    return countNs(handlers);
  }

  /**
   * Clear all handlers for a namespace.
   */
  private clearNamespace(namespace: string): void {
    for (const [key, handlers] of this.subscriptions) {
      const filtered = handlers.filter(h => h.namespace !== namespace);
      if (filtered.length === 0) {
        this.subscriptions.delete(key);
      } else {
        this.subscriptions.set(key, filtered);
      }
    }
    for (const [prefix, handlers] of this.prefixSubscriptions) {
      const filtered = handlers.filter(h => h.namespace !== namespace);
      if (filtered.length === 0) {
        this.prefixSubscriptions.delete(prefix);
      } else {
        this.prefixSubscriptions.set(prefix, filtered);
      }
    }
    this.wildcardSubscriptions = this.wildcardSubscriptions.filter(h => h.namespace !== namespace);
  }

  /**
   * Safely call handler, catching errors.
   */
  private safeCall<T>(
    handler: EventHandler<T>,
    payload: T,
    eventName: string,
    pattern: EventPattern
  ): void {
    try {
      handler(payload);
    } catch (error) {
      if (this.listenerErrorHandler) {
        this.listenerErrorHandler({ error, eventName, pattern });
      } else {
        // Default: log with context for debugging
        this.logger.error(
          `Error in event handler for pattern "${pattern}" on event "${eventName}":`,
          error as unknown as Record<string, unknown>
        );
      }
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an event manager.
 *
 * @returns New EventManager instance
 *
 * @example
 * ```ts
 * const events = createEventManager();
 *
 * // Subscribe to events
 * const unsub = events.on('tick', (payload) => {
 *   console.log("Tick:", payload);
 * });
 *
 * // Emit events
 * events.emit('tick', { timestamp: Date.now() });
 *
 * // Unsubscribe
 * unsub();
 * ```
 */
export function createEventManager(logger?: Logger): EventManager {
  return new EventManager(logger);
}
