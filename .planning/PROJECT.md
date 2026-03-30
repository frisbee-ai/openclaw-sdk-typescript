# OpenClaw SDK TypeScript — v2.0 Quality & Resilience

## What This Is

A production-grade WebSocket client SDK for the OpenClaw Gateway, written in TypeScript. All 15 Gateway API namespaces are implemented and tested. The v2.0 milestone shipped in March 2026.

## Core Value

**The SDK must reliably maintain a WebSocket connection with the Gateway, automatically recovering from all common failure modes — token expiry, network drops, protocol mismatches, and server unavailability.**

## Current State (v2.0 Shipped)

- **893 tests** passing across **50 test files**
- WebSocket transport abstraction with Node.js and browser implementations
- MetricsCollector observability hook for request latency, connection state, and message throughput
- Protocol version fallback chain (v3 → v2 → v1)
- TypeScript strict mode, ESM + CJS dual output
- Node.js >=22.0.0, browser environments

## Validated Requirements (v2.0)

- ✅ REL-01: AuthHandler token refresh wired into reconnect path
- ✅ REL-02: TickMonitor auto-calls checkStale() on timer interval
- ✅ REL-03: GapDetector recovery dispatch (reconnect/snapshot modes)
- ✅ REF-02: api-params.ts split into 15 per-domain type files
- ✅ BUG-01: EventManager once() token-based cleanup
- ✅ BUG-02: Redundant abort handler removed
- ✅ BUG-03: ReconnectManager initial delay (thundering herd prevention)
- ✅ BUG-04: WebSocket send() throws ConnectionError
- ✅ BUG-05: Duplicate responses handled silently
- ✅ TRANS-01: WebSocketTransport abstract base class
- ✅ OBS-01: MetricsCollector observability hook

## Known Technical Debt (v2.0)

| Item | Description | Impact |
|------|-------------|--------|
| REF-01 partial | client.ts is 1059 lines (target: 800) | createClient kept for backward compat |
| HARD-01 partial | Protocol fallback WARNING logs to console.warn | Non-blocking |
| HARD-04/05 | Already implemented — no code needed | No debt |

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Protocol fallback: v3 → v2 → v1 | Graceful degradation | WARNING on v2/v1, throws on unsupported |
| MetricsCollector: callback interface | Zero overhead when disabled | Optional, non-breaking |
| Transport: abstract base class | Eliminate Node/browser duplication | WebSocketTransport base + thin subclasses |
| Bounded GapDetector array | Prevent unbounded memory growth | `splice(0, length - maxGaps)` pattern |
| No breaking API changes | v2.0 hardening, not redesign | Backward compatible throughout |

## Out of Scope

- Binary frame encoding/decoding — protocol doesn't use it yet
- Streaming JSON parsing — performance gain doesn't justify complexity yet
- E2E tests with real server — requires a running Gateway instance
- WebSocket library swap — ws is stable

## Constraints

- **TypeScript strict mode**: All code must pass `tsc --strict`
- **No breaking API changes**: v2.0 is backward-compatible
- **Test coverage**: 80% minimum maintained
- **ESM + CJS**: Dual compilation output preserved

---

*Last updated: 2026-03-31 after v2.0 milestone completion*
