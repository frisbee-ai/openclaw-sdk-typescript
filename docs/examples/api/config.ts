/**
 * Config API Examples
 *
 * Examples showing how to manage gateway configuration:
 * - Get/set configuration values
 * - Apply and patch configurations
 * - Get configuration schema
 */

import { ClientBuilder } from '../../../src/index.js';

async function main() {
  const client = new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .build();

  await client.connect();
  console.log('✓ Connected to OpenClaw Gateway');

  // ============================================================================
  // Example 1: Get Full Configuration
  // ============================================================================

  const config = await client.config.get();
  console.log('Current configuration:', config);

  // ============================================================================
  // Example 2: Get Specific Key
  // ============================================================================

  const themeConfig = await client.config.get({
    key: 'theme',
  });
  console.log('Theme config:', themeConfig);

  // ============================================================================
  // Example 3: Set Configuration Value
  // ============================================================================

  await client.config.set({
    key: 'theme',
    value: 'dark',
  });
  console.log('Theme set to dark');

  await client.config.set({
    key: 'language',
    value: 'en-US',
  });
  console.log('Language set to en-US');

  // ============================================================================
  // Example 4: Apply Pending Changes
  // ============================================================================

  // Some changes require explicit apply
  await client.config.apply({
    restart: false, // Apply without restarting services
  });
  console.log('Configuration applied');

  // ============================================================================
  // Example 5: Patch with JSON Patch
  // ============================================================================

  // JSON Patch allows partial updates with operations like add, remove, replace
  await client.config.patch({
    patches: [
      { op: 'replace', path: '/theme', value: 'light' },
      { op: 'add', path: '/newKey', value: 'newValue' },
      { op: 'remove', path: '/temporaryKey' },
    ],
  });
  console.log('Patches applied');

  // ============================================================================
  // Example 6: Get Configuration Schema
  // ============================================================================

  const schema = await client.config.schema();
  console.log('Configuration schema:', schema);

  // Get schema for specific key
  const themeSchema = await client.config.schema({
    key: 'theme',
  });
  console.log('Theme schema:', themeSchema);

  client.disconnect();
}

main().catch(console.error);
