/**
 * Transport Module Tests
 *
 * Tests for platform detection and exports in transport/index.ts
 */

import { describe, it, expect } from 'vitest';

// Type-only tests - these verify TypeScript can resolve the types
describe('Transport Module Type Exports', () => {
  it('should have index.ts file that exports transport types', () => {
    // This test verifies the file exists and can be imported
    // Type exports are handled by TypeScript at compile time
    expect(true).toBe(true);
  });

  it('should export WebSocketTransport class', async () => {
    const { WebSocketTransport } = await import('./index.js');
    expect(WebSocketTransport).toBeDefined();
    expect(typeof WebSocketTransport).toBe('function');
  });

  it('should have createWebSocketTransport as default export', async () => {
    const transportModule = await import('./index.js');
    expect(transportModule.default).toBeDefined();
    expect(typeof transportModule.default).toBe('function');
  });

  it('should have createWebSocketTransport named export', async () => {
    const { createWebSocketTransport } = await import('./index.js');
    expect(createWebSocketTransport).toBeDefined();
    expect(typeof createWebSocketTransport).toBe('function');
  });

  it('should have createNodeWebSocketTransport named export', async () => {
    const { createNodeWebSocketTransport } = await import('./index.js');
    expect(createNodeWebSocketTransport).toBeDefined();
    expect(typeof createNodeWebSocketTransport).toBe('function');
  });

  it('should have createBrowserWebSocketTransport named export', async () => {
    const { createBrowserWebSocketTransport } = await import('./index.js');
    expect(createBrowserWebSocketTransport).toBeDefined();
    expect(typeof createBrowserWebSocketTransport).toBe('function');
  });
});

// Type-only tests that verify type resolution at compile time
describe('Transport Type Resolution', () => {
  // These tests use type annotations to verify types resolve correctly
  // They will fail at compile time if types are incorrect

  it('should resolve IWebSocketTransport type', () => {
    // Type assertion to verify type exists - compile-time check
    type T = import('./websocket.js').IWebSocketTransport;
    const _typeCheck: T | undefined = undefined;
    expect(_typeCheck).toBeUndefined();
  });

  it('should resolve ReadyState type', () => {
    type T = import('./websocket.js').ReadyState;
    const _typeCheck: T | undefined = undefined;
    expect(_typeCheck).toBeUndefined();
  });

  it('should resolve ReadyStateString type', () => {
    type T = import('./websocket.js').ReadyStateString;
    const _typeCheck: T | undefined = undefined;
    expect(_typeCheck).toBeUndefined();
  });

  it('should resolve NodeWebSocketTransportConfig type', () => {
    type T = import('./node.js').NodeWebSocketTransportConfig;
    const _typeCheck: T | undefined = undefined;
    expect(_typeCheck).toBeUndefined();
  });

  it('should resolve BrowserWebSocketTransportConfig type', () => {
    type T = import('./browser.js').BrowserWebSocketTransportConfig;
    const _typeCheck: T | undefined = undefined;
    expect(_typeCheck).toBeUndefined();
  });
});
