/**
 * OpenClaw Protocol Connection Types
 *
 * @module
 */

// ============================================================================
// Connection and Handshake Types
// ============================================================================

export interface PresenceEntry {
  node: string;
  [key: string]: unknown;
}

export interface Snapshot {
  presence: Record<string, unknown>;
  health: Record<string, unknown>;
  stateVersion: number;
  uptimeMs: number;
  configPath?: string;
  authMode?: string;
  agents?: Record<string, unknown>;
  nodes?: Record<string, unknown>;
}

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    displayName?: string;
    version: string;
    platform: string;
    deviceFamily?: string;
    modelIdentifier?: string;
    mode: string;
    instanceId?: string;
  };
  caps?: string[];
  commands?: string[];
  permissions?: Record<string, boolean>;
  pathEnv?: string;
  role?: string;
  scopes?: string[];
  device?: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
  };
  auth?: {
    token?: string;
    bootstrapToken?: string;
    deviceToken?: string;
    password?: string;
  };
  locale?: string;
  userAgent?: string;
}

export interface HelloOk {
  type: 'hello-ok';
  protocol: number;
  server: {
    version: string;
    connId: string;
  };
  features: {
    methods: string[];
    events: string[];
  };
  snapshot: Snapshot;
  canvasHostUrl?: string;
  auth?: {
    deviceToken: string;
    role: string;
    scopes: string[];
    issuedAtMs?: number;
  };
  policy: {
    maxPayload: number;
    maxBufferedBytes: number;
    tickIntervalMs: number;
  };
}
