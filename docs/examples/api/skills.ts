/**
 * Skills API Examples
 *
 * Examples showing how to manage skills and tools:
 * - Check skills status
 * - Get tools catalog
 * - Install and update skills
 * - Manage skill bins
 */

import { ClientBuilder } from '../../../src/index.js';

async function main() {
  const client = new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .build();

  await client.connect();
  console.log('✓ Connected to OpenClaw Gateway');

  // ============================================================================
  // Example 1: Get Skills Status
  // ============================================================================

  const status = await client.skills.status();
  console.log('Skills status:', status);

  // ============================================================================
  // Example 2: Get Tools Catalog
  // ============================================================================

  const catalogResult = await client.skills.tools.catalog({
    category: 'all',
    limit: 50,
  });
  console.log('Tools catalog:', catalogResult);

  // Filter tools by category
  const dataTools = await client.skills.tools.catalog({
    category: 'data-processing',
  });
  console.log('Data processing tools:', dataTools);

  // ============================================================================
  // Example 3: Get Skills Bins
  // ============================================================================

  const bins = await client.skills.bins();
  console.log('Skills bins:', bins);

  // ============================================================================
  // Example 4: Install a Skill
  // ============================================================================

  // await client.skills.install({
  //   name: 'my-custom-skill',
  //   version: '1.0.0',
  //   source: 'https://registry.example.com/skills/my-custom-skill.tgz',
  // });
  // console.log('Skill installed');

  // ============================================================================
  // Example 5: Update a Skill
  // ============================================================================

  // await client.skills.update({
  //   name: 'my-custom-skill',
  //   version: '1.1.0',
  // });
  // console.log('Skill updated');

  client.disconnect();
}

main().catch(console.error);
