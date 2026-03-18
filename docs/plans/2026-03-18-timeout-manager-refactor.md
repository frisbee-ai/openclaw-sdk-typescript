# Timeout Manager 重构实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建超时管理工具类并选择性重构现有代码

**Architecture:** 创建一个集中的 TimeoutManager 类，提供命名超时、批量清理、Promise-based API。仅重构简单场景（reconnect.ts, websocket.ts），保持复杂场景（connection.ts, request.ts）不变。

**Tech Stack:** TypeScript

---

## 重要决策：选择性重构

### 为什么 connection.ts 和 request.ts 不重构？

**Architect 和 Critic 审查结论**：

1. **TimeoutManager 设计假设**：`timeoutId` 由调用方保留以便后续清除
2. **实际使用模式**：`pendingRequests` Map 同时存储 resolve/reject 和对应的 timeoutId
3. **重构复杂度**：不是简单语法替换，而是架构级改动，可能导致回归

| 文件 | 超时模式 | 复杂度 | 重构 | 收益 |
|------|----------|--------|------|------|
| `reconnect.ts` | 单个 currentTimeoutId | 低 | ✅ 简单 | 高 |
| `websocket.ts` | 单个 connectTimeoutId | 中 | ✅ 中等 | 中 |
| `connection.ts` | per-request + reconnect | 高 | ❌ 复杂 | 低 |
| `request.ts` | per-request | 高 | ❌ 复杂 | 低 |

---

## 文件结构

### 新建
- `src/utils/timeoutManager.ts` - ✅ 已完成

### 修改
- `src/managers/reconnect.ts` - ✅ 选择性重构
- `src/transport/websocket.ts` - ✅ 选择性重构
- `src/index.ts` - ✅ 导出

### 保持不变
- `src/managers/connection.ts` - 保持现有实现
- `src/managers/request.ts` - 保持现有实现

---

## Chunk 1: 完成 TimeoutManager 工具类 ✅

**状态**: 已完成并提交

---

## Chunk 2: 重构 ReconnectManager

**Files:**
- Modify: `src/managers/reconnect.ts`

> 风险说明: reconnect.ts 只有一个 currentTimeoutId，重构简单，风险低

- [ ] **Step 1: 导入 TimeoutManager**

```typescript
import { TimeoutManager } from "../utils/timeoutManager.js";
```

- [ ] **Step 2: 添加 TimeoutManager 实例**

```typescript
private timeoutManager = new TimeoutManager();
```

- [ ] **Step 3: 重构 waitForDelay 中的 setTimeout**

将:
```typescript
this.currentTimeoutId = setTimeout(resolve, ms);
```

替换为:
```typescript
this.timeoutManager.set(resolve, ms, "reconnect-delay");
```

- [ ] **Step 4: 在 cleanup 中清理**

将:
```typescript
clearTimeout(this.currentTimeoutId);
```

替换为:
```typescript
this.timeoutManager.clearAll();
```

- [ ] **Step 5: 运行测试验证**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 6: 提交更改**

```bash
git add src/managers/reconnect.ts
git commit -m "refactor: use TimeoutManager in ReconnectManager"
```

---

## Chunk 3: 重构 WebSocketTransport

**Files:**
- Modify: `src/transport/websocket.ts`

> 风险说明: websocket.ts 只有一个 connectTimeoutId，多入口清理需注意

- [ ] **Step 1: 导入 TimeoutManager**

```typescript
import { TimeoutManager } from "../utils/timeoutManager.js";
```

- [ ] **Step 2: 添加 TimeoutManager 实例**

```typescript
private timeoutManager = new TimeoutManager();
```

- [ ] **Step 3: 重构 connectTimeoutId**

将:
```typescript
this.connectTimeoutId = setTimeout(() => {
  // timeout logic
}, this.config.connectTimeoutMs);
```

替换为:
```typescript
this.timeoutManager.set(() => {
  // timeout logic
}, this.config.connectTimeoutMs, "ws-connect");
```

- [ ] **Step 4: 重构所有 clearTimeout(connectTimeoutId)**

将所有:
```typescript
clearTimeout(this.connectTimeoutId);
this.connectTimeoutId = null;
```

替换为:
```typescript
this.timeoutManager.clear("ws-connect");
```

- [ ] **Step 5: 在 close() 中清理**

将:
```typescript
if (this.connectTimeoutId) {
  clearTimeout(this.connectTimeoutId);
  this.connectTimeoutId = null;
}
```

替换为:
```typescript
this.timeoutManager.clear("ws-connect");
```

- [ ] **Step 6: 运行测试验证**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 7: 提交更改**

```bash
git add src/transport/websocket.ts
git commit -m "refactor: use TimeoutManager in WebSocketTransport"
```

---

## Chunk 4: 导出到公共 API

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: 导出 TimeoutManager**

在 index.ts 中添加:
```typescript
export { TimeoutManager, createTimeoutManager } from "./utils/timeoutManager.js";
```

- [ ] **Step 2: 运行完整测试**

```bash
npm test 2>&1
```

- [ ] **Step 3: 运行 lint**

```bash
npm run lint 2>&1
```

- [ ] **Step 4: 提交**

```bash
git add src/index.ts
git commit -m "feat: export TimeoutManager in public API"
```

---

## 验收标准

1. ✅ TimeoutManager 工具类功能完整
2. ✅ reconnect.ts 成功使用 TimeoutManager
3. ✅ websocket.ts 成功使用 TimeoutManager
4. ✅ 所有测试通过
5. ✅ 减少约 10+ 行重复代码
6. ✅ connection.ts 和 request.ts 保持原有实现不变（稳定性优先）

---

## 风险声明

> **风险说明**: connection.ts 和 request.ts 的 per-request 超时模式与 TimeoutManager 的设计不完全匹配（timeoutId 存储在 pendingRequests Map 中），重构可能导致回归。建议保持不变，仅在新代码中使用 TimeoutManager。

---

## RALPLAN-DR Summary

### Principles
1. **YAGNI** - 只重构已证明简单的场景，不过度抽象
2. **稳定性优先** - 复杂模块保持现状，避免回归风险
3. **渐进式改进** - 先做简单场景，积累经验后再考虑复杂场景

### Decision Drivers
1. **风险控制** - connection.ts/request.ts 重构复杂度高
2. **收益评估** - 简单场景已有足够收益
3. **测试可行性** - 保持现有测试覆盖

### Viable Options

| Option | Pros | Cons |
|--------|------|------|
| **选择性重构** (推荐) | 风险低，收益确定 | 代码统一性较低 |
| 全量重构 | 代码统一 | 高回归风险，可能需要大量测试 |
| 不重构 | 零风险 | 错失简化机会 |

### Why Chosen
- Architect 和 Critic 一致认为 connection.ts/request.ts 重构风险过高
- 简单场景（reconnect, websocket）重构收益明确
- 保持现有稳定模块不变

### Consequences
- 仍有少量重复代码在 connection/request 中，但可接受
- 未来可以考虑为 per-request 场景创建专用子类

### Follow-ups
- 监控 TimeoutManager 在生产环境的使用效果
- 考虑是否需要 RequestTimeoutManager 子类
