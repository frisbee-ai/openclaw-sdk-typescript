/**
 * Tick Monitor Examples
 *
 * Examples showing how to use TickMonitor for heartbeat
 * monitoring and stale connection detection.
 */

import { createTickMonitor } from '../../../src/index.js';

// ============================================================================
// Example 1: Basic Tick Monitoring
// ============================================================================

async function basicMonitoring() {
  const tickMonitor = createTickMonitor({
    tickIntervalMs: 1000, // Tick every 1 second
    staleMultiplier: 2, // Stale after 2 seconds without tick
  });

  tickMonitor.start();
  console.log('Tick monitor started');

  // Simulate receiving ticks
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    tickMonitor.recordTick(Date.now());
    console.log('Tick recorded, isStale:', tickMonitor.isStale());
  }

  tickMonitor.stop();
}

// ============================================================================
// Example 2: Stale Detection Callbacks
// ============================================================================

async function staleDetection() {
  const tickMonitor = createTickMonitor({
    tickIntervalMs: 100,
    staleMultiplier: 2, // Stale after 200ms
    onStale: () => {
      console.log('Connection is now STALE - no heartbeat received');
    },
    onRecovered: () => {
      console.log('Connection RECOVERED - heartbeat resumed');
    },
  });

  tickMonitor.start();
  console.log('Tick monitor started with stale detection');

  // Record a tick
  tickMonitor.recordTick(Date.now());
  console.log('Initial status:', tickMonitor.getStatus());

  // Wait for it to become stale
  await new Promise(resolve => setTimeout(resolve, 300));
  tickMonitor.checkStale(); // Check and trigger stale event
  console.log('After wait:', tickMonitor.getStatus());

  // Record new tick to recover
  await new Promise(resolve => setTimeout(resolve, 50));
  tickMonitor.recordTick(Date.now());
  console.log('After recovery:', tickMonitor.getStatus());

  tickMonitor.stop();
}

// ============================================================================
// Example 3: Using Events
// ============================================================================

async function usingEvents() {
  const tickMonitor = createTickMonitor({
    tickIntervalMs: 100,
    staleMultiplier: 2,
  });

  // Listen to stale/recovered events
  tickMonitor.on('stale', () => {
    console.log('Event: Connection became stale');
  });

  tickMonitor.on('recovered', () => {
    console.log('Event: Connection recovered');
  });

  tickMonitor.start();

  // Record initial tick
  tickMonitor.recordTick(Date.now());

  // Wait for stale
  await new Promise(resolve => setTimeout(resolve, 250));
  tickMonitor.checkStale();

  // Recover
  await new Promise(resolve => setTimeout(resolve, 50));
  tickMonitor.recordTick(Date.now());

  await new Promise(resolve => setTimeout(resolve, 100));

  tickMonitor.stop();
}

// ============================================================================
// Example 4: Stale Duration Tracking
// ============================================================================

async function staleDurationTracking() {
  const tickMonitor = createTickMonitor({
    tickIntervalMs: 100,
    staleMultiplier: 2,
    onStale: () => {
      console.log(`Connection stale for ${tickMonitor.getStaleDuration()}ms`);
    },
  });

  tickMonitor.start();
  tickMonitor.recordTick(Date.now());

  // Wait for stale
  await new Promise(resolve => setTimeout(resolve, 200));
  tickMonitor.checkStale();

  // Track duration while stale
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log(`Stale duration: ${tickMonitor.getStaleDuration()}ms`);
  }

  tickMonitor.stop();
}

// ============================================================================
// Example 5: Testing with Time Provider
// ============================================================================

async function testingWithTimeProvider() {
  let mockTime = 1000;

  const tickMonitor = createTickMonitor({
    tickIntervalMs: 100,
    staleMultiplier: 2,
    getTime: () => mockTime, // Use mock time for deterministic testing
  });

  tickMonitor.start();

  // Record tick at time 1000
  tickMonitor.recordTick(1000);
  console.log('Tick at 1000, isStale:', tickMonitor.isStale());

  // Advance time to 1299 (still not stale, threshold is 200)
  mockTime = 1299;
  console.log('Time 1299, isStale:', tickMonitor.isStale());

  // Advance time to 1300 (exactly stale)
  mockTime = 1300;
  console.log('Time 1300, isStale:', tickMonitor.isStale());

  // Advance time to 1500 (stale for 200ms)
  mockTime = 1500;
  tickMonitor.checkStale();
  console.log('Time 1500, staleDuration:', tickMonitor.getStaleDuration());

  tickMonitor.stop();
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('=== Example 1: Basic Tick Monitoring ===');
  await basicMonitoring();

  console.log('\n=== Example 2: Stale Detection Callbacks ===');
  await staleDetection();

  console.log('\n=== Example 3: Using Events ===');
  await usingEvents();

  console.log('\n=== Example 4: Stale Duration Tracking ===');
  await staleDurationTracking();

  console.log('\n=== Example 5: Testing with Time Provider ===');
  await testingWithTimeProvider();
}

main().catch(console.error);
