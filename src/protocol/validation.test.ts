/**
 * Tests for protocol validation functions
 */

import { describe, it, expect } from 'vitest';
import type { RequestFrame, ResponseFrame, EventFrame } from './types.js';
import {
  ValidationError,
  validateRequestId,
  validateFrame,
  validateRequestFrame,
  validateResponseFrame,
  validateEventFrame,
  validateErrorShape,
  validateConnectParams,
  isRequestFrame,
  isResponseFrame,
  isEventFrame,
  isSuccessfulResponse,
  isErrorResponse,
} from './validation.js';

describe('validateRequestId', () => {
  it('accepts valid string IDs', () => {
    expect(validateRequestId('abc-123')).toBe(true);
    expect(validateRequestId('1')).toBe(true);
    expect(validateRequestId('request-id')).toBe(true);
  });

  it('accepts numeric IDs when allowed', () => {
    expect(validateRequestId(123)).toBe(true);
    expect(validateRequestId(0)).toBe(true);
    expect(validateRequestId(1.5)).toBe(true);
  });

  it('rejects invalid IDs', () => {
    expect(validateRequestId('')).toBe(false);
    expect(validateRequestId(null)).toBe(false);
    expect(validateRequestId(undefined)).toBe(false);
    expect(validateRequestId({})).toBe(false);
    expect(validateRequestId([])).toBe(false);
  });

  it('respects minLength option', () => {
    expect(validateRequestId('ab', { minLength: 2 })).toBe(true);
    expect(validateRequestId('a', { minLength: 2 })).toBe(false);
  });

  it('respects maxLength option', () => {
    expect(validateRequestId('abc', { maxLength: 3 })).toBe(true);
    expect(validateRequestId('abcd', { maxLength: 3 })).toBe(false);
  });

  it('rejects numeric IDs when not allowed', () => {
    expect(validateRequestId(123, { allowNumeric: false })).toBe(false);
  });
});

describe('validateFrame', () => {
  it('validates request frames', () => {
    const input = { type: 'req', id: '1', method: 'ping' };
    const frame = validateFrame(input);
    expect(frame.type).toBe('req');
    expect(frame.id).toBe('1');
    expect(frame.method).toBe('ping');
  });

  it('validates response frames', () => {
    const input = { type: 'res', id: '1', ok: true };
    const frame = validateFrame(input);
    expect(frame.type).toBe('res');
    expect(frame.id).toBe('1');
    expect(frame.ok).toBe(true);
  });

  it('validates event frames', () => {
    const input = { type: 'event', event: 'tick' };
    const frame = validateFrame(input);
    expect(frame.type).toBe('event');
    expect(frame.event).toBe('tick');
  });

  it('throws on invalid frame type', () => {
    expect(() => validateFrame({ type: 'invalid' as any })).toThrow(ValidationError);
    expect(() => validateFrame({ type: 'invalid' as any })).toThrow('Invalid frame type');
  });

  it('throws on missing type field', () => {
    expect(() => validateFrame({})).toThrow(ValidationError);
    expect(() => validateFrame({})).toThrow('missing or invalid type field');
  });

  it('throws on non-object input', () => {
    expect(() => validateFrame(null)).toThrow(ValidationError);
    expect(() => validateFrame(undefined)).toThrow(ValidationError);
    expect(() => validateFrame('string')).toThrow(ValidationError);
  });
});

describe('validateRequestFrame', () => {
  it('accepts valid request frames', () => {
    const frame = validateRequestFrame({
      type: 'req',
      id: '1',
      method: 'ping',
      params: {},
    });
    expect(frame.type).toBe('req');
    expect(frame.id).toBe('1');
    expect(frame.method).toBe('ping');
  });

  it('throws on missing id', () => {
    expect(() =>
      validateRequestFrame({ type: 'req', method: 'ping' }),
    ).toThrow(ValidationError);
  });

  it('throws on invalid id', () => {
    expect(() =>
      validateRequestFrame({ type: 'req', id: '', method: 'ping' }),
    ).toThrow(ValidationError);
  });

  it('throws on missing method', () => {
    expect(() =>
      validateRequestFrame({ type: 'req', id: '1' }),
    ).toThrow(ValidationError);
  });

  it('throws on empty method', () => {
    expect(() =>
      validateRequestFrame({ type: 'req', id: '1', method: '' }),
    ).toThrow(ValidationError);
  });
});

describe('validateResponseFrame', () => {
  it('accepts successful response frames', () => {
    const frame = validateResponseFrame({
      type: 'res',
      id: '1',
      ok: true,
      payload: { result: 'success' },
    });
    expect(frame.type).toBe('res');
    expect(frame.ok).toBe(true);
    expect(frame.payload).toEqual({ result: 'success' });
  });

  it('accepts error response frames with error', () => {
    const frame = validateResponseFrame({
      type: 'res',
      id: '1',
      ok: false,
      error: { code: 'ERROR', message: 'Something went wrong' },
    });
    expect(frame.type).toBe('res');
    expect(frame.ok).toBe(false);
    expect(frame.error?.code).toBe('ERROR');
  });

  it('throws on missing id', () => {
    expect(() =>
      validateResponseFrame({ type: 'res', ok: true }),
    ).toThrow(ValidationError);
  });

  it('throws on missing ok field', () => {
    expect(() =>
      validateResponseFrame({ type: 'res', id: '1' }),
    ).toThrow(ValidationError);
  });

  it('throws when ok is false but error is missing', () => {
    expect(() =>
      validateResponseFrame({ type: 'res', id: '1', ok: false }),
    ).toThrow(ValidationError);
  });

  it('throws on invalid error shape', () => {
    expect(() =>
      validateResponseFrame({
        type: 'res',
        id: '1',
        ok: false,
        error: { code: 'ERROR' }, // missing message
      }),
    ).toThrow(ValidationError);
  });
});

describe('validateEventFrame', () => {
  it('accepts valid event frames', () => {
    const frame = validateEventFrame({
      type: 'event',
      event: 'tick',
      payload: { ts: Date.now() },
    });
    expect(frame.type).toBe('event');
    expect(frame.event).toBe('tick');
  });

  it('accepts event frames with seq', () => {
    const frame = validateEventFrame({
      type: 'event',
      event: 'msg',
      seq: 123,
    });
    expect(frame.seq).toBe(123);
  });

  it('accepts event frames with stateVersion', () => {
    const frame = validateEventFrame({
      type: 'event',
      event: 'presence',
      stateVersion: { presence: 1, health: 2 },
    });
    expect(frame.stateVersion).toEqual({ presence: 1, health: 2 });
  });

  it('throws on missing event name', () => {
    expect(() =>
      validateEventFrame({ type: 'event' }),
    ).toThrow(ValidationError);
  });

  it('throws on empty event name', () => {
    expect(() =>
      validateEventFrame({ type: 'event', event: '' }),
    ).toThrow(ValidationError);
  });

  it('throws on invalid seq', () => {
    expect(() =>
      validateEventFrame({ type: 'event', event: 'test', seq: -1 }),
    ).toThrow(ValidationError);
  });

  it('throws on invalid stateVersion', () => {
    expect(() =>
      validateEventFrame({ type: 'event', event: 'test', stateVersion: null as any }),
    ).toThrow(ValidationError);
  });
});

describe('validateErrorShape', () => {
  it('accepts valid error shapes', () => {
    const error = { code: 'ERROR', message: 'Test error' };
    expect(() => validateErrorShape(error)).not.toThrow();
  });

  it('accepts error shapes with optional fields', () => {
    const error = {
      code: 'ERROR',
      message: 'Test error',
      details: { context: 'test' },
      retryable: true,
      retryAfterMs: 5000,
    };
    expect(() => validateErrorShape(error)).not.toThrow();
  });

  it('throws on missing code', () => {
    const error = { message: 'Test' };
    expect(() => validateErrorShape(error)).toThrow(ValidationError);
  });

  it('throws on missing message', () => {
    const error = { code: 'ERROR' };
    expect(() => validateErrorShape(error)).toThrow(ValidationError);
  });

  it('throws on invalid retryable', () => {
    const error = { code: 'ERROR', message: 'Test', retryable: 'yes' as any };
    expect(() => validateErrorShape(error)).toThrow(ValidationError);
  });

  it('throws on invalid retryAfterMs', () => {
    const error = { code: 'ERROR', message: 'Test', retryAfterMs: -1 };
    expect(() => validateErrorShape(error)).toThrow(ValidationError);
  });
});

describe('validateConnectParams', () => {
  it('accepts valid connect params', () => {
    const params = {
      minProtocol: 1,
      maxProtocol: 2,
      client: {
        id: 'test-client',
        version: '1.0.0',
        platform: 'test',
        mode: 'node',
      },
    };
    const result = validateConnectParams(params);
    expect(result).toEqual(params);
  });

  it('throws on invalid protocol range', () => {
    const params = {
      minProtocol: 5,
      maxProtocol: 1,
      client: { id: 'test', version: '1.0', platform: 'test', mode: 'node' },
    };
    expect(() => validateConnectParams(params)).toThrow(ValidationError);
  });

  it('throws on missing client', () => {
    const params = { minProtocol: 1, maxProtocol: 2 };
    expect(() => validateConnectParams(params as any)).toThrow(ValidationError);
  });

  it('throws on missing required client fields', () => {
    const params = {
      minProtocol: 1,
      maxProtocol: 2,
      client: { id: 'test' } as any,
    };
    expect(() => validateConnectParams(params)).toThrow(ValidationError);
  });
});

describe('Type guards', () => {
  const validRequest: RequestFrame = { type: 'req', id: '1', method: 'ping' };
  const validSuccessResponse: ResponseFrame = { type: 'res', id: '1', ok: true };
  const validErrorResponse: ResponseFrame = {
    type: 'res',
    id: '1',
    ok: false,
    error: { code: 'ERR', message: 'error' },
  };
  const validEvent: EventFrame = { type: 'event', event: 'tick' };

  describe('isRequestFrame', () => {
    it('returns true for valid request frames', () => {
      expect(isRequestFrame(validRequest)).toBe(true);
    });

    it('returns false for non-request frames', () => {
      expect(isRequestFrame(validSuccessResponse)).toBe(false);
      expect(isRequestFrame(validEvent)).toBe(false);
      expect(isRequestFrame({})).toBe(false);
    });
  });

  describe('isResponseFrame', () => {
    it('returns true for valid response frames', () => {
      expect(isResponseFrame(validSuccessResponse)).toBe(true);
      expect(isResponseFrame(validErrorResponse)).toBe(true);
    });

    it('returns false for non-response frames', () => {
      expect(isResponseFrame(validRequest)).toBe(false);
      expect(isResponseFrame(validEvent)).toBe(false);
      expect(isResponseFrame({})).toBe(false);
    });
  });

  describe('isEventFrame', () => {
    it('returns true for valid event frames', () => {
      expect(isEventFrame(validEvent)).toBe(true);
    });

    it('returns false for non-event frames', () => {
      expect(isEventFrame(validRequest)).toBe(false);
      expect(isEventFrame(validSuccessResponse)).toBe(false);
      expect(isEventFrame({})).toBe(false);
    });
  });

  describe('isSuccessfulResponse', () => {
    it('returns true for successful responses', () => {
      expect(isSuccessfulResponse(validSuccessResponse)).toBe(true);
    });

    it('returns false for error responses', () => {
      expect(isSuccessfulResponse(validErrorResponse)).toBe(false);
    });

    it('returns false for non-response frames', () => {
      expect(isSuccessfulResponse(validRequest)).toBe(false);
      expect(isSuccessfulResponse(validEvent)).toBe(false);
    });
  });

  describe('isErrorResponse', () => {
    it('returns true for error responses', () => {
      expect(isErrorResponse(validErrorResponse)).toBe(true);
    });

    it('returns false for successful responses', () => {
      expect(isErrorResponse(validSuccessResponse)).toBe(false);
    });

    it('returns false for non-response frames', () => {
      expect(isErrorResponse(validRequest)).toBe(false);
      expect(isErrorResponse(validEvent)).toBe(false);
    });
  });
});
