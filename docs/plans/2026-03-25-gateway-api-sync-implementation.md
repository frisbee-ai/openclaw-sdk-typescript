# Gateway API Sync — Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`. Tasks use checkbox (`- [ ]`) syntax.

**Goal:** Align SDK with Gateway — delete SDK-only methods, sync type definitions, add missing APIs.

**Architecture:**
- SDK uses API Namespace pattern: each module is a class (e.g., `SessionsAPI`), constructor takes `RequestFn`
- All calls go through `this.request(method, params)`
- Types live in `src/protocol/api-params.ts`
- Gateway is the source of truth — SDK must match exactly

**Tech Stack:** TypeScript, Vitest, npm

---

## RALPLAN-DR Summary

**Principles:**
1. Gateway as source of truth — SDK drifts are corrected to match Gateway
2. Breaking changes released as v2.0.0 — all breaking type changes batched into single release
3. No skeleton phases — every task has complete implementation, test, and verification

**Decision Drivers:**
1. v2.0.0 blast radius: how many breaking changes, in what order?
2. Phase dependency: which phases can run in parallel after Phase 1?
3. Verification: how to prove SDK matches Gateway without running a Gateway instance?

**Viable Options:**

| # | Option | Pros | Cons |
|---|--------|------|------|
| A | Sequential phases (1→2→3→...) | Simple, low risk | Slow, 8-9 weeks |
| B | Parallel tracks post-Phase 1 | Fast (3-4 weeks total) | Requires stable Phase 1 types |
| **B** | **Recommended** | **Staggered parallel: Sessions+Chat in one track, Nodes+Config in another** | |

**Why B:** Phase 1 fixes shared types. Once types are stable, Sessions/Chat and Nodes/Config modules are independent — they can run in parallel.

---

## Pre-Phase Audit (Mandatory — Before Any Implementation)

**Task 0: Complete API Inventory vs Gateway**

Before Phase 1 begins, produce a complete cross-reference of all SDK methods vs Gateway methods.

**Prerequisites:**
- Gateway repo must be present at `/Users/linyang/workspace/my-projects/openclaw/` (cross-repo reference)
- If Gateway repo is not available, skip Task 0 and use the pre-computed inventory below

**Pre-computed inventory** (from design phase, confirmed against Gateway `server-methods-list.ts`):

| Category | SDK-only (delete) | Gateway-only (add) | Type sync needed |
|----------|-------------------|-------------------|-----------------|
| Sessions | `sessions.resolve` | 7 methods (create, send, abort, subscribe×2, messages.subscribe×2) | 1 type (SessionsSendParams) |
| Nodes | — | 6 methods (describe, pending.pull, pending.ack, pair.*, rename) | — |
| Agents | — | — | 2 types (CreateParams, UpdateParams) |
| Config | — | 1 method (schema.lookup) | — |
| Skills | — | 1 method (tools.effective) | — |
| Chat | — | 2 methods (send, abort) | — |
| Device Pairing | — | 3 methods (remove, token.rotate, token.revoke) | 1 type (requestId) |
| Browser | — | 1 method (request) | — |
| Push | — | 1 method (test) | — |
| Exec Approvals | — | 7 methods | — |
| System/Health | — | 20+ methods | — |
| Channels | — | 4 methods | — |

**Files (SDK repo):**
- Read: `src/api/*.ts` (SDK implementations)
- Read: `src/protocol/api-params.ts` (SDK type definitions)

**Step 1: Enumerate ALL SDK methods**

```bash
grep -rh "async.*params" src/api/ | grep "this.request" | sed "s/.*'\(.*\)'.*/\1/" | sort -u > /tmp/sdk_methods.txt
```

**Step 2: Enumerate ALL Gateway methods**

```bash
grep "^\s*[\"\']" src/gateway/server-methods-list.ts | tr -d ' ",' | sort -u > /tmp/gateway_methods.txt
```

**Step 3: Diff to identify**

```bash
comm -23 /tmp/sdk_methods.txt /tmp/gateway_methods.txt  # SDK-only (delete these)
comm -13 /tmp/sdk_methods.txt /tmp/gateway_methods.txt  # Gateway-only (add these)
```

**Step 4: Document findings in this plan's preamble**

This audit replaces the vague "4 type changes" scope with a precise inventory.

---

## Phase 1: Breaking Type Synchronization (v2.0.0)

> This phase changes types that are used across the entire SDK. All subsequent phases build on these types. Execute completely before any parallel work begins.

### Task 1.1: Remove sessions.resolve (SDK-only, not in Gateway)

**Files:**
- `src/api/sessions.ts` — remove `resolve()` method
- `src/protocol/api-params.ts` — remove `SessionsResolveParams`
- `src/index.ts` — remove `SessionsResolveParams` export

**Step 1: Remove from sessions.ts**

```typescript
// DELETE from SessionsAPI class:
async resolve(params: SessionsResolveParams): Promise<unknown> {
  return this.request('sessions.resolve', params);
}
```

**Step 2: Remove SessionsResolveParams from api-params.ts**

```typescript
// DELETE:
export interface SessionsResolveParams {
  sessionId: string;
  key?: string;
  label?: string;
  agentId?: string;
  spawnedBy?: string;
  includeGlobal?: boolean;
  includeUnknown?: boolean;
}
```

**Step 3: Remove from index.ts export block**

**Step 4: Verify**

```bash
npm run typecheck
npm test -- --run
```

**Step 5: Commit**

```bash
git add -A && git commit -m "fix: remove sessions.resolve (not in Gateway)"
```

---

### Task 1.2: Sync AgentsCreateParams + AgentsCreateResult

**Files:**
- `src/protocol/api-params.ts` — replace type definitions

**Step 1: Replace type**

```typescript
// Gateway schema (agents-models-skills.ts):
// name: NonEmptyString, workspace: NonEmptyString, emoji?: string, avatar?: string

export interface AgentsCreateParams {
  name: string;
  workspace: string;
  emoji?: string;
  avatar?: string;
}

export interface AgentsCreateResult {
  ok: true;
  agentId: string;
  name: string;
  workspace: string;
}
```

**Step 2: Verify**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add -A && git commit -m "fix: sync AgentsCreateParams with Gateway schema"
```

---

### Task 1.3: Sync AgentsUpdateParams + AgentsUpdateResult

**Files:**
- `src/protocol/api-params.ts` — replace type definitions

**Step 1: Replace type**

```typescript
// Gateway schema:
// agentId: NonEmptyString, name?: string, workspace?: string, model?: string, avatar?: string

export interface AgentsUpdateParams {
  agentId: string;
  name?: string;
  workspace?: string;
  model?: string;
  avatar?: string;
}

export interface AgentsUpdateResult {
  ok: true;
  agentId: string;
}
```

**Step 2: Verify**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add -A && git commit -m "fix: sync AgentsUpdateParams with Gateway schema"
```

---

### Task 1.4: Add SessionsSendParams + Deprecate ChatInjectParams

**Files:**
- `src/protocol/api-params.ts` — add new type
- `src/api/chat.ts` — add `send()` method
- `src/index.ts` — export `SessionsSendParams`

**Step 1: Add SessionsSendParams**

```typescript
// Gateway schema: key: NonEmptyString, message: string, thinking?: string,
// attachments?: unknown[], timeoutMs?: number, idempotencyKey?: string

export interface SessionsSendParams {
  key: string;
  message: string;
  thinking?: string;
  attachments?: unknown[];
  timeoutMs?: number;
  idempotencyKey?: string;
}
```

**Step 2: Deprecate ChatInjectParams**

```typescript
/**
 * @deprecated Use SessionsSendParams instead. Will be removed in v2.0.
 */
export type ChatInjectParams = SessionsSendParams;
```

**Step 3: In chat.ts, add send method**

```typescript
/**
 * Send a chat message.
 */
async send(params: SessionsSendParams): Promise<unknown> {
  return this.request('chat.send', params);
}
```

**Step 4: Verify**

```bash
npm run typecheck
```

**Step 5: Commit**

```bash
git add -A && git commit -m "fix: add SessionsSendParams, deprecate ChatInjectParams"
```

---

### Task 1.5: Sync DevicePairApproveParams (pairingId → requestId)

**Files:**
- `src/protocol/api-params.ts`

**Step 1: Replace field**

```typescript
// Gateway: nodeId: string, requestId: string
// SDK currently: pairingId: string

export interface DevicePairApproveParams {
  nodeId: string;
  requestId: string;  // was: pairingId
}
```

**Step 2: Verify**

```bash
npm run typecheck
npm test -- src/api/devicePairing.test.ts --run
```

**Step 3: Commit**

```bash
git add -A && git commit -m "fix: DevicePairApproveParams pairingId → requestId"
```

---

## Phase 2: Sessions Module (Parallel Track A)

> Can run in parallel with Phase 3 (Nodes) and Phase 4 (Config/Skills) after Phase 1 is stable.

### Task 2.1: Add sessions.create

**Files:**
- `src/protocol/api-params.ts` — add `SessionsCreateParams`
- `src/api/sessions.ts` — add `create()` method

**Step 1: Add SessionsCreateParams**

```typescript
export interface SessionsCreateParams {
  key?: string;
  agentId?: string;
  label?: string;
  model?: string;
  parentSessionKey?: string;
  task?: string;
  message?: string;
}
```

**Step 2: Add method**

```typescript
/**
 * Create a new session.
 */
async create(params?: SessionsCreateParams): Promise<unknown> {
  return this.request('sessions.create', params);
}
```

**Step 3: Test**

```typescript
test('sessions.create', async () => {
  mockRequest.mockResolvedValueOnce({ ok: true, key: 'sess-123' });
  const result = await client.sessions.create({ agentId: 'agent-1' });
  expect(mockRequest).toHaveBeenCalledWith('sessions.create', { agentId: 'agent-1' });
});
```

**Step 4: Verify + commit**

```bash
npm test -- src/api/sessions.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(sessions): add create API"
```

---

### Task 2.2: Add sessions.send

**Files:**
- `src/api/sessions.ts`

**Step 1: Add method**

```typescript
/**
 * Send a message to a session.
 */
async send(params: SessionsSendParams): Promise<unknown> {
  return this.request('sessions.send', params);
}
```

**Step 2: Test**

```typescript
test('sessions.send', async () => {
  mockRequest.mockResolvedValueOnce({ ok: true });
  const result = await client.sessions.send({ key: 'sess-123', message: 'Hello' });
  expect(mockRequest).toHaveBeenCalledWith('sessions.send', { key: 'sess-123', message: 'Hello' });
});
```

**Step 3: Verify + commit**

```bash
npm test -- src/api/sessions.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(sessions): add send API"
```

---

### Task 2.3: Add sessions.abort

**Files:**
- `src/api/sessions.ts`

**Step 1: Add method**

```typescript
/**
 * Abort a running session.
 */
async abort(params: { key: string; runId?: string }): Promise<void> {
  await this.request('sessions.abort', params);
}
```

**Step 2: Test**

```typescript
test('sessions.abort', async () => {
  mockRequest.mockResolvedValueOnce(undefined);
  await client.sessions.abort({ key: 'sess-123' });
  expect(mockRequest).toHaveBeenCalledWith('sessions.abort', { key: 'sess-123' });
});
```

**Step 3: Verify + commit**

```bash
npm test -- src/api/sessions.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(sessions): add abort API"
```

---

### Task 2.4: Add sessions.subscribe + sessions.unsubscribe

**Files:**
- `src/api/sessions.ts`

**Step 1: Add both methods**

```typescript
/**
 * Subscribe to session events.
 */
async subscribe(params: { key: string }): Promise<unknown> {
  return this.request('sessions.subscribe', params);
}

/**
 * Unsubscribe from session events.
 */
async unsubscribe(params: { key: string }): Promise<void> {
  await this.request('sessions.unsubscribe', params);
}
```

**Step 2: Tests + verify + commit**

```bash
npm test -- src/api/sessions.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(sessions): add subscribe/unsubscribe APIs"
```

---

### Task 2.5: Add sessions.messages.subscribe + sessions.messages.unsubscribe

**Files:**
- `src/api/sessions.ts`

**Step 1: Add both methods**

```typescript
/**
 * Subscribe to session messages.
 */
async messagesSubscribe(params: { key: string }): Promise<unknown> {
  return this.request('sessions.messages.subscribe', params);
}

/**
 * Unsubscribe from session messages.
 */
async messagesUnsubscribe(params: { key: string }): Promise<void> {
  await this.request('sessions.messages.unsubscribe', params);
}
```

**Step 2: Tests + verify + commit**

```bash
npm test -- src/api/sessions.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(sessions): add messages subscribe/unsubscribe APIs"
```

---

## Phase 3: Nodes Module (Parallel Track B)

### Task 3.1: Add node.describe

**Files:**
- `src/api/nodes.ts`

**Step 1: Add method**

```typescript
/**
 * Get node details.
 */
async describe(params: { nodeId: string }): Promise<unknown> {
  return this.request('node.describe', params);
}
```

**Step 2: Test + verify + commit**

```bash
npm test -- src/api/nodes.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(nodes): add describe API"
```

---

### Task 3.2: Add node.pending.pull + node.pending.ack

**Files:**
- `src/api/nodes.ts`

**Step 1: Add methods**

```typescript
/**
 * Pull pending items from a node.
 */
async pendingPull(params?: { max?: number }): Promise<unknown> {
  return this.request('node.pending.pull', params);
}

/**
 * Acknowledge pending items.
 */
async pendingAck(params: { ids: string[] }): Promise<void> {
  await this.request('node.pending.ack', params);
}
```

**Step 2: Test + verify + commit**

```bash
npm test -- src/api/nodes.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(nodes): add pending.pull and pending.ack APIs"
```

---

### Task 3.3: Add node.pair.* (request/list/approve/reject/verify) + node.rename

**Files:**
- `src/api/nodes.ts` — add `pairing` getter
- `src/protocol/api-params.ts` — add NodePair types

**Step 1: Add NodePair types**

> Note: `NodePairApproveParams` and `DevicePairApproveParams` (Phase 1 Task 1.5) are **separate types** — Node pairing (`node.pair.*`) and Device pairing (`device.pair.*`) are distinct subsystems.

```typescript
export interface NodePairRequestParams {
  nodeId: string;
  displayName?: string;
  platform?: string;
  version?: string;
  coreVersion?: string;
  uiVersion?: string;
  deviceFamily?: string;
  modelIdentifier?: string;
  caps?: string[];
  commands?: string[];
  remoteIp?: string;
  silent?: boolean;
}
export interface NodePairApproveParams { requestId: string; }
export interface NodePairRejectParams { requestId: string; }
export interface NodePairVerifyParams { nodeId: string; token: string; }
export interface NodeRenameParams { nodeId: string; displayName: string; }
```

**Step 2: Add pairing getter to NodesAPI**

```typescript
get pairing() {
  const request = this.request.bind(this);
  return {
    async request(params: NodePairRequestParams): Promise<unknown> {
      return request('node.pair.request', params);
    },
    async list(): Promise<unknown> {
      return request('node.pair.list', {});
    },
    async approve(params: { requestId: string }): Promise<void> {
      await request('node.pair.approve', params);
    },
    async reject(params: { requestId: string }): Promise<void> {
      await request('node.pair.reject', params);
    },
    async verify(params: { nodeId: string; token: string }): Promise<void> {
      await request('node.pair.verify', params);
    },
  };
}

/**
 * Rename a node.
 */
async rename(params: NodeRenameParams): Promise<void> {
  await this.request('node.rename', params);
}
```

**Step 3: Test + verify + commit**

```bash
npm test -- src/api/nodes.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(nodes): add node.pair.* and node.rename APIs"
```

---

## Phase 4: Config & Skills Module (Parallel Track B)

### Task 4.1: Add config.schema.lookup

**Files:**
- `src/api/config.ts`

**Step 1: Add method**

```typescript
/**
 * Lookup config schema.
 */
async schemaLookup(params?: { key?: string }): Promise<unknown> {
  return this.request('config.schema.lookup', params);
}
```

**Step 2: Test + verify + commit**

```bash
npm test -- src/api/config.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(config): add schema.lookup API"
```

---

### Task 4.2: Add tools.effective

**Files:**
- `src/api/skills.ts` — add `tools.effective` to existing `tools` getter

**Step 1: Read Gateway schema first**

```bash
grep -A 20 "ToolsEffectiveParamsSchema" /Users/linyang/workspace/my-projects/openclaw/src/gateway/protocol/schema/agents-models-skills.ts
```

**Step 2: Add to tools getter**

```typescript
async effective(params: { agentId?: string; sessionKey: string }): Promise<unknown> {
  return request('tools.effective', params);
}
```

**Step 3: Test + verify + commit**

```bash
npm test -- src/api/skills.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(skills): add tools.effective API"
```

---

## Phase 5: Chat & Device Pairing Module (Parallel Track A)

### Task 5.1: Add chat.abort

**Files:**
- `src/api/chat.ts`

**Step 1: Add method**

```typescript
/**
 * Abort a chat message.
 */
async abort(params: { key: string }): Promise<void> {
  await this.request('chat.abort', params);
}
```

**Step 2: Test + verify + commit**

```bash
npm test -- src/api/chat.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(chat): add abort API"
```

---

### Task 5.2: Add device.token.rotate + device.token.revoke

**Files:**
- `src/protocol/api-params.ts` — add types
- `src/api/devicePairing.ts` — add methods

**Step 1: Add types**

```typescript
export interface DeviceTokenRotateParams {
  deviceId: string;
  role: string;
  scopes?: string[];
}
export interface DeviceTokenRevokeParams {
  deviceId: string;
  role: string;
}
```

**Step 2: Add methods**

```typescript
/**
 * Rotate device token.
 */
async tokenRotate(params: DeviceTokenRotateParams): Promise<unknown> {
  return this.request('device.token.rotate', params);
}

/**
 * Revoke device token.
 */
async tokenRevoke(params: DeviceTokenRevokeParams): Promise<void> {
  await this.request('device.token.revoke', params);
}
```

**Step 3: Test + verify + commit**

```bash
npm test -- src/api/devicePairing.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(devicePairing): add token.rotate and token.revoke APIs"
```

---

## Phase 6: Browser Module

### Task 6.1: Implement BrowserAPI

**Files:**
- Create: `src/api/browser.ts`
- Modify: `src/api/index.ts` — export BrowserAPI
- Modify: `src/index.ts` — export `BrowserRequestParams`

**Step 1: Read Gateway's browser.request schema** (Gateway: `browser.request` method, params vary by action)

**Gateway path (for reference when Gateway repo available):** `/Users/linyang/workspace/my-projects/openclaw/src/gateway/`

**Step 2: Create BrowserAPI**

```typescript
import type { RequestFn } from './shared.js';

export class BrowserAPI {
  constructor(private request: RequestFn) {}

  /**
   * Issue a browser request.
   * @example
   * ```ts
   * await client.browser.request({ action: 'open', url: 'https://example.com' });
   * ```
   */
  async request(params: BrowserRequestParams): Promise<unknown> {
    return this.request('browser.request', params);
  }
}

// Define params based on Gateway schema
export interface BrowserRequestParams {
  action: string;
  url?: string;
  tabId?: string;
  [key: string]: unknown;
}
```

**Step 3: Test**

```typescript
// src/api/browser.test.ts
import { describe, it, expect, vi } from 'vitest';
import { BrowserAPI } from './browser.js';

describe('BrowserAPI', () => {
  const mockRequest = vi.fn();
  const client = { browser: new BrowserAPI(mockRequest) };

  it('browser.request calls correct method', async () => {
    mockRequest.mockResolvedValueOnce({ tabId: 'tab-1' });
    const result = await client.browser.request({ action: 'open', url: 'https://example.com' });
    expect(mockRequest).toHaveBeenCalledWith('browser.request', { action: 'open', url: 'https://example.com' });
  });
});
```

**Step 4: Verify + commit**

```bash
npm test -- src/api/browser.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(browser): add BrowserAPI"
```

---

## Phase 7: Push & Exec Approvals Module

### Task 7.1: Implement PushAPI

**Files:**
- Create: `src/api/push.ts`
- Modify: `src/api/index.ts`, `src/index.ts`

**Gateway reference:** `push.test` method exists in `server-methods-list.ts`

**Step 2: Create PushAPI**

```typescript
import type { RequestFn } from './shared.js';

export class PushAPI {
  constructor(private request: RequestFn) {}

  /**
   * Send a test push notification.
   */
  async test(params: { nodeId: string; title?: string; body?: string }): Promise<unknown> {
    return this.request('push.test', params);
  }
}
```

**Step 3: Test + verify + commit**

```bash
npm test -- src/api/push.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(push): add PushAPI"
```

---

### Task 7.2: Implement ExecApprovalsAPI

**Files:**
- Create: `src/api/execApprovals.ts`
- Modify: `src/api/index.ts`, `src/index.ts`

**Gateway reference:** `exec.approval.*` and `exec.approvals.*` methods in `server-methods-list.ts`

**Step 2: Create ExecApprovalsAPI**

```typescript
import type { RequestFn } from './shared.js';

export class ExecApprovalsAPI {
  constructor(private request: RequestFn) {}

  async request(params: { nodeId: string; prompt: string }): Promise<unknown> {
    return this.request('exec.approval.request', params);
  }

  async waitDecision(params: { nodeId: string; timeoutMs?: number }): Promise<unknown> {
    return this.request('exec.approval.waitDecision', params);
  }

  async resolve(params: { nodeId: string; decision: 'approve' | 'reject' }): Promise<void> {
    await this.request('exec.approval.resolve', params);
  }

  async get(params?: {}): Promise<unknown> {
    return this.request('exec.approvals.get', params);
  }

  async set(params: { enabled: boolean }): Promise<void> {
    await this.request('exec.approvals.set', params);
  }

  async nodeGet(params: { nodeId: string }): Promise<unknown> {
    return this.request('exec.approvals.node.get', params);
  }

  async nodeSet(params: { nodeId: string; enabled: boolean }): Promise<void> {
    await this.request('exec.approvals.node.set', params);
  }
}
```

**Step 3: Test + verify + commit**

```bash
npm test -- src/api/execApprovals.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(execApprovals): add ExecApprovalsAPI"
```

---

## Phase 8: System/Health Module

### Task 8.1: Implement SystemAPI

**Files:**
- Create: `src/api/system.ts`
- Modify: `src/api/index.ts`, `src/index.ts`

**Gateway reference:** `health`, `status`, `usage.*`, `doctor.memory.status`, `logs.tail`, `secrets.*`, `wizard.*`, `voicewake.*`, `update.run`, `models.list`, `tts.*`, `gateway.identity.get`, `system-presence`, `system-event` in `server-methods-list.ts`

**Step 2: Create SystemAPI**

```typescript
import type { RequestFn } from './shared.js';

export class SystemAPI {
  constructor(private request: RequestFn) {}

  async health(): Promise<unknown> {
    return this.request('health', {});
  }

  async status(): Promise<unknown> {
    return this.request('status', {});
  }

  async usageStatus(): Promise<unknown> {
    return this.request('usage.status', {});
  }

  async usageCost(): Promise<unknown> {
    return this.request('usage.cost', {});
  }

  async doctorMemoryStatus(): Promise<unknown> {
    return this.request('doctor.memory.status', {});
  }

  async logsTail(params?: { lines?: number }): Promise<unknown> {
    return this.request('logs.tail', params);
  }

  async secretsReload(): Promise<void> {
    await this.request('secrets.reload', {});
  }

  async secretsResolve(params: { key: string }): Promise<unknown> {
    return this.request('secrets.resolve', params);
  }

  async wizardStart(params: { wizardId: string; input?: unknown }): Promise<unknown> {
    return this.request('wizard.start', params);
  }

  async wizardNext(params: { wizardId: string; input?: unknown }): Promise<unknown> {
    return this.request('wizard.next', params);
  }

  async wizardCancel(params: { wizardId: string }): Promise<void> {
    await this.request('wizard.cancel', params);
  }

  async wizardStatus(params: { wizardId: string }): Promise<unknown> {
    return this.request('wizard.status', params);
  }

  async voicewakeGet(): Promise<unknown> {
    return this.request('voicewake.get', {});
  }

  async voicewakeSet(params: { enabled: boolean }): Promise<void> {
    await this.request('voicewake.set', params);
  }

  async updateRun(): Promise<unknown> {
    return this.request('update.run', {});
  }

  async modelsList(): Promise<unknown> {
    return this.request('models.list', {});
  }

  // TTS methods
  async ttsStatus(): Promise<unknown> {
    return this.request('tts.status', {});
  }

  async ttsProviders(): Promise<unknown> {
    return this.request('tts.providers', {});
  }

  async ttsEnable(): Promise<void> {
    await this.request('tts.enable', {});
  }

  async ttsDisable(): Promise<void> {
    await this.request('tts.disable', {});
  }

  async ttsConvert(params: { text: string; voice?: string }): Promise<unknown> {
    return this.request('tts.convert', params);
  }

  async ttsSetProvider(params: { provider: string }): Promise<void> {
    await this.request('tts.setProvider', params);
  }

  async gatewayIdentity(): Promise<unknown> {
    return this.request('gateway.identity.get', {});
  }

  async systemPresence(params: { action: string }): Promise<unknown> {
    return this.request('system-presence', params);
  }

  async systemEvent(params: { event: string; payload?: unknown }): Promise<void> {
    await this.request('system-event', params);
  }
}
```

**Step 3: Test + verify + commit**

```bash
npm test -- src/api/system.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(system): add SystemAPI"
```

---

## Phase 9: Channels Module

### Task 9.1: Implement ChannelsAPI

**Files:**
- Create: `src/api/channels.ts`
- Modify: `src/api/index.ts`, `src/index.ts`

**Gateway reference:** `channels.status`, `channels.logout`, `talk.config`, `talk.speak`, `talk.mode` in `server-methods-list.ts`

**Step 2: Create ChannelsAPI**

```typescript
import type { RequestFn } from './shared.js';

export class ChannelsAPI {
  constructor(private request: RequestFn) {}

  async status(): Promise<unknown> {
    return this.request('channels.status', {});
  }

  async logout(params: { channelId: string }): Promise<void> {
    await this.request('channels.logout', params);
  }

  // Talk sub-methods
  async talkConfig(): Promise<unknown> {
    return this.request('talk.config', {});
  }

  async talkSpeak(params: { text: string; voice?: string }): Promise<unknown> {
    return this.request('talk.speak', params);
  }

  async talkMode(params: { enabled: boolean }): Promise<void> {
    await this.request('talk.mode', params);
  }
}
```

**Step 3: Test + verify + commit**

```bash
npm test -- src/api/channels.test.ts --run && npm run typecheck && git add -A && git commit -m "feat(channels): add ChannelsAPI"
```

---

## Version & Release Strategy

### Breaking Changes (v2.0.0)

All of the following are breaking changes, batched into a single v2.0.0 release:

| Change | Migration |
|--------|-----------|
| `sessions.resolve` removed | Use `sessions.preview` instead |
| `AgentsCreateParams` fields changed | Add `name` + `workspace`, remove `agentId` + `files` |
| `AgentsUpdateParams` fields changed | Replace `files` array with individual optional fields |
| `SessionsSendParams` replaces `ChatInjectParams` | Rename `chatId` → `key`, update call site |
| `DevicePairApproveParams.pairingId` → `requestId` | Rename field in call sites |

### Release Order

```
Phase 1 (complete) → tag v2.0.0-beta.1 → internal testing
Phases 2-5 (parallel tracks) → tag v2.0.0-beta.2 → testing
Phases 6-9 (parallel tracks) → tag v2.0.0 → stable release
```

---

## Implementation Order

| Phase | Content | Parallel Track |
|-------|---------|----------------|
| Pre-audit | Full SDK vs Gateway diff | — |
| Phase 1 | Breaking type sync | Sequential (gate for all) |
| Phase 2 | Sessions | Track A (parallel with 3, 4, 5) |
| Phase 3 | Nodes | Track B (parallel with 2, 4, 5) |
| Phase 4 | Config + Skills | Track B (parallel with 2, 3, 5) |
| Phase 5 | Chat + Device Pairing | Track A (parallel with 2, 3, 4) |
| Phase 6 | Browser | Track C |
| Phase 7 | Push + Exec Approvals | Track C |
| Phase 8 | System/Health | Track C |
| Phase 9 | Channels | Track C |

---

## Verification Commands

After each task:

```bash
# Type check
npm run typecheck

# Module test
npm test -- src/api/{module}.test.ts --run

# Full test suite
npm test -- --run

# Build verification
npm run build

# Circular dependency check
npm run check:circular
```

After Phase 1 complete (before v2.0.0-beta.1):

```bash
npm run typecheck && npm test -- --run && npm run build && npm run check:circular
```

---

## ADR: Gateway API Sync Implementation Decision

**Decision:** Sync SDK to Gateway using parallel tracks post-Phase-1, with all breaking changes batched into a single v2.0.0 release.

**Drivers:**
- Gateway is the source of truth — SDK must not diverge
- Breaking changes should be atomic (one v2.0.0 release, not multiple)
- Parallel tracks after Phase 1 reduce total timeline from 8-9 weeks to ~4 weeks

**Review improvements applied (Iteration 2):**
- Added pre-computed inventory table to Pre-Phase Audit (cross-repo Gateway paths replaced with "Gateway reference:" notes)
- Confirmed `NodePairApproveParams` ≠ `DevicePairApproveParams` (separate subsystems)
- Added "Phase 1 type freeze" commitment in ADR
- Added Node.pending clarification: all four methods (drain/enqueue/pull/ack) coexist

**Alternatives considered:**
- Sequential phases: safer but slower (8-9 weeks)
- No version bump: leaves SDK in inconsistent state, misleading consumers

**Why chosen:** Parallel tracks are safe because Phase 1 stabilizes all shared types. Subsequent phases operate on independent modules.

**Phase 1 type freeze:** After Phase 1 commits to `v2.0.0-beta.1`, Phase 1 types (`AgentsCreateParams`, `AgentsUpdateParams`, `SessionsSendParams`, `DevicePairApproveParams`) are **frozen** — no revisions allowed without a new beta tag. This ensures parallel tracks (2-5) remain synchronized on a stable type baseline.

**Node.pending distinction:** `node.pending.drain` and `node.pending.enqueue` are **existing SDK methods** confirmed in Gateway. `node.pending.pull` and `node.pending.ack` are **new additions**. They serve different purposes: drain=enqueue consumption, pull=batch retrieval, ack=acknowledgment. All four will coexist.

**Consequences:**
- SDK consumers must migrate to v2.0.0 in one step
- Beta release before parallel phases catches any Phase 1 oversights

**Follow-ups:**
- [ ] Write migration guide for v2.0.0
- [ ] Update CHANGELOG.md with all breaking changes
- [ ] Consider codegen from Gateway schemas to SDK types (long-term)
