/**
 * Auth Provider Unit Tests
 *
 * Comprehensive tests covering:
 * - Unit: StaticCredentialsProvider, AuthHandler
 * - Edge Cases: Null credentials, expired challenges
 * - Security: Challenge signing, token refresh
 * - Integration: Auth chain fallback, challenge handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  StaticCredentialsProvider,
  createAuthHandler,
  type CredentialsProvider,
  type DeviceCredentials,
} from './provider';

describe('StaticCredentialsProvider', () => {
  describe('getToken()', () => {
    it('should return token when configured', async () => {
      const provider = new StaticCredentialsProvider({ token: 'test-token' });

      const token = await provider.getToken();

      expect(token).toBe('test-token');
    });

    it('should return null when no token configured', async () => {
      const provider = new StaticCredentialsProvider({});

      const token = await provider.getToken();

      expect(token).toBeNull();
    });
  });

  describe('getDeviceCredentials()', () => {
    it('should return device credentials when configured', async () => {
      const device: DeviceCredentials = {
        deviceId: 'device-123',
        publicKey: 'public-key-data',
        privateKey: 'private-key-data',
      };
      const provider = new StaticCredentialsProvider({ device });

      const creds = await provider.getDeviceCredentials();

      expect(creds).toEqual(device);
    });

    it('should return null when no device configured', async () => {
      const provider = new StaticCredentialsProvider({});

      const creds = await provider.getDeviceCredentials();

      expect(creds).toBeNull();
    });
  });

  describe('getBootstrapToken()', () => {
    it('should return bootstrap token when configured', async () => {
      const provider = new StaticCredentialsProvider({ bootstrapToken: 'bootstrap-token' });

      const token = await provider.getBootstrapToken();

      expect(token).toBe('bootstrap-token');
    });

    it('should return null when no bootstrap token configured', async () => {
      const provider = new StaticCredentialsProvider({});

      const token = await provider.getBootstrapToken();

      expect(token).toBeNull();
    });
  });

  describe('getPassword()', () => {
    it('should return password credentials when configured', async () => {
      const provider = new StaticCredentialsProvider({
        password: { username: 'user', password: 'pass' },
      });

      const creds = await provider.getPassword();

      expect(creds).toEqual({ username: 'user', password: 'pass' });
    });

    it('should return null when no password configured', async () => {
      const provider = new StaticCredentialsProvider({});

      const creds = await provider.getPassword();

      expect(creds).toBeNull();
    });
  });

  describe('refreshToken()', () => {
    it('should return REFRESH_NOT_SUPPORTED when no refresh function', async () => {
      const provider = new StaticCredentialsProvider({ token: 'old-token' });

      const result = await provider.refreshToken('old-token');

      expect(result).toEqual({
        token: null,
        success: false,
        errorCode: 'REFRESH_NOT_SUPPORTED',
      });
    });

    it('should call refresh function and return success', async () => {
      const refreshFn = vi.fn().mockResolvedValue('new-token');
      const provider = new StaticCredentialsProvider({
        token: 'old-token',
        refreshToken: refreshFn,
      });

      const result = await provider.refreshToken('old-token');

      expect(refreshFn).toHaveBeenCalledWith('old-token');
      expect(result).toEqual({
        token: 'new-token',
        success: true,
      });
    });

    it('should return REFRESH_FAILED on error', async () => {
      const refreshFn = vi.fn().mockRejectedValue(new Error('Network error'));
      const provider = new StaticCredentialsProvider({
        token: 'old-token',
        refreshToken: refreshFn,
      });

      const result = await provider.refreshToken('old-token');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('REFRESH_FAILED');
    });
  });

  describe('signChallenge()', () => {
    it('should throw when no private key available', async () => {
      const provider = new StaticCredentialsProvider({
        device: { deviceId: '123', publicKey: 'key' },
      });

      await expect(provider.signChallenge('nonce', Date.now())).rejects.toThrow(
        'No private key available for signing'
      );
    });

    it('should sign challenge when private key available', async () => {
      const crypto = await import('crypto');
      const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });

      const provider = new StaticCredentialsProvider({
        device: {
          deviceId: '123',
          publicKey: 'public',
          privateKey,
        },
      });

      const signature = await provider.signChallenge('test-nonce', 1234567890);

      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);
    });
  });
});

describe('AuthHandler', () => {
  let mockProvider: CredentialsProvider;

  beforeEach(() => {
    mockProvider = {
      getToken: vi.fn().mockResolvedValue('test-token'),
      getBootstrapToken: vi.fn().mockResolvedValue('bootstrap-token'),
      getDeviceCredentials: vi.fn().mockResolvedValue(null),
      getPassword: vi.fn().mockResolvedValue(null),
      refreshToken: vi.fn().mockResolvedValue({ token: 'new-token', success: true }),
    };
  });

  describe('prepareAuth()', () => {
    it('should use primary auth method when specified', async () => {
      const handler = createAuthHandler(mockProvider, {
        primaryAuth: 'token',
      });

      const result = await handler.prepareAuth();

      expect(result).toEqual({
        method: 'token',
        data: { token: 'test-token' },
      });
    });

    it('should fallback through chain when primary fails', async () => {
      const providerWithFallback: CredentialsProvider = {
        getToken: vi.fn().mockResolvedValue(null),
        getBootstrapToken: vi.fn().mockResolvedValue('bootstrap-token'),
        getDeviceCredentials: vi.fn().mockResolvedValue(null),
        getPassword: vi.fn().mockResolvedValue(null),
      };
      const handler = createAuthHandler(providerWithFallback);

      const result = await handler.prepareAuth();

      expect(result).toEqual({
        method: 'bootstrapToken',
        data: { bootstrapToken: 'bootstrap-token' },
      });
    });

    it('should return null when no auth method succeeds', async () => {
      const providerWithNoAuth: CredentialsProvider = {
        getToken: vi.fn().mockResolvedValue(null),
        getBootstrapToken: vi.fn().mockResolvedValue(null),
        getDeviceCredentials: vi.fn().mockResolvedValue(null),
        getPassword: vi.fn().mockResolvedValue(null),
      };
      const handler = createAuthHandler(providerWithNoAuth);

      const result = await handler.prepareAuth();

      expect(result).toBeNull();
    });

    it('should try device credentials when method is deviceToken', async () => {
      const deviceCreds: DeviceCredentials = {
        deviceId: 'device-1',
        publicKey: 'public-key',
      };
      const providerWithDevice: CredentialsProvider = {
        getToken: vi.fn().mockResolvedValue(null),
        getBootstrapToken: vi.fn().mockResolvedValue(null),
        getDeviceCredentials: vi.fn().mockResolvedValue(deviceCreds),
        getPassword: vi.fn().mockResolvedValue(null),
      };
      const handler = createAuthHandler(providerWithDevice, {
        primaryAuth: 'deviceToken',
      });

      const result = await handler.prepareAuth();

      expect(result).toEqual({
        method: 'deviceToken',
        data: { deviceToken: 'device-1' },
      });
    });

    it('should try password when method is password', async () => {
      const providerWithPassword: CredentialsProvider = {
        getToken: vi.fn().mockResolvedValue(null),
        getBootstrapToken: vi.fn().mockResolvedValue(null),
        getDeviceCredentials: vi.fn().mockResolvedValue(null),
        getPassword: vi.fn().mockResolvedValue({ username: 'user', password: 'pass' }),
      };
      const handler = createAuthHandler(providerWithPassword, {
        primaryAuth: 'password',
      });

      const result = await handler.prepareAuth();

      expect(result).toEqual({
        method: 'password',
        data: { username: 'user', password: 'pass' },
      });
    });
  });

  describe('handleChallenge()', () => {
    it('should throw AuthError when challenge expired', async () => {
      const handler = createAuthHandler(mockProvider);

      const expiredChallenge = {
        nonce: 'test-nonce',
        timestamp: Date.now() - 3600000, // 1 hour ago
        expiresAt: Date.now() - 1800000, // 30 minutes ago (expired)
      };

      await expect(handler.handleChallenge(expiredChallenge)).rejects.toThrow();
    });

    it('should throw when provider does not support signing', async () => {
      const providerWithoutSign: CredentialsProvider = {
        getToken: vi.fn().mockResolvedValue('token'),
      };
      const handler = createAuthHandler(providerWithoutSign);

      const challenge = {
        nonce: 'test-nonce',
        timestamp: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      await expect(handler.handleChallenge(challenge)).rejects.toThrow(
        'Credentials provider does not support challenge signing'
      );
    });

    it('should return signature when signing succeeds', async () => {
      const crypto = await import('crypto');
      const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });

      const providerWithSign: CredentialsProvider = {
        getToken: vi.fn().mockResolvedValue('token'),
        signChallenge: vi.fn().mockImplementation(async (nonce: string, timestamp: number) => {
          const crypto = await import('crypto');
          const sign = crypto.createSign('SHA256');
          sign.update(`${nonce}:${timestamp}`);
          sign.end();
          return sign.sign(privateKey, 'base64');
        }),
      };
      const handler = createAuthHandler(providerWithSign);

      const challenge = {
        nonce: 'test-nonce',
        timestamp: Date.now(),
        expiresAt: Date.now() + 300000,
      };

      const result = await handler.handleChallenge(challenge);

      expect(result.signature).toBeDefined();
      expect(result.timestamp).toBe(challenge.timestamp);
    });
  });

  describe('refreshToken()', () => {
    it('should return null when provider does not support refresh', async () => {
      const providerNoRefresh: CredentialsProvider = {
        getToken: vi.fn().mockResolvedValue('token'),
      };
      const handler = createAuthHandler(providerNoRefresh);

      const result = await handler.refreshToken();

      expect(result).toBeNull();
    });

    it('should return refresh result when supported', async () => {
      const handler = createAuthHandler(mockProvider, { primaryAuth: 'token' });

      // First set the auth method
      await handler.prepareAuth();

      const result = await handler.refreshToken();

      expect(result).toEqual({ token: 'new-token', success: true });
    });
  });

  describe('getAuthMethod()', () => {
    it('should return null before prepareAuth', () => {
      const handler = createAuthHandler(mockProvider);

      expect(handler.getAuthMethod()).toBeNull();
    });

    it('should return current auth method after prepareAuth', async () => {
      const handler = createAuthHandler(mockProvider, { primaryAuth: 'token' });

      await handler.prepareAuth();

      expect(handler.getAuthMethod()).toBe('token');
    });
  });
});

describe('createAuthHandler factory', () => {
  it('should create AuthHandler instance', () => {
    const provider = new StaticCredentialsProvider({ token: 'test' });
    const handler = createAuthHandler(provider);

    expect(handler).toBeDefined();
  });

  it('should pass config to AuthHandler', async () => {
    const provider = new StaticCredentialsProvider({ token: 'test' });
    const handler = createAuthHandler(provider, { primaryAuth: 'token' });

    const result = await handler.prepareAuth();

    expect(result?.method).toBe('token');
  });
});

// ============================================================================
// Edge Cases - Boundary Tests
// ============================================================================

describe('Edge Cases', () => {
  describe('Empty credentials', () => {
    it('should handle empty token string', async () => {
      const provider = new StaticCredentialsProvider({ token: '' });
      const token = await provider.getToken();
      expect(token).toBe('');
    });

    it('should handle empty bootstrap token', async () => {
      const provider = new StaticCredentialsProvider({ bootstrapToken: '' });
      const token = await provider.getBootstrapToken();
      expect(token).toBe('');
    });
  });

  describe('Whitespace handling', () => {
    it('should preserve whitespace in tokens', async () => {
      const provider = new StaticCredentialsProvider({ token: 'token with spaces' });
      const token = await provider.getToken();
      expect(token).toBe('token with spaces');
    });
  });

  describe('Special characters', () => {
    it('should handle special characters in passwords', async () => {
      const provider = new StaticCredentialsProvider({
        password: { username: 'user', password: 'p@ss!w0rd#$%' },
      });
      const creds = await provider.getPassword();
      expect(creds?.password).toBe('p@ss!w0rd#$%');
    });

    it('should handle unicode in credentials', async () => {
      const provider = new StaticCredentialsProvider({
        token: 'token-中文-emoji-🎉',
      });
      const token = await provider.getToken();
      expect(token).toBe('token-中文-emoji-🎉');
    });
  });

  describe('Large data', () => {
    it('should handle large device public key', async () => {
      const largeKey = 'a'.repeat(10000);
      const provider = new StaticCredentialsProvider({
        device: {
          deviceId: 'device',
          publicKey: largeKey,
        },
      });
      const creds = await provider.getDeviceCredentials();
      expect(creds?.publicKey).toHaveLength(10000);
    });

    it('should handle large token', async () => {
      const largeToken = 't'.repeat(50000);
      const provider = new StaticCredentialsProvider({ token: largeToken });
      const token = await provider.getToken();
      expect(token).toHaveLength(50000);
    });
  });
});
