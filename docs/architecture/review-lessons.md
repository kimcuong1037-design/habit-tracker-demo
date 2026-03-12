# Review Lessons — 实践经验积累

> 日常 review 中发现的问题和优化，按类别记录。每条格式：编号 + 问题 → 结论。

---

## UI / 视觉

- **UI-001**: 图标统一用 Lucide React，不用 emoji — 保持与 shadcn/ui 线条风格一致
- **UI-002**: 底部导航等全局 UI 使用 `backdrop-blur-sm` + 半透明背景，营造层次感

## 流程 / 管理

- **PM-001**: 选做功能遗漏 — 月视图在需求文档（bootcamp-assignment.md §4）、PRD（§5.3）、User Stories（Epic 13）和 API 设计中均有规划，但 PROJECT-PLAN.md Phase 3 的 checklist 中未列出，导致开发阶段被跳过，交付时才发现缺失。
  - **根因**：PROJECT-PLAN 作为唯一执行清单，与设计文档之间缺少交叉校验。选做功能在设计阶段完成了详细规划，但未同步到开发计划的 checklist 中。
  - **教训**：Phase 开始前，必须将设计文档中所有已规划的功能（包括选做）逐项映射到 PROJECT-PLAN 的 checklist。如果某个功能决定不做，应在 PROJECT-PLAN 中显式标注"不做"及原因，而非直接省略。

## 代码 / 模式

（待积累）

## API / 数据

（待积累）

## 工具链 / 配置

（待积累）
