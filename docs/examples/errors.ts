/**
 * Error Handling Examples
 *
 * Examples showing how to handle errors using type guards:
 * - Authentication errors
 * - Connection errors
 * - Timeout errors
 * - Gateway errors
 */

import {
  createClient,
  isAuthError,
  isConnectionError,
  isTimeoutError,
  isAbortError,
  OpenClawError,
} from '../../src/index.js';

async function comprehensiveErrorHandling() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    clientId: 'example-client',
    auth: {
      token: 'invalid-token',
    },
  });

  try {
    await client.connect();
  } catch (error) {
    // Use type guards for specific error handling
    if (isAuthError(error)) {
      console.error('Authentication failed:', error.code, error.message);
    } else if (isConnectionError(error)) {
      console.error('Connection failed:', error.code, error.message);
    } else if (isTimeoutError(error)) {
      console.error('Request timed out:', error.message);
    } else if (isAbortError(error)) {
      console.error('Request was cancelled:', error.message);
    } else if (error instanceof OpenClawError) {
      console.error('OpenClaw error:', error.code, error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

async function requestTimeoutExample() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    clientId: 'example-client',
    auth: {
      token: 'your-auth-token',
    },
    connection: {
      requestTimeoutMs: 5000, // 5 second timeout
    },
  });

  await client.connect();

  try {
    // This request will timeout after 5 seconds
    await client.request('slow.operation', {});
  } catch (error) {
    if (isTimeoutError(error)) {
      console.error('Request timed out');
    }
  }

  client.disconnect();
}

async function requestCancellationExample() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    clientId: 'example-client',
    auth: {
      token: 'your-auth-token',
    },
  });

  await client.connect();

  // Create abort controller for cancellation
  const controller = new AbortController();

  // Cancel after 1 second
  setTimeout(() => controller.abort(), 1000);

  try {
    await client.request(
      'long.operation',
      {},
      {
        signal: controller.signal,
      }
    );
  } catch (error) {
    if (isAbortError(error)) {
      console.error('Request was cancelled:', error.message);
    }
  }

  client.disconnect();
}

async function main() {
  await comprehensiveErrorHandling();
  await requestTimeoutExample();
  await requestCancellationExample();
}

main().catch(console.error);
