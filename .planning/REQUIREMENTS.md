# Requirements: OpenClaw SDK TypeScript v2.0

**Defined:** 2026-03-29
**Core Value:** The SDK must reliably maintain a WebSocket connection with the Gateway, automatically recovering from all common failure modes — token expiry, network drops, protocol mismatches, and server unavailability.

## v1 Requirements

Requirements for v2.0 hardening release. Each maps to roadmap phases.

### Reliability

- [x] **REL-01**: Wire AuthHandler into the reconnect path — token refresh must happen on reconnect
- [ ] **REL-02**: Activate TickMonitor — add timer loop to auto-call checkStale(), fire onStale callback
- [ ] **REL-03**: Implement GapDetector recovery actions — 'reconnect' triggers reconnect, 'snapshot' calls snapshot endpoint

### Refactoring

- [ ] **REF-01**: Extract API namespace initialization and connection handler setup from client.ts into separate modules
- [x] **REF-02**: Split api-params.ts into per-domain files (chat.ts, agents.ts, sessions.ts, etc.)

### Bug Fixes

- [x] **BUG-01**: Fix EventManager once() off() cleanup — store original handler, match by reference in off()
- [x] **BUG-02**: Remove redundant cleanupAbortHandler — keep only finally block cleanup
- [ ] **BUG-03**: Add reconnect delay before first attempt in ReconnectManager — prevent thundering herd
- [ ] **BUG-04**: Make WebSocketTransport.send() throw typed ConnectionError instead of raw WebSocketError
- [ ] **BUG-05**: RequestManager.resolveRequest() — return silently on duplicate response instead of throwing

### Transport

- [ ] **TRANS-01**: Extract shared logic from Node and Browser transports into base WebSocketTransport

### Hardening

- [ ] **HARD-01**: Add protocol version fallbacks — allow version 2 with graceful degradation
- [ ] **HARD-02**: Add MAX_MESSAGE_SIZE validation in WebSocketTransport before buffering
- [ ] **HARD-03**: Add missing API test coverage for cron, skills, browser, push, usage namespaces
- [ ] **HARD-04**: Add missing NodesAPI pairing sub-namespace types (Promise<unknown> → typed results)
- [ ] **HARD-05**: Use fixed-size ring buffer for GapDetector gaps array
- [ ] **HARD-06**: Document private key / password in-memory limitations in StaticCredentialsProvider
- [ ] **HARD-07**: Document TLS constant-time comparison as best-effort fallback

### Observability

- [ ] **OBS-01**: Add optional metrics hook for request latency, connection uptime, message throughput

## Out of Scope

| Feature | Reason |
|---------|--------|
| Binary frame encoding/decoding | Protocol doesn't use it yet |
| Streaming JSON parsing | Performance gain doesn't justify complexity |
| E2E tests with real server | Requires running Gateway; belongs in integration test suite |
| WebSocket library swap | ws is stable; monitor security advisories |
| Breaking API changes | v2.0 is hardening, not redesign |

## Traceability

| Requirement | Phase | Status |
|------------|-------|--------|
| REL-01 | Phase 1 | Complete |
| REL-02 | Phase 1 | Pending |
| REL-03 | Phase 1 | Pending |
| REF-01 | Phase 2 | Pending |
| REF-02 | Phase 2 | Complete |
| BUG-01 | Phase 3 | Complete |
| BUG-02 | Phase 3 | Complete |
| BUG-03 | Phase 3 | Pending |
| BUG-04 | Phase 3 | Pending |
| BUG-05 | Phase 3 | Pending |
| TRANS-01 | Phase 4 | Pending |
| HARD-01 | Phase 5 | Pending |
| HARD-02 | Phase 5 | Pending |
| HARD-03 | Phase 5 | Pending |
| HARD-04 | Phase 5 | Pending |
| HARD-05 | Phase 5 | Pending |
| HARD-06 | Phase 5 | Pending |
| HARD-07 | Phase 5 | Pending |
| OBS-01 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-29*
