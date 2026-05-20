# Harness Agent — Workflow Audit Fixes & Planning Mode

> **Scope**: all fixes to the current `router.ts` workflow + the new `plan_goal` tool for task decomposition and planning.  
> **Prerequisite**: `harness-agent-implementation-plan.md` (v1) fully implemented.  
> **Agent usage**: every section is a self-contained checklist. Status: ` ` not started · `x` complete · `~` in progress · `!` blocked.  
> **Last updated**: 2026-05-19

---

## Table of Contents

### Part 1 — Workflow audit fixes
1. [Fix: Health check + metrics baseline in `begin_task`](#1-fix-health-check--metrics-baseline-in-begin_task)
2. [Fix: Rollback instruction on failure](#2-fix-rollback-instruction-on-failure)
3. [Fix: Environment setup before verification](#3-fix-environment-setup-before-verification)
4. [Fix: `runId` slug generation](#4-fix-runid-slug-generation)
5. [Fix: History format — remove raw JSON dump](#5-fix-history-format--remove-raw-json-dump)
6. [Fix: Playwright condition made explicit](#6-fix-playwright-condition-made-explicit)
7. [Fix: `check_guardrails` wording — re-check on new files](#7-fix-check_guardrails-wording--re-check-on-new-files)
8. [Fix: `sync_openapi_docs` — remove `bookId` from caller](#8-fix-sync_openapi_docs--remove-bookid-from-caller)
9. [Fix: `sync_conventions` — handle SmartRotom](#9-fix-sync_conventions--handle-smartrotom)
10. [Fix: Add `check_performance_regression` to workflow](#10-fix-add-check_performance_regression-to-workflow)
11. [Fix: Harden `create_gitlab_mr` prohibition](#11-fix-harden-create_gitlab_mr-prohibition)
12. [Fix: BookStack structure tools — mark as setup-only](#12-fix-bookstack-structure-tools--mark-as-setup-only)
13. [Fix: `write_adr` — include branch link](#13-fix-write_adr--include-branch-link)
14. [Fix: Non-fatal sync failures](#14-fix-non-fatal-sync-failures)
15. [Fix: Git error handling in workflow](#15-fix-git-error-handling-in-workflow)
16. [Fix: Context staleness warning](#16-fix-context-staleness-warning)
17. [Fix: ADR trigger examples](#17-fix-adr-trigger-examples)
18. [Updated workflow template](#18-updated-workflow-template)

### Part 2 — Planning mode
19. [Planning architecture](#19-planning-architecture)
20. [Task lifecycle](#20-task-lifecycle)
21. [The `plan_goal` tool](#21-the-plan_goal-tool)
22. [Task page template](#22-task-page-template)
23. [Dependency tracking](#23-dependency-tracking)
24. [Updated `begin_task` — dependency awareness](#24-updated-begin_task--dependency-awareness)
25. [Updated `list_bookstack_tasks` — ordering and dependencies](#25-updated-list_bookstack_tasks--ordering-and-dependencies)

### Part 3 — Implementation
26. [Implementation checklist](#26-implementation-checklist)

---

# Part 1 — Workflow audit fixes

---

## 1. Fix: Health check + metrics baseline in `begin_task`

> **Problem**: `checkSystemHealth` and `captureMetricsBaseline` are registered tools but never called by the workflow. The agent skips them because they're not in the numbered steps.  
> **Impact**: the agent works on top of a potentially broken system and has no baseline for regression detection.

### Changes to `router.ts` — `begin_task` handler

- [ ] Add `checkSystemHealth` and `captureMetricsBaseline` to the parallel calls in `begin_task`:

```typescript
const [context, history, health, _baseline] = await Promise.all([
  resolveContext({ taskDescription, maxFiles: 20 }),
  getRunHistory({ limit: 5, similarTo: title, status: 'all' }),
  checkSystemHealth().catch(() => ({ safe: true, warnings: [], metrics: {} })),
  captureMetricsBaseline({ runId }).catch(() => null)
])
```

- [ ] Surface health warnings in the workflow output if `health.safe === false`:

```typescript
const healthSection = !health.safe
  ? `\n## ⚠ System health warning\nThe following issues were detected before starting:\n${health.warnings.map(w => `- ${w}`).join('\n')}\n\nConsider investigating before proceeding. Ask the user if you should continue.\n`
  : ''
```

- [ ] Insert `${healthSection}` into the workflow template after the header
- [ ] Remove `capture_metrics_baseline` from the workflow steps — it now runs automatically inside `begin_task`

### Verification

- [ ] `begin_task` returns health warnings when system is unhealthy
- [ ] `begin_task` returns no health section when system is healthy
- [ ] `metrics_snapshots` table has a `phase=before` row after `begin_task` completes

---

## 2. Fix: Rollback instruction on failure

> **Problem**: if `run_verification` fails and the agent can't fix the code, there's no instruction to clean the working tree. The agent leaves modified files on disk and calls `save_run(failed)` — next task starts dirty.

### Changes to workflow template

- [ ] Add failure branch after step 4a. Insert this block:

```
### If verification fails and you cannot fix the code:
  - Call git_operation (action: "reset") to restore the working tree to a clean state
  - Call save_run (runId: "${runId}", status: "failed", failureSummary: "<describe what failed and why>")
  - If a bookstackTaskPageId was provided, the task status resets to pending automatically
  - Stop. Do not proceed to steps 5 or 6.
  - Consider calling create_gitlab_issue to document the failure for future review.
```

### Verification

- [ ] When the agent gives up after failed verification, working tree is clean (`git status` shows no changes)
- [ ] `save_run` is called with `status: failed` and a meaningful `failureSummary`
- [ ] BookStack task page reverts to `status:pending` if it was an agent:task

---

## 3. Fix: Environment setup before verification

> **Problem**: `run_verification` assumes the Docker agent environment is running. If it's stale or down, tests fail for infrastructure reasons — the agent wastes retries fixing code that isn't broken.

### Changes to workflow template

- [ ] Add step 3b between code changes and verification:

```
3b. Call reset_environment (action: "up") and seed_database (fixture: "default")
    to guarantee a clean, known-state test environment before verification.
```

### Alternative — build into `run_verification` itself

If you prefer the environment setup to be invisible rather than an explicit step:

- [ ] Inside `runVerification()` in `src/tools/verification.ts`, call `manageEnvironment({ action: 'up' })` and `seedDatabase({ fixture: 'default' })` as the first step before running lint/tests
- [ ] This guarantees environment readiness regardless of whether the workflow text is followed

### Decision

```
[ ] Option A — explicit workflow step (agent calls reset_environment)
[ ] Option B — built into run_verification (invisible, guaranteed)
```

Mark one before implementing.

### Verification

- [ ] Stop the Docker agent environment manually → call `run_verification` → confirm it starts the environment and tests pass
- [ ] Run `run_verification` twice in a row — confirm idempotent (second run doesn't fail)

---

## 4. Fix: `runId` slug generation

> **Problem**: if `title` is empty or all special characters, `runId` gets a leading hyphen or is just a timestamp. Ugly in file paths and branch names.

### Change in `begin_task` handler

- [ ] Replace current `runId` generation:

```typescript
// Before
const runId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now()}`

// After
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40) || 'task'
const runId = `${slug}-${Date.now()}`
```

### Verification

- [ ] `begin_task` with title `"!!!@@@"` → `runId` starts with `task-`, not `---`
- [ ] `begin_task` with title `""` → `runId` starts with `task-`
- [ ] `begin_task` with title `"add products endpoint"` → `runId` is `add-products-endpoint-1716...`

---

## 5. Fix: History format — remove raw JSON dump

> **Problem**: `JSON.stringify(history, null, 2)` dumps 2,000–4,000 tokens of raw JSON with internal IDs, timestamps, and nested objects. The useful signal is 10% of that.

### Change in `begin_task` handler

- [ ] Replace the history section builder:

```typescript
// Before
const historyBlock = history.length > 0
  ? JSON.stringify(history, null, 2)
  : 'No prior runs found.'

// After
const historyBlock = history.length > 0
  ? history.map(r => {
      const icon = r.status === 'passed' ? '✔' : '✖'
      const attempt = r.attemptCount ? ` (attempt ${r.attemptCount})` : ''
      const note = r.failureSummary ? `\n    Note: ${r.failureSummary}` : ''
      const branch = r.branch ? ` → branch: ${r.branch}` : ''
      return `- "${r.title}" → ${icon} ${r.status}${attempt}${branch}${note}`
    }).join('\n')
  : 'No prior runs found.'
```

### Verification

- [ ] `begin_task` with 5 prior runs produces ~200 tokens of history, not ~3,000
- [ ] Each history entry shows: title, status, attempt count, branch, and failure note
- [ ] Performance notes are still rendered separately via `performanceSection` (unchanged)

---

## 6. Fix: Playwright condition made explicit

> **Problem**: for non-`ui-ux` tasks the agent is told "skip unless you made UI changes" — with no criteria for what counts as a UI change.

### Change in `begin_task` handler

- [ ] Replace the `playwrightStep` builder:

```typescript
// Before
const playwrightStep = taskType === 'ui-ux'
  ? `4b. Call run_playwright (runId: "${runId}") — trace + screenshots. Present reviewInstructions to the user before proceeding to step 5.`
  : `4b. Skip run_playwright unless you made UI changes.`

// After
const playwrightStep = taskType === 'ui-ux'
  ? `4b. Call run_playwright (runId: "${runId}") — REQUIRED for ui-ux tasks.
     Capture trace and screenshots. Present reviewInstructions to the user before proceeding.`
  : `4b. Call run_playwright (runId: "${runId}") if you created or modified any file in apps/web/
     (pages, components, layouts, styles). Skip ONLY if all changes are confined to apps/api/
     with zero frontend surface.`
```

### Verification

- [ ] Agent running a `feature` task that creates a NextJS page → calls `run_playwright`
- [ ] Agent running a `refactor` task that only touches NestJS services → skips `run_playwright`
- [ ] Agent running a `ui-ux` task → always calls `run_playwright`

---

## 7. Fix: `check_guardrails` wording — re-check on new files

> **Problem**: called once at step 2 with "every file path you intend to write". Mid-implementation discoveries (new DTOs, entities, migrations) bypass the guardrail.

### Changes

- [ ] Update `check_guardrails` tool description in `router.ts`:

```typescript
'Check whether file paths violate protected path rules from .agent-ignore. '
+ 'Call this BEFORE writing any files. If you discover additional files are needed '
+ 'during implementation, call check_guardrails again before writing them. '
+ 'If any violations are returned, do not write those files and inform the user.'
```

- [ ] Update workflow step 2:

```
2. Call check_guardrails with every file path you intend to write or modify.
   Stop if violations are returned.
   ⚠ If you discover additional files are needed during step 3, call check_guardrails
   again before writing them.
```

### Verification

- [ ] Agent discovers a new file mid-implementation → calls `check_guardrails` before writing it
- [ ] File in `.agent-ignore` discovered mid-task → agent refuses to write it and informs user

---

## 8. Fix: `sync_openapi_docs` — remove `bookId` from caller

> **Problem**: `bookId` is a static config value that never changes per run. Making the agent pass it means every caller needs internal config knowledge.

### Changes to `router.ts`

- [ ] Import `API_REFERENCE_BOOK_IDS` from `agent.config.js`:

```typescript
import { API_REFERENCE_BOOK_IDS } from '../agent.config.js'
```

- [ ] Remove `bookId` from the tool schema and read from config:

```typescript
server.tool(
  'sync_openapi_docs',
  '...',
  {
    runId: z.string().describe('Run ID from begin_task'),
    affectedModules: z.array(z.string()).describe('NestJS module names changed in this run'),
    project: z.enum(['boffmedia', 'smartrotom'])
    // bookId removed
  },
  async ({ runId, affectedModules, project }) => {
    const bookId = API_REFERENCE_BOOK_IDS[project]
    if (!bookId) {
      return { content: [{ type: 'text', text: JSON.stringify({
        ok: false, reason: `No API reference book configured for ${project}`
      }) }] }
    }
    const result = await syncOpenApiDocs({ runId, affectedModules, bookId, project })
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)
```

- [ ] Add `API_REFERENCE_BOOK_IDS` to `agent.config.ts`:

```typescript
export const API_REFERENCE_BOOK_IDS: Record<string, number> = {
  boffmedia: <book_id_here>,
  smartrotom: <book_id_here>,
}
```

### Verification

- [ ] Agent calls `sync_openapi_docs` without passing `bookId` — works correctly
- [ ] Calling with an unconfigured project returns a clear error message

---

## 9. Fix: `sync_conventions` — handle SmartRotom

> **Problem**: `sync_conventions` silently returns `ok: false` for SmartRotom. It's one monorepo with one `CONVENTIONS.md` — both projects should share the same conventions page or each have their own.

### Decision

Since Boffmedia and SmartRotom share the same codebase and the same `CONVENTIONS.md`, they share the same conventions page. SmartRotom doesn't need a separate one.

### Change in `router.ts`

- [ ] Replace the SmartRotom fallback with shared conventions logic:

```typescript
server.tool(
  'sync_conventions',
  '...',
  {
    project: z.enum(['boffmedia', 'smartrotom']).describe('Project to sync conventions for')
  },
  async ({ project }) => {
    // Both projects share the same CONVENTIONS.md — use boffmedia conventions page
    // or a dedicated shared page
    const pageId = CONVENTIONS_PAGE_IDS[project] ?? CONVENTIONS_PAGE_IDS.shared
    if (!pageId) {
      return { content: [{ type: 'text', text: JSON.stringify({
        ok: false,
        reason: `No conventions page configured. Add to CONVENTIONS_PAGE_IDS in agent.config.ts`
      }) }] }
    }
    const bookId = TECHNICAL_BOOK_IDS[project] ?? TECHNICAL_BOOK_IDS.shared
    await syncConventions({ bookId, pageId, project })
    return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] }
  }
)
```

- [ ] Add `shared` key to `CONVENTIONS_PAGE_IDS` and `TECHNICAL_BOOK_IDS` in `agent.config.ts`:

```typescript
export const CONVENTIONS_PAGE_IDS: Record<string, number> = {
  boffmedia: <page_id>,
  shared: <page_id>,  // fallback — same page since it's one monorepo
}
```

### Verification

- [ ] `sync_conventions` with `project: 'smartrotom'` succeeds (uses shared page)
- [ ] `sync_conventions` with `project: 'boffmedia'` succeeds
- [ ] Both write to the same BookStack conventions page

---

## 10. Fix: Add `check_performance_regression` to workflow

> **Problem**: `capture_metrics_baseline` runs (after fix #1) but `check_performance_regression` is never called in the workflow. The post-run check is silently skipped.

### Change to workflow template

- [ ] Add step 4e after OpenAPI sync:

```
4e. Call check_performance_regression (runId: "${runId}").
    If hasRegression=true, present the regressions to the user and ask whether to proceed.
    Performance regressions do NOT automatically block the commit — the user decides.
```

### Verification

- [ ] After a successful `run_verification`, agent calls `check_performance_regression`
- [ ] Regression data is surfaced to user before commit gate
- [ ] No regression → workflow continues silently

---

## 11. Fix: Harden `create_gitlab_mr` prohibition

> **Problem**: the workflow says "Do NOT call" but the language is easy for an LLM to override if it reasons that "the task is done so a MR is helpful."

### Change to workflow template

- [ ] Replace the current line with a stronger prohibition and explanation:

```
⚠ NEVER call create_gitlab_mr during this workflow.
MR creation is the user's explicit decision after reviewing the pushed branch.
Calling it automatically bypasses the visual review and commit approval step.
If the user wants an MR, they will ask you separately after reviewing the branch.
```

### Verification

- [ ] Agent completes full workflow → does not call `create_gitlab_mr`
- [ ] Agent is explicitly asked "create a MR" → correctly calls `create_gitlab_mr`

---

## 12. Fix: BookStack structure tools — mark as setup-only

> **Problem**: `create_bookstack_shelf`, `create_bookstack_book`, `add_books_to_shelf`, and `create_bookstack_chapter` are registered as regular tools. An LLM could call them mid-task.

### Changes to `router.ts`

- [ ] Prefix each tool description with setup-only notice:

```typescript
server.tool(
  'create_bookstack_shelf',
  'SETUP TOOL — call only when explicitly asked to create BookStack structure. '
  + 'Not part of the standard task workflow. Creates a new BookStack shelf.',
  ...
)

server.tool(
  'create_bookstack_book',
  'SETUP TOOL — call only when explicitly asked to create BookStack structure. '
  + 'Not part of the standard task workflow. Creates a new BookStack book.',
  ...
)

server.tool(
  'add_books_to_shelf',
  'SETUP TOOL — call only when explicitly asked to organise BookStack structure. '
  + 'Not part of the standard task workflow. Assigns books to a shelf.',
  ...
)

server.tool(
  'create_bookstack_chapter',
  'SETUP TOOL — call only when explicitly asked to create BookStack structure. '
  + 'Not part of the standard task workflow. Creates a chapter inside a book.',
  ...
)
```

### Verification

- [ ] Agent following the standard workflow never calls these tools
- [ ] Agent explicitly asked "create a new shelf for X" → calls `create_bookstack_shelf` correctly

---

## 13. Fix: `write_adr` — include branch link

> **Problem**: the ADR written to BookStack has no link back to the branch or commit that motivated it. Six months later you can't trace from the ADR to the code.

### Change to `write_adr` tool handler

- [ ] Get the current branch name and include it in the ADR body:

```typescript
async ({ title, context, decision, consequences, project, runId }) => {
  // Get current branch for traceability
  const branchResult = await gitOperation({ action: 'current_branch' })
  const branch = branchResult.success ? branchResult.output : 'unknown'

  const result = await writeAdr({
    bookId: TECHNICAL_BOOK_IDS[project],
    chapterId: ADR_CHAPTER_IDS[project],
    title,
    context,
    decision,
    consequences,
    project,
    runId,
    branch  // new field — rendered in the ADR footer
  })
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
}
```

- [ ] Update `writeAdr` in `src/tools/bookstack.ts` to append a footer:

```markdown
---
*Recorded by harness agent · Run ID: `${runId}` · Branch: `${branch}`*
```

### Verification

- [ ] ADR page in BookStack includes the branch name and run ID in the footer
- [ ] Branch name is correct (matches the branch created in step 5)

---

## 14. Fix: Non-fatal sync failures

> **Problem**: if BookStack is unreachable during `sync_conventions` or `sync_openapi_docs`, the run may abort entirely. These are documentation operations — they should not block a successful code change.

### Change to workflow template

- [ ] Add after step 4c and 4d:

```
Steps 4c and 4d (BookStack sync) are non-fatal. If BookStack is unreachable,
log the failure and continue to step 5. Do not abort a successful run because
of a documentation sync failure. Inform the user that BookStack sync was skipped.
```

### Change to `begin_task` handler

- [ ] Mark steps 4c and 4d as non-fatal in the workflow text itself so the instruction is always visible

### Verification

- [ ] Stop BookStack container → complete a run → confirm run succeeds, agent reports BookStack sync was skipped
- [ ] BookStack running → confirm sync works normally

---

## 15. Fix: Git error handling in workflow

> **Problem**: no guidance for retry scenarios (branch already exists) or partial push failures (GitLab succeeds, GitHub mirror fails).

### Change to workflow template

- [ ] Add to step 5:

```
5. Git operations:
   a. Call git_operation (action: "branch", branchName: "<derived from task title>")
      If the branch already exists (retry scenario), use the existing branch —
      call git_operation (action: "current_branch") to confirm.
   b. Call git_operation (action: "commit", commitMessage: "feat: <task title> [agent]")
   c. Call git_operation (action: "push_mirrors", branchName: "<branch name>")
      GitHub mirror push failures are non-fatal — log and continue.
      GitLab primary push failures ARE fatal — abort and call save_run with status: "failed".
```

### Verification

- [ ] Agent retries after failure → uses existing branch, doesn't crash on "branch already exists"
- [ ] GitHub mirror down → run completes with a warning
- [ ] GitLab push fails → run aborts with `save_run(failed)`

---

## 16. Fix: Context staleness warning

> **Problem**: codebase context is resolved at task start and never refreshed. For long tasks the agent doesn't know a module it just created is now available.

### Change to workflow template

- [ ] Add a note in the codebase context section:

```
## Codebase context
⚠ This context was resolved at task start. If you create new modules, entities,
or pages during this task, they won't appear in the lists above. Apply your own
judgment based on files you have written. Call resolve_context mid-task if you
need a refreshed view.
```

### Verification

- [ ] Agent creates a new NestJS module → references it by name even though it wasn't in the original `moduleList`

---

## 17. Fix: ADR trigger examples

> **Problem**: `detect_structural_changes` returns `adrRecommended` but the workflow gives no examples of what always qualifies as structural.

### Change to workflow template

- [ ] Add after step 4c instruction:

```
4c. Call detect_structural_changes. If adrRecommended=true, call write_adr.
    Always call sync_conventions after.

    Structural changes that ALWAYS warrant an ADR, even if the tool misses them:
    - New NestJS module
    - New DrizzleORM table or schema change
    - New external service dependency
    - Change to the authentication flow
    - Change to a shared type in packages/shared
    - New cron job or background process
```

### Verification

- [ ] Agent adds a new DrizzleORM table → calls `write_adr` even if `detect_structural_changes` returns `adrRecommended: false`

---

## 18. Updated workflow template

> **This is the corrected, complete workflow template** incorporating all fixes from sections 1–17. Replace the existing template in `begin_task`.

```typescript
const workflow = `
# Boff Agent — Task Started

runId: ${runId}
title: ${title}
taskType: ${taskType}
${healthSection}
## Workflow (follow in order)

1. ✅ begin_task — done. Health checked. Metrics baseline captured.

2. Call check_guardrails with every file path you intend to write or modify.
   Stop if violations are returned.
   ⚠ If you discover additional files are needed during step 3, call check_guardrails
   again before writing them.

3. Make your code changes using your own file editing tools.

3b. Call reset_environment (action: "up") and seed_database (fixture: "default")
    to guarantee a clean test environment.

4a. Call run_verification (runId: "${runId}") to run lint + tests.
    Fix failures before proceeding.

### If verification fails and you cannot fix the code:
    - Call git_operation (action: "reset") to restore the working tree
    - Call save_run (runId: "${runId}", status: "failed", failureSummary: "...")
    - Consider calling create_gitlab_issue to document the failure
    - Stop. Do not proceed to step 5.

${playwrightStep}

4c. Call detect_structural_changes. If adrRecommended=true, call write_adr.
    Always call sync_conventions after (non-fatal if BookStack is unreachable).
    Structural changes that ALWAYS warrant an ADR regardless of tool output:
    - New NestJS module, DrizzleORM table/schema change, external service dependency
    - Auth flow change, shared type change, new cron/background process

4d. If you created or modified any NestJS controller, DTO, or route decorator,
    call sync_openapi_docs (runId: "${runId}") with the affected module names.
    Non-fatal if BookStack is unreachable — log and continue.

4e. Call check_performance_regression (runId: "${runId}").
    If hasRegression=true, present regressions to the user and ask whether to proceed.
    Performance regressions do NOT automatically block — the user decides.

5. Git operations:
   a. Create branch: git_operation (action: "branch", branchName: "${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}")
      If branch already exists (retry scenario), use the existing branch.
   b. Commit: git_operation (action: "commit", commitMessage: "feat: ${title} [agent]")
   c. Push: git_operation (action: "push_mirrors", branchName: "<branch from 5a>")
      GitHub mirror failures are non-fatal — log and continue.
      GitLab primary failures ARE fatal — abort and save_run(failed).

6. Call save_run (runId: "${runId}", status: "passed"${bookstackTaskPageId ? `, bookstackTaskPageId: ${bookstackTaskPageId}` : ''})
   to close the task.

## Rules
- Do not skip steps. Do not call save_run before run_verification passes.
- Steps 4c, 4d (BookStack sync) are non-fatal. If BookStack is unreachable, continue.
- ⚠ NEVER call create_gitlab_mr during this workflow.
  MR creation is the user's explicit decision after reviewing the pushed branch.
  If the user asks for an MR, they will request it separately.

## Prior runs on similar tasks
${historyBlock}
${performanceSection}

## Codebase context
⚠ Context was resolved at task start. If you create new modules or entities
during this task, they won't appear below. Call resolve_context mid-task if needed.

Modules: ${context.moduleList.join(', ')}
Pages: ${context.pageList.join(', ')}
Conventions: loaded (${context.totalTokenEstimate} token estimate)
${context.conventions ? '\n' + context.conventions : ''}
${bookstackSection}
`.trim()
```

---

# Part 2 — Planning mode

---

## 19. Planning architecture

### The problem

Currently the agent handles one task at a time. For larger work — "add a full tournament system" or "add push notifications across all SmartRotom apps" — the user has to manually decompose the goal into individual task pages. This is tedious and error-prone.

### The solution

A new `plan_goal` tool, separate from `begin_task`, that:

1. Takes a high-level goal description
2. Creates a dated BookStack chapter to contain all plan tasks
3. Decomposes the goal into ordered, scoped task pages inside that chapter
4. Writes them as `status:draft` pages
5. Returns a summary for user review

The key principle: **`plan_goal` never executes anything.** It only creates the chapter and draft pages. Execution happens through the normal `begin_task` workflow, only on tasks the user has approved by changing `draft` → `pending`.

```
plan_goal                         begin_task
    │                                 │
    ▼                                 ▼
Chapter created               Execute each task
(date + goal title)           via normal workflow
    │
    ▼
Draft task pages ──(user approves)──►  status:pending
inside chapter                         ready to run
```

This keeps planning and execution cleanly separated. The agent cannot auto-execute drafted plans.

### BookStack structure — chapters vs loose pages

The Agent Tasks book uses a deliberate two-tier structure:

**Single tasks (no `plan_goal`)** — loose pages directly in the Agent Tasks book. No chapter, no container. A single task does not need grouping — adding one would create a container with one item, which is pure noise.

**Multi-task plans (via `plan_goal`)** — a chapter is created first, then all task pages live inside it. The chapter name is `YYYY-MM-DD — <goal title>` so plans are sorted chronologically and immediately identifiable by date.

```
📖 Agent Tasks (Boffmedia)
  📄 Fix bank balance display              ← single task — loose page, no chapter
  📄 Update Pokémon tracker UI             ← single task — loose page, no chapter
  📑 2026-05-19 — Add tournament system    ← plan chapter (created by plan_goal)
      📄 Create tournaments DrizzleORM schema    (order:1)
      📄 Add tournament bracket service          (order:2)
      📄 Add tournament API endpoints            (order:3)
      📄 Add tournament UI pages                 (order:4)
  📑 2026-05-20 — Add friends system       ← plan chapter
      📄 Create friends DrizzleORM schema        (order:1)
      📄 Add friends API endpoints               (order:2)
      📄 Add friends UI                          (order:3)
```

**Why this distinction matters for the agent:**

- `begin_task` receiving a standalone loose page → no chapter context, executes normally
- `begin_task` receiving a page inside a plan chapter → knows the broader goal, can reference sibling task titles for context, understands execution ordering

The chapter is also the natural unit of cancellation — deleting one chapter removes all its draft pages cleanly, with no orphaned pages left behind.

---

## 20. Task lifecycle

### Status tags

| Tag | Set by | Meaning |
|---|---|---|
| `status:draft` | `plan_goal` | Agent drafted this — awaiting user review |
| `status:pending` | User | Approved for execution |
| `status:in-progress` | `begin_task` | Agent is currently executing this |
| `status:done` | `save_run` (passed) | Completed successfully |
| `status:failed` | `save_run` (failed) | Execution failed — reverts to `pending` for retry |

### Lifecycle

```
plan_goal creates → status:draft
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
        User edits   User       User
        the page    approves   deletes
                       │
                       ▼
                  status:pending
                       │
                       ▼
               begin_task picks up
                       │
                       ▼
                status:in-progress
                       │
               ┌───────┴───────┐
               ▼               ▼
          status:done    status:failed
          (save_run     (save_run failed →
           passed)       reverts to pending)
```

### Rules

- `begin_task` refuses to execute `status:draft` pages — the agent cannot bypass user approval
- `begin_task` refuses to execute `status:done` pages — prevents duplicate work
- `begin_task` warns (but doesn't block) on `status:pending` pages whose `dependsOn` tasks aren't `done` yet

---

## 21. The `plan_goal` tool

### What it does

1. Resolves codebase context and run history
2. **Creates a BookStack chapter** named `YYYY-MM-DD — <goal title>` inside the Agent Tasks book
3. Returns instructions for the LLM to decompose the goal and write task pages **inside that chapter**
4. All pages are created as `status:draft` — never executed until user approves

### Tool registration in `router.ts`

```typescript
server.tool(
  'plan_goal',
  'PLANNING TOOL — decomposes a high-level goal into a BookStack chapter containing '
  + 'individual draft task pages. Creates a dated chapter (YYYY-MM-DD — goal title) '
  + 'then instructs the LLM to write each task as a page inside it. '
  + 'All tasks are status:draft — NOT executed until the user reviews and approves '
  + 'them (status:draft → status:pending). '
  + 'Single small tasks do NOT need plan_goal — use begin_task directly. '
  + 'Use plan_goal only for goals that span multiple modules, apps, or sessions.',
  {
    goal: z.string().describe('High-level goal description — what the user wants to achieve'),
    project: z.enum(['boffmedia', 'smartrotom']).describe('Which project this goal belongs to'),
    context: z.string().optional().describe('Additional context — constraints, preferences, BookStack page URLs')
  },
  async ({ goal, project, context: additionalContext }) => {
    const codeContext = await resolveContext({ taskDescription: goal, maxFiles: 15 })
    const history = await getRunHistory({ limit: 5, similarTo: goal, status: 'all' })

    const planId = `plan-${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)           // YYYY-MM-DD
    const chapterName = `${today} — ${goal}`
    const bookId = AGENT_TASK_BOOK_IDS[project]

    // Create the chapter now — synchronously before returning instructions.
    // All task pages will be written inside this chapter by the LLM.
    const chapter = await createBookStackChapter({
      bookId,
      name: chapterName,
      description: `Plan created ${today}. planId: ${planId}. Goal: ${goal}`
    })

    const chapterId = chapter.id

    const historyBlock = history.length > 0
      ? history.map(r => {
          const icon = r.status === 'passed' ? '✔' : '✖'
          const note = r.failureSummary ? `. Note: ${r.failureSummary}` : ''
          return `- "${r.title}" → ${icon} ${r.status}${note}`
        }).join('\n')
      : 'No prior runs found.'

    const instructions = `
# Plan Goal — Decomposition Instructions

planId: ${planId}
goal: ${goal}
project: ${project}
chapterId: ${chapterId}
chapterName: ${chapterName}
bookId: ${bookId}

## Chapter created ✔

A BookStack chapter has been created: "${chapterName}"
All task pages MUST be written inside this chapter using chapterId: ${chapterId}

## What to do now

Decompose this goal into **individual, atomic tasks**. For each task, call
write_bookstack_page with:

- bookId: ${bookId}
- chapterId: ${chapterId}          ← REQUIRED — all pages inside the chapter
- title: a clear, actionable task title
- tags: ["agent:task", "${project}", "status:draft", "plan:${planId}", "order:N"]
- content: use the task template below

After writing all draft pages, present a summary to the user:
1. Chapter URL in BookStack (so the user can review all drafts in one place)
2. All drafted tasks listed in execution order with estimated scope
3. Dependencies between tasks
4. Total estimated scope for the full plan

The user will review the chapter in BookStack, edit pages if needed, and approve
each task by changing status:draft → status:pending. Only status:pending pages
can be executed by begin_task.

## Task template

Use this exact markdown structure for every draft page:

\`\`\`markdown
# [Task title]

## Description
[Clear, specific description of what this task implements — one task, one concern]

## Affected apps
- api / web / both

## Acceptance criteria
- [ ] [Specific, testable criterion — Jest or Playwright must be able to verify this]
- [ ] [Another criterion]

## Do not touch
- [Any files or areas that must not be modified by this task]

## Dependencies
- dependsOn: [exact title of the prerequisite task, or "none"]
- order: [sequence number — 1, 2, 3...]

## Plan reference
- planId: ${planId}
- chapterId: ${chapterId}
- goal: ${goal}
\`\`\`

## Decomposition rules
- Each task must be completable in a single begin_task run (< 10 files changed)
- Tasks must be ordered so no task depends on work not yet done:
    1. Shared types / packages/shared changes first
    2. DrizzleORM schema and migration tasks second
    3. NestJS service and repository tasks third
    4. NestJS controller and DTO tasks fourth
    5. NextJS pages and components last
- Each task must have at least one testable acceptance criterion
- Do NOT create tasks for things that already exist — check existing modules below
- Do NOT create tasks that mix API and UI work — keep them separate
- If a task would change more than ~10 files, split it further

## Codebase context
Existing modules: ${codeContext.moduleList.join(', ')}
Existing pages: ${codeContext.pageList.join(', ')}
${codeContext.conventions ? '\nConventions:\n' + codeContext.conventions : ''}
${additionalContext ? '\nUser-provided context:\n' + additionalContext : ''}

## Prior runs on similar work
${historyBlock}
`.trim()

    return { content: [{ type: 'text', text: instructions }] }
  }
)
```

### Config addition

- [ ] Add `AGENT_TASK_BOOK_IDS` to `agent.config.ts`:

```typescript
export const AGENT_TASK_BOOK_IDS: Record<string, number> = {
  boffmedia: <agent_tasks_book_id>,
  smartrotom: <agent_tasks_book_id>,
}
```

### What happens in BookStack after `plan_goal`

```
📖 Agent Tasks (Boffmedia)
                                          ← existing loose pages untouched
  📑 2026-05-19 — Add tournament system  ← chapter created by plan_goal
      📄 [status:draft] Create tournaments DrizzleORM schema
      📄 [status:draft] Add tournament bracket service
      📄 [status:draft] Add tournament API endpoints
      📄 [status:draft] Add tournament UI pages
```

The user reviews the chapter, edits pages freely, then changes tags from `status:draft` to `status:pending` on each task they want to execute. Tasks can be approved one at a time — no need to approve the whole plan at once.

---

## 22. Task page template

### For plan tasks (inside a chapter — created by `plan_goal`)

```markdown
# [Task title]

## Description
[Clear, specific description of what this task implements — one task, one concern]

## Affected apps
- api / web / both

## Acceptance criteria
- [ ] [Specific, testable criterion — Jest or Playwright must verify this]
- [ ] [Another criterion]

## Do not touch
- [Any files or areas that must not be modified by this task]

## Dependencies
- dependsOn: [exact title of prerequisite task, or "none"]
- order: [sequence number — 1, 2, 3...]

## Plan reference
- planId: [auto-generated by plan_goal]
- chapterId: [auto-generated by plan_goal]
- goal: [the original high-level goal]

## Notes
[Any additional context — patterns to follow, edge cases, things to avoid]
```

**Tags applied to every plan task page:**
```
agent:task  ·  status:draft  ·  plan:<planId>  ·  order:<N>  ·  <project>
```

---

### For single tasks (loose pages — created manually, no chapter)

Single tasks don't need a plan reference or dependency fields. Use this simpler template:

```markdown
# [Task title]

## Description
[What needs to be done]

## Affected apps
- api / web / both

## Acceptance criteria
- [ ] [Criterion]

## Do not touch
- [Protected areas if any]

## Notes
[Any context the agent should know]
```

**Tags applied to single task pages:**
```
agent:task  ·  status:pending  ·  <project>
```

Note: single tasks are created as `status:pending` directly — no draft state needed since there's no plan to review.

---

## 23. Dependency tracking

### Design decision: soft dependencies with warnings

Dependencies are tracked via the `dependsOn` field in the task page content and the `order:N` tag. They are **informational, not enforced** — the agent warns but does not block.

### How it works

When `begin_task` receives a `bookstackTaskPageId`, it:

1. Fetches the task page content
2. Parses the `dependsOn` field
3. If the prerequisite task exists and is not `status:done`, surfaces a warning:

```
⚠ Dependency warning: this task depends on "Create products DrizzleORM schema"
which has status:pending (not done). Proceeding may cause failures if the schema
doesn't exist yet. Ask the user whether to proceed.
```

4. The user decides — not the agent

### Why not hard blocking

Hard blocks require a graph solver, cycle detection, and an understanding of partial completion. For a solo developer running tasks sequentially, a warning is sufficient — you know the context, you can override when you know the dependency is already satisfied through other work. Complexity without utility.

---

## 24. Updated `begin_task` — dependency awareness

### Changes to `begin_task` handler

- [ ] When `bookstackTaskPageId` is provided, fetch and parse the task page:

```typescript
let dependencyWarning = ''

if (bookstackTaskPageId) {
  const taskPage = await fetchBookStackPage({ pageId: bookstackTaskPageId })

  // Check status — refuse draft, refuse done
  if (taskPage.tags.includes('status:draft')) {
    return { content: [{ type: 'text', text:
      `❌ Cannot execute task "${taskPage.title}" — it has status:draft.\n` +
      `The user must review and approve it first by changing the tag to status:pending in BookStack.`
    }] }
  }

  if (taskPage.tags.includes('status:done')) {
    return { content: [{ type: 'text', text:
      `❌ Task "${taskPage.title}" is already done. To re-run it, change the status tag to status:pending in BookStack.`
    }] }
  }

  // Parse dependsOn from content
  const dependsOnMatch = taskPage.content.match(/dependsOn:\s*(.+)/i)
  const dependsOn = dependsOnMatch?.[1]?.trim()

  if (dependsOn && dependsOn !== 'none') {
    // Search for the dependency task page
    const depResults = await searchBookStack({ query: dependsOn, tags: ['agent:task'], limit: 1 })
    if (depResults.length > 0) {
      const depPage = await fetchBookStackPage({ pageId: depResults[0].pageId })
      const depDone = depPage.tags.includes('status:done')
      if (!depDone) {
        dependencyWarning = `\n## ⚠ Dependency warning\nThis task depends on "${dependsOn}" which has not completed yet (status: ${depPage.tags.find(t => t.startsWith('status:'))?.replace('status:', '') ?? 'unknown'}).\nProceeding may cause failures. Ask the user whether to continue.\n`
      }
    }
  }
}
```

- [ ] Insert `${dependencyWarning}` into the workflow template after the health section

---

## 25. Updated `list_bookstack_tasks` — ordering, chapters, and dependencies

### Changes to `router.ts`

- [ ] Update `list_bookstack_tasks` to support chapter-aware filtering:

```typescript
server.tool(
  'list_bookstack_tasks',
  'List agent:task pages for a project. '
  + 'Plan tasks are grouped by chapter and sorted by order:N tag. '
  + 'Standalone loose pages listed separately. '
  + 'Use planId to filter to a specific plan chapter.',
  {
    project: z.enum(['boffmedia', 'smartrotom']),
    status: z.enum(['draft', 'pending', 'in-progress', 'done', 'all']).optional().default('all'),
    planId: z.string().optional().describe('Filter by plan ID to see only tasks from a specific chapter')
  },
  async ({ project, status, planId }) => {
    const result = await listBookStackTasks({ project, status, planId })
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)
```

- [ ] Update `listBookStackTasks` in `src/tools/bookstack.ts`:
  - [ ] Support `planId` filter via `plan:<planId>` tag
  - [ ] Sort plan tasks by `order:N` tag numerically within each plan group
  - [ ] Group results: `{ plans: [...], standalone: [...] }` — distinguishes plan pages from loose pages
  - [ ] Include `chapterName`, `dependsOn`, `order`, `dependencyStatus` in each plan task
  - [ ] Mark `dependencyMet: true/false` by checking whether the `dependsOn` task is `status:done`

### Expected return shape

```typescript
{
  plans: [
    {
      planId: 'plan-1716000000',
      chapterName: '2026-05-19 — Add tournament system',
      chapterId: 42,
      tasks: [
        {
          pageId: 101,
          title: 'Create tournaments DrizzleORM schema',
          status: 'done',
          order: 1,
          dependsOn: 'none',
          dependencyMet: true,
          url: 'https://bookstack.../page/...'
        },
        {
          pageId: 102,
          title: 'Add tournament bracket service',
          status: 'pending',
          order: 2,
          dependsOn: 'Create tournaments DrizzleORM schema',
          dependencyMet: true,
          url: 'https://bookstack.../page/...'
        }
      ]
    }
  ],
  standalone: [
    {
      pageId: 200,
      title: 'Fix bank balance display',
      status: 'pending',
      url: 'https://bookstack.../page/...'
    }
  ]
}
```

---

# Part 3 — Implementation
26. [Implementation checklist](#26-implementation-checklist)

---

# Part 1 — Workflow audit fixes

---

## 1. Fix: Health check + metrics baseline in `begin_task`

> **Problem**: `checkSystemHealth` and `captureMetricsBaseline` are registered tools but never called by the workflow. The agent skips them because they're not in the numbered steps.  
> **Impact**: the agent works on top of a potentially broken system and has no baseline for regression detection.

### Changes to `router.ts` — `begin_task` handler

- [ ] Add `checkSystemHealth` and `captureMetricsBaseline` to the parallel calls in `begin_task`:

```typescript
const [context, history, health, _baseline] = await Promise.all([
  resolveContext({ taskDescription, maxFiles: 20 }),
  getRunHistory({ limit: 5, similarTo: title, status: 'all' }),
  checkSystemHealth().catch(() => ({ safe: true, warnings: [], metrics: {} })),
  captureMetricsBaseline({ runId }).catch(() => null)
])
```

- [ ] Surface health warnings in the workflow output if `health.safe === false`:

```typescript
const healthSection = !health.safe
  ? `\n## ⚠ System health warning\nThe following issues were detected before starting:\n${health.warnings.map(w => `- ${w}`).join('\n')}\n\nConsider investigating before proceeding. Ask the user if you should continue.\n`
  : ''
```

- [ ] Insert `${healthSection}` into the workflow template after the header
- [ ] Remove `capture_metrics_baseline` from the workflow steps — it now runs automatically inside `begin_task`

### Verification

- [ ] `begin_task` returns health warnings when system is unhealthy
- [ ] `begin_task` returns no health section when system is healthy
- [ ] `metrics_snapshots` table has a `phase=before` row after `begin_task` completes

---

## 2. Fix: Rollback instruction on failure

> **Problem**: if `run_verification` fails and the agent can't fix the code, there's no instruction to clean the working tree. The agent leaves modified files on disk and calls `save_run(failed)` — next task starts dirty.

### Changes to workflow template

- [ ] Add failure branch after step 4a. Insert this block:

```
### If verification fails and you cannot fix the code:
  - Call git_operation (action: "reset") to restore the working tree to a clean state
  - Call save_run (runId: "${runId}", status: "failed", failureSummary: "<describe what failed and why>")
  - If a bookstackTaskPageId was provided, the task status resets to pending automatically
  - Stop. Do not proceed to steps 5 or 6.
  - Consider calling create_gitlab_issue to document the failure for future review.
```

### Verification

- [ ] When the agent gives up after failed verification, working tree is clean (`git status` shows no changes)
- [ ] `save_run` is called with `status: failed` and a meaningful `failureSummary`
- [ ] BookStack task page reverts to `status:pending` if it was an agent:task

---

## 3. Fix: Environment setup before verification

> **Problem**: `run_verification` assumes the Docker agent environment is running. If it's stale or down, tests fail for infrastructure reasons — the agent wastes retries fixing code that isn't broken.

### Changes to workflow template

- [ ] Add step 3b between code changes and verification:

```
3b. Call reset_environment (action: "up") and seed_database (fixture: "default")
    to guarantee a clean, known-state test environment before verification.
```

### Alternative — build into `run_verification` itself

If you prefer the environment setup to be invisible rather than an explicit step:

- [ ] Inside `runVerification()` in `src/tools/verification.ts`, call `manageEnvironment({ action: 'up' })` and `seedDatabase({ fixture: 'default' })` as the first step before running lint/tests
- [ ] This guarantees environment readiness regardless of whether the workflow text is followed

### Decision

```
[ ] Option A — explicit workflow step (agent calls reset_environment)
[ ] Option B — built into run_verification (invisible, guaranteed)
```

Mark one before implementing.

### Verification

- [ ] Stop the Docker agent environment manually → call `run_verification` → confirm it starts the environment and tests pass
- [ ] Run `run_verification` twice in a row — confirm idempotent (second run doesn't fail)

---

## 4. Fix: `runId` slug generation

> **Problem**: if `title` is empty or all special characters, `runId` gets a leading hyphen or is just a timestamp. Ugly in file paths and branch names.

### Change in `begin_task` handler

- [ ] Replace current `runId` generation:

```typescript
// Before
const runId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now()}`

// After
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40) || 'task'
const runId = `${slug}-${Date.now()}`
```

### Verification

- [ ] `begin_task` with title `"!!!@@@"` → `runId` starts with `task-`, not `---`
- [ ] `begin_task` with title `""` → `runId` starts with `task-`
- [ ] `begin_task` with title `"add products endpoint"` → `runId` is `add-products-endpoint-1716...`

---

## 5. Fix: History format — remove raw JSON dump

> **Problem**: `JSON.stringify(history, null, 2)` dumps 2,000–4,000 tokens of raw JSON with internal IDs, timestamps, and nested objects. The useful signal is 10% of that.

### Change in `begin_task` handler

- [ ] Replace the history section builder:

```typescript
// Before
const historyBlock = history.length > 0
  ? JSON.stringify(history, null, 2)
  : 'No prior runs found.'

// After
const historyBlock = history.length > 0
  ? history.map(r => {
      const icon = r.status === 'passed' ? '✔' : '✖'
      const attempt = r.attemptCount ? ` (attempt ${r.attemptCount})` : ''
      const note = r.failureSummary ? `\n    Note: ${r.failureSummary}` : ''
      const branch = r.branch ? ` → branch: ${r.branch}` : ''
      return `- "${r.title}" → ${icon} ${r.status}${attempt}${branch}${note}`
    }).join('\n')
  : 'No prior runs found.'
```

### Verification

- [ ] `begin_task` with 5 prior runs produces ~200 tokens of history, not ~3,000
- [ ] Each history entry shows: title, status, attempt count, branch, and failure note
- [ ] Performance notes are still rendered separately via `performanceSection` (unchanged)

---

## 6. Fix: Playwright condition made explicit

> **Problem**: for non-`ui-ux` tasks the agent is told "skip unless you made UI changes" — with no criteria for what counts as a UI change.

### Change in `begin_task` handler

- [ ] Replace the `playwrightStep` builder:

```typescript
// Before
const playwrightStep = taskType === 'ui-ux'
  ? `4b. Call run_playwright (runId: "${runId}") — trace + screenshots. Present reviewInstructions to the user before proceeding to step 5.`
  : `4b. Skip run_playwright unless you made UI changes.`

// After
const playwrightStep = taskType === 'ui-ux'
  ? `4b. Call run_playwright (runId: "${runId}") — REQUIRED for ui-ux tasks.
     Capture trace and screenshots. Present reviewInstructions to the user before proceeding.`
  : `4b. Call run_playwright (runId: "${runId}") if you created or modified any file in apps/web/
     (pages, components, layouts, styles). Skip ONLY if all changes are confined to apps/api/
     with zero frontend surface.`
```

### Verification

- [ ] Agent running a `feature` task that creates a NextJS page → calls `run_playwright`
- [ ] Agent running a `refactor` task that only touches NestJS services → skips `run_playwright`
- [ ] Agent running a `ui-ux` task → always calls `run_playwright`

---

## 7. Fix: `check_guardrails` wording — re-check on new files

> **Problem**: called once at step 2 with "every file path you intend to write". Mid-implementation discoveries (new DTOs, entities, migrations) bypass the guardrail.

### Changes

- [ ] Update `check_guardrails` tool description in `router.ts`:

```typescript
'Check whether file paths violate protected path rules from .agent-ignore. '
+ 'Call this BEFORE writing any files. If you discover additional files are needed '
+ 'during implementation, call check_guardrails again before writing them. '
+ 'If any violations are returned, do not write those files and inform the user.'
```

- [ ] Update workflow step 2:

```
2. Call check_guardrails with every file path you intend to write or modify.
   Stop if violations are returned.
   ⚠ If you discover additional files are needed during step 3, call check_guardrails
   again before writing them.
```

### Verification

- [ ] Agent discovers a new file mid-implementation → calls `check_guardrails` before writing it
- [ ] File in `.agent-ignore` discovered mid-task → agent refuses to write it and informs user

---

## 8. Fix: `sync_openapi_docs` — remove `bookId` from caller

> **Problem**: `bookId` is a static config value that never changes per run. Making the agent pass it means every caller needs internal config knowledge.

### Changes to `router.ts`

- [ ] Import `API_REFERENCE_BOOK_IDS` from `agent.config.js`:

```typescript
import { API_REFERENCE_BOOK_IDS } from '../agent.config.js'
```

- [ ] Remove `bookId` from the tool schema and read from config:

```typescript
server.tool(
  'sync_openapi_docs',
  '...',
  {
    runId: z.string().describe('Run ID from begin_task'),
    affectedModules: z.array(z.string()).describe('NestJS module names changed in this run'),
    project: z.enum(['boffmedia', 'smartrotom'])
    // bookId removed
  },
  async ({ runId, affectedModules, project }) => {
    const bookId = API_REFERENCE_BOOK_IDS[project]
    if (!bookId) {
      return { content: [{ type: 'text', text: JSON.stringify({
        ok: false, reason: `No API reference book configured for ${project}`
      }) }] }
    }
    const result = await syncOpenApiDocs({ runId, affectedModules, bookId, project })
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)
```

- [ ] Add `API_REFERENCE_BOOK_IDS` to `agent.config.ts`:

```typescript
export const API_REFERENCE_BOOK_IDS: Record<string, number> = {
  boffmedia: <book_id_here>,
  smartrotom: <book_id_here>,
}
```

### Verification

- [ ] Agent calls `sync_openapi_docs` without passing `bookId` — works correctly
- [ ] Calling with an unconfigured project returns a clear error message

---

## 9. Fix: `sync_conventions` — handle SmartRotom

> **Problem**: `sync_conventions` silently returns `ok: false` for SmartRotom. It's one monorepo with one `CONVENTIONS.md` — both projects should share the same conventions page or each have their own.

### Decision

Since Boffmedia and SmartRotom share the same codebase and the same `CONVENTIONS.md`, they share the same conventions page. SmartRotom doesn't need a separate one.

### Change in `router.ts`

- [ ] Replace the SmartRotom fallback with shared conventions logic:

```typescript
server.tool(
  'sync_conventions',
  '...',
  {
    project: z.enum(['boffmedia', 'smartrotom']).describe('Project to sync conventions for')
  },
  async ({ project }) => {
    // Both projects share the same CONVENTIONS.md — use boffmedia conventions page
    // or a dedicated shared page
    const pageId = CONVENTIONS_PAGE_IDS[project] ?? CONVENTIONS_PAGE_IDS.shared
    if (!pageId) {
      return { content: [{ type: 'text', text: JSON.stringify({
        ok: false,
        reason: `No conventions page configured. Add to CONVENTIONS_PAGE_IDS in agent.config.ts`
      }) }] }
    }
    const bookId = TECHNICAL_BOOK_IDS[project] ?? TECHNICAL_BOOK_IDS.shared
    await syncConventions({ bookId, pageId, project })
    return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] }
  }
)
```

- [ ] Add `shared` key to `CONVENTIONS_PAGE_IDS` and `TECHNICAL_BOOK_IDS` in `agent.config.ts`:

```typescript
export const CONVENTIONS_PAGE_IDS: Record<string, number> = {
  boffmedia: <page_id>,
  shared: <page_id>,  // fallback — same page since it's one monorepo
}
```

### Verification

- [ ] `sync_conventions` with `project: 'smartrotom'` succeeds (uses shared page)
- [ ] `sync_conventions` with `project: 'boffmedia'` succeeds
- [ ] Both write to the same BookStack conventions page

---

## 10. Fix: Add `check_performance_regression` to workflow

> **Problem**: `capture_metrics_baseline` runs (after fix #1) but `check_performance_regression` is never called in the workflow. The post-run check is silently skipped.

### Change to workflow template

- [ ] Add step 4e after OpenAPI sync:

```
4e. Call check_performance_regression (runId: "${runId}").
    If hasRegression=true, present the regressions to the user and ask whether to proceed.
    Performance regressions do NOT automatically block the commit — the user decides.
```

### Verification

- [ ] After a successful `run_verification`, agent calls `check_performance_regression`
- [ ] Regression data is surfaced to user before commit gate
- [ ] No regression → workflow continues silently

---

## 11. Fix: Harden `create_gitlab_mr` prohibition

> **Problem**: the workflow says "Do NOT call" but the language is easy for an LLM to override if it reasons that "the task is done so a MR is helpful."

### Change to workflow template

- [ ] Replace the current line with a stronger prohibition and explanation:

```
⚠ NEVER call create_gitlab_mr during this workflow.
MR creation is the user's explicit decision after reviewing the pushed branch.
Calling it automatically bypasses the visual review and commit approval step.
If the user wants an MR, they will ask you separately after reviewing the branch.
```

### Verification

- [ ] Agent completes full workflow → does not call `create_gitlab_mr`
- [ ] Agent is explicitly asked "create a MR" → correctly calls `create_gitlab_mr`

---

## 12. Fix: BookStack structure tools — mark as setup-only

> **Problem**: `create_bookstack_shelf`, `create_bookstack_book`, `add_books_to_shelf`, and `create_bookstack_chapter` are registered as regular tools. An LLM could call them mid-task.

### Changes to `router.ts`

- [ ] Prefix each tool description with setup-only notice:

```typescript
server.tool(
  'create_bookstack_shelf',
  'SETUP TOOL — call only when explicitly asked to create BookStack structure. '
  + 'Not part of the standard task workflow. Creates a new BookStack shelf.',
  ...
)

server.tool(
  'create_bookstack_book',
  'SETUP TOOL — call only when explicitly asked to create BookStack structure. '
  + 'Not part of the standard task workflow. Creates a new BookStack book.',
  ...
)

server.tool(
  'add_books_to_shelf',
  'SETUP TOOL — call only when explicitly asked to organise BookStack structure. '
  + 'Not part of the standard task workflow. Assigns books to a shelf.',
  ...
)

server.tool(
  'create_bookstack_chapter',
  'SETUP TOOL — call only when explicitly asked to create BookStack structure. '
  + 'Not part of the standard task workflow. Creates a chapter inside a book.',
  ...
)
```

### Verification

- [ ] Agent following the standard workflow never calls these tools
- [ ] Agent explicitly asked "create a new shelf for X" → calls `create_bookstack_shelf` correctly

---

## 13. Fix: `write_adr` — include branch link

> **Problem**: the ADR written to BookStack has no link back to the branch or commit that motivated it. Six months later you can't trace from the ADR to the code.

### Change to `write_adr` tool handler

- [ ] Get the current branch name and include it in the ADR body:

```typescript
async ({ title, context, decision, consequences, project, runId }) => {
  // Get current branch for traceability
  const branchResult = await gitOperation({ action: 'current_branch' })
  const branch = branchResult.success ? branchResult.output : 'unknown'

  const result = await writeAdr({
    bookId: TECHNICAL_BOOK_IDS[project],
    chapterId: ADR_CHAPTER_IDS[project],
    title,
    context,
    decision,
    consequences,
    project,
    runId,
    branch  // new field — rendered in the ADR footer
  })
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
}
```

- [ ] Update `writeAdr` in `src/tools/bookstack.ts` to append a footer:

```markdown
---
*Recorded by harness agent · Run ID: `${runId}` · Branch: `${branch}`*
```

### Verification

- [ ] ADR page in BookStack includes the branch name and run ID in the footer
- [ ] Branch name is correct (matches the branch created in step 5)

---

## 14. Fix: Non-fatal sync failures

> **Problem**: if BookStack is unreachable during `sync_conventions` or `sync_openapi_docs`, the run may abort entirely. These are documentation operations — they should not block a successful code change.

### Change to workflow template

- [ ] Add after step 4c and 4d:

```
Steps 4c and 4d (BookStack sync) are non-fatal. If BookStack is unreachable,
log the failure and continue to step 5. Do not abort a successful run because
of a documentation sync failure. Inform the user that BookStack sync was skipped.
```

### Change to `begin_task` handler

- [ ] Mark steps 4c and 4d as non-fatal in the workflow text itself so the instruction is always visible

### Verification

- [ ] Stop BookStack container → complete a run → confirm run succeeds, agent reports BookStack sync was skipped
- [ ] BookStack running → confirm sync works normally

---

## 15. Fix: Git error handling in workflow

> **Problem**: no guidance for retry scenarios (branch already exists) or partial push failures (GitLab succeeds, GitHub mirror fails).

### Change to workflow template

- [ ] Add to step 5:

```
5. Git operations:
   a. Call git_operation (action: "branch", branchName: "<derived from task title>")
      If the branch already exists (retry scenario), use the existing branch —
      call git_operation (action: "current_branch") to confirm.
   b. Call git_operation (action: "commit", commitMessage: "feat: <task title> [agent]")
   c. Call git_operation (action: "push_mirrors", branchName: "<branch name>")
      GitHub mirror push failures are non-fatal — log and continue.
      GitLab primary push failures ARE fatal — abort and call save_run with status: "failed".
```

### Verification

- [ ] Agent retries after failure → uses existing branch, doesn't crash on "branch already exists"
- [ ] GitHub mirror down → run completes with a warning
- [ ] GitLab push fails → run aborts with `save_run(failed)`

---

## 16. Fix: Context staleness warning

> **Problem**: codebase context is resolved at task start and never refreshed. For long tasks the agent doesn't know a module it just created is now available.

### Change to workflow template

- [ ] Add a note in the codebase context section:

```
## Codebase context
⚠ This context was resolved at task start. If you create new modules, entities,
or pages during this task, they won't appear in the lists above. Apply your own
judgment based on files you have written. Call resolve_context mid-task if you
need a refreshed view.
```

### Verification

- [ ] Agent creates a new NestJS module → references it by name even though it wasn't in the original `moduleList`

---

## 17. Fix: ADR trigger examples

> **Problem**: `detect_structural_changes` returns `adrRecommended` but the workflow gives no examples of what always qualifies as structural.

### Change to workflow template

- [ ] Add after step 4c instruction:

```
4c. Call detect_structural_changes. If adrRecommended=true, call write_adr.
    Always call sync_conventions after.

    Structural changes that ALWAYS warrant an ADR, even if the tool misses them:
    - New NestJS module
    - New DrizzleORM table or schema change
    - New external service dependency
    - Change to the authentication flow
    - Change to a shared type in packages/shared
    - New cron job or background process
```

### Verification

- [ ] Agent adds a new DrizzleORM table → calls `write_adr` even if `detect_structural_changes` returns `adrRecommended: false`

---

## 18. Updated workflow template

> **This is the corrected, complete workflow template** incorporating all fixes from sections 1–17. Replace the existing template in `begin_task`.

```typescript
const workflow = `
# Boff Agent — Task Started

runId: ${runId}
title: ${title}
taskType: ${taskType}
${healthSection}
## Workflow (follow in order)

1. ✅ begin_task — done. Health checked. Metrics baseline captured.

2. Call check_guardrails with every file path you intend to write or modify.
   Stop if violations are returned.
   ⚠ If you discover additional files are needed during step 3, call check_guardrails
   again before writing them.

3. Make your code changes using your own file editing tools.

3b. Call reset_environment (action: "up") and seed_database (fixture: "default")
    to guarantee a clean test environment.

4a. Call run_verification (runId: "${runId}") to run lint + tests.
    Fix failures before proceeding.

### If verification fails and you cannot fix the code:
    - Call git_operation (action: "reset") to restore the working tree
    - Call save_run (runId: "${runId}", status: "failed", failureSummary: "...")
    - Consider calling create_gitlab_issue to document the failure
    - Stop. Do not proceed to step 5.

${playwrightStep}

4c. Call detect_structural_changes. If adrRecommended=true, call write_adr.
    Always call sync_conventions after (non-fatal if BookStack is unreachable).
    Structural changes that ALWAYS warrant an ADR regardless of tool output:
    - New NestJS module, DrizzleORM table/schema change, external service dependency
    - Auth flow change, shared type change, new cron/background process

4d. If you created or modified any NestJS controller, DTO, or route decorator,
    call sync_openapi_docs (runId: "${runId}") with the affected module names.
    Non-fatal if BookStack is unreachable — log and continue.

4e. Call check_performance_regression (runId: "${runId}").
    If hasRegression=true, present regressions to the user and ask whether to proceed.
    Performance regressions do NOT automatically block — the user decides.

5. Git operations:
   a. Create branch: git_operation (action: "branch", branchName: "${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}")
      If branch already exists (retry scenario), use the existing branch.
   b. Commit: git_operation (action: "commit", commitMessage: "feat: ${title} [agent]")
   c. Push: git_operation (action: "push_mirrors", branchName: "<branch from 5a>")
      GitHub mirror failures are non-fatal — log and continue.
      GitLab primary failures ARE fatal — abort and save_run(failed).

6. Call save_run (runId: "${runId}", status: "passed"${bookstackTaskPageId ? `, bookstackTaskPageId: ${bookstackTaskPageId}` : ''})
   to close the task.

## Rules
- Do not skip steps. Do not call save_run before run_verification passes.
- Steps 4c, 4d (BookStack sync) are non-fatal. If BookStack is unreachable, continue.
- ⚠ NEVER call create_gitlab_mr during this workflow.
  MR creation is the user's explicit decision after reviewing the pushed branch.
  If the user asks for an MR, they will request it separately.

## Prior runs on similar tasks
${historyBlock}
${performanceSection}

## Codebase context
⚠ Context was resolved at task start. If you create new modules or entities
during this task, they won't appear below. Call resolve_context mid-task if needed.

Modules: ${context.moduleList.join(', ')}
Pages: ${context.pageList.join(', ')}
Conventions: loaded (${context.totalTokenEstimate} token estimate)
${context.conventions ? '\n' + context.conventions : ''}
${bookstackSection}
`.trim()
```

---

# Part 2 — Planning mode

---

## 19. Planning architecture

### The problem

Currently the agent handles one task at a time. For larger work — "add a full tournament system" or "add push notifications across all SmartRotom apps" — the user has to manually decompose the goal into individual task pages. This is tedious and error-prone.

### The solution

A new `plan_goal` tool, separate from `begin_task`, that:

1. Takes a high-level goal description
2. Creates a dated BookStack chapter to contain all plan tasks
3. Decomposes the goal into ordered, scoped task pages inside that chapter
4. Writes them as `status:draft` pages
5. Returns a summary for user review

The key principle: **`plan_goal` never executes anything.** It only creates the chapter and draft pages. Execution happens through the normal `begin_task` workflow, only on tasks the user has approved by changing `draft` → `pending`.

```
plan_goal                         begin_task
    │                                 │
    ▼                                 ▼
Chapter created               Execute each task
(date + goal title)           via normal workflow
    │
    ▼
Draft task pages ──(user approves)──►  status:pending
inside chapter                         ready to run
```

This keeps planning and execution cleanly separated. The agent cannot auto-execute drafted plans.

### BookStack structure — chapters vs loose pages

The Agent Tasks book uses a deliberate two-tier structure:

**Single tasks (no `plan_goal`)** — loose pages directly in the Agent Tasks book. No chapter, no container. A single task does not need grouping — adding one would create a container with one item, which is pure noise.

**Multi-task plans (via `plan_goal`)** — a chapter is created first, then all task pages live inside it. The chapter name is `YYYY-MM-DD — <goal title>` so plans are sorted chronologically and immediately identifiable by date.

```
📖 Agent Tasks (Boffmedia)
  📄 Fix bank balance display              ← single task — loose page, no chapter
  📄 Update Pokémon tracker UI             ← single task — loose page, no chapter
  📑 2026-05-19 — Add tournament system    ← plan chapter (created by plan_goal)
      📄 Create tournaments DrizzleORM schema    (order:1)
      📄 Add tournament bracket service          (order:2)
      📄 Add tournament API endpoints            (order:3)
      📄 Add tournament UI pages                 (order:4)
  📑 2026-05-20 — Add friends system       ← plan chapter
      📄 Create friends DrizzleORM schema        (order:1)
      📄 Add friends API endpoints               (order:2)
      📄 Add friends UI                          (order:3)
```

**Why this distinction matters for the agent:**

- `begin_task` receiving a standalone loose page → no chapter context, executes normally
- `begin_task` receiving a page inside a plan chapter → knows the broader goal, can reference sibling task titles for context, understands execution ordering

The chapter is also the natural unit of cancellation — deleting one chapter removes all its draft pages cleanly, with no orphaned pages left behind.

---

## 20. Task lifecycle

### Status tags

| Tag | Set by | Meaning |
|---|---|---|
| `status:draft` | `plan_goal` | Agent drafted this — awaiting user review |
| `status:pending` | User | Approved for execution |
| `status:in-progress` | `begin_task` | Agent is currently executing this |
| `status:done` | `save_run` (passed) | Completed successfully |
| `status:failed` | `save_run` (failed) | Execution failed — reverts to `pending` for retry |

### Lifecycle

```
plan_goal creates → status:draft
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
        User edits   User       User
        the page    approves   deletes
                       │
                       ▼
                  status:pending
                       │
                       ▼
               begin_task picks up
                       │
                       ▼
                status:in-progress
                       │
               ┌───────┴───────┐
               ▼               ▼
          status:done    status:failed
          (save_run     (save_run failed →
           passed)       reverts to pending)
```

### Rules

- `begin_task` refuses to execute `status:draft` pages — the agent cannot bypass user approval
- `begin_task` refuses to execute `status:done` pages — prevents duplicate work
- `begin_task` warns (but doesn't block) on `status:pending` pages whose `dependsOn` tasks aren't `done` yet

---

## 21. The `plan_goal` tool

### What it does

1. Resolves codebase context and run history
2. **Creates a BookStack chapter** named `YYYY-MM-DD — <goal title>` inside the Agent Tasks book
3. Returns instructions for the LLM to decompose the goal and write task pages **inside that chapter**
4. All pages are created as `status:draft` — never executed until user approves

### Tool registration in `router.ts`

```typescript
server.tool(
  'plan_goal',
  'PLANNING TOOL — decomposes a high-level goal into a BookStack chapter containing '
  + 'individual draft task pages. Creates a dated chapter (YYYY-MM-DD — goal title) '
  + 'then instructs the LLM to write each task as a page inside it. '
  + 'All tasks are status:draft — NOT executed until the user reviews and approves '
  + 'them (status:draft → status:pending). '
  + 'Single small tasks do NOT need plan_goal — use begin_task directly. '
  + 'Use plan_goal only for goals that span multiple modules, apps, or sessions.',
  {
    goal: z.string().describe('High-level goal description — what the user wants to achieve'),
    project: z.enum(['boffmedia', 'smartrotom']).describe('Which project this goal belongs to'),
    context: z.string().optional().describe('Additional context — constraints, preferences, BookStack page URLs')
  },
  async ({ goal, project, context: additionalContext }) => {
    const codeContext = await resolveContext({ taskDescription: goal, maxFiles: 15 })
    const history = await getRunHistory({ limit: 5, similarTo: goal, status: 'all' })

    const planId = `plan-${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)           // YYYY-MM-DD
    const chapterName = `${today} — ${goal}`
    const bookId = AGENT_TASK_BOOK_IDS[project]

    // Create the chapter now — synchronously before returning instructions.
    // All task pages will be written inside this chapter by the LLM.
    const chapter = await createBookStackChapter({
      bookId,
      name: chapterName,
      description: `Plan created ${today}. planId: ${planId}. Goal: ${goal}`
    })

    const chapterId = chapter.id

    const historyBlock = history.length > 0
      ? history.map(r => {
          const icon = r.status === 'passed' ? '✔' : '✖'
          const note = r.failureSummary ? `. Note: ${r.failureSummary}` : ''
          return `- "${r.title}" → ${icon} ${r.status}${note}`
        }).join('\n')
      : 'No prior runs found.'

    const instructions = `
# Plan Goal — Decomposition Instructions

planId: ${planId}
goal: ${goal}
project: ${project}
chapterId: ${chapterId}
chapterName: ${chapterName}
bookId: ${bookId}

## Chapter created ✔

A BookStack chapter has been created: "${chapterName}"
All task pages MUST be written inside this chapter using chapterId: ${chapterId}

## What to do now

Decompose this goal into **individual, atomic tasks**. For each task, call
write_bookstack_page with:

- bookId: ${bookId}
- chapterId: ${chapterId}          ← REQUIRED — all pages inside the chapter
- title: a clear, actionable task title
- tags: ["agent:task", "${project}", "status:draft", "plan:${planId}", "order:N"]
- content: use the task template below

After writing all draft pages, present a summary to the user:
1. Chapter URL in BookStack (so the user can review all drafts in one place)
2. All drafted tasks listed in execution order with estimated scope
3. Dependencies between tasks
4. Total estimated scope for the full plan

The user will review the chapter in BookStack, edit pages if needed, and approve
each task by changing status:draft → status:pending. Only status:pending pages
can be executed by begin_task.

## Task template

Use this exact markdown structure for every draft page:

\`\`\`markdown
# [Task title]

## Description
[Clear, specific description of what this task implements — one task, one concern]

## Affected apps
- api / web / both

## Acceptance criteria
- [ ] [Specific, testable criterion — Jest or Playwright must be able to verify this]
- [ ] [Another criterion]

## Do not touch
- [Any files or areas that must not be modified by this task]

## Dependencies
- dependsOn: [exact title of the prerequisite task, or "none"]
- order: [sequence number — 1, 2, 3...]

## Plan reference
- planId: ${planId}
- chapterId: ${chapterId}
- goal: ${goal}
\`\`\`

## Decomposition rules
- Each task must be completable in a single begin_task run (< 10 files changed)
- Tasks must be ordered so no task depends on work not yet done:
    1. Shared types / packages/shared changes first
    2. DrizzleORM schema and migration tasks second
    3. NestJS service and repository tasks third
    4. NestJS controller and DTO tasks fourth
    5. NextJS pages and components last
- Each task must have at least one testable acceptance criterion
- Do NOT create tasks for things that already exist — check existing modules below
- Do NOT create tasks that mix API and UI work — keep them separate
- If a task would change more than ~10 files, split it further

## Codebase context
Existing modules: ${codeContext.moduleList.join(', ')}
Existing pages: ${codeContext.pageList.join(', ')}
${codeContext.conventions ? '\nConventions:\n' + codeContext.conventions : ''}
${additionalContext ? '\nUser-provided context:\n' + additionalContext : ''}

## Prior runs on similar work
${historyBlock}
`.trim()

    return { content: [{ type: 'text', text: instructions }] }
  }
)
```

### Config addition

- [ ] Add `AGENT_TASK_BOOK_IDS` to `agent.config.ts`:

```typescript
export const AGENT_TASK_BOOK_IDS: Record<string, number> = {
  boffmedia: <agent_tasks_book_id>,
  smartrotom: <agent_tasks_book_id>,
}
```

### What happens in BookStack after `plan_goal`

```
📖 Agent Tasks (Boffmedia)
                                          ← existing loose pages untouched
  📑 2026-05-19 — Add tournament system  ← chapter created by plan_goal
      📄 [status:draft] Create tournaments DrizzleORM schema
      📄 [status:draft] Add tournament bracket service
      📄 [status:draft] Add tournament API endpoints
      📄 [status:draft] Add tournament UI pages
```

The user reviews the chapter, edits pages freely, then changes tags from `status:draft` to `status:pending` on each task they want to execute. Tasks can be approved one at a time — no need to approve the whole plan at once.

---

## 22. Task page template

### For plan tasks (inside a chapter — created by `plan_goal`)

```markdown
# [Task title]

## Description
[Clear, specific description of what this task implements — one task, one concern]

## Affected apps
- api / web / both

## Acceptance criteria
- [ ] [Specific, testable criterion — Jest or Playwright must verify this]
- [ ] [Another criterion]

## Do not touch
- [Any files or areas that must not be modified by this task]

## Dependencies
- dependsOn: [exact title of prerequisite task, or "none"]
- order: [sequence number — 1, 2, 3...]

## Plan reference
- planId: [auto-generated by plan_goal]
- chapterId: [auto-generated by plan_goal]
- goal: [the original high-level goal]

## Notes
[Any additional context — patterns to follow, edge cases, things to avoid]
```

**Tags applied to every plan task page:**
```
agent:task  ·  status:draft  ·  plan:<planId>  ·  order:<N>  ·  <project>
```

---

### For single tasks (loose pages — created manually, no chapter)

Single tasks don't need a plan reference or dependency fields. Use this simpler template:

```markdown
# [Task title]

## Description
[What needs to be done]

## Affected apps
- api / web / both

## Acceptance criteria
- [ ] [Criterion]

## Do not touch
- [Protected areas if any]

## Notes
[Any context the agent should know]
```

**Tags applied to single task pages:**
```
agent:task  ·  status:pending  ·  <project>
```

Note: single tasks are created as `status:pending` directly — no draft state needed since there's no plan to review.

---

## 23. Dependency tracking

### Design decision: soft dependencies with warnings

Dependencies are tracked via the `dependsOn` field in the task page content and the `order:N` tag. They are **informational, not enforced** — the agent warns but does not block.

### How it works

When `begin_task` receives a `bookstackTaskPageId`, it:

1. Fetches the task page content
2. Parses the `dependsOn` field
3. If the prerequisite task exists and is not `status:done`, surfaces a warning:

```
⚠ Dependency warning: this task depends on "Create products DrizzleORM schema"
which has status:pending (not done). Proceeding may cause failures if the schema
doesn't exist yet. Ask the user whether to proceed.
```

4. The user decides — not the agent

### Why not hard blocking

Hard blocks require a graph solver, cycle detection, and an understanding of partial completion. For a solo developer running tasks sequentially, a warning is sufficient — you know the context, you can override when you know the dependency is already satisfied through other work. Complexity without utility.

---

## 24. Updated `begin_task` — dependency awareness

### Changes to `begin_task` handler

- [ ] When `bookstackTaskPageId` is provided, fetch and parse the task page:

```typescript
let dependencyWarning = ''

if (bookstackTaskPageId) {
  const taskPage = await fetchBookStackPage({ pageId: bookstackTaskPageId })

  // Check status — refuse draft, refuse done
  if (taskPage.tags.includes('status:draft')) {
    return { content: [{ type: 'text', text:
      `❌ Cannot execute task "${taskPage.title}" — it has status:draft.\n` +
      `The user must review and approve it first by changing the tag to status:pending in BookStack.`
    }] }
  }

  if (taskPage.tags.includes('status:done')) {
    return { content: [{ type: 'text', text:
      `❌ Task "${taskPage.title}" is already done. To re-run it, change the status tag to status:pending in BookStack.`
    }] }
  }

  // Parse dependsOn from content
  const dependsOnMatch = taskPage.content.match(/dependsOn:\s*(.+)/i)
  const dependsOn = dependsOnMatch?.[1]?.trim()

  if (dependsOn && dependsOn !== 'none') {
    // Search for the dependency task page
    const depResults = await searchBookStack({ query: dependsOn, tags: ['agent:task'], limit: 1 })
    if (depResults.length > 0) {
      const depPage = await fetchBookStackPage({ pageId: depResults[0].pageId })
      const depDone = depPage.tags.includes('status:done')
      if (!depDone) {
        dependencyWarning = `\n## ⚠ Dependency warning\nThis task depends on "${dependsOn}" which has not completed yet (status: ${depPage.tags.find(t => t.startsWith('status:'))?.replace('status:', '') ?? 'unknown'}).\nProceeding may cause failures. Ask the user whether to continue.\n`
      }
    }
  }
}
```

- [ ] Insert `${dependencyWarning}` into the workflow template after the health section

---

## 25. Updated `list_bookstack_tasks` — ordering and dependencies

### Changes to `router.ts`

- [ ] Update `list_bookstack_tasks` to sort by `order:N` tag and include dependency info:

```typescript
server.tool(
  'list_bookstack_tasks',
  'List agent:task pages for a project. Tasks are sorted by order tag. '
  + 'Shows status, dependencies, and plan grouping. Use this to discover '
  + 'pending tasks or review a plan\'s execution progress.',
  {
    project: z.enum(['boffmedia', 'smartrotom']),
    status: z.enum(['draft', 'pending', 'in-progress', 'done', 'all']).optional().default('all'),
    planId: z.string().optional().describe('Filter by plan ID to see only tasks from a specific plan')
  },
  async ({ project, status, planId }) => {
    const result = await listBookStackTasks({ project, status, planId })
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)
```

- [ ] Update `listBookStackTasks` implementation in `src/tools/bookstack.ts`:
  - [ ] Support `planId` filter via `plan:<planId>` tag
  - [ ] Sort results by `order:N` tag numerically
  - [ ] Include dependency status in each result

---

# Part 3 — Implementation

---

## 26. Implementation checklist

Build in this order. Each phase is independently useful.

### Phase A — Critical workflow fixes (do first)

- [ ] A1: `runId` slug fix (section 4) — trivial, prevents edge case bugs
- [ ] A2: history format fix (section 5) — token savings, cleaner context
- [ ] A3: health check + baseline in `begin_task` (section 1) — core safety
- [ ] A4: rollback instruction in workflow (section 2) — prevents dirty state
- [ ] A5: environment setup step (section 3) — decide option A or B, implement
- [ ] A6: guardrails re-check wording (section 7) — trivial wording change
- [ ] A7: Playwright condition made explicit (section 6) — clarity
- [ ] A8: git error handling (section 15) — prevents stuck states

After Phase A: **the core task workflow is robust.** Test by running a full task end-to-end.

### Phase B — Tool-level fixes

- [ ] B1: `sync_openapi_docs` remove `bookId` from caller (section 8) — clean API
- [ ] B2: `sync_conventions` handle SmartRotom (section 9) — completeness
- [ ] B3: `write_adr` include branch link (section 13) — traceability
- [ ] B4: `check_performance_regression` in workflow (section 10) — observability
- [ ] B5: non-fatal sync failures (section 14) — resilience
- [ ] B6: `create_gitlab_mr` prohibition hardened (section 11) — safety
- [ ] B7: BookStack structure tools marked setup-only (section 12) — clarity
- [ ] B8: ADR trigger examples (section 17) — explicitness
- [ ] B9: context staleness warning (section 16) — awareness

After Phase B: **all tools behave correctly.** Assemble the updated workflow template (section 18).

### Phase C — Updated workflow template

- [ ] C1: Replace the workflow template in `begin_task` with the version from section 18
- [ ] C2: Full end-to-end test: `begin_task` → code change → verification → commit
- [ ] C3: Test failure path: deliberately fail verification → confirm rollback + save_run(failed)
- [ ] C4: Test health warning: stop API container → `begin_task` → confirm health warning shown
- [ ] C5: Test performance regression: introduce a slow query → confirm regression surfaced

After Phase C: **the corrected workflow is live and tested.**

### Phase D — Planning mode

- [ ] D1: Add `AGENT_TASK_BOOK_IDS` to `agent.config.ts`
- [ ] D2: Add `status:draft` to the status tag vocabulary in `updateTaskStatus`
- [ ] D3: Register `plan_goal` tool in `router.ts` — with chapter creation logic (section 21)
- [ ] D4: Update `begin_task` with draft/done guards + dependency check (section 24)
- [ ] D5: Update `list_bookstack_tasks` with `planId` filter, chapter grouping, and ordering (section 25)
- [ ] D6: Test: call `plan_goal` with a multi-step goal
  - [ ] Confirm: a chapter is created in BookStack with name `YYYY-MM-DD — <goal>`
  - [ ] Confirm: all draft task pages are inside the chapter, not loose in the book
  - [ ] Confirm: pages are tagged `agent:task`, `status:draft`, `plan:<planId>`, `order:N`
- [ ] D7: Test: create a single task manually as a loose page (no chapter)
  - [ ] Confirm: it appears under `standalone` in `list_bookstack_tasks`, not inside a plan
- [ ] D8: Test: try to `begin_task` on a `status:draft` page → confirm refusal with clear message
- [ ] D9: Test: try to `begin_task` on a `status:done` page → confirm refusal
- [ ] D10: Test: approve a draft by changing tag to `status:pending` → confirm `begin_task` executes
- [ ] D11: Test: `begin_task` on a task whose dependency is `status:pending` → confirm warning shown
- [ ] D12: Test: `begin_task` on a task whose dependency is `status:done` → no warning, executes cleanly
- [ ] D13: Test: `list_bookstack_tasks` returns correct grouped structure — plans with chapters, standalone separate
- [ ] D14: Test: full plan lifecycle end-to-end:
  - [ ] `plan_goal` creates chapter + draft pages
  - [ ] Review chapter in BookStack UI — chapter visible, all pages inside it
  - [ ] Approve task 1 (draft → pending), execute with `begin_task` → passes
  - [ ] Approve task 2 (draft → pending), execute with `begin_task` → dependency warning (task 1 done) → passes
  - [ ] Confirm: all task pages end up `status:done` inside the chapter

After Phase D: **planning mode is operational.**

### Validation — complete workflow

- [ ] Plan a multi-task goal: "add a friends system to SmartRotom"
- [ ] Confirm: `plan_goal` creates a chapter `YYYY-MM-DD — Add a friends system to SmartRotom`
- [ ] Confirm: 3–5 draft task pages inside the chapter, ordered correctly
- [ ] Confirm: loose single task pages remain loose — not moved into the chapter
- [ ] Approve tasks one at a time (draft → pending)
- [ ] Execute each with `begin_task` — confirm dependency warnings appear correctly
- [ ] Each task follows the corrected workflow: health check → guardrails → code → env reset → verification → rollback on failure → playwright (if UI) → regression check → ADR if structural → OpenAPI sync → push → save_run
- [ ] Final state: all chapter pages are `status:done`, chapter is a complete plan history
- [ ] `list_bookstack_tasks` shows the chapter correctly grouped with all tasks done
