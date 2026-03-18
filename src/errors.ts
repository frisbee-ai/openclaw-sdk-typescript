/**
 * OpenClaw SDK Error Types
 *
 * Centralized error definitions for the SDK including authentication,
 * connection, protocol, and request errors.
 */

/**
 * Base SDK error class.
 */
export class OpenClawError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

// ============================================================================
// Authentication Errors
// ============================================================================

export type AuthErrorCode =
  | "CHALLENGE_EXPIRED"
  | "CHALLENGE_FAILED"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_TOKEN_MISMATCH"
  | "AUTH_RATE_LIMITED"
  | "AUTH_DEVICE_REJECTED"
  | "AUTH_PASSWORD_INVALID"
  | "AUTH_NOT_SUPPORTED"
  | "AUTH_CONFIGURATION_ERROR";

/**
 * Authentication error.
 */
export class AuthError extends OpenClawError {
  constructor(config: {
    code: AuthErrorCode;
    message: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(
      config.message,
      config.code,
      config.retryable ?? isAuthErrorRetryable(config.code),
      config.details,
    );
    this.name = "AuthError";
  }
}

/**
 * Check if an auth error code is retryable
 */
function isAuthErrorRetryable(code: AuthErrorCode): boolean {
  const retryableCodes: AuthErrorCode[] = [
    "CHALLENGE_EXPIRED",
    "AUTH_TOKEN_EXPIRED",
    "AUTH_RATE_LIMITED",
  ];
  return retryableCodes.includes(code);
}

// ============================================================================
// Connection Errors
// ============================================================================

export type ConnectionErrorCode =
  | "TLS_FINGERPRINT_MISMATCH"
  | "CONNECTION_STALE"
  | "CONNECTION_CLOSED"
  | "CONNECT_TIMEOUT"
  | "CONNECTION_REFUSED"
  | "NETWORK_ERROR"
  | "PROTOCOL_ERROR";

/**
 * Connection error.
 */
export class ConnectionError extends OpenClawError {
  constructor(config: {
    code: ConnectionErrorCode;
    message: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(
      config.message,
      config.code,
      config.retryable ?? true, // Most connection errors are retryable
      config.details,
    );
    this.name = "ConnectionError";
  }
}

// ============================================================================
// Protocol Errors
// ============================================================================

export type ProtocolErrorCode =
  | "PROTOCOL_UNSUPPORTED"
  | "PROTOCOL_NEGOTIATION_FAILED"
  | "INVALID_FRAME"
  | "FRAME_TOO_LARGE";

/**
 * Protocol error.
 */
export class ProtocolError extends OpenClawError {
  constructor(config: {
    code: ProtocolErrorCode;
    message: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(
      config.message,
      config.code,
      config.retryable ?? false,
      config.details,
    );
    this.name = "ProtocolError";
  }
}

// ============================================================================
// Request Errors
// ============================================================================

export type RequestErrorCode =
  | "METHOD_NOT_FOUND"
  | "INVALID_PARAMS"
  | "INTERNAL_ERROR"
  | "REQUEST_TIMEOUT"
  | "REQUEST_CANCELLED"
  | "REQUEST_ABORTED";

/**
 * Request error.
 */
export class RequestError extends OpenClawError {
  constructor(config: {
    code: RequestErrorCode;
    message: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(
      config.message,
      config.code,
      config.retryable ?? isRequestErrorRetryable(config.code),
      config.details,
    );
    this.name = "RequestError";
  }
}

function isRequestErrorRetryable(code: RequestErrorCode): boolean {
  const retryableCodes: RequestErrorCode[] = [
    "REQUEST_TIMEOUT",
    "INTERNAL_ERROR",
  ];
  return retryableCodes.includes(code);
}

/**
 * Timeout error (shorthand for request timeout).
 */
export class TimeoutError extends RequestError {
  constructor(message: string = "Request timed out", details?: unknown) {
    super({
      code: "REQUEST_TIMEOUT",
      message,
      retryable: true,
      details,
    });
    this.name = "TimeoutError";
  }
}

/**
 * Request cancelled error.
 */
export class CancelledError extends RequestError {
  constructor(message: string = "Request was cancelled", details?: unknown) {
    super({
      code: "REQUEST_CANCELLED",
      message,
      retryable: false,
      details,
    });
    this.name = "CancelledError";
  }
}

/**
 * Request aborted error (AbortController).
 */
export class AbortError extends RequestError {
  constructor(message: string = "Request was aborted", details?: unknown) {
    super({
      code: "REQUEST_ABORTED",
      message,
      retryable: false,
      details,
    });
    this.name = "AbortError";
  }
}

// ============================================================================
// Gateway Errors (Business Logic Errors)
// ============================================================================

export type GatewayErrorCode =
  | "AGENT_NOT_FOUND"
  | "AGENT_BUSY"
  | "NODE_NOT_FOUND"
  | "NODE_OFFLINE"
  | "SESSION_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "PERMISSION_DENIED"
  | "QUOTA_EXCEEDED";

/**
 * Gateway business logic error.
 */
export class GatewayError extends OpenClawError {
  constructor(config: {
    code: GatewayErrorCode;
    message: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(
      config.message,
      config.code,
      config.retryable ?? false,
      config.details,
    );
    this.name = "GatewayError";
  }
}

// ============================================================================
// Reconnection Errors
// ============================================================================

export type ReconnectErrorCode =
  | "MAX_RECONNECT_ATTEMPTS"
  | "MAX_AUTH_RETRIES"
  | "RECONNECT_DISABLED";

/**
 * Reconnection error.
 */
export class ReconnectError extends OpenClawError {
  constructor(config: {
    code: ReconnectErrorCode;
    message: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(
      config.message,
      config.code,
      config.retryable ?? false,
      config.details,
    );
    this.name = "ReconnectError";
  }
}

// ============================================================================
// Error Factory
// ============================================================================

/**
 * Create an error from a response frame error shape.
 */
export function createErrorFromResponse(error: {
  code: string;
  message: string;
  retryable?: boolean;
  details?: unknown;
}): OpenClawError {
  const code = error.code.toUpperCase();

  // Auth errors
  if (code.startsWith("AUTH_") || code.startsWith("CHALLENGE_")) {
    return new AuthError({
      code: code as AuthErrorCode,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    });
  }

  // Connection errors
  if (code.startsWith("CONNECTION_") || code === "TLS_FINGERPRINT_MISMATCH") {
    return new ConnectionError({
      code: code as ConnectionErrorCode,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    });
  }

  // Protocol errors
  if (code.startsWith("PROTOCOL_")) {
    return new ProtocolError({
      code: code as ProtocolErrorCode,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    });
  }

  // Request errors
  if (
    code === "METHOD_NOT_FOUND" ||
    code === "INVALID_PARAMS" ||
    code === "INTERNAL_ERROR"
  ) {
    return new RequestError({
      code: code as RequestErrorCode,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    });
  }

  // Gateway errors - treat unknown codes as gateway errors
  return new GatewayError({
    code: code as GatewayErrorCode,
    message: error.message,
    retryable: error.retryable,
    details: error.details,
  });
}

// ============================================================================
// Error Guards
// ============================================================================

/**
 * Type guard for OpenClawError
 */
export function isOpenClawError(error: unknown): error is OpenClawError {
  return error instanceof OpenClawError;
}

/**
 * Type guard for AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Type guard for ConnectionError
 */
export function isConnectionError(error: unknown): error is ConnectionError {
  return error instanceof ConnectionError;
}

/**
 * Type guard for TimeoutError
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Type guard for CancelledError
 */
export function isCancelledError(error: unknown): error is CancelledError {
  return error instanceof CancelledError;
}

/**
 * Type guard for AbortError
 */
export function isAbortError(error: unknown): error is AbortError {
  return error instanceof AbortError;
}

// ============================================================================
// Default Export
// ============================================================================

export default OpenClawError;
