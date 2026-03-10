# Habit Tracker - 开发约定 (Development Conventions)

> 版本：v1.0 | 更新日期：2026-03-10
> 本文档定义项目级开发标准，所有架构设计和编码实现需遵循这些约定。

---

## 1. 共享类型策略 (Shared Types)

### 架构

```
packages/
├── shared/          ← 共享类型与常量（新增）
│   ├── src/
│   │   ├── types/   # 共享 TypeScript 类型
│   │   └── constants/ # 共享常量（枚举值、文案等）
│   └── package.json
├── client/          ← 引用 @habit-tracker/shared
└── server/          ← 引用 @habit-tracker/shared
```

### 原则

- **Single Source of Truth**：所有跨前后端的类型定义统一放在 `packages/shared`
- Prisma 生成的类型仅在 server 内部使用，对外暴露的 API 类型通过 shared 定义
- shared 包通过 monorepo workspace 引用（`"@habit-tracker/shared": "workspace:*"`）

### 类型分层

| 层级 | 位置 | 说明 |
|------|------|------|
| API 类型 | `shared/src/types/api.ts` | 请求/响应的 DTO 类型，前后端共用 |
| 领域类型 | `shared/src/types/models.ts` | Habit、CheckIn 等业务实体类型 |
| 枚举/常量 | `shared/src/constants/` | CueType、MilestoneType 等枚举值 |
| DB 类型 | `server/` 内部 | Prisma 生成，不外泄 |
| UI 类型 | `client/` 内部 | 组件 props、UI state 等 |

---

## 2. 日期与时区策略 (Date & Timezone)

### 核心决策

> 本项目为**单用户本地应用**（v1），采用 **"日期即字符串"** 的简化策略。

| 项目 | 决策 | 说明 |
|------|------|------|
| 打卡日期存储 | `String` 格式 `YYYY-MM-DD` | 不用 DateTime，避免时区歧义 |
| "今天"的定义 | 客户端本地日期 | 由前端传给后端，格式 `YYYY-MM-DD` |
| 时间戳字段 | `DateTime`（ISO 8601 UTC） | `createdAt`、`updatedAt` 等审计字段 |
| 日期库 | `dayjs`（轻量） | 前后端统一使用，放入 shared 依赖 |

### 日期字段命名规范

| 字段语义 | 字段名 | 类型 | 示例值 |
|----------|--------|------|--------|
| 打卡日期 | `date` | `String` | `"2026-03-10"` |
| 习惯开始日 | `startDate` | `String` | `"2026-03-01"` |
| 创建时间戳 | `createdAt` | `DateTime` | `2026-03-10T08:30:00.000Z` |
| 更新时间戳 | `updatedAt` | `DateTime` | `2026-03-10T08:30:00.000Z` |

### API 中的日期传递

- 请求参数中的日期：`YYYY-MM-DD` 字符串（如 `?date=2026-03-10`）
- 响应中的日期字段：保持 `YYYY-MM-DD` 字符串
- 响应中的时间戳字段：ISO 8601 UTC 字符串

---

## 3. API 响应格式 (API Response Format)

### 成功响应

```typescript
// 单个资源
{
  "data": { ... }
}

// 列表资源
{
  "data": [ ... ]
}

// 无数据操作（如删除）
{
  "message": "Habit deleted successfully"
}
```

### 错误响应

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",     // 机器可读的错误码
    "message": "习惯名称不能为空"     // 人类可读的错误信息
  }
}
```

### 标准错误码

| 错误码 | HTTP Status | 说明 |
|--------|-------------|------|
| `VALIDATION_ERROR` | 400 | 请求参数校验失败 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 业务冲突（如习惯数已达上限） |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

### HTTP 状态码使用

| 操作 | 成功状态码 |
|------|-----------|
| GET（查询） | `200 OK` |
| POST（创建） | `201 Created` |
| PUT/PATCH（更新） | `200 OK` |
| DELETE（删除） | `200 OK` |

---

## 4. 命名规范 (Naming Conventions)

### 数据库 / Prisma Schema

| 项目 | 规范 | 示例 |
|------|------|------|
| 表名（Model） | PascalCase，单数 | `Habit`、`CheckIn` |
| 字段名 | camelCase | `startDate`、`cueType` |
| 关系字段 | camelCase，引用实体名 | `habit`、`checkIns` |
| 外键 | `{entity}Id` | `habitId` |

### API 路径

| 项目 | 规范 | 示例 |
|------|------|------|
| 基础路径 | `/api` 前缀，不加版本号（v1 单版本） | `/api/habits` |
| 资源路径 | 复数名词，kebab-case | `/api/habits`、`/api/check-ins` |
| 子资源 | 嵌套路径 | `/api/habits/:id/check-ins` |
| 查询参数 | camelCase | `?date=2026-03-10` |

### TypeScript 代码

| 项目 | 规范 | 示例 |
|------|------|------|
| 接口/类型 | PascalCase | `Habit`、`CreateHabitRequest` |
| 变量/函数 | camelCase | `getHabits`、`streakCount` |
| 常量 | UPPER_SNAKE_CASE | `MAX_ACTIVE_HABITS` |
| 枚举值 | UPPER_SNAKE_CASE | `CueType.TRIGGER`、`CueType.STACKING` |
| 文件名 | kebab-case | `habit-controller.ts`、`use-habits.ts` |
| React 组件文件 | PascalCase | `HabitCard.tsx`、`CreateHabitForm.tsx` |

### 枚举值定义

```typescript
// shared/src/constants/enums.ts

export enum CueType {
  TRIGGER = "trigger",
  STACKING = "stacking",
}

export enum MilestoneType {
  DAY_7 = "7d",
  DAY_21 = "21d",
  DAY_30 = "30d",
  DAY_66 = "66d",
  DAY_100 = "100d",
}

export const MAX_ACTIVE_HABITS = 5;
export const MAX_RETROACTIVE_PER_MONTH = 3;
```

---

## 5. 校验策略 (Validation)

### 校验位置

| 层级 | 职责 | 工具 |
|------|------|------|
| 前端表单 | 即时反馈，UX 友好 | React Hook Form + Zod |
| API 入口 | 安全边界，拒绝非法请求 | Zod（共享 schema） |
| 数据库 | 最后防线，数据完整性 | Prisma schema 约束 |

### 共享校验 Schema

- 校验规则定义在 `packages/shared` 中（使用 Zod）
- 前端表单和后端 API 共用同一套 schema，确保规则一致
- 示例：习惯名称 1-50 字符的校验只需写一次

---

## 6. 项目结构约定 (Project Structure)

### 目录结构

```
habit-tracker-demo/
├── docs/                          # 文档
├── packages/
│   ├── shared/                    # 共享代码
│   │   ├── src/
│   │   │   ├── types/             # 共享类型
│   │   │   │   ├── models.ts      # 领域模型类型
│   │   │   │   └── api.ts         # API 请求/响应类型
│   │   │   ├── constants/         # 共享常量
│   │   │   │   └── enums.ts       # 枚举与常量值
│   │   │   └── schemas/           # 共享 Zod 校验 schema
│   │   │       └── habit.ts
│   │   └── package.json
│   ├── client/                    # 前端
│   │   ├── src/
│   │   │   ├── components/        # UI 组件（PascalCase 文件名）
│   │   │   ├── pages/             # 页面
│   │   │   ├── hooks/             # 自定义 hooks（use-xxx.ts）
│   │   │   ├── services/          # API 调用层
│   │   │   ├── types/             # 前端专用类型
│   │   │   └── utils/             # 工具函数
│   │   └── package.json
│   └── server/                    # 后端
│       ├── src/
│       │   ├── routes/            # Express 路由定义
│       │   ├── controllers/       # 请求处理（调用 service）
│       │   ├── services/          # 业务逻辑
│       │   ├── middleware/        # 中间件（错误处理、认证预留）
│       │   └── utils/             # 工具函数
│       ├── prisma/                # Prisma schema & migrations
│       └── package.json
├── CLAUDE.md
└── package.json                   # monorepo root (pnpm workspace)
```

### 后端分层

```
Route → Controller → Service → Prisma (DB)
```

- **Route**：定义路径和 HTTP 方法，调用 controller
- **Controller**：解析请求参数，调用 service，格式化响应
- **Service**：核心业务逻辑（streak 计算、补卡配额检查等）
- **Prisma**：数据库访问

---

## 附录：技术选型清单

| 类别 | 工具 | 说明 |
|------|------|------|
| 包管理器 | pnpm | Monorepo workspace 支持好 |
| 构建工具 | Vite（前端）、tsx（后端开发）、tsup（后端构建） | |
| 校验 | Zod | 前后端共享 schema |
| 日期处理 | dayjs | 轻量，放入 shared 依赖 |
| HTTP 客户端 | fetch（原生） | 前端 API 调用，无需额外库 |
| 表单 | React Hook Form | 配合 Zod resolver |
| 代码质量 | ESLint + Prettier | 统一格式 |
