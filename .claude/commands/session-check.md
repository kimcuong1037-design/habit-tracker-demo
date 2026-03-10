---
description: "Check if current session should wrap up and prompt end-session"
---

Check the current session state:

1. Read the progress log at `/Users/rogerfang/.claude/projects/-Users-rogerfang-habit-tracker-habit-tracker-demo/memory/progress-log.md`
2. Review what work has been done in this conversation so far
3. Provide a brief status summary (in Chinese):
   - 已完成的工作
   - 进行中的工作
   - 建议是否该收尾

If there has been meaningful work done, ask the user:
> "已经工作了一段时间了，是否要运行 `/end-session` 保存进度？"

If no significant work was done, simply note that and suggest continuing.
