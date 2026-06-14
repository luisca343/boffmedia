---
description: Show SDD dashboard — specs, tasks, recent runs
agent: build
---

Show the current janus SDD status for this project.

1. Call `spec_list` to get all specs with their status and task progress.
2. Call `runs_history` to get recent runs (last 10).
3. Summarize:
   - Active specs (in-progress, approved)
   - Task completion percentages per spec
   - Recent run outcomes (passed/failed/blocked)
   - Any specs that need attention (blocked tasks, failed runs)

Present this as a clear dashboard the user can quickly scan.
