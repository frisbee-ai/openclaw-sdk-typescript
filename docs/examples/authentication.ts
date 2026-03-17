/**
 * Authentication Examples
 *
 * Examples showing different authentication methods:
 * - Static credentials (device + API key)
 * - Custom credentials provider with token refresh
 */

import {
  createClient,
  type CredentialsProvider,
  StaticCredentialsProvider,
} from "../../src/index.js";

// ============================================================================
// Example 1: Static Credentials
// ============================================================================

async function staticCredentialsExample() {
  const client = createClient({
    url: "wss://gateway.openclaw.example.com",
    credentials: {
      deviceId: "your-device-id",
      apiKey: "your-api-key",
    },
  });

  await client.connect();
  console.log("✓ Connected with static credentials");
  client.disconnect();
}

// ============================================================================
// Example 2: Custom Credentials Provider
// ============================================================================

/**
 * Custom credentials provider with dynamic token refresh.
 */
class TokenRefreshProvider implements CredentialsProvider {
  private token?: string;
  private expiresAt?: number;

  async getCredentials() {
    // Check if we have a valid token
    if (this.token && this.expiresAt && Date.now() < this.expiresAt) {
      return {
        token: this.token,
        success: true,
      };
    }

    // Fetch new token
    const response = await fetch("https://auth.example.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: "your-client-id",
        clientSecret: "your-client-secret",
      }),
    });

    const data = await response.json();

    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;

    return {
      token: this.token,
      success: true,
    };
  }

  async shouldRefresh() {
    if (!this.expiresAt) {
      return true;
    }
    // Refresh if token expires in less than 5 minutes
    return Date.now() > this.expiresAt - 5 * 60 * 1000;
  }

  async refresh() {
    return this.getCredentials();
  }
}

async function customCredentialsExample() {
  const provider = new TokenRefreshProvider();

  const client = createClient({
    url: "wss://gateway.openclaw.example.com",
    credentials: provider,
  });

  await client.connect();
  console.log("✓ Connected with custom credentials provider");
  client.disconnect();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  await staticCredentialsExample();
  await customCredentialsExample();
}

main().catch(console.error);
