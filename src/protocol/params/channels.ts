/**
 * Channels API Parameter Types
 *
 * Parameter and result types for channel and talk operations.
 *
 * @module protocol/params/channels
 */

export interface ChannelsStatusParams {}

export interface ChannelsStatusResult {
  channels: unknown[];
}

export interface ChannelsLogoutParams {
  channelId: string;
}

// ============================================================================
// Talk Types
// ============================================================================

export interface TalkConfigParams {}

export interface TalkConfigResult {
  enabled: boolean;
  [key: string]: unknown;
}

export interface TalkModeParams {
  enabled: boolean;
}

export interface TalkStartParams {
  language?: string;
}

export interface TalkStartResult {
  sessionId: string;
}

export interface TalkStopParams {
  sessionId: string;
}

export interface TalkStopResult {}

export interface TalkSpeakParams {
  text: string;
  language?: string;
}

// ============================================================================
// WebLogin Types
// ============================================================================

export interface WebLoginStartParams {
  returnUrl?: string;
}

export interface WebLoginWaitParams {
  token: string;
  timeoutMs?: number;
}

export interface WebLoginStartResult {
  token: string;
  url: string;
}

export interface WebLoginWaitResult {
  success: boolean;
  userId?: string;
}

export interface WebLoginCancelParams {
  token: string;
}

export interface WebLoginCancelResult {}
