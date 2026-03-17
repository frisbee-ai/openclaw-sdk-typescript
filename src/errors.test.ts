/**
 * Error Types Tests
 *
 * Comprehensive tests for all error classes and utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  OpenClawError,
  AuthError,
  ConnectionError,
  ProtocolError,
  RequestError,
  TimeoutError,
  CancelledError,
  AbortError,
  GatewayError,
  ReconnectError,
  createErrorFromResponse,
  isOpenClawError,
  isAuthError,
  isConnectionError,
  isTimeoutError,
  isCancelledError,
  isAbortError,
} from "./errors.js";

// ============================================================================
// OpenClawError (Base Class)
// ============================================================================

describe("OpenClawError", () => {
  it("should create error with message and code", () => {
    const error = new OpenClawError("Test error", "TEST_CODE");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.name).toBe("OpenClawError");
  });

  it("should have retryable default to false", () => {
    const error = new OpenClawError("Test", "TEST");
    expect(error.retryable).toBe(false);
  });

  it("should accept retryable parameter", () => {
    const error = new OpenClawError("Test", "TEST", true);
    expect(error.retryable).toBe(true);
  });

  it("should accept details parameter", () => {
    const details = { foo: "bar" };
    const error = new OpenClawError("Test", "TEST", false, details);
    expect(error.details).toEqual(details);
  });

  it("should convert to JSON", () => {
    const details = { context: "test" };
    const error = new OpenClawError("Test error", "TEST_CODE", true, details);
    const json = error.toJSON();

    expect(json).toEqual({
      name: "OpenClawError",
      message: "Test error",
      code: "TEST_CODE",
      retryable: true,
      details: { context: "test" },
    });
  });

  it("should be instanceof Error", () => {
    const error = new OpenClawError("Test", "TEST");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(OpenClawError);
  });
});

// ============================================================================
// AuthError
// ============================================================================

describe("AuthError", () => {
  it("should create AuthError with config", () => {
    const error = new AuthError({
      code: "AUTH_TOKEN_EXPIRED",
      message: "Token expired",
    });
    expect(error.code).toBe("AUTH_TOKEN_EXPIRED");
    expect(error.message).toBe("Token expired");
    expect(error.name).toBe("AuthError");
  });

  it("should mark certain auth errors as retryable", () => {
    const retryableCodes = [
      "CHALLENGE_EXPIRED",
      "AUTH_TOKEN_EXPIRED",
      "AUTH_RATE_LIMITED",
    ];

    retryableCodes.forEach((code) => {
      const error = new AuthError({ code, message: "Test" });
      expect(error.retryable).toBe(true);
    });
  });

  it("should mark non-retryable auth codes", () => {
    const nonRetryableCodes = [
      "CHALLENGE_FAILED",
      "AUTH_TOKEN_MISMATCH",
      "AUTH_DEVICE_REJECTED",
      "AUTH_PASSWORD_INVALID",
      "AUTH_NOT_SUPPORTED",
      "AUTH_CONFIGURATION_ERROR",
    ];

    nonRetryableCodes.forEach((code) => {
      const error = new AuthError({ code, message: "Test" });
      expect(error.retryable).toBe(false);
    });
  });

  it("should accept custom retryable override", () => {
    const error = new AuthError({
      code: "AUTH_TOKEN_EXPIRED",
      message: "Test",
      retryable: false,
    });
    expect(error.retryable).toBe(false);
  });

  it("should accept details parameter", () => {
    const details = { attempt: 3 };
    const error = new AuthError({
      code: "AUTH_RATE_LIMITED",
      message: "Rate limited",
      details,
    });
    expect(error.details).toEqual(details);
  });
});

// ============================================================================
// ConnectionError
// ============================================================================

describe("ConnectionError", () => {
  it("should create ConnectionError with config", () => {
    const error = new ConnectionError({
      code: "CONNECTION_CLOSED",
      message: "Connection closed",
    });
    expect(error.code).toBe("CONNECTION_CLOSED");
    expect(error.message).toBe("Connection closed");
    expect(error.name).toBe("ConnectionError");
  });

  it("should default to retryable", () => {
    const error = new ConnectionError({
      code: "NETWORK_ERROR",
      message: "Network error",
    });
    expect(error.retryable).toBe(true);
  });

  it("should accept custom retryable override", () => {
    const error = new ConnectionError({
      code: "CONNECTION_REFUSED",
      message: "Refused",
      retryable: false,
    });
    expect(error.retryable).toBe(false);
  });

  it("should support all connection error codes", () => {
    const codes = [
      "TLS_FINGERPRINT_MISMATCH",
      "CONNECTION_STALE",
      "CONNECTION_CLOSED",
      "CONNECT_TIMEOUT",
      "CONNECTION_REFUSED",
      "NETWORK_ERROR",
      "PROTOCOL_ERROR",
    ];

    codes.forEach((code) => {
      const error = new ConnectionError({ code, message: "Test" });
      expect(error.code).toBe(code);
    });
  });
});

// ============================================================================
// ProtocolError
// ============================================================================

describe("ProtocolError", () => {
  it("should create ProtocolError with config", () => {
    const error = new ProtocolError({
      code: "PROTOCOL_UNSUPPORTED",
      message: "Unsupported protocol",
    });
    expect(error.code).toBe("PROTOCOL_UNSUPPORTED");
    expect(error.message).toBe("Unsupported protocol");
    expect(error.name).toBe("ProtocolError");
  });

  it("should default to non-retryable", () => {
    const error = new ProtocolError({
      code: "INVALID_FRAME",
      message: "Invalid frame",
    });
    expect(error.retryable).toBe(false);
  });
});

// ============================================================================
// RequestError
// ============================================================================

describe("RequestError", () => {
  it("should create RequestError with config", () => {
    const error = new RequestError({
      code: "METHOD_NOT_FOUND",
      message: "Method not found",
    });
    expect(error.code).toBe("METHOD_NOT_FOUND");
    expect(error.message).toBe("Method not found");
    expect(error.name).toBe("RequestError");
  });

  it("should mark timeout and internal error as retryable", () => {
    const retryableCodes = ["REQUEST_TIMEOUT", "INTERNAL_ERROR"];

    retryableCodes.forEach((code) => {
      const error = new RequestError({ code, message: "Test" });
      expect(error.retryable).toBe(true);
    });
  });

  it("should mark non-retryable request codes", () => {
    const nonRetryableCodes = [
      "METHOD_NOT_FOUND",
      "INVALID_PARAMS",
      "REQUEST_CANCELLED",
      "REQUEST_ABORTED",
    ];

    nonRetryableCodes.forEach((code) => {
      const error = new RequestError({ code, message: "Test" });
      expect(error.retryable).toBe(false);
    });
  });
});

// ============================================================================
// Specialized Request Errors
// ============================================================================

describe("TimeoutError", () => {
  it("should create TimeoutError with default message", () => {
    const error = new TimeoutError();
    expect(error.message).toBe("Request timed out");
    expect(error.code).toBe("REQUEST_TIMEOUT");
    expect(error.retryable).toBe(true);
    expect(error.name).toBe("TimeoutError");
  });

  it("should accept custom message", () => {
    const error = new TimeoutError("Custom timeout");
    expect(error.message).toBe("Custom timeout");
  });

  it("should accept details", () => {
    const details = { timeoutMs: 5000 };
    const error = new TimeoutError("Timeout", details);
    expect(error.details).toEqual(details);
  });
});

describe("CancelledError", () => {
  it("should create CancelledError with default message", () => {
    const error = new CancelledError();
    expect(error.message).toBe("Request was cancelled");
    expect(error.code).toBe("REQUEST_CANCELLED");
    expect(error.retryable).toBe(false);
    expect(error.name).toBe("CancelledError");
  });

  it("should accept custom message", () => {
    const error = new CancelledError("User cancelled");
    expect(error.message).toBe("User cancelled");
  });
});

describe("AbortError", () => {
  it("should create AbortError with default message", () => {
    const error = new AbortError();
    expect(error.message).toBe("Request was aborted");
    expect(error.code).toBe("REQUEST_ABORTED");
    expect(error.retryable).toBe(false);
    expect(error.name).toBe("AbortError");
  });

  it("should accept custom message", () => {
    const error = new AbortError("Aborted by user");
    expect(error.message).toBe("Aborted by user");
  });
});

// ============================================================================
// GatewayError
// ============================================================================

describe("GatewayError", () => {
  it("should create GatewayError with config", () => {
    const error = new GatewayError({
      code: "AGENT_NOT_FOUND",
      message: "Agent not found",
    });
    expect(error.code).toBe("AGENT_NOT_FOUND");
    expect(error.message).toBe("Agent not found");
    expect(error.name).toBe("GatewayError");
  });

  it("should support all gateway error codes", () => {
    const codes = [
      "AGENT_NOT_FOUND",
      "AGENT_BUSY",
      "NODE_NOT_FOUND",
      "NODE_OFFLINE",
      "SESSION_NOT_FOUND",
      "SESSION_EXPIRED",
      "PERMISSION_DENIED",
      "QUOTA_EXCEEDED",
    ];

    codes.forEach((code) => {
      const error = new GatewayError({ code, message: "Test" });
      expect(error.code).toBe(code);
    });
  });
});

// ============================================================================
// ReconnectError
// ============================================================================

describe("ReconnectError", () => {
  it("should create ReconnectError with config", () => {
    const error = new ReconnectError({
      code: "MAX_RECONNECT_ATTEMPTS",
      message: "Max reconnection attempts reached",
    });
    expect(error.code).toBe("MAX_RECONNECT_ATTEMPTS");
    expect(error.message).toBe("Max reconnection attempts reached");
    expect(error.name).toBe("ReconnectError");
  });

  it("should support all reconnect error codes", () => {
    const codes = [
      "MAX_RECONNECT_ATTEMPTS",
      "MAX_AUTH_RETRIES",
      "RECONNECT_DISABLED",
    ];

    codes.forEach((code) => {
      const error = new ReconnectError({ code, message: "Test" });
      expect(error.code).toBe(code);
    });
  });
});

// ============================================================================
// Error Factory
// ============================================================================

describe("createErrorFromResponse", () => {
  it("should create AuthError for auth codes", () => {
    const error = createErrorFromResponse({
      code: "AUTH_TOKEN_EXPIRED",
      message: "Token expired",
    });
    expect(error).toBeInstanceOf(AuthError);
    expect(error.code).toBe("AUTH_TOKEN_EXPIRED");
  });

  it("should create AuthError for challenge codes", () => {
    const error = createErrorFromResponse({
      code: "CHALLENGE_FAILED",
      message: "Challenge failed",
    });
    expect(error).toBeInstanceOf(AuthError);
  });

  it("should create ConnectionError for connection codes", () => {
    const error = createErrorFromResponse({
      code: "CONNECTION_CLOSED",
      message: "Connection closed",
    });
    expect(error).toBeInstanceOf(ConnectionError);
  });

  it("should create ConnectionError for TLS code", () => {
    const error = createErrorFromResponse({
      code: "TLS_FINGERPRINT_MISMATCH",
      message: "TLS mismatch",
    });
    expect(error).toBeInstanceOf(ConnectionError);
  });

  it("should create ProtocolError for protocol codes", () => {
    const error = createErrorFromResponse({
      code: "PROTOCOL_UNSUPPORTED",
      message: "Protocol unsupported",
    });
    expect(error).toBeInstanceOf(ProtocolError);
  });

  it("should create RequestError for method not found", () => {
    const error = createErrorFromResponse({
      code: "METHOD_NOT_FOUND",
      message: "Method not found",
    });
    expect(error).toBeInstanceOf(RequestError);
  });

  it("should create GatewayError for unknown codes", () => {
    const error = createErrorFromResponse({
      code: "UNKNOWN_ERROR",
      message: "Unknown error",
    });
    expect(error).toBeInstanceOf(GatewayError);
    expect(error.code).toBe("UNKNOWN_ERROR");
  });

  it("should pass through retryable flag", () => {
    const error = createErrorFromResponse({
      code: "AUTH_TOKEN_EXPIRED",
      message: "Token expired",
      retryable: true,
    });
    expect(error.retryable).toBe(true);
  });

  it("should pass through details", () => {
    const details = { attempt: 3 };
    const error = createErrorFromResponse({
      code: "AGENT_NOT_FOUND",
      message: "Not found",
      details,
    });
    expect(error.details).toEqual(details);
  });

  it("should uppercase the code", () => {
    const error = createErrorFromResponse({
      code: "auth_token_expired",
      message: "Token expired",
    });
    expect(error.code).toBe("AUTH_TOKEN_EXPIRED");
  });
});

// ============================================================================
// Type Guards
// ============================================================================

describe("isOpenClawError", () => {
  it("should return true for OpenClawError", () => {
    const error = new OpenClawError("Test", "TEST");
    expect(isOpenClawError(error)).toBe(true);
  });

  it("should return true for subclasses", () => {
    const authError = new AuthError({ code: "AUTH_TOKEN_EXPIRED", message: "Test" });
    expect(isOpenClawError(authError)).toBe(true);
  });

  it("should return false for non-OpenClawError", () => {
    const error = new Error("Regular error");
    expect(isOpenClawError(error)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isOpenClawError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isOpenClawError(undefined)).toBe(false);
  });
});

describe("isAuthError", () => {
  it("should return true for AuthError", () => {
    const error = new AuthError({ code: "AUTH_TOKEN_EXPIRED", message: "Test" });
    expect(isAuthError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    const error = new ConnectionError({ code: "CONNECTION_CLOSED", message: "Test" });
    expect(isAuthError(error)).toBe(false);
  });

  it("should return false for plain Error", () => {
    const error = new Error("Test");
    expect(isAuthError(error)).toBe(false);
  });
});

describe("isConnectionError", () => {
  it("should return true for ConnectionError", () => {
    const error = new ConnectionError({ code: "CONNECTION_CLOSED", message: "Test" });
    expect(isConnectionError(error)).toBe(true);
  });

  it("should return false for other errors", () => {
    const error = new AuthError({ code: "AUTH_TOKEN_EXPIRED", message: "Test" });
    expect(isConnectionError(error)).toBe(false);
  });
});

describe("isTimeoutError", () => {
  it("should return true for TimeoutError", () => {
    const error = new TimeoutError();
    expect(isTimeoutError(error)).toBe(true);
  });

  it("should return false for RequestError", () => {
    const error = new RequestError({ code: "METHOD_NOT_FOUND", message: "Test" });
    expect(isTimeoutError(error)).toBe(false);
  });
});

describe("isCancelledError", () => {
  it("should return true for CancelledError", () => {
    const error = new CancelledError();
    expect(isCancelledError(error)).toBe(true);
  });

  it("should return false for AbortError", () => {
    const error = new AbortError();
    expect(isCancelledError(error)).toBe(false);
  });
});

describe("isAbortError", () => {
  it("should return true for AbortError", () => {
    const error = new AbortError();
    expect(isAbortError(error)).toBe(true);
  });

  it("should return false for CancelledError", () => {
    const error = new CancelledError();
    expect(isAbortError(error)).toBe(false);
  });
});
