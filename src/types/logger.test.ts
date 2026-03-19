/**
 * Logger Types Unit Tests
 *
 * Comprehensive tests covering:
 * - Unit: Logger interface, LogLevel enum
 * - Edge Cases: isLogger type guard with various inputs
 * - Security: Invalid inputs handled gracefully
 */

import { describe, it, expect } from 'vitest';
import { Logger, LogLevel, isLogger } from './logger';

describe('LogLevel', () => {
  it('should have correct string values', () => {
    expect(LogLevel.Debug).toBe('debug');
    expect(LogLevel.Info).toBe('info');
    expect(LogLevel.Warn).toBe('warn');
    expect(LogLevel.Error).toBe('error');
  });

  it('should have all required levels', () => {
    const levels = Object.values(LogLevel);
    expect(levels).toContain('debug');
    expect(levels).toContain('info');
    expect(levels).toContain('warn');
    expect(levels).toContain('error');
    expect(levels.length).toBe(4);
  });
});

describe('Logger interface', () => {
  it('should accept valid logger implementation', () => {
    const logger: Logger = {
      name: 'test-logger',
      level: LogLevel.Info,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(logger.name).toBe('test-logger');
    expect(logger.level).toBe(LogLevel.Info);
  });

  it('should allow different log levels', () => {
    const debugLogger: Logger = {
      name: 'debug',
      level: LogLevel.Debug,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    const errorLogger: Logger = {
      name: 'error',
      level: LogLevel.Error,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(debugLogger.level).toBe(LogLevel.Debug);
    expect(errorLogger.level).toBe(LogLevel.Error);
  });
});

describe('isLogger type guard', () => {
  it('should return true for valid logger', () => {
    const validLogger = {
      name: 'myLogger',
      level: LogLevel.Info,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(validLogger)).toBe(true);
  });

  it('should return true for logger with all methods as arrow functions', () => {
    const arrowLogger = {
      name: 'arrow',
      level: 'info' as const,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(arrowLogger)).toBe(true);
  });

  it('should return false for null', () => {
    expect(isLogger(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isLogger(undefined)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(isLogger('string')).toBe(false);
    expect(isLogger(123)).toBe(false);
    expect(isLogger(true)).toBe(false);
  });

  it('should return false for object missing name', () => {
    const obj = {
      level: LogLevel.Info,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(obj)).toBe(false);
  });

  it('should return false for object missing level', () => {
    const obj = {
      name: 'test',
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(obj)).toBe(false);
  });

  it('should return false for object with string instead of function', () => {
    const obj = {
      name: 'test',
      level: LogLevel.Info,
      debug: 'not a function',
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(obj)).toBe(false);
  });

  it('should return false for object missing debug method', () => {
    const obj = {
      name: 'test',
      level: LogLevel.Info,
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(obj)).toBe(false);
  });

  it('should return false for object missing info method', () => {
    const obj = {
      name: 'test',
      level: LogLevel.Info,
      debug: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(obj)).toBe(false);
  });

  it('should return false for object missing warn method', () => {
    const obj = {
      name: 'test',
      level: LogLevel.Info,
      debug: () => {},
      info: () => {},
      error: () => {},
    };

    expect(isLogger(obj)).toBe(false);
  });

  it('should return false for object missing error method', () => {
    const obj = {
      name: 'test',
      level: LogLevel.Info,
      debug: () => {},
      info: () => {},
      warn: () => {},
    };

    expect(isLogger(obj)).toBe(false);
  });

  it('should return true for logger with custom level string', () => {
    const obj = {
      name: 'custom',
      level: 'custom-level',
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    // Type guard checks for presence, not valid LogLevel
    expect(isLogger(obj)).toBe(true);
  });

  it('should return true for empty object with all required properties as functions', () => {
    const obj = {
      name: '',
      level: '' as any,
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(isLogger(obj)).toBe(true);
  });
});
