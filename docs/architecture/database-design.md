# Habit Tracker - 数据库设计 (Database Design)

> 版本：v1.0 | 更新日期：2026-03-10
> ORM：Prisma | 数据库：SQLite（可迁移至 PostgreSQL）

---

## 1. ER 关系图

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    User      │       │    Habit     │       │    CheckIn       │
│  (v1 预留)   │       │              │       │                  │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id       PK  │──1:N─►│ id       PK  │──1:N─►│ id           PK  │
│ email?       │       │ userId   FK  │       │ habitId      FK  │
│ createdAt    │       │ name         │       │ date     (索引)  │
│ updatedAt    │       │ description? │       │ isRetroactive    │
│              │       │ startDate    │       │ createdAt        │
│              │       │ frequency    │       │ updatedAt        │
│              │       │ cueType      │       └──────────────────┘
│              │       │ cueValue     │
│              │       │ stackedHabitId? FK ──┐
│              │       │ isActive     │       │  自引用（习惯叠加）
│              │       │ sortOrder    │       │
│              │       │ createdAt    │◄──────┘
│              │       │ updatedAt    │
│              │       └──────┬───────┘
│              │              │
│              │              │ 1:N
│              │              ▼
│              │       ┌──────────────────┐
│              │       │ MilestoneEvent   │
│              │       ├──────────────────┤
│              │       │ id           PK  │
│              │       │ habitId      FK  │
│              │       │ type             │
│              │       │ totalDays        │
│              │       │ completionRate   │
│              │       │ longestStreak    │
│              │       │ dismissed        │
│              │       │ createdAt        │
│              │       └──────────────────┘
└──────────────┘

                       ┌──────────────────┐
                       │ StreakBreakEvent  │
                       ├──────────────────┤
                       │ id           PK  │
                       │ habitId      FK  │  独立表，记录断裂安慰
                       │ breakDate        │  是否已展示
                       │ comfortShown     │
                       │ createdAt        │
                       └──────────────────┘

                       ┌──────────────────┐
                       │DailyEncouragement│
                       ├──────────────────┤
                       │ id           PK  │  AI 每日鼓励语缓存
                       │ date             │  YYYY-MM-DD
                       │ message          │  生成的鼓励文案
                       │ source           │  "ai" | "fallback"
                       │ context          │  生成时的状态快照 (JSON)
                       │ createdAt        │
                       └──────────────────┘
```

---

## 2. Prisma Schema

```prisma
// packages/server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ──────────────────────────────────
// User（v1 预留，单用户模式）
// ──────────────────────────────────
model User {
  id        String   @id @default(uuid())
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  habits Habit[]
}

// ──────────────────────────────────
// Habit（习惯）
// ──────────────────────────────────
model Habit {
  id          String  @id @default(uuid())
  userId      String
  name        String                        // 1-50 字符
  description String?                       // 0-200 字符
  startDate   String                        // YYYY-MM-DD
  frequency   String  @default("daily")     // v1 固定 "daily"
  cueType     String                        // "trigger" | "stacking"
  cueValue    String                        // 触发场景文本（trigger 模式）
  stackedHabitId String?                    // 叠加的目标习惯 ID（stacking 模式）
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)           // 列表排序
  reminderTime String?                      // 每日提醒时间 "HH:mm"，null=不提醒（追加需求 see DD-014）

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 关系
  user            User              @relation(fields: [userId], references: [id])
  stackedHabit    Habit?            @relation("HabitStacking", fields: [stackedHabitId], references: [id])
  stackedByHabits Habit[]           @relation("HabitStacking")
  checkIns        CheckIn[]
  milestoneEvents MilestoneEvent[]
  streakBreaks    StreakBreakEvent[]

  @@index([userId, isActive])
  @@index([stackedHabitId])
}

// 追加需求（2026-03-11）：reminderTime 字段已添加到 Habit 模型中
// see DD-014

// ──────────────────────────────────
// CheckIn（打卡记录）
// ──────────────────────────────────
model CheckIn {
  id            String  @id @default(uuid())
  habitId       String
  date          String                      // YYYY-MM-DD（打卡目标日期）
  isRetroactive Boolean @default(false)     // 是否为补卡

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])                 // 同一习惯同一天只能打一次卡
  @@index([habitId])
  @@index([date])
}

// ──────────────────────────────────
// MilestoneEvent（里程碑事件）
// ──────────────────────────────────
model MilestoneEvent {
  id             String  @id @default(uuid())
  habitId        String
  type           String                     // "7d" | "21d" | "30d" | "66d" | "100d"
  totalDays      Int                        // 触发时的总打卡天数
  completionRate Float                      // 触发时的完成率 (0-1)
  longestStreak  Int                        // 触发时的最长连续天数
  dismissed      Boolean @default(false)    // 用户是否已查看

  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, type])                 // 每个习惯每种里程碑只触发一次
  @@index([habitId])
}

// ──────────────────────────────────
// StreakBreakEvent（连续断裂安慰记录）
// ──────────────────────────────────
model StreakBreakEvent {
  id           String  @id @default(uuid())
  habitId      String
  breakDate    String                       // YYYY-MM-DD（断裂发生的日期）
  comfortShown Boolean @default(false)      // 安慰消息是否已展示

  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, breakDate])            // 同一习惯同一天只记录一次断裂
  @@index([habitId])
}

// ──────────────────────────────────
// DailyEncouragement（AI 鼓励语缓存）
// ──────────────────────────────────
model DailyEncouragement {
  id        String @id @default(uuid())
  date      String                         // YYYY-MM-DD
  message   String                         // 生成的鼓励文案（含颜文字）
  source    String                         // "ai" | "fallback"
  context   String?                        // 生成时的状态快照 JSON（调试用）

  createdAt DateTime @default(now())

  @@unique([date])                         // 每天只缓存一条
  @@index([date])
}
```

---

## 3. 模型详细说明

### 3.1 User（预留）

v1 为单用户模式。系统初始化时自动创建一个默认用户，所有习惯归属于该用户。

```typescript
// 默认用户 ID，硬编码在 server 常量中
const DEFAULT_USER_ID = "default-user";
```

**为什么预留 User 表？**
- 所有 Habit 已经通过 `userId` 外键关联
- 后续接入 JWT/OAuth 时只需修改认证中间件，数据模型无需改动

### 3.2 Habit（习惯）

| 字段 | 说明 | 校验规则 |
|------|------|----------|
| `name` | 习惯名称 | 必填，1-50 字符 |
| `description` | 习惯描述 | 可选，0-200 字符 |
| `startDate` | 开始日期 | 必填，`YYYY-MM-DD`，不可为过去日期（创建时） |
| `frequency` | 频次 | 固定 `"daily"`（v1） |
| `cueType` | 触发方式 | `"trigger"` 或 `"stacking"` |
| `cueValue` | 触发文本 | trigger 模式：场景文本；stacking 模式：生成的叠加描述文案 |
| `stackedHabitId` | 叠加目标习惯 | stacking 模式：引用的习惯 ID；trigger 模式：null |
| `isActive` | 是否活跃 | 默认 true，删除时可考虑软删除（v1 直接硬删除） |
| `sortOrder` | 排序权重 | 默认 0，用于自定义排序（v1 按创建时间） |
| `reminderTime` | 每日提醒时间 | 可选，`HH:mm` 格式（如 `"08:00"`），null 表示不提醒（追加需求，see DD-014） |

**Cue 设计说明：**

PRD 允许同时设置 trigger 和 stacking，但"至少选其一"。为简化 v1 实现：
- `cueType` 记录主要的 Cue 方式
- trigger 模式：`cueValue` = 场景文本（如"午餐后"），`stackedHabitId` = null
- stacking 模式：`cueValue` = 生成的描述文案（如"在运动30分钟之后"），`stackedHabitId` = 目标习惯 ID

### 3.3 CheckIn（打卡记录）

| 字段 | 说明 |
|------|------|
| `date` | 打卡的目标日期（`YYYY-MM-DD`），今日打卡=今天，补卡=昨天 |
| `isRetroactive` | 区分正常打卡与补卡，用于统计展示 |

**唯一约束：** `@@unique([habitId, date])` — 同一习惯同一天不可重复打卡。

**级联删除：** 删除习惯时自动删除所有关联的 CheckIn 记录。

### 3.4 MilestoneEvent（里程碑事件）

| 字段 | 说明 |
|------|------|
| `type` | 里程碑类型：`"7d"` / `"21d"` / `"30d"` / `"66d"` / `"100d"` |
| `totalDays` | 触发时的总打卡天数（快照数据） |
| `completionRate` | 触发时的完成率（快照数据） |
| `longestStreak` | 触发时的最长连续天数（快照数据） |
| `dismissed` | 用户是否已点击"知道了"关闭 |

**唯一约束：** `@@unique([habitId, type])` — 每个习惯每种里程碑只触发一次。

**为什么存快照数据？**
里程碑回顾卡片需要展示"触发那一刻"的统计数据，而非当前数据。用户可能在 66 天里程碑触发后继续打卡，事后再查看时应展示 66 天时的数据。

### 3.5 StreakBreakEvent（断裂安慰记录）

**为什么需要独立表？**

PRD 要求"同一次断裂只展示一次安慰消息"。如果没有这个记录：
- 用户看到安慰消息后关闭 app
- 再次打开 app 时，系统检测到 streak 仍然是 0，会再次弹出安慰
- 需要记录"这次断裂已经安慰过了"

| 字段 | 说明 |
|------|------|
| `breakDate` | 断裂发生的日期（即"最后一次打卡日期的下一天"） |
| `comfortShown` | 安慰消息是否已展示给用户 |

### 3.6 DailyEncouragement（AI 鼓励语缓存）

AI 鼓励语每天生成一次，缓存在数据库中，避免重复调用 Claude API。

| 字段 | 说明 |
|------|------|
| `date` | 鼓励语对应的日期（`YYYY-MM-DD`） |
| `message` | 生成的鼓励文案，包含颜文字/表情 |
| `source` | 来源标记：`"ai"`（Claude API 生成）或 `"fallback"`（静态文案） |
| `context` | 生成时的状态快照（JSON），包含 streak、进度等信息，便于调试 |

**唯一约束：** `@@unique([date])` — 每天只缓存一条鼓励语。

**清理策略：** 可定期清理超过 30 天的历史缓存记录（可选）。

---

## 4. 关键业务逻辑的数据支撑

### 4.1 Streak 计算（不存储，实时计算）

> **设计决策：Streak 不作为字段持久化存储，而是从 CheckIn 记录实时计算。**

**理由：**
- 避免数据不一致（补卡、删除打卡记录时需要同步更新）
- CheckIn 数据量小（单用户、5 个习惯），查询成本可忽略
- 计算逻辑集中在 Service 层，易于维护和测试

**计算算法：**

```typescript
// 伪代码：计算某习惯的当前 streak
function calculateStreak(habitId: string, today: string): number {
  // 1. 获取该习惯所有打卡记录，按日期倒序
  const checkIns = getCheckInsByHabitId(habitId, orderBy: date DESC);

  // 2. 从今天开始往回数连续天数
  let streak = 0;
  let currentDate = today;

  // 如果今天没打卡，从昨天开始检查
  if (!checkIns.includes(today)) {
    currentDate = yesterday(today);
  }

  // 3. 连续回溯
  while (checkIns.includes(currentDate)) {
    streak++;
    currentDate = previousDay(currentDate);
  }

  return streak;
}
```

### 4.2 补卡配额检查

```typescript
// 伪代码：查询本月已用补卡次数
function getRetroactiveCountThisMonth(today: string): number {
  const monthStart = firstDayOfMonth(today);  // "2026-03-01"
  const monthEnd = lastDayOfMonth(today);     // "2026-03-31"

  return count(CheckIn, where: {
    isRetroactive: true,
    date: between(monthStart, monthEnd),
  });
}
```

> 注意：补卡配额是全局的（所有习惯共享每月 3 次），不是按习惯计算。

### 4.3 里程碑触发检查

```typescript
// 伪代码：打卡后检查是否触发里程碑
function checkMilestone(habitId: string): MilestoneType | null {
  const totalDays = count(CheckIn, where: { habitId });
  const milestoneTypes = [7, 21, 30, 66, 100];

  if (milestoneTypes.includes(totalDays)) {
    const type = `${totalDays}d`;
    const existing = find(MilestoneEvent, where: { habitId, type });
    if (!existing) {
      return type; // 需要触发
    }
  }
  return null; // 不需要触发
}
```

### 4.4 断裂检测

```typescript
// 伪代码：应用加载时检测断裂
function detectStreakBreaks(habitId: string, today: string): boolean {
  const yesterday = previousDay(today);
  const dayBefore = previousDay(yesterday);

  // 昨天没打卡 AND 前天打过卡 → streak 刚刚断裂
  const yesterdayChecked = exists(CheckIn, { habitId, date: yesterday });
  const dayBeforeChecked = exists(CheckIn, { habitId, date: dayBefore });

  if (!yesterdayChecked && dayBeforeChecked) {
    // 检查是否已记录过这次断裂
    const existing = find(StreakBreakEvent, { habitId, breakDate: yesterday });
    if (!existing) {
      return true; // 新的断裂，需要安慰
    }
    return !existing.comfortShown;
  }
  return false;
}
```

---

## 5. 索引策略

| 索引 | 字段 | 用途 |
|------|------|------|
| Habit 复合索引 | `[userId, isActive]` | 查询用户的活跃习惯列表 |
| CheckIn 唯一索引 | `[habitId, date]` | 防重复打卡 + 快速查某天是否打卡 |
| CheckIn 索引 | `[habitId]` | 按习惯查询打卡历史 |
| CheckIn 索引 | `[date]` | 按日期查询所有打卡（今日视图） |
| MilestoneEvent 唯一索引 | `[habitId, type]` | 防重复触发 + 快速查询 |
| StreakBreakEvent 唯一索引 | `[habitId, breakDate]` | 防重复记录 + 查询断裂状态 |
| DailyEncouragement 唯一索引 | `[date]` | 每天一条缓存 + 按日期快速查询 |

---

## 6. 数据初始化

### 默认用户（v1）

```typescript
// server 启动时 seed
async function seedDefaultUser() {
  await prisma.user.upsert({
    where: { id: "default-user" },
    update: {},
    create: {
      id: "default-user",
      email: null,
    },
  });
}
```

---

## 附录：与 PRD 数据模型的差异说明

| PRD 原始设计 | 本文档调整 | 原因 |
|-------------|-----------|------|
| Streak 存储为 Habit 字段 | 实时计算，不持久化 | 避免数据不一致，计算成本低 |
| 无 StreakBreakEvent 表 | 新增 | 需要记录"安慰消息已展示"状态 |
| MilestoneEvent 只有基础字段 | 增加快照数据字段 | 回顾卡片需要展示触发时刻的统计 |
| Habit.cueValue 存关联习惯 ID | 拆分为 cueValue + stackedHabitId | stacking 模式需要同时存描述文案和引用关系 |
| 无 sortOrder 字段 | 新增 | 支持列表自定义排序 |
| 无鼓励语缓存 | 新增 DailyEncouragement 表 | AI 鼓励语每天缓存一条，避免重复调用 API |
| 无提醒相关字段 | Habit 表增加 `reminderTime` 字段 | 追加需求：支持每日定时提醒（see DD-014） |
| User 表仅预留 id + email | 增加 `username` + `passwordHash` 字段，移除 `email` | 追加需求：本地 JWT 认证（see DD-015） |

---

> **以下为后续追加的数据库变更（2026-03-12），不修改上述原始设计。**

## 7. User 表升级：从预留到实际认证（see DD-015）

### 7.1 变更说明

User 表从 v1 的"预留占位"升级为实际的认证用户表。

**变更前（v1 预留）：**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  habits    Habit[]
}
```

**变更后：**
```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique                // 用户名，3-20 字符，唯一
  passwordHash String                          // bcrypt 哈希后的密码
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  habits       Habit[]

  @@index([username])
}
```

### 7.2 字段说明

| 字段 | 说明 | 校验规则 |
|------|------|----------|
| `username` | 用户名，登录凭证 | 必填，3-20 字符，`/^[a-zA-Z0-9_]+$/`，唯一 |
| `passwordHash` | bcrypt 哈希后的密码 | 由服务端生成，不直接接受明文 |

**移除字段：** `email` — v1 不使用邮箱，避免空字段混淆。

### 7.3 索引

| 索引 | 字段 | 用途 |
|------|------|------|
| 唯一索引 | `username` | 登录查询 + 注册唯一性检查 |

### 7.4 数据初始化（更新）

```typescript
// Prisma seed：预置 demo 账号
import bcrypt from "bcrypt";

async function seedDemoUser() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      id: "demo-user-id",
      username: "demo",
      passwordHash,
    },
  });
}
```

**注意：** 原有的 `default-user` 不再需要。新系统通过 JWT 中间件从 token 中提取 userId，不再硬编码默认用户。
