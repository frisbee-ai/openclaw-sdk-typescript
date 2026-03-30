# Roadmap: OpenClaw SDK TypeScript v2.0

**Phases:** 6 | **Requirements:** 18 | **Model:** Balanced

## Overview

This roadmap addresses all technical debt and reliability issues identified in the codebase analysis. Each phase is self-contained and can be verified independently.

| Phase | Name | Goal | Requirements | Success Criteria |
|-------|------|------|-------------|------------------|
| 1 | Critical Reliability | 3/3 | Complete|  |
| 2 | Code Health | Split client.ts and api-params.ts large files | REF-01, REF-02 | 3/3 |
| 3 | Bug Fixes | 2/2 | Complete   | 2026-03-30 |
| 4 | Transport Consolidation | 1/1 | Complete   | 2026-03-30 |
| 5 | Hardening | Protocol fallbacks, message size limits, test coverage, docs | HARD-01–HARD-07 | 7/7 |
| 6 | Observability | 2/2 | Complete|  |

---

## Phase 1: Critical Reliability

**Goal:** Make the SDK self-healing — it must automatically recover from token expiry, connection stalls, and message gaps.

### Requirements

- [x] **REL-01**: Wire AuthHandler into the reconnect path — token refresh must happen on reconnect
- [x] **REL-02**: Activate TickMonitor — add timer loop to auto-call checkStale(), fire onStale callback
- [x] **REL-03**: Implement GapDetector recovery actions — 'reconnect' triggers reconnect, 'snapshot' calls snapshot endpoint

### Success Criteria

1. When a token expires during a reconnect, `authHandler.refreshToken()` is called and the new token is used
2. When no tick is received for `stalenessThresholdMs`, the `onStale` callback fires automatically
3. When a gap is detected in `reconnect` mode, `ConnectionManager.reconnect()` is called
4. When a gap is detected in `snapshot` mode, the configured snapshot endpoint is called

**Plans:** 3/3 plans executed

Plans:
- [x] 01-PLAN.md — Wire AuthHandler into reconnect path via ReconnectManager
- [x] 02-PLAN.md — Extend TimeoutManager with setInterval, wire TickMonitor timer loop
- [x] 03-PLAN.md — Implement GapDetector recovery actions in client.ts

---

## Phase 2: Code Health

**Goal:** Split oversized files to improve maintainability, testability, and review quality.

### Requirements

- [x] **REF-01**: Extract API namespace initialization and connection handler setup from client.ts into separate modules
- [x] **REF-02**: Split api-params.ts into per-domain files (chat.ts, agents.ts, sessions.ts, etc.)

### Success Criteria

1. `client.ts` is reduced to ≤800 lines
2. `api-params.ts` is split into separate files under `src/protocol/params/`
3. All existing tests still pass
4. Public API exports in `src/index.ts` are unchanged

**Plans:** 3/3 plans (including gap closure)

Plans:
- [x] 02-01-PLAN.md — ClientBuilder refactor (REF-01)
- [x] 02-02-PLAN.md — api-params.ts split (REF-02)
- [x] 02-03-PLAN.md — Complete manager extraction, remove createClient (gap closure)

---

## Phase 3: Bug Fixes

**Goal:** Fix 5 bugs identified in codebase analysis — most are one-liners but critical for correctness.

### Requirements

- [ ] **BUG-01**: Fix EventManager once() off() cleanup — store original handler, match by reference in off()
- [ ] **BUG-02**: Remove redundant cleanupAbortHandler — keep only finally block cleanup
- [ ] **BUG-03**: Add reconnect delay before first attempt in ReconnectManager — prevent thundering herd
- [ ] **BUG-04**: Make WebSocketTransport.send() throw typed ConnectionError instead of raw WebSocketError
- [ ] **BUG-05**: RequestManager.resolveRequest() — return silently on duplicate response instead of throwing

### Success Criteria

1. `client.off()` after `client.once()` successfully removes the subscription
2. Abort handler cleanup code is in exactly one place (finally block)
3. First reconnect attempt waits at least `reconnectDelayMs` before connecting
4. `ws.send()` errors propagate as `ConnectionError` subclasses
5. Duplicate server responses are handled silently without throwing

**Plans:** 2/2 plans complete

Plans:
- [x] 03-01-PLAN.md — Fix EventManager once/off (BUG-01) and client abort cleanup (BUG-02)
- [x] 03-02-PLAN.md — Fix reconnect delay (BUG-03), typed send error (BUG-04), silent duplicate response (BUG-05)

---

## Phase 4: Transport Consolidation

**Goal:** Eliminate code duplication between Node.js and browser WebSocket transports.

### Requirements

- [x] **TRANS-01**: Extract shared logic from Node and Browser transports into base WebSocketTransport

### Success Criteria

1. All shared behavior (connect, send, close, error handling) lives in `WebSocketTransport`
2. Node transport and browser transport are thin wrappers differing only in `getDefaultWebSocket()`
3. No logic divergence between the two transports
4. All transport tests still pass

**Plans:** 1/1 plan executed

Plans:
- [x] 04-01-PLAN.md — Create WebSocketTransport abstract base class (TRANS-01)
- [x] 04-02-PLAN.md — Gap closure: refactor BrowserWebSocketTransport to thin subclass

---

## Phase 5: Hardening

**Goal:** Close remaining gaps — protocol compatibility, security docs, missing test coverage.

### Requirements

- [ ] **HARD-01**: Add protocol version fallbacks — allow version 2 with graceful degradation
- [x] **HARD-02**: Add MAX_MESSAGE_SIZE validation in WebSocketTransport before buffering
- [x] **HARD-03**: Add missing API test coverage for cron, skills, browser, push, usage namespaces
- [ ] **HARD-04**: Add missing NodesAPI pairing sub-namespace types (Promise<unknown> → typed results)
- [ ] **HARD-05**: Use fixed-size ring buffer for GapDetector gaps array
- [x] **HARD-06**: Document private key / password in-memory limitations in StaticCredentialsProvider
- [x] **HARD-07**: Document TLS constant-time comparison as best-effort fallback

### Success Criteria

1. SDK connects to Gateway running protocol version 2 with a warning log
2. Payloads larger than MAX_MESSAGE_SIZE are rejected before buffering
3. All 15 API namespaces have test coverage
4. Pairing sub-namespace methods return typed `Promise<T>` results
5. GapDetector uses a ring buffer (no unbounded array growth)
6. Security limitations are documented in JSDoc comments
7. TLS timing-safe comparison is documented as best-effort

---

## Phase 6: Observability

**Goal:** Add optional metrics hooks for production monitoring.

### Requirements

- [x] **OBS-01**: Add optional metrics hook for request latency, connection uptime, message throughput

### Success Criteria

1. Consumers can optionally provide a `MetricsCollector` to the client config
2. Request latency is reported per-method
3. Connection state changes are reported
4. Message throughput is reported (messages/sec)
5. Metrics collection has zero overhead when disabled

**Plans:** 2/2 plans executed

Plans:
- [x] 06-01-PLAN.md — Create MetricsCollector interface, add to ClientConfig, export from index.ts
- [x] 06-02-PLAN.md — Wire metrics into client.ts request(), ConnectionStateMachine, WebSocketTransport

---

## Phase Details

### Phase 1: Critical Reliability

**Goal:** Make the SDK self-healing — it must automatically recover from token expiry, connection stalls, and message gaps.

**Requirements:** REL-01, REL-02, REL-03

**Success criteria:**
1. When a token expires during a reconnect, `authHandler.refreshToken()` is called and the new token is used
2. When no tick is received for `stalenessThresholdMs`, the `onStale` callback fires automatically
3. When a gap is detected in `reconnect` mode, `ConnectionManager.reconnect()` is called
4. When a gap is detected in `snapshot` mode, the configured snapshot endpoint is called

### Phase 2: Code Health

**Goal:** Split oversized files to improve maintainability, testability, and review quality.

**Requirements:** REF-01, REF-02

**Success criteria:**
1. `client.ts` is reduced to ≤800 lines
2. `api-params.ts` is split into separate files under `src/protocol/params/`
3. All existing tests pass
4. Public API exports in `src/index.ts` are unchanged

### Phase 3: Bug Fixes

**Goal:** Fix 5 bugs identified in codebase analysis — most are one-liners but critical for correctness.

**Requirements:** BUG-01, BUG-02, BUG-03, BUG-04, BUG-05

**Success criteria:**
1. `client.off()` after `client.once()` successfully removes the subscription
2. Abort handler cleanup code is in exactly one place (finally block)
3. First reconnect attempt waits at least `reconnectDelayMs` before connecting
4. `ws.send()` errors propagate as `ConnectionError` subclasses
5. Duplicate server responses are handled silently without throwing

### Phase 4: Transport Consolidation

**Goal:** Eliminate code duplication between Node.js and browser WebSocket transports.

**Requirements:** TRANS-01

**Success criteria:**
1. All shared behavior (connect, send, close, error handling) lives in `WebSocketTransport`
2. Node transport and browser transport are thin wrappers differing only in `getDefaultWebSocket()`
3. No logic divergence between the two transports
4. All transport tests still pass

### Phase 5: Hardening

**Goal:** Close remaining gaps — protocol compatibility, security docs, missing test coverage.

**Requirements:** HARD-01, HARD-02, HARD-03, HARD-04, HARD-05, HARD-06, HARD-07

**Success criteria:**
1. SDK connects to Gateway running protocol version 2 with a warning log
2. Payloads larger than MAX_MESSAGE_SIZE are rejected before buffering
3. All 15 API namespaces have test coverage
4. Pairing sub-namespace methods return typed `Promise<T>` results
5. GapDetector uses a ring buffer (no unbounded array growth)
6. Security limitations are documented in JSDoc comments
7. TLS timing-safe comparison is documented as best-effort

### Phase 6: Observability

**Goal:** Add optional metrics hooks for production monitoring.

**Requirements:** OBS-01

**Success criteria:**
1. Consumers can optionally provide a `MetricsCollector` to the client config
2. Request latency is reported per-method
3. Connection state changes are reported
4. Message throughput is reported (messages/sec)
5. Metrics collection has zero overhead when disabled

---

*Roadmap created: 2026-03-29*
*Phases: 6 | Requirements: 18 | All v1 requirements covered ✓*
