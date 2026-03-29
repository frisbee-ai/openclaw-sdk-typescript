/**
 * Push API Parameter Types
 *
 * Parameter and result types for push notification operations.
 *
 * @module protocol/params/push
 */

export interface PushRegisterParams {
  token: string;
  platform: string;
}

export interface PushRegisterResult {}

export interface PushUnregisterParams {
  token: string;
}

export interface PushUnregisterResult {}

export interface PushSendParams {
  target: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushSendResult {}
