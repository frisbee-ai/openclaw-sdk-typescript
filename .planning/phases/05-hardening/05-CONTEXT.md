# Phase 5: Hardening - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Close remaining hardening gaps — protocol compatibility, message size limits, missing test coverage, and security documentation. 7 requirements: HARD-01 through HARD-07.

</domain>

<decisions>
## Implementation Decisions

### HARD-01: Protocol Version Fallbacks

- **D-01:** Fallback order: **v3 → v2 → v1** (newest to oldest, Gateway v3 is current standard, v2/v1 are compatibility modes)
- **D-02:** Degraded behavior: **WARNING log + continue connecting** — user is informed of version degradation but connection proceeds
- **D-03:** Structure: **`ProtocolVersionRange[]` array** — explicit ordered list (e.g., `[{min:3,max:3}, {min:2,max:2}, {min:1,max:1}]`), not single range expansion
- **D-04:** `negotiate()` tries each range in order when server rejects; logs warning on successful fallback; throws only when all ranges exhausted
- **D-05:** `DEFAULT_PROTOCOL_VERSION` becomes `DEFAULT_PROTOCOL_VERSIONS: ProtocolVersionRange[] = [{min:3,max:3}, {min:2,max:2}, {min:1,max:1}]`

### HARD-02: MAX_MESSAGE_SIZE Validation

- **D-06:** Threshold source: **read from `HelloOk.policy.maxPayload`** (negotiated at connection time, Gateway declares its own limit) — no hardcoded constant needed
- **D-07:** Storage: `maxPayload` stored in `ConnectionManager` after `hello-ok` received; passed to `WebSocketTransport` via config
- **D-08:** Check location: in `WebSocketTransport.send()` before passing data to WebSocket
- **D-09:** Over-limit behavior: **throw `ConnectionError`** with code `MESSAGE_TOO_LARGE` — fail-fast, caller must handle

### HARD-03: Missing API Test Coverage

- **D-10:** Target namespaces: **cron, skills, push** (3 namespaces missing tests; browser.test.ts and usage.test.ts already exist)
- **D-11:** Test count: **2-3 core tests per namespace** — cover primary methods, error handling, and edge cases
- **D-12:** Mock strategy: **Mock `RequestManager`** — isolate API layer logic from transport layer; consistent with existing API tests in codebase

### Already-Implemented Requirements (No Discussion Needed)

- **HARD-04:** NodesAPI pairing sub-namespace (`src/api/nodes.ts:125-163`) already fully typed with `Promise<T>` results — no changes needed
- **HARD-05:** GapDetector gaps array design (`src/events/gap.ts:51`) already uses private array with `reset()` — bounded usage pattern; ring buffer not needed given current usage
- **HARD-06:** `StaticCredentialsProvider` (`src/auth/provider.ts:96`) — add JSDoc documenting: private key held in plaintext in memory; `signChallenge()` wipes `keyBuffer` after use but original `privateKey` string remains in memory; recommend HSM or keyring for production
- **HARD-07:** `TlsValidator` (`src/connection/tls.ts`) — add JSDoc noting `constantTimeCompare()` uses XOR loop over full length; timing-safe for equal-length strings; falls back to lexicographic comparison for different lengths

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Files (Hardening Requirements)
- `src/connection/protocol.ts` — ProtocolNegotiator, negotiate(), DEFAULT_PROTOCOL_VERSION (HARD-01)
- `src/managers/connection.ts` — ConnectionManager receives HelloOk, has access to policy.maxPayload (HARD-02)
- `src/transport/websocket.ts` — WebSocketTransport.send() (HARD-02)
- `src/auth/provider.ts` — StaticCredentialsProvider (HARD-06)
- `src/connection/tls.ts` — TlsValidator.constantTimeCompare (HARD-07)
- `src/events/gap.ts` — GapDetector gaps array (HARD-05 — already complete)
- `src/api/nodes.ts` — NodesAPI pairing sub-namespace (HARD-04 — already complete)

### Test Files
- `src/api/cron.test.ts` — **MISSING** (HARD-03)
- `src/api/skills.test.ts` — **MISSING** (HARD-03)
- `src/api/push.test.ts` — **MISSING** (HARD-03)
- `src/api/browser.test.ts` — exists
- `src/api/usage.test.ts` — exists
- `src/api/shared.ts` — RequestFn type (used for mocking in HARD-03)

### Protocol Types
- `src/protocol/connection.ts` — HelloOk.policy.maxPayload definition (HARD-02)
- `src/protocol/frames.ts` — frame type definitions

### Prior Phase Context
- `.planning/phases/04-transport-consolidation/04-CONTEXT.md` — WebSocketTransport base class structure
- `.planning/phases/03-bug-fixes/03-CONTEXT.md` — ConnectionError usage patterns
- `.planning/PROJECT.md` — Core value (reliable connection), constraints (strict TypeScript, backward compat)
- `.planning/ROADMAP.md` — Phase 5 goal and HARD-01 through HARD-07 definitions

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Integration Points for HARD-01
- `client-builder.ts:271`: `createProtocolNegotiator({ min: 3, max: 3 })` — must change to accept array
- `src/connection/protocol.ts`: `negotiate()` method (lines 82-99) — needs fallback loop + warning log
- `src/client-builder.ts`: Creates ProtocolNegotiator at construction time
- ProtocolNegotiator is constructed before connection; negotiated version set after `hello-ok` received

### Integration Points for HARD-02
- `ConnectionManager` has `policyManager` and receives `HelloOk` with `policy.maxPayload`
- `WebSocketTransport` config currently: `{ connectTimeoutMs }` — add `maxPayload?: number`
- `send()` method (lines 441-463) — add size check before `ws.send()`
- `ConnectionError` already exists — use with code `MESSAGE_TOO_LARGE`

### Integration Points for HARD-03
- Pattern: see existing `src/api/chat.test.ts` or `src/api/agents.test.ts` for test structure
- Each test creates a mock `RequestFn` and passes it to the API constructor
- Methods tested: happy path, error propagation, parameter passing

### Existing Constants
- `src/transport/websocket.ts`: No MAX_MESSAGE_SIZE currently defined
- `src/managers/connection.ts`: Has `_maxPayload?: number` — confirmed present

</codebase_context>

<specifics>
## Specific Ideas

- HARD-01: `ProtocolNegotiator` constructor signature changes from `range: Partial<ProtocolVersionRange>` to `ranges: ProtocolVersionRange[]`
- HARD-02: `ConnectionError` code `MESSAGE_TOO_LARGE` may need to be added to error codes
- HARD-03: Each test file follows pattern: `describe('CronAPI', () => { let api: CronAPI; let mockRequest: RequestFn; beforeEach(() => { mockRequest = vi.fn(); api = new CronAPI(mockRequest); }); ... })`
- HARD-06/07: JSDoc additions only — no runtime code changes

</specifics>

<deferred>
## Deferred Ideas

None — all 7 requirements addressed in scope.

</deferred>

---

*Phase: 05-hardening*
*Context gathered: 2026-03-31*
