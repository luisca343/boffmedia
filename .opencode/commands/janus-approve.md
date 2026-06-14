---
description: Approve a spec by ID
agent: build
---

Approve the janus spec with ID "$ARGUMENTS".

Run: `janus spec approve $ARGUMENTS`

Report the result. If the spec has open questions, warn the user but do not block approval.

After approval, suggest next steps: `plan_write` then `tasks_write` then `task_start`.
