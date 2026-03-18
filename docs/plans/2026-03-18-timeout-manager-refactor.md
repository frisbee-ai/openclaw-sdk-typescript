# Timeout Manager 重构实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建超时管理工具类并重构现有代码使用它，减少 setTimeout/clearTimeout 的重复代码

**Architecture:** 创建一个集中的 TimeoutManager 类，提供命名超时、批量清理、Promise-based API。在现有模块中逐步替换直接 setTimeout 调用。

**Tech Stack:** TypeScript

---

## 文件结构

### 新建
- `src/utils/timeoutManager.ts` - 已创建，包含 TimeoutManager 类

### 修改
- `src/managers/connection.ts` - 重构超时管理
- `src/managers/request.ts` - 重构超时管理
- `src/managers/reconnect.ts` - 重构超时管理
- `src/transport/websocket.ts` - 重构超时管理
- `src/index.ts` - 导出 TimeoutManager

---

## Chunk 1: 完成 TimeoutManager 工具类

**Files:**
- Modify: `src/utils/timeoutManager.ts`

- [ ] **Step 1: 运行 typecheck 验证模块编译**

```bash
npm run typecheck 2>&1
```

- [ ] **Step 2: 运行测试验证**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 3: 提交 TimeoutManager 模块**

```bash
git add src/utils/timeoutManager.ts
git commit -m "feat: add TimeoutManager utility class

- Provides centralized timeout management
- Named timeouts for debugging
- Promise-based delay/wait APIs
- Automatic cleanup on destroy"
```

---

## Chunk 2: 重构 ConnectionManager

**Files:**
- Modify: `src/managers/connection.ts`

- [ ] **Step 1: 在 ConnectionManager 中添加 TimeoutManager 实例**

在类中添加:
```typescript
private timeoutManager = new TimeoutManager();
```

- [ ] **Step 2: 重构 pendingRequests 超时管理**

将:
```typescript
const timeoutId = setTimeout(() => {
  this.pendingRequests.delete(id);
  reject(new Error(`Request "${method}" (${id}) timed out after ${timeoutMs}ms`));
}, timeoutMs);
```

替换为使用 timeoutManager

- [ ] **Step 3: 重构重连定时器**

将:
```typescript
this.reconnectTimerId = setTimeout(() => {
  // 重连逻辑
}, this.config.reconnectDelayMs);
```

替换为使用 timeoutManager

- [ ] **Step 4: 在 disconnect 中清理**

将:
```typescript
if (this.reconnectTimerId !== null) {
  clearTimeout(this.reconnectTimerId);
  this.reconnectTimerId = null;
}
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
git add src/managers/connection.ts
git commit -m "refactor: use TimeoutManager in ConnectionManager"
```

---

## Chunk 3: 重构 RequestManager

**Files:**
- Modify: `src/managers/request.ts`

- [ ] **Step 1: 添加 TimeoutManager 实例**

```typescript
private timeoutManager = new TimeoutManager();
```

- [ ] **Step 2: 重构所有 setTimeout/clearTimeout 调用**

查看 request.ts 中的超时使用模式:
- Line 61: setTimeout for request timeout
- Line 96, 122, 149, 170: clearTimeout calls

- [ ] **Step 3: 重构 abortRequest 清理**

- [ ] **Step 4: 运行测试**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 5: 提交**

```bash
git add src/managers/request.ts
git commit -m "refactor: use TimeoutManager in RequestManager"
```

---

## Chunk 4: 重构 ReconnectManager

**Files:**
- Modify: `src/managers/reconnect.ts`

- [ ] **Step 1: 添加 TimeoutManager 实例**

- [ ] **Step 2: 重构 currentTimeoutId**

- [ ] **Step 3: 重构 waitForDelay 方法**

- [ ] **Step 4: 运行测试**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 5: 提交**

```bash
git add src/managers/reconnect.ts
git commit -m "refactor: use TimeoutManager in ReconnectManager"
```

---

## Chunk 5: 重构 WebSocketTransport

**Files:**
- Modify: `src/transport/websocket.ts`

- [ ] **Step 1: 添加 TimeoutManager 实例**

- [ ] **Step 2: 重构 connectTimeoutId**

- [ ] **Step 3: 在 close 方法中清理**

- [ ] **Step 4: 运行测试**

```bash
npm test 2>&1 | tail -20
```

- [ ] **Step 5: 提交**

```bash
git add src/transport/websocket.ts
git commit -m "refactor: use TimeoutManager in WebSocketTransport"
```

---

## Chunk 6: 导出和最终验证

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: 从 index.ts 导出 TimeoutManager**

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

1. TimeoutManager 工具类功能完整
2. 所有测试通过
3. 减少约 30+ 行重复的 setTimeout/clearTimeout 代码
4. 代码更易维护，超时统一管理
