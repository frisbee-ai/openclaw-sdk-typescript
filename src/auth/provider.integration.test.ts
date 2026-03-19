/**
 * Auth Provider Integration Tests
 *
 * Integration tests covering:
 * - Full auth chain fallback behavior
 * - Token refresh flows
 * - Multi-component interaction scenarios
 */

import { describe, it, expect, vi } from 'vitest';
import { createAuthHandler, type CredentialsProvider } from './provider';

describe('Auth Integration Scenarios', () => {
  describe('Full auth chain', () => {
    it('should try all methods in order', async () => {
      const callOrder: string[] = [];
      const provider: CredentialsProvider = {
        getToken: vi.fn().mockImplementation(() => {
          callOrder.push('token');
          return Promise.resolve(null);
        }),
        getBootstrapToken: vi.fn().mockImplementation(() => {
          callOrder.push('bootstrapToken');
          return Promise.resolve(null);
        }),
        getDeviceCredentials: vi.fn().mockImplementation(() => {
          callOrder.push('deviceToken');
          return Promise.resolve(null);
        }),
        getPassword: vi.fn().mockImplementation(() => {
          callOrder.push('password');
          return Promise.resolve({ username: 'user', password: 'pass' });
        }),
      };

      const handler = createAuthHandler(provider);
      await handler.prepareAuth();

      // Default auth chain: bootstrapToken -> deviceToken -> token -> password
      expect(callOrder).toEqual(['bootstrapToken', 'deviceToken', 'token', 'password']);
    });

    it('should stop at first successful method', async () => {
      const callOrder: string[] = [];
      const provider: CredentialsProvider = {
        getToken: vi.fn().mockImplementation(() => {
          callOrder.push('token');
          return Promise.resolve('success-token');
        }),
        getBootstrapToken: vi.fn().mockImplementation(() => {
          callOrder.push('bootstrapToken');
          return Promise.resolve('bootstrap-token');
        }),
        getDeviceCredentials: vi.fn().mockImplementation(() => {
          callOrder.push('deviceToken');
          return Promise.resolve(null);
        }),
        getPassword: vi.fn().mockImplementation(() => {
          callOrder.push('password');
          return Promise.resolve(null);
        }),
      };

      const handler = createAuthHandler(provider);
      const result = await handler.prepareAuth();

      // Default chain starts with bootstrapToken, which succeeds first
      expect(callOrder).toEqual(['bootstrapToken']);
      expect(result?.method).toBe('bootstrapToken');
    });
  });

  describe('Token refresh flow', () => {
    it('should refresh token on reconnection', async () => {
      let refreshCallCount = 0;
      const { StaticCredentialsProvider } = await import('./provider');
      const provider = new StaticCredentialsProvider({
        token: 'initial-token',
        refreshToken: async () => {
          refreshCallCount++;
          return 'refreshed-token';
        },
      });

      const handler = createAuthHandler(provider, { primaryAuth: 'token' });
      await handler.prepareAuth();

      // First refresh
      const result1 = await handler.refreshToken();
      expect(result1?.token).toBe('refreshed-token');

      // Second refresh
      const result2 = await handler.refreshToken();
      expect(result2?.token).toBe('refreshed-token');
      expect(refreshCallCount).toBe(2);
    });

    it('should handle refresh failure gracefully', async () => {
      const { StaticCredentialsProvider } = await import('./provider');
      const provider = new StaticCredentialsProvider({
        token: 'expired-token',
        refreshToken: async () => {
          throw new Error('Network error');
        },
      });

      const handler = createAuthHandler(provider, { primaryAuth: 'token' });
      await handler.prepareAuth();

      const result = await handler.refreshToken();

      expect(result?.success).toBe(false);
      expect(result?.errorCode).toBe('REFRESH_FAILED');
    });
  });
});
