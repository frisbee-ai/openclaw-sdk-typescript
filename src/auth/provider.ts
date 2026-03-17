/**
 * Credentials Provider
 *
 * Interface for secure credential access with support for multiple
 * authentication methods (token, device, password, bootstrap).
 */

import type { ConnectParams } from '../protocol/types.js';
import type { AuthError, AuthErrorCode } from '../errors.js';

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
 * @warning Suitable for development but not production for device keys.
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
        retryAfterMs: (error as any)?.retryAfterMs,
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

  async signChallenge(nonce: string, timestamp: number): Promise<string> {
    if (!this.config.device?.privateKey) {
      throw new Error('No private key available for signing');
    }

    // Node.js crypto implementation
    const crypto = await import('crypto');
    const payload = `${nonce}:${timestamp}`;
    const sign = crypto.createSign('SHA256');
    sign.update(payload);
    sign.end();
    const signature = sign.sign(this.config.device.privateKey, 'base64');
    return signature;
  }
}

// ============================================================================
// Auth Handler (Integration)
// ============================================================================

export interface AuthConfig {
  primaryAuth?: AuthMethod;
  fallbackChain?: AuthMethod[];
}

const DEFAULT_AUTH_CHAIN: AuthMethod[] = [
  'bootstrapToken',
  'deviceToken',
  'token',
  'password',
];

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
      : this.config.fallbackChain ?? DEFAULT_AUTH_CHAIN;

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
      const { AuthError } = await import('../errors.js');
      throw new AuthError({
        code: 'CHALLENGE_EXPIRED',
        message: 'Challenge expired',
        retryable: true,
      });
    }

    // Sign the challenge
    if (!this.provider.signChallenge) {
      const { AuthError } = await import('../errors.js');
      throw new AuthError({
        code: 'CHALLENGE_FAILED',
        message: 'Credentials provider does not support challenge signing',
        retryable: false,
      });
    }

    try {
      const signature = await this.provider.signChallenge(
        challenge.nonce,
        challenge.timestamp
      );
      return { signature, timestamp: challenge.timestamp };
    } catch (error) {
      const { AuthError } = await import('../errors.js');
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

    const currentToken = this.currentMethod === 'token'
      ? await this.provider.getToken?.() ?? undefined
      : undefined;

    return this.provider.refreshToken(currentToken ?? null);
  }

  private async tryAuthMethod(
    method: AuthMethod
  ): Promise<ConnectParams['auth'] | null> {
    switch (method) {
      case 'bootstrapToken': {
        const token = await this.provider.getBootstrapToken?.();
        return token ? { bootstrapToken: token } : null;
      }

      case 'deviceToken': {
        const device = await this.provider.getDeviceCredentials?.();
        if (device) {
          return {
            deviceToken: device.publicKey,
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
 */
export function createAuthHandler(
  provider: CredentialsProvider,
  config?: AuthConfig
): AuthHandler {
  return new AuthHandler(provider, config);
}
