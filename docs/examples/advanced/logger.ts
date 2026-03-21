/**
 * Logger Examples
 *
 * Examples showing how to use the Logger integration
 * with EventManager, ConnectionStateMachine, and ReconnectManager.
 */

import {
  createEventManager,
  createConnectionStateMachine,
  createReconnectManager,
  ConsoleLogger,
  isLogger,
} from '../../../src/index.js';
import { LogLevel as LL } from '../../../src/types/logger.js';

// ============================================================================
// Example 1: Using ConsoleLogger
// ============================================================================

async function usingConsoleLogger() {
  const logger = new ConsoleLogger({
    name: 'my-app',
    level: LL.Debug,
  });

  const eventManager = createEventManager(logger);
  const stateMachine = createConnectionStateMachine(logger);

  eventManager.on('test', () => console.log('Test event received'));

  stateMachine.onChange(event => {
    console.log(`State: ${event.previous} -> ${event.current}`);
  });

  // Emit some events
  eventManager.emit('test', { data: 'hello' });
  stateMachine.connect();

  stateMachine.reset();
}

// ============================================================================
// Example 2: Custom Logger
// ============================================================================

async function customLogger() {
  const customLogger = {
    name: 'custom-logger',
    level: LL.Info,
    debug(message: string, meta?: Record<string, unknown>) {
      console.debug(`[DEBUG] ${message}`, meta || '');
    },
    info(message: string, meta?: Record<string, unknown>) {
      console.info(`[INFO] ${message}`, meta || '');
    },
    warn(message: string, meta?: Record<string, unknown>) {
      console.warn(`[WARN] ${message}`, meta || '');
    },
    error(message: string, meta?: Record<string, unknown>) {
      console.error(`[ERROR] ${message}`, meta || '');
    },
  };

  const eventManager = createEventManager(customLogger);

  eventManager.on('userAction', () => {
    console.log('User action received');
  });

  eventManager.emit('userAction', { type: 'click', target: 'button' });
}

// ============================================================================
// Example 3: Selective Log Levels
// ============================================================================

async function selectiveLogLevels() {
  // Only log errors
  const errorOnlyLogger = new ConsoleLogger({
    name: 'error-only',
    level: LL.Error,
  });

  const eventManager = createEventManager(errorOnlyLogger);

  eventManager.on('test', () => {});

  // These will NOT be logged because level is Error
  errorOnlyLogger.debug('This debug will not log');
  errorOnlyLogger.info('This info will not log');

  // But errors will be logged
  errorOnlyLogger.error('This error will be logged');
}

// ============================================================================
// Example 4: Type Guard isLogger
// ============================================================================

async function loggerTypeGuard() {
  const validLogger = new ConsoleLogger({
    name: 'valid',
    level: LL.Info,
  });

  const invalidLogger = {
    name: 'invalid',
    level: 'not-a-level', // Invalid type
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };

  // isLogger validates the logger structure
  console.log('Valid logger:', isLogger(validLogger)); // true
  console.log('Invalid logger:', isLogger(invalidLogger)); // false

  // Usage with EventManager
  const eventMgr = createEventManager(validLogger);
  console.log('EventManager created with valid logger');
  void eventMgr; // Used above
}

// ============================================================================
// Example 5: Logger with ReconnectManager
// ============================================================================

async function loggerWithReconnectManager() {
  const logger = new ConsoleLogger({
    name: 'reconnect',
    level: LL.Info,
  });

  const reconnectMgr = createReconnectManager(
    {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      pauseOnAuthError: false,
      jitterFactor: 0,
    },
    logger
  );

  reconnectMgr.onEvent(event => {
    console.log(`Reconnect event: ${event.state}`);
  });

  console.log('ReconnectManager created with logger');
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('=== Example 1: Using ConsoleLogger ===');
  await usingConsoleLogger();

  console.log('\n=== Example 2: Custom Logger ===');
  await customLogger();

  console.log('\n=== Example 3: Selective Log Levels ===');
  await selectiveLogLevels();

  console.log('\n=== Example 4: Logger Type Guard ===');
  await loggerTypeGuard();

  console.log('\n=== Example 5: Logger with ReconnectManager ===');
  await loggerWithReconnectManager();
}

main().catch(console.error);
