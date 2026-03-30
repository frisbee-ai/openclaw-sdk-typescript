---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: milestone
status: Executing Phase 03
last_updated: "2026-03-30T02:58:36.716Z"
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 8
  completed_plans: 6
---

# State: OpenClaw SDK TypeScript v2.0

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-29)

**Core value:** The SDK must reliably maintain a WebSocket connection with the Gateway, automatically recovering from all common failure modes.

**Current focus:** Phase 03 — bug-fixes

## Milestone

**Version:** v2.0

**Goal:** Fix all critical reliability bugs, resolve technical debt, and harden the SDK for production workloads.

## Phase Status

| Phase | Name | Status | Plans | Progress |
|-------|------|--------|-------|----------|
| 1 | Critical Reliability | ● | 3/3 | 100% |
| 2 | Code Health | ● | 2/2 | 100% |
| 3 | Bug Fixes | ○ | 1/5 | 20% |
| 4 | Transport Consolidation | ○ | 0/1 | 0% |
| 5 | Hardening | ○ | 0/7 | 0% |
| 6 | Observability | ○ | 0/1 | 0% |

## Decisions

(— recorded during execution)

- [Phase 01-critical-reliability]: ReconnectManager.reconnect(connectFn, refreshTokenFn) pattern for token refresh during reconnect
- [Phase 01-critical-reliability]: GapDetector remains pure detector; client.ts handles recovery actions (D-05)
- [Phase 01-critical-reliability]: Initialized state pattern in GapDetector prevents false-positive gaps on first sequence
- [Phase 02-code-health]: ClientBuilder is primary entry point, fluent chainable API (D-01, D-02, D-03)
- [Phase 02-code-health]: api-params.ts types co-located next to respective src/api/*.ts files (D-04)
- [Phase 02-code-health]: ClientBuilder uses ClientConfig imported from client.ts (avoids circular deps)
- [Phase 02-code-health]: createClient kept as backward-compatible factory (not removed to avoid breaking examples)
- [Phase 02-code-health]: Types co-located next to their API classes (D-04); Shared types stay in api-common.ts (D-05); api-params.ts deleted after migration (D-06)

## Open Issues

- AuthHandler wiring into reconnect path needs careful design to avoid circular dependencies
- TickMonitor timer loop must be stopped on client disconnect to prevent memory leaks (FIXED in plan 02)
- GapDetector recovery modes must not trigger infinite reconnect loops (ADDRESSED in plan 03)

## Session History

| Date | Session | Summary |
|------|---------|---------|
| 2026-03-29 | Initial | Codebase mapped, v2.0 requirements defined, 6-phase roadmap created |
| 2026-03-29 | Phase 1 discuss | Context gathered for Critical Reliability (REL-01, REL-02, REL-03), 6 decisions captured |
| 2026-03-29 | Phase 1 plan 02 | Completed REL-02: TickMonitor automatic staleness detection via TimeoutManager.setInterval() |
| 2026-03-29 | Phase 1 plan 03 | Completed REL-03: GapDetector gap event listener with mode-based recovery dispatch |
| 2026-03-29 | Phase 2 plan 02 | Completed REF-02: Split api-params.ts into 15 per-domain type files |
| 2026-03-29 | Phase 2 plan 01 | Completed REF-01: ClientBuilder extraction with fluent API |
| 2026-03-30 | Phase 3 plan 01 | Completed BUG-01 (EventManager once() token cleanup) and BUG-02 (redundant abort handler cleanup) |

*Last updated: 2026-03-30 after plan 03-01 completion*
