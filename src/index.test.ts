/**
 * Main Entry Point Tests
 *
 * Tests verifying the public API exports from src/index.ts
 */

import { describe, it, expect } from 'vitest';

describe('Main Entry Point Exports', () => {
  describe('Client exports', () => {
    it('should export OpenClawClient class', async () => {
      const { OpenClawClient } = await import('./index.js');
      expect(OpenClawClient).toBeDefined();
      expect(typeof OpenClawClient).toBe('function');
    });

    it('should export createClient factory', async () => {
      const { createClient } = await import('./index.js');
      expect(createClient).toBeDefined();
      expect(typeof createClient).toBe('function');
    });

    it('should export ClientConfig type', async () => {
      type T = import('./index.js').ClientConfig;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export ConnectionConfig type', async () => {
      type T = import('./index.js').ConnectionConfig;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });
  });

  describe('Error exports', () => {
    it('should export OpenClawError class', async () => {
      const { OpenClawError } = await import('./index.js');
      expect(OpenClawError).toBeDefined();
    });

    it('should export AuthError class', async () => {
      const { AuthError } = await import('./index.js');
      expect(AuthError).toBeDefined();
    });

    it('should export ConnectionError class', async () => {
      const { ConnectionError } = await import('./index.js');
      expect(ConnectionError).toBeDefined();
    });

    it('should export ProtocolError class', async () => {
      const { ProtocolError } = await import('./index.js');
      expect(ProtocolError).toBeDefined();
    });

    it('should export RequestError class', async () => {
      const { RequestError } = await import('./index.js');
      expect(RequestError).toBeDefined();
    });

    it('should export TimeoutError class', async () => {
      const { TimeoutError } = await import('./index.js');
      expect(TimeoutError).toBeDefined();
    });

    it('should export CancelledError class', async () => {
      const { CancelledError } = await import('./index.js');
      expect(CancelledError).toBeDefined();
    });

    it('should export AbortError class', async () => {
      const { AbortError } = await import('./index.js');
      expect(AbortError).toBeDefined();
    });

    it('should export GatewayError class', async () => {
      const { GatewayError } = await import('./index.js');
      expect(GatewayError).toBeDefined();
    });

    it('should export ReconnectError class', async () => {
      const { ReconnectError } = await import('./index.js');
      expect(ReconnectError).toBeDefined();
    });
  });

  describe('Error type guards', () => {
    it('should export isOpenClawError', async () => {
      const { isOpenClawError } = await import('./index.js');
      expect(isOpenClawError).toBeDefined();
      expect(typeof isOpenClawError).toBe('function');
    });

    it('should export isAuthError', async () => {
      const { isAuthError } = await import('./index.js');
      expect(isAuthError).toBeDefined();
      expect(typeof isAuthError).toBe('function');
    });

    it('should export isConnectionError', async () => {
      const { isConnectionError } = await import('./index.js');
      expect(isConnectionError).toBeDefined();
      expect(typeof isConnectionError).toBe('function');
    });

    it('should export isTimeoutError', async () => {
      const { isTimeoutError } = await import('./index.js');
      expect(isTimeoutError).toBeDefined();
      expect(typeof isTimeoutError).toBe('function');
    });

    it('should export isCancelledError', async () => {
      const { isCancelledError } = await import('./index.js');
      expect(isCancelledError).toBeDefined();
      expect(typeof isCancelledError).toBe('function');
    });

    it('should export isAbortError', async () => {
      const { isAbortError } = await import('./index.js');
      expect(isAbortError).toBeDefined();
      expect(typeof isAbortError).toBe('function');
    });
  });

  describe('Error factory', () => {
    it('should export createErrorFromResponse', async () => {
      const { createErrorFromResponse } = await import('./index.js');
      expect(createErrorFromResponse).toBeDefined();
      expect(typeof createErrorFromResponse).toBe('function');
    });
  });

  describe('Protocol type exports', () => {
    it('should export GatewayFrame type', async () => {
      type T = import('./index.js').GatewayFrame;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export RequestFrame type', async () => {
      type T = import('./index.js').RequestFrame;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export ResponseFrame type', async () => {
      type T = import('./index.js').ResponseFrame;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export EventFrame type', async () => {
      type T = import('./index.js').EventFrame;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export ConnectionState type', async () => {
      type T = import('./index.js').ConnectionState;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export ConnectParams type', async () => {
      type T = import('./index.js').ConnectParams;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export HelloOk type', async () => {
      type T = import('./index.js').HelloOk;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export ErrorShape type', async () => {
      type T = import('./index.js').ErrorShape;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });
  });

  describe('Managers exports', () => {
    it('should export EventManager', async () => {
      const { EventManager } = await import('./index.js');
      expect(EventManager).toBeDefined();
    });

    it('should export createEventManager', async () => {
      const { createEventManager } = await import('./index.js');
      expect(createEventManager).toBeDefined();
    });

    it('should export ReconnectManager', async () => {
      const { ReconnectManager } = await import('./index.js');
      expect(ReconnectManager).toBeDefined();
    });

    it('should export createReconnectManager', async () => {
      const { createReconnectManager } = await import('./index.js');
      expect(createReconnectManager).toBeDefined();
    });
  });

  describe('Connection exports', () => {
    it('should export ProtocolNegotiator', async () => {
      const { ProtocolNegotiator } = await import('./index.js');
      expect(ProtocolNegotiator).toBeDefined();
    });

    it('should export createProtocolNegotiator', async () => {
      const { createProtocolNegotiator } = await import('./index.js');
      expect(createProtocolNegotiator).toBeDefined();
    });

    it('should export ConnectionStateMachine', async () => {
      const { ConnectionStateMachine } = await import('./index.js');
      expect(ConnectionStateMachine).toBeDefined();
    });

    it('should export createConnectionStateMachine', async () => {
      const { createConnectionStateMachine } = await import('./index.js');
      expect(createConnectionStateMachine).toBeDefined();
    });

    it('should export PolicyManager', async () => {
      const { PolicyManager } = await import('./index.js');
      expect(PolicyManager).toBeDefined();
    });

    it('should export createPolicyManager', async () => {
      const { createPolicyManager } = await import('./index.js');
      expect(createPolicyManager).toBeDefined();
    });

    it('should export TlsValidator', async () => {
      const { TlsValidator } = await import('./index.js');
      expect(TlsValidator).toBeDefined();
    });

    it('should export createTlsValidator', async () => {
      const { createTlsValidator } = await import('./index.js');
      expect(createTlsValidator).toBeDefined();
    });
  });

  describe('Events exports', () => {
    it('should export TickMonitor', async () => {
      const { TickMonitor } = await import('./index.js');
      expect(TickMonitor).toBeDefined();
    });

    it('should export createTickMonitor', async () => {
      const { createTickMonitor } = await import('./index.js');
      expect(createTickMonitor).toBeDefined();
    });

    it('should export GapDetector', async () => {
      const { GapDetector } = await import('./index.js');
      expect(GapDetector).toBeDefined();
    });

    it('should export createGapDetector', async () => {
      const { createGapDetector } = await import('./index.js');
      expect(createGapDetector).toBeDefined();
    });
  });

  describe('Auth exports', () => {
    it('should export CredentialsProvider interface', async () => {
      type T = import('./index.js').CredentialsProvider;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export StaticCredentialsProvider', async () => {
      const { StaticCredentialsProvider } = await import('./index.js');
      expect(StaticCredentialsProvider).toBeDefined();
    });

    it('should export AuthHandler', async () => {
      const { AuthHandler } = await import('./index.js');
      expect(AuthHandler).toBeDefined();
    });

    it('should export createAuthHandler', async () => {
      const { createAuthHandler } = await import('./index.js');
      expect(createAuthHandler).toBeDefined();
    });
  });

  describe('Logger type exports', () => {
    it('should export Logger interface', async () => {
      type T = import('./index.js').Logger;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export LogLevel type', async () => {
      type T = import('./index.js').LogLevel;
      const _check: T | undefined = undefined;
      expect(_check).toBeUndefined();
    });

    it('should export isLogger type guard', async () => {
      const { isLogger } = await import('./index.js');
      expect(isLogger).toBeDefined();
      expect(typeof isLogger).toBe('function');
    });
  });
});
