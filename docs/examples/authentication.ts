/**
 * Authentication Examples
 *
 * Examples showing different authentication methods:
 * - Static token via auth config
 * - Custom credentials provider with token refresh
 */

import {
  createClient,
  type CredentialsProvider,
  StaticCredentialsProvider,
} from '../../src/index.js';

// ============================================================================
// Example 1: Static Token via auth config
// ============================================================================

async function staticTokenExample() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    clientId: 'example-client',
    auth: {
      token: 'your-auth-token',
    },
  });

  await client.connect();
  console.log('✓ Connected with static token');
  client.disconnect();
}

// ============================================================================
// Example 2: Using StaticCredentialsProvider
// ============================================================================

async function staticCredentialsProviderExample() {
  const provider = new StaticCredentialsProvider({
    token: 'your-auth-token',
  });

  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    clientId: 'example-client',
    credentialsProvider: provider,
  });

  await client.connect();
  console.log('✓ Connected with StaticCredentialsProvider');
  client.disconnect();
}

// ============================================================================
// Example 3: Custom Credentials Provider with Token Refresh
// ============================================================================

/**
 * Custom credentials provider with dynamic token refresh.
 */
class TokenRefreshProvider implements CredentialsProvider {
  private token?: string;
  private expiresAt?: number;

  async getToken(): Promise<string | null> {
    // Check if we have a valid token
    if (this.token && this.expiresAt && Date.now() < this.expiresAt) {
      return this.token;
    }

    // Fetch new token
    const response = await fetch('https://auth.example.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
      }),
    });

    const data = (await response.json()) as { access_token: string; expires_in: number };

    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    return this.token;
  }

  async refreshToken(_currentToken: string | null) {
    // Fetch new token
    const response = await fetch('https://auth.example.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
      }),
    });

    if (!response.ok) {
      return { token: null, success: false, errorCode: 'REFRESH_FAILED' as const };
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    return { token: this.token, success: true };
  }
}

async function customCredentialsExample() {
  const provider = new TokenRefreshProvider();

  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    clientId: 'example-client',
    credentialsProvider: provider,
  });

  await client.connect();
  console.log('✓ Connected with custom credentials provider');
  client.disconnect();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  await staticTokenExample();
  await staticCredentialsProviderExample();
  // await customCredentialsExample(); // Requires external auth server
  void customCredentialsExample; // Keep for reference
}

main().catch(console.error);
