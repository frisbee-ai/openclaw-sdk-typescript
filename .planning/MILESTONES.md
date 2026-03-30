# Milestones

## v2.0 Quality and Resilience (Shipped: 2026-03-30)

**Phases completed:** 6 phases, 16 plans, 35 tasks

**Key accomplishments:**

- AuthHandler.refreshToken() wired into ReconnectManager for automatic token refresh on retryable auth errors
- TimeoutManager.setInterval() wired into TickMonitor for automatic periodic checkStale() calls
- GapDetector 'gap' event listener in client.ts with mode-based dispatch
- Plan:
- Split 809-line api-params.ts into 15 focused domain type files, co-located next to their API classes
- Thin facade achieved: client.ts uses _internal path for ClientBuilder builds, shared config types extracted to client-config.ts
- EventManager once() token-based cleanup and redundant abort handler removal completed
- Three isolated bug fixes: reconnect initial delay, typed WebSocket send errors, and silent duplicate response handling
- WebSocketTransport abstract base class
- BrowserWebSocketTransport thin subclass
- Phase:
- Phase:
- Executed:
- MetricsCollector callback interface for request latency, connection state changes, and message throughput with zero overhead when disabled
- Wire MetricsCollector into request latency tracking, connection state change reporting, and message throughput counting

---
