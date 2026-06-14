---
description: Run the full SDD workflow for a task
agent: build
---

You are executing a Janus SDD workflow. The user wants to:
$ARGUMENTS

Follow these steps IN ORDER:

## Step 1 — Determine spec type

Analyze the request. If it spans 2+ modules, changes >10 files, or adds a feature end-to-end (DB → API → UI), it is a FULL spec. Otherwise it is a QUICK spec.

## Step 2 — Create spec

Call `workflow_begin` with:
- title: a concise description of the task
- type: "quick" or "feature" (or "bugfix", "refactor", "ui-ux" as appropriate)
- description: extended context from the user's request

## Step 3a — Quick spec (auto-approved)

If the spec was auto-approved:
1. `workflow_begin` already started T001. Read the returned workflow, constitution, and guidelines.
2. Implement the task. Call `guard_check` BEFORE any file writes.
3. Call `verify_run` when implementation is complete.
4. If verification passes, call `task_complete` with status="passed".
5. If verification fails, fix the issues and re-verify. If blocked, call `task_complete` with status="failed" and a summary.
6. Call `git_operation` to branch, commit, and push.

## Step 3b — Full spec (requires approval)

If the spec is in draft status:
1. Present the spec to the user clearly.
2. STOP and tell the user to approve it:
   ```
   janus spec approve <spec-id>
   ```
3. After approval, call `plan_write` to create the implementation plan.
4. Call `tasks_write` to create the task checklist.
5. For each task in order:
   - Call `task_start` to begin (returns workflow + context)
   - Call `guard_check` before file writes
   - Implement the task
   - Call `verify_run`
   - Call `task_complete` with the appropriate status
6. Call `git_operation` to branch, commit, and push.

## Rules

- NEVER create MRs/PRs without explicit user request.
- NEVER skip `guard_check` before file writes.
- NEVER run verification commands directly — always use `verify_run`.
- If a task is blocked, complete it with status="blocked" and continue.
