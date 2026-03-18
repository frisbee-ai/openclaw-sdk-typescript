# Timeout Manager Refactoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a centralized TimeoutManager utility class and selectively refactor existing code.

**Architecture:** Create a centralized TimeoutManager class providing named timeouts, batch cleanup, and Promise-based API. Only refactor simple scenarios (reconnect.ts, websocket.ts), keep complex scenarios (connection.ts, request.ts) unchanged.

**Tech Stack:** TypeScript

---

## Key Decision: Selective Refactoring

### Why NOT refactor connection.ts and request.ts?

**Architect and Critic review conclusion:**

1. **TimeoutManager design assumption**: `timeoutId` is retained by caller for later clearing
2. **Actual usage pattern**: `pendingRequests` Map stores both resolve/reject and corresponding timeoutId
3. **Refactoring complexity**: Not simple syntax replacement, but architectural-level change that could cause regressions

| File | Timeout Pattern | Complexity | Refactor | Benefit |
|------|-----------------|------------|----------|---------|
| `reconnect.ts` | Single currentTimeoutId | Low | ✅ Simple | High |
| `websocket.ts` | Single connectTimeoutId | Medium | ✅ Medium | Medium |
| `connection.ts` | Per-request + reconnect | High | ❌ Complex | Low |
| `request.ts` | Per-request | High | ❌ Complex | Low |

---

## File Structure

### New Files
- `src/utils/timeoutManager.ts` - ✅ Completed

### Modified
- `src/managers/reconnect.ts` - ✅ Selective refactor
- `src/transport/websocket.ts` - ✅ Selective refactor
- `src/index.ts` - ✅ Export

### Unchanged
- `src/managers/connection.ts` - Keep existing implementation
- `src/managers/request.ts` - Keep existing implementation

---

## Chunk 1: Complete TimeoutManager Utility Class ✅

**Status**: Completed and committed

---

## Chunk 2: Refactor ReconnectManager

**Files:**
- Modify: `src/managers/reconnect.ts`

> Risk note: reconnect.ts has only one currentTimeoutId, refactoring is simple, low risk

- [ ] **Step 1: Import TimeoutManager**

```typescript
import { TimeoutManager } from "../utils/timeoutManager.js";
```

- [ ] **Step 2: Add TimeoutManager instance**

```typescript
private timeoutManager = new TimeoutManager();
```

- [ ] **Step 3: Refactor setTimeout in waitForDelay**

Replace:
```typescript
this.currentTimeoutId = setTimeout(resolve, ms);
```

With:
```typescript
this.timeoutManager.set(resolve, ms, "reconnect-delay");
```

- [ ] **Step 4: Cleanup in abort**

Replace:
```typescript
clearTimeout(this.currentTimeoutId);
```

With:
```typescript
this.timeoutManager.clearAll();
```

- [ ] **Step 5: Run tests to verify**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 6: Commit changes**

```bash
git add src/managers/reconnect.ts
git commit -m "refactor: use TimeoutManager in ReconnectManager"
```

---

## Chunk 3: Refactor WebSocketTransport

**Files:**
- Modify: `src/transport/websocket.ts`

> Risk note: websocket.ts has only one connectTimeoutId, multiple entry points for cleanup need attention

- [ ] **Step 1: Import TimeoutManager**

```typescript
import { TimeoutManager } from "../utils/timeoutManager.js";
```

- [ ] **Step 2: Add TimeoutManager instance**

```typescript
private timeoutManager = new TimeoutManager();
```

- [ ] **Step 3: Refactor connectTimeoutId**

Replace:
```typescript
this.connectTimeoutId = setTimeout(() => {
  // timeout logic
}, this.config.connectTimeoutMs);
```

With:
```typescript
this.timeoutManager.set(() => {
  // timeout logic
}, this.config.connectTimeoutMs, "ws-connect");
```

- [ ] **Step 4: Refactor all clearTimeout(connectTimeoutId)**

Replace all:
```typescript
clearTimeout(this.connectTimeoutId);
this.connectTimeoutId = null;
```

With:
```typescript
this.timeoutManager.clear("ws-connect");
```

- [ ] **Step 5: Cleanup in close()**

Replace:
```typescript
if (this.connectTimeoutId) {
  clearTimeout(this.connectTimeoutId);
  this.connectTimeoutId = null;
}
```

With:
```typescript
this.timeoutManager.clear("ws-connect");
```

- [ ] **Step 6: Run tests to verify**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 7: Commit changes**

```bash
git add src/transport/websocket.ts
git commit -m "refactor: use TimeoutManager in WebSocketTransport"
```

---

## Chunk 4: Export to Public API

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Export TimeoutManager**

In index.ts add:
```typescript
export { TimeoutManager, createTimeoutManager } from "./utils/timeoutManager.js";
```

- [ ] **Step 2: Run full test suite**

```bash
npm test 2>&1
```

- [ ] **Step 3: Run lint**

```bash
npm run lint 2>&1
```

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: export TimeoutManager in public API"
```

---

## Acceptance Criteria

1. ✅ TimeoutManager utility class is complete
2. ✅ reconnect.ts successfully uses TimeoutManager
3. ✅ websocket.ts successfully uses TimeoutManager
4. ✅ All tests pass
5. ✅ Reduced ~10+ lines of duplicate code
6. ✅ connection.ts and request.ts unchanged (stability priority)

---

## Risk Statement

> **Risk note**: connection.ts and request.ts per-request timeout pattern doesn't fully match TimeoutManager's design (timeoutId stored in pendingRequests Map), refactoring could cause regressions. Recommended to keep unchanged, use TimeoutManager only in new code.

---

## RALPLAN-DR Summary

### Principles
1. **YAGNI** - Only refactor proven simple scenarios, no over-abstraction
2. **Stability priority** - Keep complex modules as-is, avoid regression risk
3. **Incremental improvement** - Start with simple scenarios, accumulate experience before tackling complex ones

### Decision Drivers
1. **Risk control** - connection.ts/request.ts refactoring complexity is high
2. **Benefit assessment** - Simple scenarios already provide sufficient benefit
3. **Test feasibility** - Maintain existing test coverage

### Viable Options

| Option | Pros | Cons |
|--------|------|------|
| **Selective refactor** (recommended) | Low risk, definite benefit | Lower code uniformity |
| Full refactor | Code uniformity | High regression risk, may need extensive testing |
| No refactor | Zero risk | Misses simplification opportunity |

### Why Chosen
- Architect and Critic both agree connection.ts/request.ts refactoring risk too high
- Simple scenarios (reconnect, websocket) have clear refactoring benefits
- Keep existing stable modules unchanged

### Consequences
- Some duplicate code remains in connection/request, but acceptable
- Future consideration: create dedicated subclass for per-request scenarios

### Follow-ups
- Monitor TimeoutManager usage in production
- Consider whether RequestTimeoutManager subclass is needed
