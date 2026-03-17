/**
 * OpenClaw Protocol Validation
 *
 * This module provides validation functions for protocol frames and payloads.
 * It re-exports validators from the openclaw package and adds SDK-specific
 * validation utilities.
 *
 * @see https://github.com/openclaw/openclaw
 */

import type {
  GatewayFrame,
  RequestFrame,
  ResponseFrame,
  EventFrame,
  ConnectParams,
  ErrorShape,
} from './types.js';

/**
 * Validation error thrown when frame validation fails.
 */
export class ValidationError extends Error {
  /** The error code from the protocol */
  readonly code: string;

  /** Additional error details */
  readonly details?: unknown;

  constructor(message: string, code: string = 'VALIDATION_ERROR', details?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Request ID validation options.
 */
export interface RequestIdValidationOptions {
  /** Allow numeric request IDs (default: true) */
  allowNumeric?: boolean;
  /** Minimum length for string IDs (default: 1) */
  minLength?: number;
  /** Maximum length for string IDs (default: 255) */
  maxLength?: number;
}

/**
 * Default request ID validation options.
 */
const DEFAULT_REQUEST_ID_OPTIONS: RequestIdValidationOptions = {
  allowNumeric: true,
  minLength: 1,
  maxLength: 255,
};

/**
 * Validates a request ID format.
 *
 * Request IDs should be non-empty strings or numbers (if allowed).
 *
 * @param id - The request ID to validate
 * @param options - Validation options
 * @returns True if the request ID is valid
 *
 * @example
 * ```ts
 * validateRequestId('abc-123'); // true
 * validateRequestId(123); // true
 * validateRequestId(''); // false
 * validateRequestId(null); // false
 * ```
 */
export function validateRequestId(
  id: unknown,
  options: RequestIdValidationOptions = {},
): id is string | number {
  const opts = { ...DEFAULT_REQUEST_ID_OPTIONS, ...options };

  if (typeof id === 'string') {
    return id.length >= opts.minLength! && id.length <= opts.maxLength!;
  }

  if (opts.allowNumeric && typeof id === 'number') {
    return Number.isFinite(id) && id >= 0;
  }

  return false;
}

/**
 * Validates and parses a WebSocket frame.
 *
 * This function checks that the input is a valid GatewayFrame and returns
 * the parsed frame. Throws ValidationError if the input is invalid.
 *
 * @param data - Unknown data to validate as a frame
 * @returns The validated frame
 * @throws ValidationError if the frame is invalid
 *
 * @example
 * ```ts
 * const frame = validateFrame({ type: 'req', id: '1', method: 'ping', params: {} });
 * // frame is typed as RequestFrame
 * ```
 */
export function validateFrame(data: unknown): GatewayFrame {
  if (!data || typeof data !== 'object') {
    throw new ValidationError(
      'Invalid frame: must be an object',
      'INVALID_FRAME_TYPE',
    );
  }

  const frame = data as Partial<GatewayFrame>;

  // Check type discriminator
  if (!frame.type || typeof frame.type !== 'string') {
    throw new ValidationError(
      'Invalid frame: missing or invalid type field',
      'MISSING_FRAME_TYPE',
    );
  }

  const validTypes = ['req', 'res', 'event'] as const;
  if (!validTypes.includes(frame.type as 'req' | 'res' | 'event')) {
    throw new ValidationError(
      `Invalid frame type: ${frame.type}. Must be one of: ${validTypes.join(', ')}`,
      'INVALID_FRAME_TYPE',
    );
  }

  // Type-specific validation
  switch (frame.type) {
    case 'req':
      return validateRequestFrame(frame);
    case 'res':
      return validateResponseFrame(frame);
    case 'event':
      return validateEventFrame(frame);
  }

  throw new ValidationError(
    'Unknown frame type',
    'UNKNOWN_FRAME_TYPE',
  );
}

/**
 * Validates a request frame.
 *
 * @param frame - Partial frame to validate
 * @returns The validated request frame
 * @throws ValidationError if validation fails
 */
export function validateRequestFrame(frame: Partial<RequestFrame>): RequestFrame {
  if (!frame.id) {
    throw new ValidationError(
      'Invalid request frame: missing id field',
      'MISSING_REQUEST_ID',
    );
  }

  if (!validateRequestId(frame.id)) {
    throw new ValidationError(
      `Invalid request frame: invalid id format`,
      'INVALID_REQUEST_ID',
    );
  }

  if (!frame.method || typeof frame.method !== 'string') {
    throw new ValidationError(
      'Invalid request frame: missing or invalid method field',
      'MISSING_METHOD',
    );
  }

  if (frame.method.length === 0) {
    throw new ValidationError(
      'Invalid request frame: method cannot be empty',
      'INVALID_METHOD',
    );
  }

  return {
    type: 'req',
    id: frame.id,
    method: frame.method,
    params: frame.params,
  };
}

/**
 * Validates a response frame.
 *
 * @param frame - Partial frame to validate
 * @returns The validated response frame
 * @throws ValidationError if validation fails
 */
export function validateResponseFrame(frame: Partial<ResponseFrame>): ResponseFrame {
  if (!frame.id) {
    throw new ValidationError(
      'Invalid response frame: missing id field',
      'MISSING_RESPONSE_ID',
    );
  }

  if (!validateRequestId(frame.id)) {
    throw new ValidationError(
      'Invalid response frame: invalid id format',
      'INVALID_RESPONSE_ID',
    );
  }

  if (typeof frame.ok !== 'boolean') {
    throw new ValidationError(
      'Invalid response frame: missing or invalid ok field',
      'MISSING_OK_FIELD',
    );
  }

  // If response is not OK, error field should be present
  if (!frame.ok && !frame.error) {
    throw new ValidationError(
      'Invalid response frame: error field required when ok is false',
      'MISSING_ERROR_FIELD',
    );
  }

  // Validate error shape if present
  if (frame.error) {
    validateErrorShape(frame.error);
  }

  return {
    type: 'res',
    id: frame.id,
    ok: frame.ok,
    payload: frame.payload,
    error: frame.error,
  };
}

/**
 * Validates an event frame.
 *
 * @param frame - Partial frame to validate
 * @returns The validated event frame
 * @throws ValidationError if validation fails
 */
export function validateEventFrame(frame: Partial<EventFrame>): EventFrame {
  if (!frame.event || typeof frame.event !== 'string') {
    throw new ValidationError(
      'Invalid event frame: missing or invalid event field',
      'MISSING_EVENT_NAME',
    );
  }

  if (frame.event.length === 0) {
    throw new ValidationError(
      'Invalid event frame: event name cannot be empty',
      'INVALID_EVENT_NAME',
    );
  }

  // Validate optional sequence number
  if (frame.seq !== undefined) {
    if (typeof frame.seq !== 'number' || !Number.isFinite(frame.seq) || frame.seq < 0) {
      throw new ValidationError(
        'Invalid event frame: seq must be a non-negative number',
        'INVALID_SEQUENCE',
      );
    }
  }

  // Validate optional state version
  if (frame.stateVersion !== undefined) {
    if (typeof frame.stateVersion !== 'object' || frame.stateVersion === null) {
      throw new ValidationError(
        'Invalid event frame: stateVersion must be an object',
        'INVALID_STATE_VERSION',
      );
    }

    const sv = frame.stateVersion as { presence?: unknown; health?: unknown };
    if (
      typeof sv.presence !== 'number' ||
      !Number.isFinite(sv.presence) ||
      sv.presence < 0
    ) {
      throw new ValidationError(
        'Invalid event frame: stateVersion.presence must be a non-negative number',
        'INVALID_STATE_VERSION_PRESENCE',
      );
    }

    if (
      typeof sv.health !== 'number' ||
      !Number.isFinite(sv.health) ||
      sv.health < 0
    ) {
      throw new ValidationError(
        'Invalid event frame: stateVersion.health must be a non-negative number',
        'INVALID_STATE_VERSION_HEALTH',
      );
    }
  }

  return {
    type: 'event',
    event: frame.event,
    payload: frame.payload,
    seq: frame.seq,
    stateVersion: frame.stateVersion,
  };
}

/**
 * Validates an error shape object.
 *
 * @param error - Error object to validate
 * @throws ValidationError if validation fails
 */
export function validateErrorShape(error: unknown): asserts error is ErrorShape {
  if (!error || typeof error !== 'object') {
    throw new ValidationError(
      'Invalid error: must be an object',
      'INVALID_ERROR_TYPE',
    );
  }

  const err = error as Partial<ErrorShape>;

  if (!err.code || typeof err.code !== 'string') {
    throw new ValidationError(
      'Invalid error: missing or invalid code field',
      'MISSING_ERROR_CODE',
    );
  }

  if (!err.message || typeof err.message !== 'string') {
    throw new ValidationError(
      'Invalid error: missing or invalid message field',
      'MISSING_ERROR_MESSAGE',
    );
  }

  if (err.retryable !== undefined && typeof err.retryable !== 'boolean') {
    throw new ValidationError(
      'Invalid error: retryable must be a boolean',
      'INVALID_RETRYABLE',
    );
  }

  if (err.retryAfterMs !== undefined) {
    if (
      typeof err.retryAfterMs !== 'number' ||
      !Number.isFinite(err.retryAfterMs) ||
      err.retryAfterMs < 0
    ) {
      throw new ValidationError(
        'Invalid error: retryAfterMs must be a non-negative number',
        'INVALID_RETRY_AFTER_MS',
      );
    }
  }
}

/**
 * Validates connection parameters.
 *
 * @param params - Parameters to validate
 * @returns The validated connection parameters
 * @throws ValidationError if validation fails
 */
export function validateConnectParams(params: unknown): ConnectParams {
  if (!params || typeof params !== 'object') {
    throw new ValidationError(
      'Invalid connect params: must be an object',
      'INVALID_CONNECT_PARAMS',
    );
  }

  const p = params as Partial<ConnectParams>;

  // Validate protocol version range
  if (
    typeof p.minProtocol !== 'number' ||
    !Number.isFinite(p.minProtocol) ||
    p.minProtocol < 1
  ) {
    throw new ValidationError(
      'Invalid connect params: minProtocol must be a number >= 1',
      'INVALID_MIN_PROTOCOL',
    );
  }

  if (
    typeof p.maxProtocol !== 'number' ||
    !Number.isFinite(p.maxProtocol) ||
    p.maxProtocol < 1
  ) {
    throw new ValidationError(
      'Invalid connect params: maxProtocol must be a number >= 1',
      'INVALID_MAX_PROTOCOL',
    );
  }

  if (p.minProtocol > p.maxProtocol) {
    throw new ValidationError(
      'Invalid connect params: minProtocol cannot be greater than maxProtocol',
      'INVALID_PROTOCOL_RANGE',
    );
  }

  // Validate client object
  if (!p.client || typeof p.client !== 'object') {
    throw new ValidationError(
      'Invalid connect params: missing or invalid client field',
      'MISSING_CLIENT_INFO',
    );
  }

  const client = p.client as Partial<ConnectParams['client']>;

  if (!client.id || typeof client.id !== 'string') {
    throw new ValidationError(
      'Invalid connect params: client.id is required',
      'MISSING_CLIENT_ID',
    );
  }

  if (!client.version || typeof client.version !== 'string') {
    throw new ValidationError(
      'Invalid connect params: client.version is required',
      'MISSING_CLIENT_VERSION',
    );
  }

  if (!client.platform || typeof client.platform !== 'string') {
    throw new ValidationError(
      'Invalid connect params: client.platform is required',
      'MISSING_CLIENT_PLATFORM',
    );
  }

  if (!client.mode || typeof client.mode !== 'string') {
    throw new ValidationError(
      'Invalid connect params: client.mode is required',
      'MISSING_CLIENT_MODE',
    );
  }

  return params as ConnectParams;
}

/**
 * Type guard to check if a value is a RequestFrame.
 *
 * @param frame - Value to check
 * @returns True if the value is a RequestFrame
 */
export function isRequestFrame(frame: unknown): frame is RequestFrame {
  try {
    return validateRequestFrame(frame as Partial<RequestFrame>).type === 'req';
  } catch {
    return false;
  }
}

/**
 * Type guard to check if a value is a ResponseFrame.
 *
 * @param frame - Value to check
 * @returns True if the value is a ResponseFrame
 */
export function isResponseFrame(frame: unknown): frame is ResponseFrame {
  try {
    return validateResponseFrame(frame as Partial<ResponseFrame>).type === 'res';
  } catch {
    return false;
  }
}

/**
 * Type guard to check if a value is an EventFrame.
 *
 * @param frame - Value to check
 * @returns True if the value is an EventFrame
 */
export function isEventFrame(frame: unknown): frame is EventFrame {
  try {
    return validateEventFrame(frame as Partial<EventFrame>).type === 'event';
  } catch {
    return false;
  }
}

/**
 * Type guard to check if a frame is a successful response.
 *
 * @param frame - Value to check
 * @returns True if the value is a successful ResponseFrame
 */
export function isSuccessfulResponse(frame: unknown): frame is ResponseFrame {
  return isResponseFrame(frame) && frame.ok === true;
}

/**
 * Type guard to check if a frame is an error response.
 *
 * @param frame - Value to check
 * @returns True if the value is an error ResponseFrame
 */
export function isErrorResponse(frame: unknown): frame is ResponseFrame {
  return isResponseFrame(frame) && frame.ok === false;
}
