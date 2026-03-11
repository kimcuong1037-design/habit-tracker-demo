# Habit Tracker - API 设计文档

> 版本：v1.0 | 更新日期：2026-03-10
> 风格：RESTful | 基础路径：`/api`
> 响应格式：见 `conventions.md` §3

---

## API 总览

| # | 方法 | 路径 | 说明 | 阶段 |
|---|------|------|------|------|
| 1 | `POST` | `/api/habits` | 创建习惯 | Phase 2a |
| 2 | `GET` | `/api/habits` | 获取习惯列表（含今日状态） | Phase 2a |
| 3 | `GET` | `/api/habits/:id` | 获取单个习惯详情 | Phase 2a |
| 4 | `PUT` | `/api/habits/:id` | 更新习惯 | Phase 2b |
| 5 | `DELETE` | `/api/habits/:id` | 删除习惯 | Phase 2b |
| 6 | `POST` | `/api/habits/:id/check-ins` | 打卡（今日或补卡） | Phase 2a |
| 7 | `GET` | `/api/habits/:id/check-ins` | 获取打卡历史 | Phase 2a |
| 8 | `GET` | `/api/check-ins/retroactive-quota` | 查询本月补卡配额 | Phase 2c |
| 9 | `POST` | `/api/milestones/:id/dismiss` | 关闭里程碑回顾 | Phase 2c |
| 10 | `POST` | `/api/streak-breaks/:id/dismiss` | 关闭断裂安慰消息 | Phase 2c |
| 11 | `GET` | `/api/today` | 获取今日综合视图 | Phase 2a |

---

## 1. 创建习惯

`POST /api/habits`

### 请求

```typescript
// CreateHabitRequest
{
  "name": "阅读 20 分钟",           // 必填，1-50 字符
  "description": "每天睡前阅读",     // 可选，0-200 字符
  "startDate": "2026-03-10",         // 必填，YYYY-MM-DD，≥ 今天
  "cueType": "trigger",              // 必填，"trigger" | "stacking"
  "cueValue": "午餐后",              // 必填，触发场景文本
  "stackedHabitId": null              // stacking 模式时必填
}
```

### 响应

**`201 Created`**

```typescript
{
  "data": {
    "id": "uuid-xxx",
    "name": "阅读 20 分钟",
    "description": "每天睡前阅读",
    "startDate": "2026-03-10",
    "frequency": "daily",
    "cueType": "trigger",
    "cueValue": "午餐后",
    "stackedHabitId": null,
    "isActive": true,
    "sortOrder": 0,
    "createdAt": "2026-03-10T08:30:00.000Z",
    "updatedAt": "2026-03-10T08:30:00.000Z"
  }
}
```

### 错误

| 状态码 | 错误码 | 触发条件 |
|--------|--------|----------|
| 400 | `VALIDATION_ERROR` | 名称为空、超长、日期格式错误等 |
| 409 | `HABIT_LIMIT_REACHED` | 活跃习惯已达 5 个上限 |
| 404 | `NOT_FOUND` | stacking 模式下 `stackedHabitId` 不存在 |

---

## 2. 获取习惯列表

`GET /api/habits`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `date` | string | 否 | 基准日期 `YYYY-MM-DD`，默认今天 |
| `active` | boolean | 否 | 是否只返回活跃习惯，默认 `true` |

### 响应

**`200 OK`**

```typescript
{
  "data": [
    {
      "id": "uuid-xxx",
      "name": "阅读 20 分钟",
      "description": "每天睡前阅读",
      "startDate": "2026-03-10",
      "frequency": "daily",
      "cueType": "trigger",
      "cueValue": "午餐后",
      "stackedHabitId": null,
      "isActive": true,
      "sortOrder": 0,
      "createdAt": "2026-03-10T08:30:00.000Z",
      "updatedAt": "2026-03-10T08:30:00.000Z",

      // ── 以下为计算字段，非 DB 直接查询 ──
      "checkedInToday": false,           // 今日是否已打卡
      "currentStreak": 12,               // 当前连续天数（实时计算, see DD-003）
      "canRetroactive": true,            // 是否可补昨日的卡
      "totalCheckIns": 45                // 总打卡天数
    }
    // ...
  ]
}
```

**排序规则：** 未完成在前，已完成在后；同组内按 `sortOrder` → `createdAt` 排序。

---

## 3. 获取单个习惯详情

`GET /api/habits/:id`

### 响应

**`200 OK`**

```typescript
{
  "data": {
    "id": "uuid-xxx",
    "name": "阅读 20 分钟",
    "description": "每天睡前阅读",
    "startDate": "2026-03-10",
    "frequency": "daily",
    "cueType": "trigger",
    "cueValue": "午餐后",
    "stackedHabitId": null,
    "stackedHabitName": null,            // 叠加习惯名称（stacking 模式）
    "isActive": true,
    "sortOrder": 0,
    "createdAt": "2026-03-10T08:30:00.000Z",
    "updatedAt": "2026-03-10T08:30:00.000Z",

    // 计算字段
    "checkedInToday": false,
    "currentStreak": 12,
    "longestStreak": 15,
    "totalCheckIns": 45,
    "completionRate": 0.94,              // 从 startDate 到今天的完成率
    "canRetroactive": true
  }
}
```

### 错误

| 状态码 | 错误码 | 触发条件 |
|--------|--------|----------|
| 404 | `NOT_FOUND` | 习惯 ID 不存在 |

---

## 4. 更新习惯

`PUT /api/habits/:id`

### 请求

```typescript
// UpdateHabitRequest（全量更新，前端提交完整表单）
{
  "name": "阅读 30 分钟",            // 必填
  "description": "加长阅读时间",      // 可选
  "startDate": "2026-03-10",          // 必填
  "cueType": "stacking",             // 必填
  "cueValue": "在运动30分钟之后",     // 必填
  "stackedHabitId": "uuid-yyy"        // stacking 模式时必填
}
```

### 响应

**`200 OK`** — 返回更新后的完整习惯对象（同 GET 单个详情格式）。

### 错误

| 状态码 | 错误码 | 触发条件 |
|--------|--------|----------|
| 400 | `VALIDATION_ERROR` | 字段校验失败 |
| 404 | `NOT_FOUND` | 习惯 ID 不存在 |
| 404 | `NOT_FOUND` | `stackedHabitId` 引用的习惯不存在 |

---

## 5. 删除习惯

`DELETE /api/habits/:id`

### 响应

**`200 OK`**

```typescript
{
  "message": "Habit deleted successfully"
}
```

级联删除：同时删除该习惯关联的所有 CheckIn、MilestoneEvent、StreakBreakEvent。

### 错误

| 状态码 | 错误码 | 触发条件 |
|--------|--------|----------|
| 404 | `NOT_FOUND` | 习惯 ID 不存在 |

---

## 6. 打卡

`POST /api/habits/:id/check-ins`

### 请求

```typescript
// CreateCheckInRequest
{
  "date": "2026-03-10"                // 必填，YYYY-MM-DD，仅限今天或昨天
}
```

> 服务端根据 `date` 与当前日期的关系自动判断是否为补卡（`isRetroactive`）。

### 响应

**`201 Created`**

```typescript
{
  "data": {
    "checkIn": {
      "id": "uuid-zzz",
      "habitId": "uuid-xxx",
      "date": "2026-03-10",
      "isRetroactive": false,
      "createdAt": "2026-03-10T14:30:00.000Z"
    },
    "updatedStreak": 13,               // 打卡后的最新 streak
    "milestone": null                   // 如触发里程碑则返回 MilestoneEvent 对象
  }
}
```

**触发里程碑时的响应（`milestone` 不为 null）：**

```typescript
{
  "data": {
    "checkIn": { ... },
    "updatedStreak": 7,
    "milestone": {
      "id": "uuid-mmm",
      "habitId": "uuid-xxx",
      "type": "7d",
      "totalDays": 7,
      "completionRate": 1.0,
      "longestStreak": 7,
      "dismissed": false,
      "createdAt": "2026-03-17T14:30:00.000Z"
    }
  }
}
```

### 错误

| 状态码 | 错误码 | 触发条件 |
|--------|--------|----------|
| 400 | `VALIDATION_ERROR` | 日期格式错误，或日期不是今天/昨天 |
| 404 | `NOT_FOUND` | 习惯 ID 不存在 |
| 409 | `ALREADY_CHECKED_IN` | 该日期已打过卡 |
| 409 | `RETROACTIVE_QUOTA_EXCEEDED` | 本月补卡配额已用完（补卡时） |

### 服务端逻辑

```
1. 校验日期 → 仅允许今天或昨天
2. 检查重复 → CheckIn 唯一约束 [habitId, date]
3. 如果是昨天（补卡）：
   a. 查询本月补卡次数，检查 < 3
   b. 标记 isRetroactive = true
4. 创建 CheckIn 记录
5. 计算新 streak
6. 检查里程碑触发条件（总打卡天数 ∈ {7,21,30,66,100} 且未触发过）
7. 如触发里程碑 → 创建 MilestoneEvent，快照当前统计数据
8. 返回响应
```

---

## 7. 获取打卡历史

`GET /api/habits/:id/check-ins`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `from` | string | 否 | 开始日期 `YYYY-MM-DD` |
| `to` | string | 否 | 结束日期 `YYYY-MM-DD` |

### 响应

**`200 OK`**

```typescript
{
  "data": [
    {
      "id": "uuid-zzz",
      "habitId": "uuid-xxx",
      "date": "2026-03-10",
      "isRetroactive": false,
      "createdAt": "2026-03-10T14:30:00.000Z"
    }
    // ...按 date 倒序排列
  ]
}
```

> 主要用途：周视图矩阵渲染、历史回顾。

---

## 8. 查询补卡配额

`GET /api/check-ins/retroactive-quota`

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `date` | string | 否 | 基准日期，默认今天，用于确定"本月" |

### 响应

**`200 OK`**

```typescript
{
  "data": {
    "month": "2026-03",               // 当前月份
    "used": 1,                         // 已使用次数
    "limit": 3,                        // 上限
    "remaining": 2                     // 剩余次数
  }
}
```

---

## 9. 关闭里程碑回顾

`POST /api/milestones/:id/dismiss`

> 用户在里程碑回顾卡片上点击"知道了"时调用。

### 响应

**`200 OK`**

```typescript
{
  "data": {
    "id": "uuid-mmm",
    "dismissed": true
  }
}
```

---

## 10. 关闭断裂安慰消息

`POST /api/streak-breaks/:id/dismiss`

> 用户关闭安慰消息时调用。

### 响应

**`200 OK`**

```typescript
{
  "data": {
    "id": "uuid-sss",
    "comfortShown": true
  }
}
```

---

## 11. 今日综合视图

`GET /api/today`

> 前端首屏加载的聚合接口，一次请求获取所有需要的数据，减少网络往返。

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `date` | string | 否 | 基准日期，默认今天 |

### 响应

**`200 OK`**

```typescript
{
  "data": {
    // ── 进度概览 ──
    "progress": {
      "total": 5,                      // 活跃习惯总数
      "completed": 3,                  // 今日已完成数
      "allDone": false                 // 是否全部完成
    },

    // ── 习惯列表（含今日状态） ──
    "habits": [
      {
        "id": "uuid-xxx",
        "name": "阅读 20 分钟",
        "description": "每天睡前阅读",
        "startDate": "2026-03-10",
        "frequency": "daily",
        "cueType": "trigger",
        "cueValue": "午餐后",
        "stackedHabitId": null,
        "isActive": true,
        "sortOrder": 0,

        "checkedInToday": false,
        "currentStreak": 12,
        "canRetroactive": true,
        "totalCheckIns": 45
      }
      // ...
    ],

    // ── 补卡配额 ──
    "retroactiveQuota": {
      "month": "2026-03",
      "used": 1,
      "limit": 3,
      "remaining": 2
    },

    // ── 待展示的断裂安慰（未关闭的） ──
    "pendingStreakBreaks": [
      {
        "id": "uuid-sss",
        "habitId": "uuid-xxx",
        "habitName": "阅读 20 分钟",
        "breakDate": "2026-03-09"
      }
    ],

    // ── 待展示的里程碑（未关闭的） ──
    "pendingMilestones": [
      {
        "id": "uuid-mmm",
        "habitId": "uuid-xxx",
        "habitName": "阅读 20 分钟",
        "type": "7d",
        "totalDays": 7,
        "completionRate": 1.0,
        "longestStreak": 7
      }
    ],

    // ── AI 每日鼓励语 ──
    "encouragement": {
      "message": "三天连续打卡了！保持这个节奏吧 ᕙ(⇀‸↼‶)ᕗ",
      "source": "ai"                   // "ai" | "fallback"（前端无需区分，仅调试用）
    }
  }
}
```

### 服务端逻辑

```
1. 查询所有活跃习惯
2. 对每个习惯：
   a. 查询今日是否打卡 → checkedInToday
   b. 计算当前 streak → currentStreak
   c. 判断是否可补卡 → canRetroactive
   d. 统计总打卡天数 → totalCheckIns
3. 计算进度 → progress
4. 查询本月补卡配额 → retroactiveQuota
5. 检测未展示的断裂安慰 → pendingStreakBreaks
6. 查询未关闭的里程碑 → pendingMilestones
7. 生成/获取 AI 每日鼓励语 → encouragement
   a. 查询缓存（DailyEncouragement 表，当日是否已生成）
   b. 有缓存 → 直接使用
   c. 无缓存 → 调用 Claude Haiku API 生成，传入 streak/进度/断裂状态
   d. API 失败 → 从静态文案库 fallback
   e. 存入缓存
8. 组装返回
```

---

---

> **以下为后续追加的 API 变更（2026-03-11），不修改上述原始 API 定义。**

## 追加：习惯提醒字段扩展（see DD-014）

### 影响的现有 API

以下 API 的请求/响应中新增 `reminderTime` 字段：

**`POST /api/habits`（创建习惯）— 请求新增可选字段：**

```typescript
{
  // ...原有字段不变
  "reminderTime": "08:00"              // 可选，HH:mm 格式，null 或省略表示不设置提醒
}
```

**`PUT /api/habits/:id`（更新习惯）— 请求新增可选字段：**

```typescript
{
  // ...原有字段不变
  "reminderTime": "08:00"              // 可选，HH:mm 格式，null 表示清除提醒
}
```

**`GET /api/habits`、`GET /api/habits/:id`、`GET /api/today` — 响应新增字段：**

```typescript
{
  // ...原有字段不变
  "reminderTime": "08:00"              // string | null
}
```

### Zod Schema 扩展

在 `packages/shared/src/schemas/habit.ts` 中扩展：

```typescript
// reminderTime 校验：HH:mm 格式
const reminderTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "提醒时间格式应为 HH:mm")
  .nullable()
  .optional();
```

### 说明

- `reminderTime` 为纯前端消费的数据，服务端仅负责存储和返回
- 定时检查和通知发送逻辑全部在客户端完成（Web Notification API + Service Worker）
- 服务端无需定时任务或推送服务

---

## 附录：前端调用场景映射

| 用户场景 | 调用的 API | 备注 |
|----------|-----------|------|
| 打开应用首屏 | `GET /api/today` | 一次获取所有数据 |
| 点击 [+] 创建习惯 | `POST /api/habits` | |
| 打卡（点复选框） | `POST /api/habits/:id/check-ins` | 前端乐观更新 |
| 补卡 | `POST /api/habits/:id/check-ins` | `date` = 昨天 |
| 编辑习惯 | `GET /api/habits/:id` → `PUT /api/habits/:id` | 先获取详情预填表单 |
| 删除习惯 | `DELETE /api/habits/:id` | |
| 关闭里程碑卡片 | `POST /api/milestones/:id/dismiss` | |
| 关闭安慰消息 | `POST /api/streak-breaks/:id/dismiss` | |
| 周视图 | `GET /api/habits/:id/check-ins?from=...&to=...` | 按习惯查询一周数据 |
| 设置/修改提醒时间 | `POST /api/habits` 或 `PUT /api/habits/:id` | `reminderTime` 字段（追加需求） |

## 附录：设计决策引用

- 打卡日期用 `YYYY-MM-DD` 字符串：see DD-002
- Streak 由服务端实时计算后附加到响应中：see DD-003
- 补卡配额全局共享（所有习惯合计每月 3 次）：see DD-007
- 里程碑快照数据在创建时固化：see DD-005
- AI 鼓励语使用 Anthropic SDK 单次调用，不引入 Agent SDK：see DD-013
- 提醒通知使用 Web Notification API，客户端调度，无需服务端推送：see DD-014
