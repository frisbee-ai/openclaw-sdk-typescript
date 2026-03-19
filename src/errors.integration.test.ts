/**
 * Errors Module Integration Tests
 *
 * Integration tests covering:
 * - Error creation and classification
 * - Error factory functions
 * - Type guard functions
 */

import { describe, it, expect } from 'vitest';
import {
  OpenClawError,
  AuthError,
  ConnectionError,
  ProtocolError,
  TimeoutError,
  CancelledError,
  AbortError,
  createErrorFromResponse,
  isOpenClawError,
  isAuthError,
  isConnectionError,
  isTimeoutError,
  isCancelledError,
  isAbortError,
} from './errors.js';

describe('Errors Integration', () => {
  describe('Error hierarchy', () => {
    it('should create OpenClawError with code', () => {
      const error = new OpenClawError('Test error message', 'UNKNOWN');

      expect(error.name).toBe('OpenClawError');
      expect(error.code).toBe('UNKNOWN');
      expect(error.message).toBe('Test error message');
    });

    it('should create AuthError with valid auth code', () => {
      const error = new AuthError({
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Token has expired',
        retryable: true,
      });

      expect(error.name).toBe('AuthError');
      expect(error.code).toBe('AUTH_TOKEN_EXPIRED');
      expect(error.retryable).toBe(true);
    });

    it('should create ConnectionError with valid connection code', () => {
      const error = new ConnectionError({
        code: 'CONNECTION_STALE',
        message: 'Connection is stale',
        retryable: true,
      });

      expect(error.name).toBe('ConnectionError');
      expect(error.code).toBe('CONNECTION_STALE');
    });

    it('should create ProtocolError with valid protocol code', () => {
      const error = new ProtocolError({
        code: 'PROTOCOL_UNSUPPORTED',
        message: 'Protocol not supported',
      });

      expect(error.name).toBe('ProtocolError');
      expect(error.code).toBe('PROTOCOL_UNSUPPORTED');
    });

    it('should create TimeoutError', () => {
      const error = new TimeoutError('Request timed out');

      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Request timed out');
    });

    it('should create CancelledError', () => {
      const error = new CancelledError('Request was cancelled');

      expect(error.name).toBe('CancelledError');
      expect(error.message).toBe('Request was cancelled');
    });

    it('should create AbortError', () => {
      const error = new AbortError('Request was aborted');

      expect(error.name).toBe('AbortError');
      expect(error.message).toBe('Request was aborted');
    });
  });

  describe('Error factory', () => {
    it('should create error from response object with code', () => {
      const error = createErrorFromResponse({
        code: 'INVALID_REQUEST',
        message: 'Invalid request parameters',
      });

      expect(error).toBeDefined();
      expect(error.code).toBe('INVALID_REQUEST');
    });

    it('should create error from string message', () => {
      const error = createErrorFromResponse({
        code: 'UNKNOWN_ERROR',
        message: 'Something went wrong',
      });

      expect(error).toBeDefined();
      expect(error.message).toBe('Something went wrong');
    });
  });

  describe('Type guards', () => {
    it('should identify OpenClawError', () => {
      const error = new OpenClawError('test', 'UNKNOWN');
      expect(isOpenClawError(error)).toBe(true);
      expect(isAuthError(error)).toBe(false);
    });

    it('should identify AuthError', () => {
      const error = new AuthError({ code: 'AUTH_TOKEN_EXPIRED', message: 'auth failed' });
      expect(isOpenClawError(error)).toBe(true);
      expect(isAuthError(error)).toBe(true);
      expect(isConnectionError(error)).toBe(false);
    });

    it('should identify ConnectionError', () => {
      const error = new ConnectionError({ code: 'CONNECTION_STALE', message: 'conn failed' });
      expect(isOpenClawError(error)).toBe(true);
      expect(isConnectionError(error)).toBe(true);
    });

    it('should identify TimeoutError', () => {
      const error = new TimeoutError('timeout');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should identify CancelledError', () => {
      const error = new CancelledError('cancelled');
      expect(isCancelledError(error)).toBe(true);
    });

    it('should identify AbortError', () => {
      const error = new AbortError('aborted');
      expect(isAbortError(error)).toBe(true);
    });

    it('should return false for non-error values', () => {
      expect(isOpenClawError(null)).toBe(false);
      expect(isOpenClawError(undefined)).toBe(false);
      expect(isOpenClawError('string')).toBe(false);
      expect(isOpenClawError({})).toBe(false);
    });
  });

  describe('Error details', () => {
    it('should include details in error', () => {
      const error = new AuthError({
        code: 'CHALLENGE_FAILED',
        message: 'Authentication failed',
        details: { field: 'token', reason: 'expired' },
      });

      expect(error.details).toEqual({ field: 'token', reason: 'expired' });
    });

    it('should have retryable flag', () => {
      const error = new ConnectionError({
        code: 'CONNECTION_STALE',
        message: 'Stale connection',
        retryable: true,
      });

      expect(error.retryable).toBe(true);
    });
  });
});
