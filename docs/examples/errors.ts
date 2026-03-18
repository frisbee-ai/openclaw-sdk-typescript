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
  type AuthError,
  type ConnectionError,
} from '../../src/index.js';

async function comprehensiveErrorHandling() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    credentials: {
      deviceId: 'invalid-id',
      apiKey: 'invalid-key',
    },
  });

  try {
    await client.connect();
  } catch (error) {
    // Use type guards for specific error handling
    if (isAuthError(error)) {
      const authErr = error as AuthError;
      console.error('Authentication failed:');
      console.error('  Code:', authErr.errorCode);
      console.error('  Message:', authErr.message);
      console.error('  Retry after:', authErr.retryAfterMs, 'ms');
    } else if (isConnectionError(error)) {
      const connErr = error as ConnectionError;
      console.error('Connection failed:');
      console.error('  Code:', connErr.errorCode);
      console.error('  Message:', connErr.message);
      console.error('  Recoverable:', connErr.recoverable);
    } else if (isTimeoutError(error)) {
      console.error('Request timed out:', error.message);
    } else if (isAbortError(error)) {
      console.error('Request was cancelled:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

async function requestTimeoutExample() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    credentials: {
      deviceId: 'your-device-id',
      apiKey: 'your-api-key',
    },
    defaultRequestTimeout: 5000, // 5 second timeout
  });

  await client.connect();

  try {
    // This request will timeout after 5 seconds
    await client.request('slow.operation', {});
  } catch (error) {
    if (isTimeoutError(error)) {
      console.error('Request timed out after', error.timeoutMs, 'ms');
    }
  }

  client.disconnect();
}

async function requestCancellationExample() {
  const client = createClient({
    url: 'wss://gateway.openclaw.example.com',
    credentials: {
      deviceId: 'your-device-id',
      apiKey: 'your-api-key',
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
