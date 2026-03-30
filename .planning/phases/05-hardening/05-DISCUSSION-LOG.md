# Phase 5: Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 05-hardening
**Areas discussed:** HARD-01 (protocol fallbacks), HARD-02 (MAX_MESSAGE_SIZE), HARD-03 (test coverage)

---

## HARD-01: Protocol Version Fallbacks

| Option | Description | Selected |
|--------|-------------|----------|
| A1: v3→v2→v1 fallback | Prefer v3, fall back to v2 then v1 (recommended) | ✓ |
| A2: Prefer v2 | Conservative route, prefer v2 first | |
| A3: Try all versions | Attempt all versions until one succeeds | |

| Option | Description | Selected |
|--------|-------------|----------|
| B1: WARNING log + continue | Log warning on fallback, continue connecting (recommended) | ✓ |
| B2: Silent accept | Silently accept, no log | |
| B3: Throw error | Throw error, terminate connection (current behavior) | |

| Option | Description | Selected |
|--------|-------------|----------|
| C1: ProtocolVersionRange[] array | Explicit ordered list, flexible (recommended) | ✓ |
| C2: Single range expansion | Auto-expand min:1, max:3 to [3,2,1] | |

**User's choice:** A1 + B1 + C1 — v3→v2→v1 fallback order, WARNING log on degradation, array structure
**Notes:** v3 is current standard; fallback to older versions is compatibility mode. User wants visibility via WARNING log but doesn't want connection interrupted.

---

## HARD-02: MAX_MESSAGE_SIZE Validation

| Option | Description | Selected |
|--------|-------------|----------|
| A1: Read HelloOk.policy.maxPayload | Use Gateway-declared limit, stays in sync (recommended) | ✓ |
| A2: Hardcode 10MB | Simple but may not match Gateway | |
| A3: max(10MB, Gateway) | Take larger value, redundant | |

| Option | Description | Selected |
|--------|-------------|----------|
| B1: Throw ConnectionError | Fail-fast, caller must handle (recommended) | ✓ |
| B2: Silent truncate + warning | Silently truncate and log warning | |
| B3: Log warning but send | Warning only, not protective | |

**User's choice:** A1 + B1 — read from Gateway policy, throw ConnectionError on over-limit
**Notes:** Gateway knows its own limits; SDK should respect those limits and fail loudly when a caller tries to send oversized data.

---

## HARD-03: Missing API Test Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| A1: 2-3 core tests per namespace | Cover primary methods, error handling, edge cases (recommended) | ✓ |
| A2: 5+ comprehensive tests | Full coverage per namespace | |

| Option | Description | Selected |
|--------|-------------|----------|
| B1: Mock RequestManager | Isolate API layer from transport (recommended) | ✓ |
| B2: Mock WebSocket transport | Integration test style | |

**User's choice:** A1 + B1 — 2-3 core tests per namespace, mock RequestManager
**Notes:** Consistent with existing test patterns in codebase. API layer should be tested independently of transport.

---

## Already-Implemented (Not Discussed)

| Requirement | Finding |
|------------|---------|
| HARD-04 | NodesAPI pairing already fully typed Promise<T> in src/api/nodes.ts:131-161 |
| HARD-05 | GapDetector gaps array design already reasonable; ring buffer not needed |
| HARD-06 | JSDoc additions only — documented in context |
| HARD-07 | constantTimeCompare already implemented; JSDoc note only |

---

## Deferred Ideas

None — discussion stayed within phase scope.
