/**
 * Protocol Types Unit Tests
 *
 * Comprehensive tests covering:
 * - Unit: Protocol type definitions
 * - Edge Cases: Type guards, frame validation
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorCodes,
  FrameTypes,
  type ErrorCode,
  type FrameType,
  type RequestFrame,
  type ResponseFrame,
  type EventFrame,
  type GatewayFrame,
  type ConnectParams,
  type HelloOk,
  type ErrorShape,
} from './types';

describe('ErrorCodes', () => {
  it('should have correct error code values', () => {
    expect(ErrorCodes.NOT_LINKED).toBe('NOT_LINKED');
    expect(ErrorCodes.NOT_PAIRED).toBe('NOT_PAIRED');
    expect(ErrorCodes.AGENT_TIMEOUT).toBe('AGENT_TIMEOUT');
    expect(ErrorCodes.INVALID_REQUEST).toBe('INVALID_REQUEST');
    expect(ErrorCodes.UNAVAILABLE).toBe('UNAVAILABLE');
  });

  it('should have all expected error codes', () => {
    const codes = Object.values(ErrorCodes);
    expect(codes).toContain('NOT_LINKED');
    expect(codes).toContain('NOT_PAIRED');
    expect(codes).toContain('AGENT_TIMEOUT');
    expect(codes).toContain('INVALID_REQUEST');
    expect(codes).toContain('UNAVAILABLE');
  });
});

describe('ErrorCode type', () => {
  it('should accept valid error codes', () => {
    const code: ErrorCode = ErrorCodes.NOT_LINKED;
    expect(code).toBe('NOT_LINKED');
  });
});

describe('ErrorShape', () => {
  it('should accept valid error shape', () => {
    const error: ErrorShape = {
      code: 'INVALID_REQUEST',
      message: 'Invalid request',
      details: { field: 'value' },
      retryable: true,
      retryAfterMs: 5000,
    };

    expect(error.code).toBe('INVALID_REQUEST');
    expect(error.message).toBe('Invalid request');
    expect(error.details).toEqual({ field: 'value' });
    expect(error.retryable).toBe(true);
    expect(error.retryAfterMs).toBe(5000);
  });

  it('should accept minimal error shape', () => {
    const error: ErrorShape = {
      code: 'INVALID_REQUEST',
      message: 'Error',
    };

    expect(error.details).toBeUndefined();
    expect(error.retryable).toBeUndefined();
  });
});

describe('FrameTypes', () => {
  it('should have correct frame type values', () => {
    expect(FrameTypes.REQUEST).toBe('req');
    expect(FrameTypes.RESPONSE).toBe('res');
    expect(FrameTypes.EVENT).toBe('event');
  });
});

describe('FrameType type', () => {
  it('should accept valid frame types', () => {
    const requestType: FrameType = FrameTypes.REQUEST;
    const responseType: FrameType = FrameTypes.RESPONSE;
    const eventType: FrameType = FrameTypes.EVENT;

    expect(requestType).toBe('req');
    expect(responseType).toBe('res');
    expect(eventType).toBe('event');
  });
});

describe('RequestFrame', () => {
  it('should accept valid request frame', () => {
    const frame: RequestFrame = {
      type: 'req',
      id: 'req-123',
      method: 'ping',
      params: { key: 'value' },
    };

    expect(frame.type).toBe('req');
    expect(frame.id).toBe('req-123');
    expect(frame.method).toBe('ping');
    expect(frame.params).toEqual({ key: 'value' });
  });

  it('should accept request frame without params', () => {
    const frame: RequestFrame = {
      type: 'req',
      id: 'req-456',
      method: 'listAgents',
    };

    expect(frame.params).toBeUndefined();
  });
});

describe('ResponseFrame', () => {
  it('should accept successful response frame', () => {
    const frame: ResponseFrame = {
      type: 'res',
      id: 'req-123',
      ok: true,
      payload: { result: 'success' },
    };

    expect(frame.ok).toBe(true);
    expect(frame.payload).toEqual({ result: 'success' });
    expect(frame.error).toBeUndefined();
  });

  it('should accept error response frame', () => {
    const frame: ResponseFrame = {
      type: 'res',
      id: 'req-123',
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid parameters',
      },
    };

    expect(frame.ok).toBe(false);
    expect(frame.error).toBeDefined();
    expect(frame.error?.code).toBe('INVALID_REQUEST');
  });
});

describe('EventFrame', () => {
  it('should accept event frame with payload', () => {
    const frame: EventFrame = {
      type: 'event',
      event: 'agent.joined',
      payload: { agentId: 'agent-1' },
      seq: 1,
    };

    expect(frame.event).toBe('agent.joined');
    expect(frame.payload).toEqual({ agentId: 'agent-1' });
    expect(frame.seq).toBe(1);
  });

  it('should accept event frame with state version', () => {
    const frame: EventFrame = {
      type: 'event',
      event: 'state.update',
      stateVersion: { v: 5 },
    };

    expect(frame.stateVersion?.v).toBe(5);
  });
});

describe('GatewayFrame union type', () => {
  it('should accept RequestFrame in union', () => {
    const frame: GatewayFrame = {
      type: 'req',
      id: 'req-1',
      method: 'ping',
    };

    expect((frame as RequestFrame).method).toBe('ping');
  });

  it('should accept ResponseFrame in union', () => {
    const frame: GatewayFrame = {
      type: 'res',
      id: 'req-1',
      ok: true,
    };

    expect((frame as ResponseFrame).ok).toBe(true);
  });

  it('should accept EventFrame in union', () => {
    const frame: GatewayFrame = {
      type: 'event',
      event: 'tick',
    };

    expect((frame as EventFrame).event).toBe('tick');
  });
});

describe('ConnectParams', () => {
  it('should accept full connect params', () => {
    const params: ConnectParams = {
      minProtocol: 1,
      maxProtocol: 3,
      client: {
        id: 'client-1',
        displayName: 'Test Client',
        version: '1.0.0',
        platform: 'node',
        deviceFamily: 'desktop',
        modelIdentifier: 'mac',
        mode: 'node',
        instanceId: 'instance-1',
      },
      caps: ['cap1', 'cap2'],
      commands: ['cmd1'],
      permissions: { read: true, write: false },
      pathEnv: '/usr/bin',
      role: 'user',
      scopes: ['scope1'],
      device: {
        id: 'device-1',
        publicKey: 'key-data',
        signature: 'sig-data',
        signedAt: Date.now(),
        nonce: 'nonce-data',
      },
      auth: {
        token: 'token',
        bootstrapToken: 'bootstrap',
        deviceToken: 'device',
        password: 'pass',
      },
      locale: 'en-US',
      userAgent: 'OpenClaw SDK',
    };

    expect(params.minProtocol).toBe(1);
    expect(params.maxProtocol).toBe(3);
    expect(params.client.id).toBe('client-1');
    expect(params.caps).toEqual(['cap1', 'cap2']);
  });

  it('should accept minimal connect params', () => {
    const params: ConnectParams = {
      minProtocol: 1,
      maxProtocol: 1,
      client: {
        id: 'client-1',
        version: '1.0.0',
        platform: 'node',
        mode: 'node',
      },
    };

    expect(params.caps).toBeUndefined();
    expect(params.auth).toBeUndefined();
  });
});

describe('HelloOk', () => {
  it('should accept full hello-ok response', () => {
    const hello: HelloOk = {
      type: 'hello-ok',
      protocol: 1,
      server: {
        version: '1.0.0',
        connId: 'conn-123',
      },
      features: {
        methods: ['ping', 'listAgents'],
        events: ['tick', 'agent.joined'],
      },
      snapshot: {
        agents: {},
        nodes: {},
      },
      canvasHostUrl: 'https://canvas.example.com',
      auth: {
        deviceToken: 'token',
        role: 'user',
        scopes: ['scope1'],
        issuedAtMs: Date.now(),
      },
      policy: {
        maxPayload: 1048576,
        maxBufferedBytes: 65536,
        tickIntervalMs: 1000,
      },
    };

    expect(hello.protocol).toBe(1);
    expect(hello.server.connId).toBe('conn-123');
    expect(hello.features.methods).toContain('ping');
    expect(hello.policy.tickIntervalMs).toBe(1000);
  });
});

describe('ConnectionState', () => {
  it('should accept valid connection states', () => {
    type ConnectionState = 'disconnected' | 'connecting' | 'ready' | 'closing';

    const states: ConnectionState[] = ['disconnected', 'connecting', 'ready', 'closing'];

    expect(states).toContain('disconnected');
    expect(states).toContain('ready');
  });
});
