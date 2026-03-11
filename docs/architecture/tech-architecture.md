# Habit Tracker - 技术架构文档

> 版本：v1.0 | 更新日期：2026-03-10
> 相关文档：`conventions.md`（开发约定）| `database-design.md`（数据模型）| `api-design.md`（API 设计）

---

## 1. 系统架构总览

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│  ┌─────────────────────────────────────────────────┐ │
│  │              React SPA (Vite)                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │ │
│  │  │  Pages   │ │Components│ │   Hooks        │  │ │
│  │  └────┬─────┘ └──────────┘ └───────┬────────┘  │ │
│  │       │                            │            │ │
│  │  ┌────▼────────────────────────────▼────────┐  │ │
│  │  │           Services (API Client)          │  │ │
│  │  └────────────────────┬─────────────────────┘  │ │
│  └───────────────────────┼─────────────────────────┘ │
└──────────────────────────┼───────────────────────────┘
                           │ HTTP (fetch)
                           │
┌──────────────────────────┼───────────────────────────┐
│                    Express Server                     │
│  ┌───────────────────────▼─────────────────────────┐ │
│  │              Middleware Pipeline                  │ │
│  │  errorHandler → (authPlaceholder) → routes      │ │
│  │  cors │ json │ requestLogger                    │ │
│  └───────────────────────┬─────────────────────────┘ │
│  ┌───────────────────────▼─────────────────────────┐ │
│  │  Routes → Controllers → Services → Prisma (DB) │ │
│  │                            │                     │ │
│  │                            └──→ Claude API       │ │
│  │                           (encouragement.service)│ │
│  └───────────────────────┬─────────────────────────┘ │
│  ┌───────────────────────▼─────────────────────────┐ │
│  │               SQLite (file-based)                │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              @habit-tracker/shared                     │
│  ┌──────────┐ ┌────────────┐ ┌───────────────────┐   │
│  │  Types   │ │  Constants │ │  Zod Schemas      │   │
│  └──────────┘ └────────────┘ └───────────────────┘   │
│                                                       │
│  client 和 server 共同引用（workspace dependency）      │
└──────────────────────────────────────────────────────┘
```

---

## 2. Monorepo 结构

```
habit-tracker-demo/
├── package.json                 # root：pnpm workspace 配置 + 全局 scripts
├── pnpm-workspace.yaml          # workspace 声明
├── tsconfig.base.json           # 共享 TypeScript 配置
├── .eslintrc.cjs                # 共享 ESLint 配置
├── .prettierrc                  # Prettier 配置
├── docs/                        # 项目文档（不参与构建）
│
├── packages/
│   ├── shared/                  # 共享代码包
│   │   ├── package.json         # name: @habit-tracker/shared
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/
│   │       │   ├── models.ts    # 领域模型类型 (Habit, CheckIn, etc.)
│   │       │   └── api.ts       # API 请求/响应 DTO 类型
│   │       ├── constants/
│   │       │   └── enums.ts     # 枚举与常量 (CueType, MilestoneType, etc.)
│   │       └── schemas/
│   │           └── habit.ts     # Zod 校验 schema
│   │
│   ├── client/                  # 前端 React 应用
│   │   ├── package.json         # name: @habit-tracker/client
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx         # 入口
│   │       ├── App.tsx          # 根组件 + 路由
│   │       ├── components/      # UI 组件（PascalCase）
│   │       │   ├── HabitCard.tsx
│   │       │   ├── ProgressBar.tsx
│   │       │   ├── Toast.tsx
│   │       │   ├── MilestoneModal.tsx
│   │       │   └── ...
│   │       ├── pages/           # 页面组件
│   │       │   ├── HomePage.tsx
│   │       │   ├── CreateHabitPage.tsx
│   │       │   ├── EditHabitPage.tsx
│   │       │   └── WeekViewPage.tsx
│   │       ├── hooks/           # 自定义 hooks
│   │       │   ├── use-today.ts
│   │       │   ├── use-habits.ts
│   │       │   └── use-check-in.ts
│   │       ├── services/        # API 调用层
│   │       │   ├── api.ts
│   │       │   └── reminder.ts  # 提醒通知调度（追加需求 see DD-014）
│   │       ├── types/           # 前端专用类型
│   │       └── utils/           # 工具函数
│   │
│   └── server/                  # 后端 Express 应用
│       ├── package.json         # name: @habit-tracker/server
│       ├── tsconfig.json
│       ├── prisma/
│       │   ├── schema.prisma    # 数据模型定义
│       │   ├── migrations/      # 迁移文件
│       │   └── seed.ts          # 初始化数据（默认用户）
│       └── src/
│           ├── index.ts         # 入口：创建 server 并监听端口
│           ├── app.ts           # Express app 配置 + 中间件挂载
│           ├── routes/          # 路由定义
│           │   ├── habit.routes.ts
│           │   ├── check-in.routes.ts
│           │   ├── milestone.routes.ts
│           │   ├── streak-break.routes.ts
│           │   └── today.routes.ts
│           ├── controllers/     # 请求处理
│           │   ├── habit.controller.ts
│           │   ├── check-in.controller.ts
│           │   └── today.controller.ts
│           ├── services/        # 业务逻辑
│           │   ├── habit.service.ts
│           │   ├── check-in.service.ts
│           │   ├── streak.service.ts
│           │   ├── milestone.service.ts
│           │   └── encouragement.service.ts  # AI 鼓励语（Claude API + 缓存 + fallback）
│           ├── middleware/       # 中间件
│           │   ├── error-handler.ts
│           │   ├── validate.ts  # Zod 校验中间件
│           │   └── auth.ts      # 认证预留（v1 透传默认用户）
│           └── utils/
│               └── prisma.ts    # Prisma Client 单例
```

---

## 3. 技术选型清单

### 3.1 核心技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 19.x | |
| 构建工具 | Vite | 6.x | 快速 HMR |
| CSS 框架 | Tailwind CSS | 4.x | 原子化 CSS |
| 路由 | React Router | 7.x | 客户端路由 |
| 后端框架 | Express | 5.x | |
| ORM | Prisma | 6.x | 类型安全 ORM |
| 数据库 | SQLite | - | 零配置，文件级数据库 |
| 语言 | TypeScript | 5.x | 全栈共享 |

### 3.2 工具库

| 用途 | 库 | 说明 |
|------|-----|------|
| 校验 | Zod | 前后端共享 schema（see DD-009） |
| 日期 | dayjs | 轻量日期处理（see DD-010） |
| 表单 | React Hook Form | 配合 @hookform/resolvers/zod |
| HTTP 客户端 | fetch（原生） | 无需额外库 |
| AI API | @anthropic-ai/sdk | Claude Haiku 生成每日鼓励语（see DD-013） |

### 3.3 开发工具

| 用途 | 工具 | 说明 |
|------|------|------|
| 包管理器 | pnpm | Monorepo workspace（see DD-008） |
| 后端开发运行 | tsx | TypeScript 直接运行，支持 watch |
| 后端构建 | tsup | 轻量 TS bundler |
| Lint | ESLint | 统一代码风格 |
| 格式化 | Prettier | 统一格式 |

---

## 4. 前端架构

### 4.1 路由设计

```typescript
// React Router 路由配置
/                    → HomePage          // 今日视图（默认）
/create              → CreateHabitPage   // 创建习惯（两步表单）
/edit/:id            → EditHabitPage     // 编辑习惯
/week                → WeekViewPage      // 周视图（P1 选做）
```

### 4.2 状态管理

> **设计决策：不引入全局状态管理库（如 Redux/Zustand），使用 React 内置方案。**

| 状态类型 | 方案 | 示例 |
|----------|------|------|
| 服务端数据 | 自定义 hooks + fetch + useState | `useToday()` 获取首屏数据 |
| 表单状态 | React Hook Form | 创建/编辑习惯表单 |
| UI 临时状态 | useState / useReducer | Toast 显示、Modal 开关 |
| 跨组件通信 | Context（仅需要时） | Toast 通知系统 |

**理由：** 本项目数据流简单（主要是列表 CRUD），不存在复杂的跨页面共享状态。自定义 hooks 封装 API 调用已足够。

### 4.3 API 调用层

```typescript
// packages/client/src/services/api.ts

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(error.error.code, error.error.message);
  }

  return res.json();
}

// 具体方法
export const api = {
  getToday: (date?: string) =>
    request<TodayResponse>(`/today${date ? `?date=${date}` : ""}`),

  createHabit: (data: CreateHabitRequest) =>
    request<{ data: Habit }>("/habits", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  checkIn: (habitId: string, date: string) =>
    request<CheckInResponse>(`/habits/${habitId}/check-ins`, {
      method: "POST",
      body: JSON.stringify({ date }),
    }),

  // ...
};
```

### 4.4 乐观更新策略

打卡操作（< 200ms 响应要求）使用乐观更新：

```
1. 用户点击复选框
2. 前端立即更新 UI（复选框填充、卡片移至已完成区）
3. 异步发送 POST /api/habits/:id/check-ins
4. 成功 → 用服务端返回的数据（streak、milestone）更新 UI
5. 失败 → 回滚 UI，显示错误 Toast
```

---

## 5. 后端架构

### 5.1 分层架构

```
请求 → Middleware → Route → Controller → Service → Prisma → SQLite
                                                ↑
                                    @habit-tracker/shared
                                    (types, schemas, constants)
```

| 层 | 职责 | 示例 |
|-----|------|------|
| **Middleware** | 跨切面关注（CORS、JSON 解析、错误处理、校验） | `validate.ts` 用 Zod schema 校验请求体 |
| **Route** | 定义 HTTP 方法 + 路径，绑定 controller | `router.post("/", validate(createHabitSchema), controller.create)` |
| **Controller** | 解析请求参数，调用 service，格式化响应 | 解析 `req.params.id`，调用 `habitService.create(data)` |
| **Service** | 核心业务逻辑，不依赖 HTTP 概念 | streak 计算、里程碑触发检查、补卡配额验证 |
| **Prisma** | 数据库访问，由 service 调用 | `prisma.habit.create(...)` |

### 5.2 中间件管道

```typescript
// packages/server/src/app.ts

const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// 认证预留（v1 注入默认用户 ID）
app.use(authPlaceholder);

// API 路由
app.use("/api/habits", habitRoutes);
app.use("/api/check-ins", checkInRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/streak-breaks", streakBreakRoutes);
app.use("/api/today", todayRoutes);

// 全局错误处理（放在最后）
app.use(errorHandler);
```

### 5.3 认证预留机制

```typescript
// packages/server/src/middleware/auth.ts

// v1：透传默认用户，不做实际认证
export function authPlaceholder(req: Request, _res: Response, next: NextFunction) {
  req.userId = "default-user";
  next();
}

// v2+：替换为 JWT 验证
// export function authenticate(req, res, next) {
//   const token = req.headers.authorization?.split(" ")[1];
//   const payload = verifyJWT(token);
//   req.userId = payload.userId;
//   next();
// }
```

### 5.4 校验中间件

```typescript
// packages/server/src/middleware/validate.ts
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: result.error.issues[0].message,
        },
      });
    }
    req.body = result.data; // 用 Zod 解析后的数据替换
    next();
  };
}
```

### 5.5 错误处理

```typescript
// packages/server/src/middleware/error-handler.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
  });
}
```

### 5.6 核心 Service 划分

| Service | 职责 | 关键方法 |
|---------|------|----------|
| `habit.service.ts` | 习惯 CRUD、活跃数量限制 | `create()`, `update()`, `delete()`, `getActiveCount()` |
| `check-in.service.ts` | 打卡、补卡、配额检查 | `checkIn()`, `getRetroactiveQuota()` |
| `streak.service.ts` | Streak 计算（see DD-003） | `calculateCurrentStreak()`, `calculateLongestStreak()` |
| `milestone.service.ts` | 里程碑触发检查、快照创建 | `checkAndTrigger()`, `dismiss()` |
| `today.service.ts` | 聚合今日视图数据（see DD-011） | `getTodayView()` |
| `encouragement.service.ts` | AI 鼓励语生成、缓存、fallback（see DD-013） | `getOrGenerate()`, `getFallback()` |

---

## 6. 开发环境

### 6.1 本地开发流程

```bash
# 安装依赖
pnpm install

# 初始化数据库
pnpm --filter @habit-tracker/server prisma:migrate
pnpm --filter @habit-tracker/server prisma:seed

# 启动开发服务器（并行）
pnpm dev
# → client: Vite dev server @ http://localhost:5173
# → server: tsx watch      @ http://localhost:3000
```

### 6.2 环境变量

```bash
# packages/server/.env
DATABASE_URL="file:./dev.db"

# AI 鼓励语功能（Phase 2d）
ANTHROPIC_API_KEY="sk-ant-..."      # Claude API Key
ANTHROPIC_MODEL="claude-haiku-4-5-20251001"  # 使用 Haiku，成本最低
```

> `ANTHROPIC_API_KEY` 未配置时，鼓励语功能自动 fallback 到静态文案，不影响其他功能。

### 6.3 Vite 代理配置

```typescript
// packages/client/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### 6.4 Root package.json Scripts

```jsonc
{
  "scripts": {
    "dev": "pnpm --parallel --filter @habit-tracker/client --filter @habit-tracker/server dev",
    "build": "pnpm --filter @habit-tracker/shared build && pnpm --parallel --filter @habit-tracker/client --filter @habit-tracker/server build",
    "lint": "eslint packages/",
    "format": "prettier --write packages/"
  }
}
```

---

## 7. 构建与部署

### 7.1 构建产物

```
dist/
├── client/          # Vite 构建的静态文件（HTML/JS/CSS）
└── server/          # tsup 构建的 Node.js bundle
    └── index.js
```

### 7.2 生产环境运行

```bash
# 构建
pnpm build

# 运行（Express 同时托管前端静态文件）
node dist/server/index.js
# → http://localhost:3000      API
# → http://localhost:3000/*    前端静态文件
```

```typescript
// 生产环境：Express 托管前端静态文件
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
  });
}
```

---

## 8. 关键技术决策索引

本文档涉及的设计决策，详见 `design-decisions.md`：

| 决策编号 | 主题 | 影响范围 |
|----------|------|----------|
| DD-001 | shared 包策略 | Monorepo 结构 |
| DD-002 | 日期字符串策略 | 全栈日期处理 |
| DD-003 | Streak 实时计算 | Service 层 |
| DD-008 | pnpm 包管理器 | 开发环境 |
| DD-009 | Zod 共享校验 | 校验中间件 + 前端表单 |
| DD-010 | dayjs 日期库 | 全栈工具函数 |
| DD-011 | /api/today 聚合接口 | API + 前端首屏 |
| DD-013 | AI 功能用 Anthropic SDK | encouragement.service + 环境变量 |
| DD-014 | 提醒通知用 Web Notification API | 客户端 reminder.ts + Service Worker |

---

> **以下为后续追加的架构说明（2026-03-11），不修改上述原始内容。**

## 9. 提醒通知架构（追加需求 see DD-014）

### 9.1 架构概览

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │          React SPA                            │   │
│  │  ┌─────────────────┐  ┌──────────────────┐   │   │
│  │  │  useReminder()  │  │  reminder.ts     │   │   │  ← 前台：每分钟检查
│  │  │  (hook)         │──│  (调度服务)       │   │   │
│  │  └─────────────────┘  └────────┬─────────┘   │   │
│  └─────────────────────────────────┼─────────────┘   │
│                                    │                  │
│                                    ▼                  │
│  ┌──────────────────────────────────────────────┐   │
│  │           Service Worker (sw-reminder.js)     │   │  ← 后台：接收消息发通知
│  │  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ message handler│  │ Notification.show() │  │   │
│  │  └──────────────┘  └──────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │          Web Notification API (OS Level)       │   │  ← 操作系统通知
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 9.2 核心模块

| 模块 | 位置 | 职责 |
|------|------|------|
| `reminder.ts` | `packages/client/src/services/` | 通知调度核心：权限管理、定时检查、防重复发送 |
| `useReminder` | `packages/client/src/hooks/` | React hook：初始化调度器、响应习惯数据变化 |
| `sw-reminder.js` | `packages/client/public/` | Service Worker：后台通知发送 |
| `useBadge` | `packages/client/src/hooks/` | Nice-to-have：document.title badge 更新 |

### 9.3 前台调度逻辑

```typescript
// packages/client/src/services/reminder.ts（概念代码）

class ReminderScheduler {
  private sentToday: Set<string> = new Set(); // habitId set，防重复

  start(habits: HabitWithStatus[]) {
    // 每分钟检查一次
    setInterval(() => this.check(habits), 60_000);
  }

  private check(habits: HabitWithStatus[]) {
    const now = dayjs().format("HH:mm");
    for (const habit of habits) {
      if (
        habit.reminderTime === now &&
        !habit.checkedInToday &&
        !this.sentToday.has(habit.id)
      ) {
        this.notify(habit);
        this.sentToday.add(habit.id);
      }
    }
  }

  private async notify(habit: HabitWithStatus) {
    if (Notification.permission !== "granted") return;
    new Notification("⏰ 习惯打卡提醒", {
      body: `「${habit.name}」— 现在是你的习惯时间！`,
      tag: `reminder-${habit.id}`, // 防重复通知
    });
  }

  // 每天零点重置 sentToday
  resetDaily() { this.sentToday.clear(); }
}
```

### 9.4 Service Worker（后台通知）

```typescript
// packages/client/public/sw-reminder.js（概念代码）

self.addEventListener("message", (event) => {
  if (event.data.type === "SCHEDULE_REMINDER") {
    const { habitName, habitId, delay } = event.data;
    setTimeout(() => {
      self.registration.showNotification("⏰ 习惯打卡提醒", {
        body: `「${habitName}」— 现在是你的习惯时间！`,
        tag: `reminder-${habitId}`,
      });
    }, delay);
  }
});
```

### 9.5 关键设计要点

1. **无服务端依赖**：提醒逻辑完全在客户端，服务端仅存储 `reminderTime` 字段
2. **防重复**：每个习惯每天最多一次通知，使用 `Set` + Notification `tag` 双重保障
3. **优雅降级**：权限未授予或 API 不支持时静默降级，不影响核心功能
4. **每日重置**：零点或应用重新加载时清空已发送记录
