/**
 * Credentials Provider
 *
 * Interface for secure credential access with support for multiple
 * authentication methods (token, device, password, bootstrap).
 *
 * @module
 */

import type { ConnectParams } from '../protocol/connection.js';
import { AuthError } from '../errors.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Device credentials containing keypair information.
 */
export interface DeviceCredentials {
  deviceId: string;
  publicKey: string;
  /** Private key - use signChallenge() instead of exposing directly */
  privateKey?: string;
  keyPairId?: string;
}

/**
 * Result of token refresh operation.
 */
export interface RefreshResult {
  token: string | null;
  success: boolean;
  errorCode?: 'REFRESH_NOT_SUPPORTED' | 'REFRESH_FAILED' | 'TOKEN_EXPIRED' | 'NETWORK_ERROR';
  retryAfterMs?: number;
}

/**
 * Auth method priority.
 */
export type AuthMethod = 'bootstrapToken' | 'deviceToken' | 'token' | 'password';

/**
 * Credentials provider interface for secure credential access.
 */
export interface CredentialsProvider {
  /**
   * Get authentication token.
   */
  getToken?(): Promise<string | null>;

  /**
   * Refresh authentication token.
   * Called before reconnection if token might be expired.
   */
  refreshToken?(currentToken: string | null): Promise<RefreshResult>;

  /**
   * Get device credentials for keypair authentication.
   */
  getDeviceCredentials?(): Promise<DeviceCredentials | null>;

  /**
   * Get bootstrap token for initial pairing.
   */
  getBootstrapToken?(): Promise<string | null>;

  /**
   * Get password credentials.
   */
  getPassword?(): Promise<{ username: string; password: string } | null>;

  /**
   * Sign a challenge nonce. Required for device auth.
   */
  signChallenge?(nonce: string, timestamp: number): Promise<string>;
}

// ============================================================================
// Static Credentials Provider
// ============================================================================

export interface StaticCredentialsConfig {
  token?: string;
  device?: DeviceCredentials;
  bootstrapToken?: string;
  password?: { username: string; password: string };
  refreshToken?: (currentToken: string | null) => Promise<string | null>;
}

/**
 * Static credentials provider for simple use cases.
 *
 * Suitable for development but not production for device keys.
 */
export class StaticCredentialsProvider implements CredentialsProvider {
  constructor(private config: StaticCredentialsConfig) {}

  async getToken(): Promise<string | null> {
    return this.config.token ?? null;
  }

  async refreshToken(currentToken: string | null): Promise<RefreshResult> {
    if (!this.config.refreshToken) {
      return { token: null, success: false, errorCode: 'REFRESH_NOT_SUPPORTED' };
    }

    try {
      const newToken = await this.config.refreshToken(currentToken);
      return { token: newToken, success: true };
    } catch (error) {
      return {
        token: null,
        success: false,
        errorCode: 'REFRESH_FAILED',
        retryAfterMs: (error as { retryAfterMs?: number } | undefined)?.retryAfterMs,
      };
    }
  }

  async getDeviceCredentials(): Promise<DeviceCredentials | null> {
    return this.config.device ?? null;
  }

  async getBootstrapToken(): Promise<string | null> {
    return this.config.bootstrapToken ?? null;
  }

  async getPassword(): Promise<{ username: string; password: string } | null> {
    return this.config.password ?? null;
  }

  /**
   * @securityNote **Private key held in plaintext in memory.** The private key
   * string is stored in memory after construction. `signChallenge()` wipes
   * the internal keyBuffer after use via crypto.privateEncrypt, but the
   * original `privateKey` string remains in memory. For production use with
   * sensitive keys, consider using an HSM, keyring, or hardware security module.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
   */
  async signChallenge(nonce: string, timestamp: number): Promise<string> {
    if (!this.config.device?.privateKey) {
      throw new Error('No private key available for signing');
    }

    const crypto = await import('crypto');
    const payload = `${nonce}:${timestamp}`;
    const sign = crypto.createSign('SHA256');
    sign.update(payload);
    sign.end();

    const keyBuffer = Buffer.from(this.config.device.privateKey, 'utf-8');
    try {
      return sign.sign(keyBuffer, 'base64');
    } finally {
      keyBuffer.fill(0);
    }
  }
}

// ============================================================================
// Auth Handler (Integration)
// ============================================================================

export interface AuthConfig {
  primaryAuth?: AuthMethod;
  fallbackChain?: AuthMethod[];
}

const DEFAULT_AUTH_CHAIN: AuthMethod[] = ['bootstrapToken', 'deviceToken', 'token', 'password'];

/**
 * Auth handler that integrates with ConnectionManager.
 */
export class AuthHandler {
  private currentMethod: AuthMethod | null = null;

  constructor(
    private provider: CredentialsProvider,
    private config: AuthConfig = {}
  ) {}

  /**
   * Prepare auth data for connect request.
   */
  async prepareAuth(): Promise<{
    method: AuthMethod;
    data: ConnectParams['auth'];
  } | null> {
    const methods = this.config.primaryAuth
      ? [this.config.primaryAuth]
      : (this.config.fallbackChain ?? DEFAULT_AUTH_CHAIN);

    for (const method of methods) {
      const data = await this.tryAuthMethod(method);
      if (data) {
        this.currentMethod = method;
        return { method, data };
      }
    }

    return null;
  }

  /**
   * Handle incoming challenge from server.
   */
  async handleChallenge(challenge: {
    nonce: string;
    timestamp: number;
    expiresAt: number;
  }): Promise<{ signature: string; timestamp: number }> {
    const now = Date.now();

    // Check expiration
    if (now >= challenge.expiresAt) {
      throw new AuthError({
        code: 'CHALLENGE_EXPIRED',
        message: 'Challenge expired',
        retryable: true,
      });
    }

    // Sign the challenge
    if (!this.provider.signChallenge) {
      throw new AuthError({
        code: 'CHALLENGE_FAILED',
        message: 'Credentials provider does not support challenge signing',
        retryable: false,
      });
    }

    try {
      const signature = await this.provider.signChallenge(challenge.nonce, challenge.timestamp);
      return { signature, timestamp: challenge.timestamp };
    } catch (error) {
      throw new AuthError({
        code: 'CHALLENGE_FAILED',
        message: `Failed to sign challenge: ${error instanceof Error ? error.message : 'Unknown'}`,
        retryable: false,
      });
    }
  }

  /**
   * Get the current auth method being used.
   */
  getAuthMethod(): AuthMethod | null {
    return this.currentMethod;
  }

  /**
   * Refresh token if supported (for reconnection).
   */
  async refreshToken(): Promise<RefreshResult | null> {
    if (!this.provider.refreshToken) {
      return null;
    }

    const currentToken =
      this.currentMethod === 'token'
        ? ((await this.provider.getToken?.()) ?? undefined)
        : undefined;

    return this.provider.refreshToken(currentToken ?? null);
  }

  private async tryAuthMethod(method: AuthMethod): Promise<ConnectParams['auth'] | null> {
    switch (method) {
      case 'bootstrapToken': {
        const token = await this.provider.getBootstrapToken?.();
        return token ? { bootstrapToken: token } : null;
      }

      case 'deviceToken': {
        const device = await this.provider.getDeviceCredentials?.();
        if (device) {
          return {
            deviceToken: device.deviceId,
          };
        }
        return null;
      }

      case 'token': {
        const token = await this.provider.getToken?.();
        return token ? { token } : null;
      }

      case 'password': {
        const password = await this.provider.getPassword?.();
        return password ?? null;
      }
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an auth handler.
 *
 * @param provider - Credentials provider instance
 * @param config - Optional auth configuration
 * @returns AuthHandler instance
 *
 * @example
 * ```ts
 * const provider = new StaticCredentialsProvider({
 *   token: "my-token"
 * });
 *
 * const auth = createAuthHandler(provider, {
 *   primaryAuth: "token",
 *   fallbackChain: ["bootstrapToken", "password"]
 * });
 * ```
 */
export function createAuthHandler(provider: CredentialsProvider, config?: AuthConfig): AuthHandler {
  return new AuthHandler(provider, config);
}
