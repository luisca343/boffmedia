# Boff Agent Workflow — Canonical Rules

This repo ships a custom MCP server (`boff-agent`) that owns the full task lifecycle:
context resolution, guardrails, verification, BookStack docs, GitLab, metrics, ADRs.

**Every AI agent working in this repo (Claude Code, GitHub Copilot, OpenCode, any other)
MUST use this workflow for ALL code-modifying tasks.** It is not optional, not a fallback,
and not "for big tasks only." Tool descriptions ("CALL THIS FIRST") are non-negotiable.

If the `boff-agent` MCP tools are not available in your runtime, STOP and tell the user
before doing anything else. Do not silently fall back to ad-hoc editing.

---

## Step 0 — Decide: `plan_goal` or `begin_task`?

### Use `plan_goal` when the request meets ANY of these:
- Spans 2 or more NestJS modules (e.g. `api/boffmedia/x` + `api/boffmedia/y`)
- Spans 2 or more apps together (api + web, or api + discord)
- Likely changes more than ~10 files
- Combines new schema + service + controller + UI in a single ask
- Touches both design systems (Boffmedia primitives + SmartRotom UI)
- Adds a new feature end-to-end (DB → API → DTO → page → component)
- User uses words like: "feature", "build", "implement X end-to-end", "migrate",
  "refactor across", "rebuild", "redesign", "audit", "rewrite", "overhaul", "epic"

`plan_goal` creates a BookStack chapter and instructs you to write each subtask as a
`status:draft` page. **Do NOT execute the tasks yourself.** Stop after drafting and present
the chapter URL + task list to the user. The user reviews and approves each task by
flipping `status:draft` → `status:pending` in BookStack. Only `status:pending` pages
can be picked up by `begin_task`.

### Use `begin_task` directly when:
- Single concern, single module, single layer
- Estimated < 10 files changed
- Already-approved task from a plan (pass the BookStack page ID as `bookstackTaskPageId`)

Set `taskType` correctly:
- `feature` — adding new behavior
- `bugfix` — fixing an existing behavior
- `refactor` — restructuring without behavior change
- `ui-ux` — visual / interaction work on `apps/web/src` (triggers Playwright step 4b)

---

## Mandatory workflow for code-modifying tasks

1. Call `plan_goal` OR `begin_task` **BEFORE** touching any file with Edit/Write.
2. Follow the workflow returned by the tool in order. Do not skip steps.
   - `check_guardrails` before writes
   - `reset_environment` + `seed_database` before verification
   - `run_verification` before commit
   - `run_playwright` if ui-ux or .tsx/.jsx changes
   - `detect_structural_changes` → `write_adr` if structural
   - `sync_conventions`, `sync_openapi_docs` as applicable
   - `check_performance_regression`
   - `git_operation` for branch/commit/push (NEVER `create_gitlab_mr` automatically)
3. Close with `save_run` (status: passed or failed). Never abandon a runId mid-flight.
   If you cannot finish, call `save_run(status: "failed", failureSummary: "...")`.

---

## Carve-outs — workflow NOT required

The agent is for **code-modifying** tasks. You may skip the workflow for:

- Pure read-only questions: "explain X", "where is Y", "what does Z do".
- Trivial single-line / single-file fixes: a typo in a comment, renaming one local
  identifier, fixing a single import path. Anything that fits a one-shot `Edit` call
  and obviously needs no verification or documentation.
- Conversational replies, clarifying questions, planning discussions BEFORE the user
  has approved an approach.
- Edits inside `packages/agent/**` itself — using the agent to modify the agent risks
  recursion. Flag this to the user and proceed manually with `pnpm type-check` as
  the verification gate.
- Configuration / instruction files (`.mcp.json`, `*.md`, `CLAUDE.md`, `AGENTS.md`,
  `.github/copilot-instructions.md`, `opencode.json`) — these don't need the
  test/playwright/git lifecycle.

When in doubt, default to **using the workflow**. The cost of an extra `begin_task`
call is small; the cost of skipping context, guardrails, verification, and
documentation is high.

---

## Wrong patterns — do NOT do these

- ❌ Start editing files, then call `begin_task` retroactively to "log it."
- ❌ Use `begin_task` for a multi-module feature instead of `plan_goal`.
- ❌ Use `plan_goal` for a single trivial fix.
- ❌ Skip `save_run` because verification passed manually.
- ❌ Call `create_gitlab_mr` without explicit user request — MR creation is always
  user-initiated, never automatic.
- ❌ Skip `check_guardrails` because "the path looks safe."
- ❌ Run `pnpm lint`, `pnpm type-check`, or any other verification command outside of `run_verification`. The agent tracks run IDs, step ordering, and metrics — bypassing it breaks the chain and invalidates the run. This rule is absolute for all code-modifying tasks, no carve-out.
- ❌ Decide a task is "too small for the agent" when it modifies 2+ files in 2+
  modules — that's the exact case `plan_goal` exists for.

---

## When the MCP server is unavailable

If `boff-agent` tools are not registered in the current session:

1. Tell the user explicitly: "The boff-agent MCP server is not available in this
   session. The full workflow (context, guardrails, verification, BookStack sync)
   cannot run."
2. Ask whether to proceed manually or fix the MCP setup first. The MCP server is
   defined in:
   - `.mcp.json` (Claude Code)
   - `.vscode/mcp.json` (VS Code + Copilot)
   - `opencode.json` (OpenCode)
3. If proceeding manually, at minimum run `pnpm type-check` before declaring done.
   **Exception**: this is the ONLY scenario where running a verification command
   directly is permitted — and only because the agent is unavailable. Once the
   agent comes back, the run must be logged retroactively via `save_run`.

---

## Memory Management (WSL)

This repo includes memory-safe scripts to prevent WSL OOM crashes:

| Command | Behavior | Use when |
|---------|----------|----------|
| `pnpm lint` | Sequential, 2GB per package | Default for agents |
| `pnpm type-check` | Sequential, 2GB per package | Default for agents |
| `pnpm memory-check` | Check available memory | Before heavy operations |
| `pnpm lint:parallel` | Concurrent, original behavior | Only with >16GB RAM |
| `pnpm type-check:parallel` | Concurrent, original behavior | Only with >16GB RAM |

**Agents MUST use `pnpm lint` and `pnpm type-check` (sequential versions) to prevent
WSL crashes.** Only use parallel versions if the user explicitly has >16GB RAM.
