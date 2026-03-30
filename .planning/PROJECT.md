# OpenClaw SDK TypeScript — v2.0 Quality & Resilience

## What This Is

A production-grade WebSocket client SDK for the OpenClaw Gateway, written in TypeScript. The v2.0 milestone focuses on fixing critical reliability bugs, resolving technical debt, and hardening the SDK for production workloads. All 15 Gateway API namespaces are already implemented and tested.

## Core Value

**The SDK must reliably maintain a WebSocket connection with the Gateway, automatically recovering from all common failure modes — token expiry, network drops, protocol mismatches, and server unavailability.**

## Requirements

### Validated

(None yet — this is v2.0 work on top of existing v1)

### Active

#### Phase 1 — Critical Reliability Fixes (COMPLETED)
- [x] **REL-01**: Wire AuthHandler into the reconnect path — token refresh must happen on reconnect
- [x] **REL-02**: Activate TickMonitor — add timer loop to auto-call checkStale(), fire onStale callback
- [x] **REL-03**: Implement GapDetector recovery actions — 'reconnect' triggers reconnect, 'snapshot' calls snapshot endpoint

Validated in Phase 1: All 3 critical reliability requirements implemented and verified.

#### Phase 2 — Code Health (Large File Refactoring)
- [ ] **REF-01**: Extract API namespace initialization and connection handler setup from client.ts into separate modules
- [ ] **REF-02**: Split api-params.ts into per-domain files (chat.ts, agents.ts, sessions.ts, etc.)

#### Phase 3 — Bug Fixes (COMPLETED)
- [x] **BUG-01**: Fix EventManager once() off() cleanup — store original handler, match by reference in off()
- [x] **BUG-02**: Remove redundant cleanupAbortHandler — keep only finally block cleanup
- [x] **BUG-03**: Add reconnect delay before first attempt in ReconnectManager — prevent thundering herd
- [x] **BUG-04**: Make WebSocketTransport.send() throw typed ConnectionError instead of raw WebSocketError
- [x] **BUG-05**: RequestManager.resolveRequest() — return silently on duplicate response instead of throwing

#### Phase 4 — Transport Consolidation
- [ ] **TRANS-01**: Extract shared logic from Node and Browser transports into base WebSocketTransport

#### Phase 5 — Hardening & Completeness
- [ ] **HARD-01**: Add protocol version fallbacks — allow version 2 with graceful degradation
- [ ] **HARD-02**: Add MAX_MESSAGE_SIZE validation in WebSocketTransport before buffering
- [ ] **HARD-03**: Add missing API test coverage for cron, skills, browser, push, usage namespaces
- [ ] **HARD-04**: Add missing NodesAPI pairing sub-namespace types (Promise<unknown> → typed results)
- [ ] **HARD-05**: Use fixed-size ring buffer for GapDetector gaps array
- [ ] **HARD-06**: Document private key / password in-memory limitations in StaticCredentialsProvider
- [ ] **HARD-07**: Document TLS constant-time comparison as best-effort fallback

#### Phase 6 — Observability (COMPLETED)
- [x] **OBS-01**: Add optional metrics hook for request latency, connection uptime, message throughput

Validated in Phase 6: MetricsCollector interface added with zero-overhead callback pattern.

### Out of Scope

- Binary frame encoding/decoding — protocol doesn't use it yet
- Streaming JSON parsing — performance gain doesn't justify complexity yet
- E2E tests with real server — requires a running Gateway instance, too complex for this SDK repo
- WebSocket library swap — ws is stable, monitor security advisories instead

## Context

This is a brownfield project. The v1 SDK (current state) is functional and tested with 872 unit/integration tests across 47 files. All 15 Gateway API namespaces are implemented. The SDK targets Node.js >=22.0.0 and browser environments.

Key existing patterns:
- Factory functions (`createXxx()`) wrap all class instantiation
- Error hierarchy: `OpenClawError` → `ConnectionError` / `AuthError` / `TimeoutError` / etc.
- Event-driven pipeline: ConnectionManager → RequestManager → EventManager
- Dual output: ESM + CJS via tsup
- TypeScript strict mode enabled

## Constraints

- **TypeScript strict mode**: All code must pass `tsc --strict`
- **No breaking API changes**: v2.0 is backward-compatible — existing public APIs cannot change signatures
- **Test coverage**: All bug fixes must include test cases; 80% minimum coverage maintained
- **ESM + CJS**: Refactoring must preserve dual compilation output

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Prioritize auth/tick/gap fixes over feature work | These block production readiness | — Pending |
| Split large files by domain, not by arbitrary size | Domain boundaries are stable; size limits shift | — Pending |
| No breaking API changes | v2.0 is a hardening release, not a redesign | — Pending |
| E2E tests deferred | Requires running Gateway; out of scope for SDK unit tests | — Pending |

---

*Last updated: 2026-03-31 after Phase 6 Observability completion*
