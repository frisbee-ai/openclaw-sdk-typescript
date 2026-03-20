/**
 * OpenClaw Protocol Frame Types
 *
 * @module
 */

import type { ErrorShape } from './errors.js';

// ============================================================================
// Frame Type Constants
// ============================================================================

/** Frame type constants to avoid magic strings */
export const FrameTypes = {
  REQUEST: 'req',
  RESPONSE: 'res',
  EVENT: 'event',
} as const;

export type FrameType = (typeof FrameTypes)[keyof typeof FrameTypes];

// ============================================================================
// Core Frame Types
// ============================================================================

export interface RequestFrame {
  type: 'req';
  id: string;
  method: string;
  params?: unknown;
}

export interface ResponseFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: ErrorShape;
  /** If true, this is an intermediate progress update, not a final response */
  progress?: boolean;
}

/** State version for tracking connection state changes */
export interface StateVersion {
  /** Presence state version */
  presence: number;
  /** Health state version */
  health: number;
}

export interface EventFrame {
  type: 'event';
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: StateVersion;
}

export type GatewayFrame = RequestFrame | ResponseFrame | EventFrame;

export interface Frame {
  type: string;
  [key: string]: unknown;
}
