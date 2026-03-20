/**
 * OpenClaw Protocol Connection State Type
 *
 * @module
 */

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'handshaking'
  | 'authenticating'
  | 'ready'
  | 'reconnecting'
  | 'closed';
