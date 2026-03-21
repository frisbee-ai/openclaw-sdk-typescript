/**
 * Gap Detector Examples
 *
 * Examples showing how to use GapDetector for message
 * sequence gap detection and recovery.
 */

import { createGapDetector, type GapInfo } from '../../../src/index.js';

// ============================================================================
// Example 1: Basic Gap Detection
// ============================================================================

async function basicGapDetection() {
  const gapDetector = createGapDetector({
    recovery: {
      mode: 'skip', // Just detect gaps, don't recover
    },
    maxGaps: 100,
  });

  // Simulate sequential event sequences
  gapDetector.recordSequence(1);
  console.log('Recorded 1, hasGap:', gapDetector.hasGap());

  gapDetector.recordSequence(2);
  console.log('Recorded 2, hasGap:', gapDetector.hasGap());

  // Gap detected! Missed sequence 3
  gapDetector.recordSequence(4);
  console.log('Recorded 4, hasGap:', gapDetector.hasGap());
  console.log('Gaps:', gapDetector.getGaps());

  // Continue with correct sequence
  gapDetector.recordSequence(5);
  console.log('Recorded 5, gaps cleared:', gapDetector.getGaps());
}

// ============================================================================
// Example 2: Gap Event Listening
// ============================================================================

async function gapEventListening() {
  const gapDetector = createGapDetector({
    recovery: {
      mode: 'skip',
    },
  });

  // Listen to gap events
  gapDetector.on('gap', (gaps: GapInfo[]) => {
    console.log('Gap detected! Current gaps:');
    for (const gap of gaps) {
      console.log(`  Expected: ${gap.expected}, Received: ${gap.received}`);
    }
  });

  // Normal sequence
  gapDetector.recordSequence(1);
  gapDetector.recordSequence(2);

  // Gap - missing 3
  gapDetector.recordSequence(4);

  // Another gap - missing 5
  gapDetector.recordSequence(6);
}

// ============================================================================
// Example 3: Reconnect Recovery Mode
// ============================================================================

async function reconnectRecovery() {
  const gapDetector = createGapDetector({
    recovery: {
      mode: 'reconnect',
      onGap: (_gaps: GapInfo[]) => {
        console.log('Gap detected, triggering reconnect...');
        console.log(`Lost ${_gaps.length} message(s)`);
        // In real implementation, this would trigger a reconnection
      },
    },
  });

  gapDetector.recordSequence(1);
  gapDetector.recordSequence(2);

  // Gap detected, onGap callback triggered
  gapDetector.recordSequence(5);

  console.log('Reconnect recovery mode active');
}

// ============================================================================
// Example 4: Snapshot Recovery Mode
// ============================================================================

async function snapshotRecovery() {
  const gapDetector = createGapDetector({
    recovery: {
      mode: 'snapshot',
      snapshotEndpoint: '/api/state/snapshot',
      onGap: (_gaps: GapInfo[]) => {
        console.log('Gap detected, fetching state snapshot...');
        console.log('Would fetch from:', gapDetector['recovery'].snapshotEndpoint);
        // In real implementation, this would fetch a state snapshot
        // to recover the missed messages
      },
    },
  });

  gapDetector.recordSequence(1);
  gapDetector.recordSequence(2);
  gapDetector.recordSequence(10); // Large gap
}

// ============================================================================
// Example 5: Skip Recovery Mode
// ============================================================================

async function skipRecovery() {
  const gapDetector = createGapDetector({
    recovery: {
      mode: 'skip',
      onGap: (_gaps: GapInfo[]) => {
        console.log('Messages skipped:');
        for (const gap of _gaps) {
          const missed = gap.received - gap.expected;
          console.log(`  Missed ${missed} message(s) (${gap.expected} -> ${gap.received})`);
        }
      },
    },
  });

  // Simulate a stream with occasional gaps
  for (let i = 1; i <= 20; i++) {
    // Randomly skip some sequences to simulate packet loss
    if (i === 7 || i === 13 || i === 18) {
      continue; // Skip this one to create a gap
    }
    gapDetector.recordSequence(i);
  }

  console.log('Final gaps:', gapDetector.getGaps());
}

// ============================================================================
// Example 6: Reset and Replay
// ============================================================================

async function resetAndReplay() {
  const gapDetector = createGapDetector({
    recovery: {
      mode: 'skip',
    },
  });

  gapDetector.recordSequence(1);
  gapDetector.recordSequence(2);
  gapDetector.recordSequence(5); // Gap

  console.log('Before reset - last sequence:', gapDetector.getLastSequence());
  console.log('Before reset - gaps:', gapDetector.getGaps());

  // Reset for replay
  gapDetector.reset();

  console.log('After reset - last sequence:', gapDetector.getLastSequence());
  console.log('After reset - gaps:', gapDetector.getGaps());

  // Replay from the beginning
  gapDetector.recordSequence(1);
  gapDetector.recordSequence(2);
  gapDetector.recordSequence(3);
  gapDetector.recordSequence(4);
  console.log('After replay - gaps:', gapDetector.getGaps());
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('=== Example 1: Basic Gap Detection ===');
  await basicGapDetection();

  console.log('\n=== Example 2: Gap Event Listening ===');
  await gapEventListening();

  console.log('\n=== Example 3: Reconnect Recovery Mode ===');
  await reconnectRecovery();

  console.log('\n=== Example 4: Snapshot Recovery Mode ===');
  await snapshotRecovery();

  console.log('\n=== Example 5: Skip Recovery Mode ===');
  await skipRecovery();

  console.log('\n=== Example 6: Reset and Replay ===');
  await resetAndReplay();
}

main().catch(console.error);
