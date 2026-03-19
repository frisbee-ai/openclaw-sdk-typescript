/**
 * Event Manager Integration Tests
 *
 * Integration tests covering:
 * - EventPubSub with multiple components
 * - Cross-component event communication
 * - Event flow with error handling
 */

import { describe, it, expect } from 'vitest';
import { createEventManager } from './event.js';

describe('EventManager Integration', () => {
  describe('Multi-component event flow', () => {
    it('should propagate events through multiple handlers', () => {
      const events = createEventManager();
      const results: string[] = [];

      // Handler chain: order -> transform -> log
      events.on('user:*', data => {
        results.push(`received:${(data as any).id}`);
      });

      events.on('user:created', data => {
        results.push(`validated:${(data as any).id}`);
      });

      events.emit('user:created', { id: '123', name: 'Test' });

      expect(results).toContain('received:123');
    });

    it('should handle wildcard to specific event propagation', () => {
      const events = createEventManager();
      const wildcards: any[] = [];
      const specifics: any[] = [];

      events.on('agent:*', data => {
        wildcards.push(data);
      });

      events.on('agent:joined', data => {
        specifics.push(data);
      });

      events.emit('agent:joined', { agentId: 'agent-1' });

      expect(wildcards).toHaveLength(1);
      expect(specifics).toHaveLength(1);
      expect(wildcards[0].agentId).toBe('agent-1');
    });
  });

  describe('Error handling across handlers', () => {
    it('should continue handlers when one throws', () => {
      const events = createEventManager();
      const results: string[] = [];

      events.on('test', () => {
        results.push('first');
      });

      events.on('test', () => {
        throw new Error('Handler error');
      });

      events.on('test', () => {
        results.push('third');
      });

      // Should not throw, should continue
      events.emit('test', {});

      expect(results).toContain('first');
      expect(results).toContain('third');
    });

    it('should report errors via onListenerError', () => {
      const events = createEventManager();
      const errors: any[] = [];

      events.onListenerError(error => {
        errors.push(error);
      });

      events.on('error-event', () => {
        throw new Error('Test error');
      });

      events.emit('error-event', {});

      expect(errors).toHaveLength(1);
      expect(errors[0].error.message).toBe('Test error');
    });
  });

  describe('Event unsubscribe flow', () => {
    it('should handle unsubscribe during emit', () => {
      const events = createEventManager();
      const results: string[] = [];

      const removeFirst = events.on('multi', () => {
        results.push('first');
        removeFirst(); // Unsubscribe self
      });

      events.on('multi', () => {
        results.push('second');
      });

      events.emit('multi', {});
      events.emit('multi', {});

      // First emit: both handlers run, first unsubscribes
      // Second emit: only second handler runs
      expect(results).toEqual(['first', 'second', 'second']);
    });
  });

  describe('Pattern matching integration', () => {
    it('should match multiple wildcard patterns', () => {
      const events = createEventManager();
      const results: string[] = [];

      events.on('*', () => results.push('all'));
      events.on('node:*', () => results.push('node'));
      events.on('node:added', () => results.push('specific'));

      events.emit('node:added', {});

      expect(results).toContain('all');
      expect(results).toContain('node');
      expect(results).toContain('specific');
    });

    it('should handle deeply nested patterns', () => {
      const events = createEventManager();
      const results: string[] = [];

      events.on('a:b:c', () => results.push('exact'));
      events.on('a:b:*', () => results.push('one-star'));
      events.on('a:*', () => results.push('two-star'));

      events.emit('a:b:c', {});

      expect(results).toContain('exact');
      expect(results).toContain('one-star');
      expect(results).toContain('two-star');
    });
  });

  describe('Once handler integration', () => {
    it('should work with regular handlers', () => {
      const events = createEventManager();
      const results: string[] = [];

      events.once('single', () => results.push('once'));
      events.on('single', () => results.push('regular'));

      events.emit('single', {});
      events.emit('single', {});

      expect(results).toEqual(['once', 'regular', 'regular']);
    });
  });
});
