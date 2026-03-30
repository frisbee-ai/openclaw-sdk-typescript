/**
 * Cron API Examples
 *
 * Examples showing how to manage scheduled jobs:
 * - List cron jobs
 * - Add, update, remove jobs
 * - Trigger manual runs
 * - View job run history
 */

import { ClientBuilder } from '../../../src/index.js';

async function main() {
  const client = new ClientBuilder('wss://gateway.openclaw.example.com', 'example-client')
    .withAuth('your-auth-token')
    .build();

  await client.connect();
  console.log('✓ Connected to OpenClaw Gateway');

  // ============================================================================
  // Example 1: List Cron Jobs
  // ============================================================================

  const { jobs } = await client.cron.list();
  console.log('Cron jobs:', jobs);

  // ============================================================================
  // Example 2: Get Job Status
  // ============================================================================

  if (jobs.length > 0) {
    const jobId = jobs[0].id;

    const job = await client.cron.status({
      jobId,
    });
    console.log('Job status:', job);

    // ============================================================================
    // Example 3: Get Job Run History
    // ============================================================================

    const { runs } = await client.cron.runs({
      jobId,
      limit: 10,
    });
    console.log('Recent runs:', runs);
  }

  // ============================================================================
  // Example 4: Add a New Cron Job
  // ============================================================================

  const newJob = await client.cron.add({
    cron: '0 * * * *', // Every hour
    prompt: 'Check system status and report',
  });
  console.log('Created cron job:', newJob);

  // ============================================================================
  // Example 5: Update Cron Job
  // ============================================================================

  const updatedJob = await client.cron.update({
    jobId: newJob.id,
    cron: '*/30 * * * *', // Every 30 minutes
  });
  console.log('Updated job:', updatedJob);

  // ============================================================================
  // Example 6: Manual Trigger (Run Now)
  // ============================================================================

  await client.cron.run({
    jobId: newJob.id,
  });
  console.log('Job triggered manually');

  // ============================================================================
  // Example 7: Remove Cron Job
  // ============================================================================

  await client.cron.remove({
    jobId: newJob.id,
  });
  console.log('Job removed');

  client.disconnect();
}

main().catch(console.error);
