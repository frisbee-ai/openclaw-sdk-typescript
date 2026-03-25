# Gateway API 同步补全计划

**日期**: 2026-03-25
**项目**: openclaw-sdk-typescript
**目标**: 同步 SDK 与 Gateway 最新 API 定义，补全缺失功能

### Gateway 参考源码

- **Gateway 路径**: `/Users/linyang/workspace/my-projects/openclaw/src/gateway`
- **Protocol Schema**: `src/gateway/protocol/schema/`
- **Server Methods**: `src/gateway/server-methods/`
- **方法列表**: `src/gateway/server-methods-list.ts`

---

## 1. 背景与目标

### 1.1 问题描述

当前 `openclaw-sdk-typescript` 与 `openclaw` Gateway 之间存在以下问题：

1. **SDK 有多余实现** — `sessions.resolve` 在 Gateway 中不存在，需删除
2. **类型定义不同步** — `AgentsCreateParams`、`SessionsSendParams` 等类型与 Gateway 最新定义不一致
3. **API 方法缺失** — Gateway 有 100+ 方法，SDK 大量缺失
4. **方法名不一致** — `agents.identity()` vs `agent.identity.get`

### 1.2 核心原则

| 原则 | 说明 |
|-----|------|
| Gateway 是 Source of Truth | SDK 必须与 Gateway 保持 100% 一致 |
| 多余删除 | SDK 有但 Gateway 无的方法需删除 |
| 缺少补齐 | Gateway 有但 SDK 无的方法需实现 |
| 不一致修正 | 以 Gateway 为基础修正 SDK |

---

## 2. 逐模块交叉验证

### 2.1 Sessions 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| sessions.list | ✅ | ✅ | 一致 |
| sessions.subscribe | ✅ | ❌ | **缺失** |
| sessions.unsubscribe | ✅ | ❌ | **缺失** |
| sessions.messages.subscribe | ✅ | ❌ | **缺失** |
| sessions.messages.unsubscribe | ✅ | ❌ | **缺失** |
| sessions.preview | ✅ | ✅ | 一致 |
| sessions.create | ✅ | ❌ | **缺失** |
| sessions.send | ✅ | ❌ | **缺失** |
| sessions.abort | ✅ | ❌ | **缺失** |
| sessions.patch | ✅ | ✅ | 一致 |
| sessions.reset | ✅ | ✅ | 一致 |
| sessions.delete | ✅ | ✅ | 一致 |
| sessions.compact | ✅ | ✅ | 一致 |
| sessions.usage | ✅ | ✅ | 一致 |
| sessions.steer | ✅ | ❌ | **缺失** |
| **sessions.resolve** | ❌ | ✅ | **SDK 多余！删除** |

**处置**: `sessions.resolve` 需从 SDK 删除

### 2.2 Nodes 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| node.list | ✅ | ✅ | 一致 |
| node.describe | ✅ | ❌ | **缺失** |
| node.invoke | ✅ | ✅ | 一致 |
| node.invoke.result | ✅ | ✅ | 一致 |
| node.event | ✅ | ✅ | 一致 |
| node.pending.drain | ✅ | ✅ | 一致 |
| node.pending.enqueue | ✅ | ✅ | 一致 |
| node.pending.pull | ✅ | ❌ | **缺失** |
| node.pending.ack | ✅ | ❌ | **缺失** |
| node.canvas.capability.refresh | ✅ | ❌ | **缺失** |
| node.pair.request | ✅ | ❌ | **缺失** |
| node.pair.list | ✅ | ❌ | **缺失** |
| node.pair.approve | ✅ | ❌ | **缺失** |
| node.pair.reject | ✅ | ❌ | **缺失** |
| node.pair.verify | ✅ | ❌ | **缺失** |
| node.rename | ✅ | ❌ | **缺失** |

### 2.3 Agents 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| agents.list | ✅ | ✅ | 一致 |
| agents.create | ✅ | ✅ | 一致 |
| agents.update | ✅ | ✅ | 一致 |
| agents.delete | ✅ | ✅ | 一致 |
| agents.files.list | ✅ | ✅ | 一致 |
| agents.files.get | ✅ | ✅ | 一致 |
| agents.files.set | ✅ | ✅ | 一致 |
| agent.identity.get | ✅ | ✅ | **方法名需统一** |
| agent.wait | ✅ | ✅ | 一致 |

**处置**: SDK `identity()` 方法名建议改为 `agent.identity.get` 保持一致

### 2.4 Config 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| config.get | ✅ | ✅ | 一致 |
| config.set | ✅ | ✅ | 一致 |
| config.apply | ✅ | ✅ | 一致 |
| config.patch | ✅ | ✅ | 一致 |
| config.schema | ✅ | ✅ | 一致 |
| config.schema.lookup | ✅ | ❌ | **缺失** |

### 2.5 Skills/Tools 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| skills.status | ✅ | ✅ | 一致 |
| skills.bins | ✅ | ✅ | 一致 |
| skills.install | ✅ | ✅ | 一致 |
| skills.update | ✅ | ✅ | 一致 |
| tools.catalog | ✅ | ✅ | 一致 |
| tools.effective | ✅ | ❌ | **缺失** |

### 2.6 Cron 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| cron.list | ✅ | ✅ | 一致 |
| cron.status | ✅ | ✅ | 一致 |
| cron.add | ✅ | ✅ | 一致 |
| cron.update | ✅ | ✅ | 一致 |
| cron.remove | ✅ | ✅ | 一致 |
| cron.run | ✅ | ✅ | 一致 |
| cron.runs | ✅ | ✅ | 一致 |

### 2.7 Chat 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| chat.list | ✅ | ✅ | 一致 |
| chat.history | ✅ | ✅ | 一致 |
| chat.send | ✅ | ❌ | **缺失** |
| chat.abort | ✅ | ❌ | **缺失** |
| chat.inject | ✅ | ✅ | 一致 |
| chat.delete | ✅ | ✅ | 一致 |
| chat.title | ✅ | ✅ | 一致 |

### 2.8 Device Pairing 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| device.pair.list | ✅ | ✅ | 一致 |
| device.pair.approve | ✅ | ✅ | 一致 |
| device.pair.reject | ✅ | ✅ | 一致 |
| device.pair.remove | ✅ | ❌ | **缺失** |
| device.token.rotate | ✅ | ❌ | **缺失** |
| device.token.revoke | ✅ | ❌ | **缺失** |

### 2.9 Browser 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| browser.request | ✅ | ❌ | **完全缺失** |

### 2.10 Push 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| push.test | ✅ | ❌ | **完全缺失** |

### 2.11 Exec Approvals 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| exec.approval.request | ✅ | ❌ | **完全缺失** |
| exec.approval.waitDecision | ✅ | ❌ | **完全缺失** |
| exec.approval.resolve | ✅ | ❌ | **完全缺失** |
| exec.approvals.get | ✅ | ❌ | **类型已定义，API 缺失** |
| exec.approvals.set | ✅ | ❌ | **类型已定义，API 缺失** |
| exec.approvals.node.get | ✅ | ❌ | **缺失** |
| exec.approvals.node.set | ✅ | ❌ | **缺失** |

### 2.12 System/Health 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| health | ✅ | ❌ | **缺失** |
| status | ✅ | ❌ | **缺失** |
| usage.status | ✅ | ❌ | **缺失** |
| usage.cost | ✅ | ❌ | **缺失** |
| doctor.memory.status | ✅ | ❌ | **缺失** |
| logs.tail | ✅ | ❌ | **缺失** |
| secrets.reload | ✅ | ❌ | **缺失** |
| secrets.resolve | ✅ | ❌ | **缺失** |
| wizard.start/next/cancel/status | ✅ | ❌ | **完全缺失** |
| voicewake.get/set | ✅ | ❌ | **完全缺失** |
| update.run | ✅ | ❌ | **完全缺失** |
| models.list | ✅ | ❌ | **完全缺失** |
| tts.* (6 methods) | ✅ | ❌ | **完全缺失** |
| gateway.identity.get | ✅ | ❌ | **缺失** |
| system-presence/event | ✅ | ❌ | **完全缺失** |
| send, agent | ✅ | ❌ | **完全缺失** |

### 2.13 Channels 模块

| 方法 | Gateway | SDK | 状态 |
|-----|---------|-----|------|
| channels.status | ✅ | ❌ | **仅类型，API 缺失** |
| channels.logout | ✅ | ❌ | **缺失** |
| talk.config/speak/mode | ✅ | ❌ | **完全缺失** |

---

## 3. 类型定义差异

| 类型 | Gateway 定义 | SDK 当前定义 | 差异 |
|-----|-------------|-----------|------|
| `AgentsCreateParams` | `name`, `workspace`, `emoji?`, `avatar?` | `agentId`, `files` | **完全不同** |
| `AgentsUpdateParams` | `agentId`, `name?`, `workspace?`, `model?`, `avatar?` | `agentId`, `files` | **完全不同** |
| `SessionsSendParams` | `key`, `message`, `thinking?`, `attachments?`, `timeoutMs?` | 使用 `ChatInjectParams` | 不一致 |
| `DevicePairApproveParams` | `requestId` | `pairingId` | **字段名不同** |

---

## 4. SDK 多余方法（需删除）

| 方法 | 原因 |
|-----|------|
| `sessions.resolve` | Gateway 无此方法，应为 `sessions.preview` |

---

## 5. 补全计划

### Phase 1: 修正多余 & 类型同步 (1-2 周)

**目标**: 删除 SDK 多余实现，修复类型定义

| 任务 | 描述 | 破坏性 |
|-----|------|--------|
| T1.1 | **删除** `sessions.resolve` 方法 | ⚠️ 是 |
| T1.2 | 同步 `AgentsCreateParams` → Gateway 定义 | ⚠️ 是 |
| T1.3 | 同步 `AgentsUpdateParams` → Gateway 定义 | ⚠️ 是 |
| T1.4 | 同步 `SessionsSendParams` → Gateway 定义 | ⚠️ 是 |
| T1.5 | 同步 `DevicePairApproveParams` (`requestId` vs `pairingId`) | ⚠️ 是 |
| T1.6 | 将 `ChatInjectParams` deprecated 并指向 `SessionsSendParams` | ⚠️ 是 |

### Phase 2: Sessions 生命周期补全 (1 周)

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| T2.1 | 实现 `sessions.create` API | 🔴 高 |
| T2.2 | 实现 `sessions.send` API | 🔴 高 |
| T2.3 | 实现 `sessions.abort` API | 🔴 高 |
| T2.4 | 实现 `sessions.subscribe/unsubscribe` | 🟡 中 |
| T2.5 | 实现 `sessions.messages.subscribe/unsubscribe` | 🟡 中 |
| T2.6 | 实现 `sessions.steer` API | 🟢 低 |

### Phase 3: Nodes 高级操作补全 (1 周)

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| T3.1 | 实现 `node.describe` API | 🔴 高 |
| T3.2 | 实现 `node.pending.pull` API | 🔴 高 |
| T3.3 | 实现 `node.pending.ack` API | 🔴 高 |
| T3.4 | 实现 `node.canvas.capability.refresh` API | 🟡 中 |
| T3.5 | 实现 `node.pair.*` 系列 (request/list/approve/reject/verify) | 🔴 高 |
| T3.6 | 实现 `node.rename` API | 🟡 中 |

### Phase 4: Config & Skills 补全 (1 周)

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| T4.1 | 实现 `config.schema.lookup` API | 🟡 中 |
| T4.2 | 实现 `tools.effective` API | 🟡 中 |

### Phase 5: Chat & Device Pairing 补全 (1 周)

| 任务 | 描述 | 优先级 |
|-----|------|--------|
| T5.1 | 实现 `chat.send` API | 🔴 高 |
| T5.2 | 实现 `chat.abort` API | 🔴 高 |
| T5.3 | 实现 `device.pair.remove` API | 🟡 中 |
| T5.4 | 实现 `device.token.rotate` API | 🟡 中 |
| T5.5 | 实现 `device.token.revoke` API | 🟡 中 |

### Phase 6: Browser 模块 (1 周)

| 任务 | 描述 |
|-----|------|
| T6.1 | 实现 `browser.request` API |

### Phase 7: Push & Exec Approvals (1 周)

| 任务 | 描述 |
|-----|------|
| T7.1 | 实现 `push.test` API |
| T7.2 | 实现 `exec.approval.request/resolve` 系列 |
| T7.3 | 实现 `exec.approvals.get/set` API |
| T7.4 | 实现 `exec.approvals.node.get/set` API |

### Phase 8: System/Health 模块 (1 周)

| 任务 | 描述 |
|-----|------|
| T8.1 | 实现 `health` API |
| T8.2 | 实现 `status` API |
| T8.3 | 实现 `usage.status/cost` API |
| T8.4 | 实现 `doctor.memory.status` API |
| T8.5 | 实现 `logs.tail` API |
| T8.6 | 实现 `secrets.reload/resolve` API |
| T8.7 | 实现 `wizard.*` 系列 |
| T8.8 | 实现 `voicewake.*` 系列 |
| T8.9 | 实现 `update.run` API |
| T8.10 | 实现 `models.list` API |
| T8.11 | 实现 `tts.*` 系列 |
| T8.12 | 实现 `gateway.identity.get` API |

### Phase 9: Channels & Talk 模块 (1 周)

| 任务 | 描述 |
|-----|------|
| T9.1 | 补全 `channels.status` API |
| T9.2 | 实现 `channels.logout` API |
| T9.3 | 实现 `talk.config/speak/mode` API |

---

## 6. 破坏性变更

Phase 1 的类型同步将导致以下 API 签名变更，建议发布 **v2.0.0**：

### 6.1 AgentsCreateParams

```typescript
// 旧 (v1.x)
interface AgentsCreateParams {
  agentId: string;
  files: AgentsFileEntry[];
}

// 新 (v2.0)
interface AgentsCreateParams {
  name: string;
  workspace: string;
  emoji?: string;
  avatar?: string;
}
```

### 6.2 SessionsSendParams

```typescript
// 旧 (v1.x)
interface ChatInjectParams {
  chatId: string;
  message: unknown;
}

// 新 (v2.0)
interface SessionsSendParams {
  key: string;
  message: string;
  thinking?: string;
  attachments?: unknown[];
  timeoutMs?: number;
  idempotencyKey?: string;
}
```

### 6.3 DevicePairApproveParams

```typescript
// 旧 (v1.x)
interface DevicePairApproveParams {
  pairingId: string;
}

// 新 (v2.0)
interface DevicePairApproveParams {
  requestId: string;
}
```

### 6.4 Sessions.delete (方法删除)

```typescript
// 旧 (v1.x) — SDK 独有
async resolve(params: SessionsResolveParams): Promise<unknown> {
  return this.request('sessions.resolve', params);
}

// 新 (v2.0) — 删除此方法
// sessions.resolve 不存在于 Gateway
```

---

## 7. 实施策略

### 7.1 类型同步策略

由于 Gateway 和 SDK 在同一 monorepo 中，建议：

1. **短期**：手动同步 Gateway schema 到 SDK 类型文件
2. **长期**：考虑从 Gateway schema 生成 SDK 类型（避免重复维护）

### 7.2 兼容性策略

对于破坏性变更，提供迁移指南：

```typescript
// 使用 deprecated 标记旧 API
/**
 * @deprecated Use `SessionsSendParams` instead. Will be removed in v2.0
 */
type ChatInjectParams = SessionsSendParams;
```

---

## 8. 预计工期

| Phase | 内容 | 工期 |
|-------|------|------|
| Phase 1 | 修正多余 & 类型同步 | 1-2 周 |
| Phase 2 | Sessions 生命周期补全 | 1 周 |
| Phase 3 | Nodes 高级操作补全 | 1 周 |
| Phase 4 | Config & Skills 补全 | 1 周 |
| Phase 5 | Chat & Device Pairing 补全 | 1 周 |
| Phase 6 | Browser 模块 | 1 周 |
| Phase 7 | Push & Exec Approvals | 1 周 |
| Phase 8 | System/Health 模块 | 1 周 |
| Phase 9 | Channels & Talk 模块 | 1 周 |
| **总计** | | **8-9 周** |

---

## 9. 后续工作

- [ ] 详细任务拆分与估算
- [ ] 迁移指南编写
- [ ] Breaking Change 文档
- [ ] v2.0.0 发布计划
