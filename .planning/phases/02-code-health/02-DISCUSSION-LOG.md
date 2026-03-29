# Phase 2: Code Health - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 02-code-health
**Areas discussed:** REF-01 (client.ts extraction), REF-02 (api-params.ts split)

---

## REF-01: client.ts Extraction Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Per-API factory modules | Create src/api-init/ with factory functions, client.ts calls these | |
| Nested class extraction | Move existing API classes into client.ts then extract | |
| **Builder pattern** | **ClientBuilder handles all wiring, client.ts is thin facade** | **✓** |

**User's choice:** Builder pattern
**Notes:** Chainable/fluent API preferred. ClientBuilder becomes primary entry point.

---

## Builder API Style

| Option | Description | Selected |
|--------|-------------|----------|
| **Fluent (chainable)** | **`new ClientBuilder(url, clientId).withAuth(token).withReconnect(true).build()`** | **✓** |
| Step-based (clearer) | builder.setAuth(); builder.setReconnect(); builder.build() | |

**User's choice:** Fluent (chainable)

---

## Entry Point Decision

| Option | Description | Selected |
|--------|-------------|----------|
| Keep createClient() as wrapper | createClient() stays, wraps ClientBuilder | |
| **Remove createClient()** | **ClientBuilder is primary (breaking change)** | **✓** |

**User's choice:** Remove createClient(), ClientBuilder is primary
**Notes:** Breaking change accepted. User explicitly stated "不需要再向后兼容，无需保留createClient()"

**Constraint conflict resolved:**
- PROJECT.md says "no breaking API changes"
- User accepted breaking change for REF-01
- Decision logged as D-07: Accept breaking API change

---

## REF-02: api-params.ts Split

| Option | Description | Selected |
|--------|-------------|----------|
| **src/api/*.ts (co-located)** | **Move XxxParams/XxxResult to corresponding src/api/*.ts** | **✓** |
| src/protocol/params/ (centralized) | Keep under src/protocol/params/ with subdirectory per domain | |
| Hybrid | Co-locate domain types, shared in protocol/ | |

**User's choice:** src/api/*.ts (co-located)
**Notes:** Shared types (AgentSummary, WizardStep) stay in src/protocol/api-common.ts

---

## Scope: Both Areas Discussed

User selected "Both areas" from initial prompt, covering REF-01 and REF-02.

---

## Deferred Ideas

- Consumer migration guide for breaking change — defer to Phase 5 (Hardening)
- Version bump coordination — major version bump needed for breaking change

---

*Log created: 2026-03-29*
