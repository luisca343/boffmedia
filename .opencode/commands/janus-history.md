---
description: Show recent SDD run history
agent: build
---

Show recent janus run history.

Call `runs_history` to get past runs. If the user specified filters in "$ARGUMENTS", use them (e.g., a spec ID or status).

Present:
- Run ID, spec/task, status, timestamps
- Failure summaries for failed runs
- Verification results per run
- Patterns (e.g., recurring failures in the same task)
