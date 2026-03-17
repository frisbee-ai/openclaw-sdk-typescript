/**
 * Event Manager
 *
 * Event subscription system with wildcard support for server-sent events.
 */

import type { EventFrame } from '../protocol/types.js';

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
  private defaultNamespace = '__default__';

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
   * const unsub1 = events.on('*', (e) => console.log(e.event));
   * const unsub2 = events.on('agent:*', (e) => console.log(e.event));
   * const unsub3 = events.on('tick', (e) => console.log(e.payload));
   * ```
   */
  on<T = unknown>(
    pattern: EventPattern,
    handler: EventHandler<T>,
    namespace?: string
  ): UnsubscribeFn {
    // Validate event name
    if (pattern.length > MAX_EVENT_NAME_LENGTH) {
      throw new Error(
        `Event pattern exceeds max length of ${MAX_EVENT_NAME_LENGTH}`
      );
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
      // Prefix wildcard - store without the trailing *
      const prefix = pattern.slice(0, -2);
      const key = `wildcard:${prefix}`;
      const existing = this.subscriptions.get(key) ?? [];
      existing.push(entry);
      this.subscriptions.set(key, existing);
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
    const wrapped: EventHandler<T> = (event) => {
      handler(event);
      this.off(pattern, wrapped, namespace);
    };
    return this.on(pattern, wrapped, namespace);
  }

  /**
   * Unsubscribe from events.
   */
  off<T = unknown>(
    pattern?: EventPattern,
    handler?: EventHandler<T>,
    namespace?: string
  ): void {
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

    const filterByNs = (e: SubscriptionEntry) =>
      !namespace || e.namespace === namespace;
    const filterByHandler = handler
      ? (e: SubscriptionEntry) => e.handler === handler && filterByNs(e)
      : filterByNs;

    if (pattern === '*') {
      this.wildcardSubscriptions = this.wildcardSubscriptions.filter(filterByHandler);
    } else if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      const key = `wildcard:${prefix}`;
      const existing = this.subscriptions.get(key);
      if (existing) {
        this.subscriptions.set(
          key,
          existing.filter(filterByHandler)
        );
      }
    } else {
      const existing = this.subscriptions.get(pattern);
      if (existing) {
        this.subscriptions.set(
          pattern,
          existing.filter(filterByHandler)
        );
      }
    }
  }

  /**
   * Emit an event to all matching handlers.
   */
  emit<T = unknown>(eventName: string, payload: T): void {
    // Validate incoming event name length
    if (eventName.length > MAX_EVENT_NAME_LENGTH) {
      console.warn(
        `Received event name exceeds max length (${eventName.length}), dropping`
      );
      return;
    }

    const called = new Set<EventHandler>();

    // 1. Exact match
    const exactHandlers = this.subscriptions.get(eventName);
    if (exactHandlers) {
      for (const entry of exactHandlers) {
        called.add(entry.handler);
        this.safeCall(entry.handler, payload);
      }
    }

    // 2. Prefix wildcard matches
    // Find all wildcard subscriptions where eventName starts with prefix
    for (const [key, entries] of this.subscriptions) {
      if (key.startsWith('wildcard:')) {
        const prefix = key.slice(9); // Remove 'wildcard:'
        if (eventName.startsWith(prefix + ':')) {
          for (const entry of entries) {
            if (!called.has(entry.handler)) {
              called.add(entry.handler);
              this.safeCall(entry.handler, payload);
            }
          }
        }
      }
    }

    // 3. Global wildcard
    for (const entry of this.wildcardSubscriptions) {
      if (!called.has(entry.handler)) {
        this.safeCall(entry.handler, payload);
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
    if (!pattern) {
      let count = this.wildcardSubscriptions.length;
      for (const handlers of this.subscriptions.values()) {
        count += handlers.length;
      }
      if (namespace) {
        count -= this.subscriptions.size; // Approximate
      }
      return count;
    }

    if (pattern === '*') {
      const handlers = this.wildcardSubscriptions;
      return namespace
        ? handlers.filter((h) => h.namespace === namespace).length
        : handlers.length;
    }

    const key = pattern.endsWith(':*')
      ? `wildcard:${pattern.slice(0, -2)}`
      : pattern;
    const handlers = this.subscriptions.get(key);
    if (!handlers) return 0;

    return namespace
      ? handlers.filter((h) => h.namespace === namespace).length
      : handlers.length;
  }

  /**
   * Clear all handlers for a namespace.
   */
  private clearNamespace(namespace: string): void {
    for (const [key, handlers] of this.subscriptions) {
      this.subscriptions.set(
        key,
        handlers.filter((h) => h.namespace !== namespace)
      );
    }
    this.wildcardSubscriptions = this.wildcardSubscriptions.filter(
      (h) => h.namespace !== namespace
    );
  }

  /**
   * Safely call handler, catching errors.
   */
  private safeCall<T>(handler: EventHandler<T>, payload: T): void {
    try {
      handler(payload);
    } catch (error) {
      console.error('Error in event handler:', error);
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an event manager.
 */
export function createEventManager(): EventManager {
  return new EventManager();
}
