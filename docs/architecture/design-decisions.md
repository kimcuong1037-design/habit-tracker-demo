# Habit Tracker - 设计决策记录 (Design Decisions)

> 本文档记录项目开发过程中的关键设计决策，包括背景、方案选择和理由。
> 每条决策附带编号，便于在其他文档和代码注释中引用（如 `// see DD-005`）。

---

## DD-001: 共享类型策略 — 新增 `packages/shared`

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 架构设计 |
| **背景** | 前后端均使用 TypeScript，需要共享 API 类型、领域模型类型和校验规则 |
| **方案** | 新增 `packages/shared` 作为 monorepo 第三个包，通过 workspace 引用 |
| **备选方案** | ① 直接用 Prisma 生成类型导出给前端 ② 前后端各自定义类型 |
| **决策理由** | Prisma 类型包含 DB 实现细节（如 DateTime vs string），不适合直接暴露给前端；各自定义则容易漂移。shared 包是最干净的 single source of truth |

---

## DD-002: 日期策略 — 打卡日期用 `YYYY-MM-DD` 字符串

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 架构设计 |
| **背景** | 习惯打卡的核心概念是"哪一天"，不是"哪一刻"。时区处理是常见的 bug 来源 |
| **方案** | 打卡日期（`date`、`startDate`、`breakDate`）用 `String` 类型存储 `YYYY-MM-DD`；审计字段（`createdAt`、`updatedAt`）用 `DateTime` UTC |
| **备选方案** | 全部用 DateTime，服务端统一转换时区 |
| **决策理由** | v1 为单用户本地应用，"今天是哪天"由客户端决定。纯日期字符串彻底消除时区歧义，简化 streak 计算和日期比较逻辑 |

---

## DD-003: Streak 不持久化，实时计算

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 数据库设计 |
| **背景** | PRD 初始模型暗示 streak 可能是 Habit 表的字段 |
| **方案** | Streak 不存储在数据库中，每次需要时从 CheckIn 记录实时计算 |
| **备选方案** | 在 Habit 表增加 `currentStreak` 和 `longestStreak` 字段 |
| **决策理由** | ① 补卡会回溯性地改变 streak，如果持久化需要回溯更新，逻辑复杂易出 bug ② 单用户 + ≤5 习惯，CheckIn 数据量极小，查询成本可忽略 ③ 计算逻辑集中在 Service 层，便于测试和维护 |
| **影响** | API 响应中的 streak 值由 Service 层计算后附加，不来自 DB 直接查询 |

---

## DD-004: 新增 `StreakBreakEvent` 表

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 数据库设计 |
| **背景** | PRD 要求"同一次 streak 断裂只展示一次安慰消息"，需要持久化记录展示状态 |
| **方案** | 新增 `StreakBreakEvent` 表，记录断裂日期和安慰消息是否已展示 |
| **备选方案** | ① 在 Habit 表加 `lastComfortDate` 字段 ② 用 localStorage 前端记录 |
| **决策理由** | ① Habit 字段方案无法处理多次断裂的历史 ② localStorage 方案不持久、换设备丢失。独立表语义清晰，且支持未来扩展（如断裂统计分析） |

---

## DD-005: `MilestoneEvent` 增加快照数据字段

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 数据库设计 |
| **背景** | 里程碑回顾卡片需展示"触发时刻"的统计数据（总天数、完成率、最长连续） |
| **方案** | 在 `MilestoneEvent` 中增加 `totalDays`、`completionRate`、`longestStreak` 快照字段 |
| **备选方案** | 回顾卡片展示时实时计算当前数据 |
| **决策理由** | 用户可能在 66 天里程碑触发后继续打卡到第 80 天才回看。实时计算会展示第 80 天的数据，与里程碑语境不符。快照保留了"那个时刻"的意义 |

---

## DD-006: Habit Cue 字段拆分为 `cueValue` + `stackedHabitId`

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 数据库设计 |
| **背景** | PRD 中 `cueValue` 同时承担"触发场景文本"和"关联习惯 ID"两种语义 |
| **方案** | 拆为两个字段：`cueValue`（始终存描述文案）+ `stackedHabitId`（stacking 模式下存引用 ID） |
| **备选方案** | 保持单一 `cueValue` 字段，根据 `cueType` 解释其含义 |
| **决策理由** | ① stacking 模式需要同时展示描述文案（UI 用）和维护习惯引用关系（数据完整性） ② 引用关系可以设外键约束，确保被叠加的习惯存在 ③ 如果被叠加的习惯被删除，可以通过外键关系优雅处理 |

---

## DD-007: 补卡配额全局共享，不按习惯独立计算

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 数据库设计 |
| **背景** | PRD 规定"每月 3 次补卡"，但未明确是按习惯还是全局 |
| **方案** | 全局共享每月 3 次补卡配额（所有习惯合计） |
| **备选方案** | 每个习惯独立拥有每月 3 次配额 |
| **决策理由** | ① 全局配额更珍贵，促使用户更审慎地使用补卡机会，符合"偶尔中断不致命"的科学理念 ② 实现更简单，直接 `count(CheckIn where isRetroactive=true)` 即可，无需额外的配额表 ③ 独立配额在 5 个习惯时等于每月 15 次补卡，过于宽松 |

---

## DD-008: 包管理器选择 pnpm

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 架构设计 |
| **背景** | Monorepo 需要 workspace 支持，管理 client/server/shared 三个包 |
| **方案** | 使用 pnpm 作为包管理器 |
| **决策理由** | workspace 原生支持好、磁盘效率高、lock 文件更可靠 |

---

## DD-009: 校验层使用 Zod，前后端共享 Schema

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 架构设计 |
| **背景** | 习惯名称 1-50 字符、描述 0-200 字符等校验规则需要前后端一致 |
| **方案** | 在 `packages/shared/src/schemas/` 中用 Zod 定义校验 schema，前端（React Hook Form + Zod resolver）和后端（API 中间件）共用 |
| **决策理由** | Zod 与 TypeScript 类型推导深度集成（`z.infer<typeof schema>` 自动生成类型），一份 schema 同时产出校验逻辑和类型定义，消除重复 |

---

## DD-010: 日期处理库选择 dayjs

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — 架构设计 |
| **背景** | Streak 计算、补卡日期判断等需要日期加减和比较操作 |
| **方案** | 使用 dayjs，作为 shared 依赖前后端共用 |
| **决策理由** | 轻量（2KB gzip），API 与 moment.js 兼容，满足项目需求且不增加包体积 |

---

## DD-011: 首屏聚合接口 `GET /api/today`

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 0 — API 设计 |
| **背景** | 前端首屏需要：习惯列表（含打卡状态、streak）、今日进度、补卡配额、待展示的断裂安慰和里程碑回顾，共涉及多种数据 |
| **方案** | 提供 `GET /api/today` 聚合接口，一次请求返回首屏所有数据 |
| **备选方案** | 前端分别调用 `GET /api/habits` + `GET /api/check-ins/retroactive-quota` + 各状态查询（更 RESTful，但需 3-4 个请求） |
| **决策理由** | ① 首屏加载是最高频场景，1 个请求 vs 3-4 个请求对体验影响明显 ② 各数据间存在计算依赖（如 streak 影响补卡提示），服务端一次计算效率更高 ③ 独立的 RESTful 端点仍然保留，聚合接口是额外提供的便利层，不破坏 REST 语义 |

---

## DD-012: UI 组件方案 — shadcn/ui + 温暖调色

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 2 — 前端开发准备 |
| **背景** | 需要确定 UI 视觉风格和组件方案，在开发效率、产品调性（温暖+科学）、Tailwind 兼容性之间取得平衡 |
| **方案** | 采用 shadcn/ui（基于 Radix + Tailwind）作为组件基础，自定义温暖色调主题 |
| **备选方案** | ① Material Design 3（MD3 规范成熟，但纯 Tailwind 实现 ripple/elevation 工作量大，视觉偏工具感） ② 纯 Tailwind 自定义（最灵活但无组件基础，开发效率低） ③ DaisyUI（轻量但定制深度和社区活跃度不足） |
| **决策理由** | ① shadcn/ui 组件代码直接复制到项目中，完全可控、可定制，不是黑盒依赖 ② 内置 Radix 提供无障碍支持和交互逻辑（Dialog、Toast 等）③ 通过自定义 CSS Variables 实现温暖色调（Emerald 主色 + Stone 暖灰中性色 + 12px 大圆角），兼顾产品调性 ④ 2024-2026 最主流的 React + Tailwind 方案，社区资源丰富，适合 Bootcamp 展示 |
| **主题配置** | Primary: Emerald (#10B981)、Radius: 12px、Neutrals: Warm stone-tinted、语义色: success/warning/comfort/celebration |
| **相关文件** | `packages/client/src/index.css`（主题变量）、`packages/client/components.json`（shadcn 配置） |

---

## DD-013: 不引入 Claude Agent SDK，AI 功能用 Anthropic SDK 直接调用

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-10 |
| **阶段** | Phase 2 — 技术选型 |
| **背景** | 评估是否需要 Claude Agent SDK 来支持 Phase 2 功能开发中可能的 AI 集成 |
| **方案** | 不引入 Agent SDK；如需 AI 功能（如生成安慰文案、里程碑庆祝语），直接使用 `@anthropic-ai/sdk` 做单次 API 调用 |
| **备选方案** | 引入 Claude Agent SDK，构建具备工具调用和多步推理能力的 Agent |
| **决策理由** | ① 项目核心功能（CRUD、check-in、streak、milestone）均为确定性逻辑，不需要 Agent 的自主推理能力 ② Agent SDK 引入 agent loop、工具注册、token 管理等额外复杂度，对 Bootcamp demo 而言成本过高 ③ 如需 AI 元素，单次 API 调用（生成文案等）即可满足，几行代码即可集成 ④ 保持架构简洁，避免过度工程化 |

---

<!-- 新决策请追加在此处，保持编号递增 -->
