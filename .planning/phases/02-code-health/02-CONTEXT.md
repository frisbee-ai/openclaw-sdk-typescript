# Phase 2: Code Health - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Split oversized files to improve maintainability, testability, and review quality.
- REF-01: Extract API namespace initialization and connection handler setup from client.ts into separate modules
- REF-02: Split api-params.ts into per-domain files (chat.ts, agents.ts, sessions.ts, etc.)

**Success Criteria:**
1. `client.ts` is reduced to ≤800 lines
2. `api-params.ts` is split into separate files under `src/protocol/params/`
3. All existing tests still pass
4. Public API exports in `src/index.ts` are unchanged

</domain>

<decisions>
## Implementation Decisions

### REF-01: client.ts Extraction Strategy
- **D-01:** Use **Builder pattern** — `ClientBuilder` handles all API wiring, client.ts becomes thin facade
- **D-02:** Builder API is **fluent/chainable** — `new ClientBuilder(url, clientId).withAuth(token).withReconnect(true).withGapDetection(config).build()`
- **D-03:** `createClient()` factory is **removed** — `ClientBuilder` is the primary entry point (breaking change accepted)

### REF-02: api-params.ts Split
- **D-04:** **Co-located types** — Move each `XxxParams`/`XxxResult` interface to its corresponding `src/api/*.ts` file (e.g., `ChatParams`/`ChatResult` go into `src/api/chat.ts`)
- **D-05:** Shared/common types (`AgentSummary`, `WizardStep`) remain in `src/protocol/api-common.ts`
- **D-06:** `api-params.ts` is deleted after types are moved

### Breaking Change Acknowledgment
- **D-07:** Accept breaking API change — `createClient()` removed, `ClientBuilder` is new primary entry
  - Consumer applications must migrate to `new ClientBuilder()...build()`
  - This is a deliberate architectural decision, not a hardening constraint

### Claude's Discretion
- File structure within `src/api/` for co-located types (interface placement within files)
- Builder implementation details (defaults, validation order, error handling)
- Test structure for refactored code

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Constraints
- `.planning/PROJECT.md` — Core value, constraints (strict TypeScript, backward compat noted), key decisions
- `.planning/REQUIREMENTS.md` — REF-01, REF-02 requirements
- `.planning/ROADMAP.md` — Phase 2 goals and success criteria

### Phase 1 Context
- `.planning/phases/01-critical-reliability/01-CONTEXT.md` — Prior decisions on manager wiring patterns
- `.planning/phases/01-critical-reliability/01-VERIFICATION.md` — Verification approach

### Existing Code Structure
- `src/client.ts` (1110 lines) — TO BE REFACTORED: extract API init and connection setup
- `src/protocol/api-params.ts` (809 lines) — TO BE SPLIT: move types to `src/api/*.ts`
- `src/api/chat.ts`, `src/api/agents.ts`, etc. — Existing API classes (co-location targets)
- `src/protocol/api-common.ts` — Existing shared types (stays in place)
- `src/index.ts` — Public exports (must be updated after refactor)

### Key Patterns
- `src/auth/provider.ts` — Factory pattern example (createAuthHandler)
- `src/managers/connection.ts` — Constructor with many config options (Builder reference)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- API classes already exist in `src/api/` (chat.ts, agents.ts, sessions.ts, etc.) — REF-02 types go next to these
- Factory pattern already established: `createXxx()` functions throughout codebase
- Builder-like config normalization already in client.ts constructor

### Established Patterns
- Factory functions wrap all class instantiation
- Error hierarchy: `OpenClawError` base → typed subclasses
- Event-driven pipeline: ConnectionManager → RequestManager → EventManager
- Dual ESM + CJS output preserved via tsconfig

### Integration Points
- `src/index.ts` re-exports all public types/classes — must update after refactor
- `client.ts` is entry point for all manager instantiation — Builder replaces this
- API classes receive `RequestFn` closure — Builder wires this

</code_context>

<specifics>
## Specific Ideas

- ClientBuilder should have sensible defaults for all config options (matches current DEFAULT_* constants in client.ts)
- Builder methods: `withAuth()`, `withReconnect()`, `withGapDetection()`, `withTickMonitor()`, `withLogger()`
- Error thrown if required config (url, clientId) missing at build() time

</specifics>

<deferred>
## Deferred Ideas

### Breaking Change Process
- Consumer migration guide — deferred to Phase 5 (Hardening) or a separate migration doc
- Version bump to v2.0 (major) — coordinate with breaking change communication

</deferred>

---

*Phase: 02-code-health*
*Context gathered: 2026-03-29*
