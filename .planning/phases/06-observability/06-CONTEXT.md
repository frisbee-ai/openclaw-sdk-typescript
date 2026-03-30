# Phase 6: Observability - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Add optional metrics hooks (OBS-01) for production monitoring. The SDK emits events that consumers route to their own monitoring systems (Datadog, Prometheus, CloudWatch). The SDK's role is emit-only — zero overhead when disabled.

</domain>

<decisions>
## Implementation Decisions

### OBS-01: MetricsCollector Design

- **D-01:** Interface: **Callback interface** (`MetricsCollector`) — consumer provides any object with the required methods; no class coupling
- **D-02:** Three signals emitted:
  - Request latency: `onRequestLatency(method: string, latencyMs: number)` — measured in `RequestManager.submit()`
  - Connection uptime: `onConnectionStateChange(state: string, durationMs?: number)` — state machine observer
  - Message throughput: `onMessageThroughput(count: number, periodMs: number)` — time-bucketed counter in `WebSocketTransport`
- **D-03:** Disabled overhead: **no-op guard** (`if (!collector) return`) before every emit call — V8 can inline away the check; zero allocation, zero dispatch when disabled
- **D-04:** Integration: `MetricsCollector` added to `ClientConfig` as optional field `metricsCollector?: MetricsCollector`, following the same pattern as `logger?: Logger`

### Integration Points

- `ClientConfig` (`src/client-config.ts`): Add `metricsCollector?: MetricsCollector`
- `RequestManager` (`src/managers/request.ts`): Wrap `submit()` timing in emit call
- `ConnectionStateMachine` (`src/connection/state.ts`): Add state-change observer that emits to collector
- `WebSocketTransport` (`src/transport/websocket.ts`): Add rolling message counter on `onmessage`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Files
- `src/client-config.ts` — ClientConfig interface (add metricsCollector field here)
- `src/client.ts` — OpenClawClient constructor (wire metricsCollector through to managers)
- `src/managers/request.ts` — RequestManager.submit() (add latency emit)
- `src/connection/state.ts` — ConnectionStateMachine (add state-change emit)
- `src/transport/websocket.ts` — WebSocketTransport (add message throughput counter)
- `src/index.ts` — Public exports (export MetricsCollector interface)

### Prior Phase Context
- `.planning/phases/05-hardening/05-CONTEXT.md` — HARD-06/07 JSDoc pattern (optional hook in config)
- `.planning/phases/01-critical-reliability/01-CONTEXT.md` — Logger pattern (optional hook, same approach)
- `.planning/ROADMAP.md` — Phase 6 goal and OBS-01 definition
- `.planning/REQUIREMENTS.md` — OBS-01 requirement
- `.planning/PROJECT.md` — Core value (reliable connection), constraints (strict TypeScript, backward compat, zero overhead when disabled)

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `Logger` interface in `src/types/logger.ts` — exact pattern to replicate for `MetricsCollector`: optional in config, no-op when absent, consumer provides implementation
- `RequestManager.submit()` already tracks `startTime` — emit call is a thin wrapper around existing timing
- `ConnectionStateMachine` state change handler (`onStateChange`) already exists — reuse the same registration mechanism

### Established Patterns
- Optional hook in `ClientConfig`: field is `Optional<HookInterface>`, checked with `if (!hook) return` guard, no default noop object allocated
- Factory function not needed for the interface — consumer implements the interface directly

### Integration Points
- `createClient()` / `ClientBuilder` — accept `metricsCollector` in config and pass to `OpenClawClient` constructor
- `OpenClawClient` — pass `metricsCollector` down to `RequestManager` and `ConnectionStateMachine` at construction
- `WebSocketTransport` — needs `onmessage` counter, but this is created inside `ConnectionManager`; may need to thread the collector through

</codebase_context>

<specifics>
## Specific Ideas

- MetricsCollector lives in `src/metrics/collector.ts` (new file, following `src/auth/provider.ts` as a pattern)
- Interface exported from `src/index.ts` alongside `Logger`
- No new manager class — emit calls added to existing code paths
- Message throughput: rolling window of 1 second, emit every second with `count` and `periodMs = 1000`

</specifics>

<deferred>
## Deferred Ideas

None — all decisions made within OBS-01 scope.

</deferred>

---

*Phase: 06-observability*
*Context gathered: 2026-03-31*
