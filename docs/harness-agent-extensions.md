# Harness Agent — v1 Extensions

> **Prerequisite**: `harness-agent-implementation-plan.md` (v1) must be fully implemented before starting this document.  
> **What this adds**: new MCP tools and background services that integrate the agent with BookStack, GitLab, Grafana, and OpenAPI. The existing tool layer is extended, never replaced.  
> **What does NOT change**: all v1 tools remain intact. Extensions are purely additive — new tools registered in `router.ts`, new shell scripts, new memory tables.  
> **Last updated**: 2026-05-15

---

## Philosophy

Each extension follows the same pattern as v1: a pure TypeScript tool function in `src/tools/`, registered as an MCP tool in `router.ts`, backed by shell scripts where infrastructure operations are needed. Opencode calls them the same way it calls any v1 tool.

Extensions are grouped into four integration areas:

1. **BookStack** — knowledge base as input, context, and output
2. **GitLab** — full git hosting lifecycle (MRs, issues, pipeline status, mirroring)
3. **Grafana** — observability integrated into the development loop
4. **OpenAPI** — self-maintaining API documentation

---

## Progress checklist

> This checklist is the source of truth for implementation progress. Update it as each item is completed. Items are ordered to match the implementation order in section 11 — complete them top to bottom within each phase.  
> **Status markers**: ` ` = not started · `x` = complete · `~` = in progress · `!` = blocked

---

### Prerequisites

- [x] v1 MCP server fully implemented and connected to Opencode
- [x] `BOOKSTACK_URL` and `BOOKSTACK_TOKEN` set in `.env.agent`
- [x] `GITLAB_URL`, `GITLAB_TOKEN`, and `GITLAB_PROJECT_ID` set in `.env.agent`
- [x] `PROMETHEUS_URL` set in `.env.agent`
- [x] `API_BASE_URL` set in `.env.agent`
- [x] `GITHUB_REMOTE_URL` set in `.env.agent` (optional — required for E9 only)
- [x] BookStack structure created manually (shelves, books, chapters — see section 6)
- [x] All existing BookStack pages tagged with `agent:readonly` where appropriate
- [x] `agent:task` template created in BookStack

---

### E1 — BookStack client + `fetch_bookstack_page`

- [x] Create `src/tools/bookstack.ts` with `bsGet`, `bsPost`, `bsPut` client functions
- [x] Implement `fetchBookStackPage` — fetch by page ID
- [x] Implement `fetchBookStackPage` — resolve URL to page ID
- [x] Implement `htmlToMarkdown` converter for pages without markdown source
- [x] Register `fetch_bookstack_page` MCP tool in `router.ts`
- [x] Test: Opencode calls `agent:fetch_bookstack_page` and returns correct title + content
- [x] Test: URL resolution works for a real BookStack page URL

---

### E2 — `search_bookstack` + context resolver extension

- [x] Implement `searchBookStack` with query + tag filter support
- [x] Register `search_bookstack` MCP tool in `router.ts`
- [x] Extend `src/tools/context.ts` to call `searchBookStack` alongside file resolution
- [x] Implement project tag inference from task description (`boffmedia` vs `smartrotom`)
- [x] Implement full page fetch for top 3 BookStack results
- [x] Add `bookstackPages` field to `ResolvedContext` type in `src/shared/types.ts`
- [x] Test: `resolve_context` returns BookStack pages alongside code files
- [x] Test: tag inference correctly identifies project from task description

---

### E3 — `write_bookstack_page` + changelog writing

- [x] Implement `writeBookStackPage` with create and update paths
- [x] Implement `agent:readonly` tag guardrail — throw on protected pages
- [x] Register `write_bookstack_page` MCP tool in `router.ts`
- [x] Implement `writeChangelog` helper — builds changelog entry markdown from run data
- [x] Identify changelog page IDs for Boffmedia and SmartRotom shelves
- [x] Store changelog page IDs in `agent.config.ts`
- [ ] Test: changelog entry written correctly after a successful run
- [x] Test: writing to an `agent:readonly` page throws and does not modify the page

---

### E4 — `list_bookstack_tasks`

- [x] Implement `listBookStackTasks` with project + status filter
- [x] Register `list_bookstack_tasks` MCP tool in `router.ts`
- [x] Define and document `status:pending`, `status:in-progress`, `status:done` tag convention
- [x] Test: returns only pages tagged `agent:task` + the given project tag
- [x] Test: status filter works correctly

---

### E5 — ADR generation + conventions sync

- [ ] Define ADR page template in BookStack (title format, required sections)
- [x] Implement `writeAdr` helper — detects structural decisions from generation plan
- [ ] Implement structural decision detector — triggers on new module, new DB table, new service
- [x] Identify ADR chapter IDs for Boffmedia and SmartRotom
- [x] Store ADR chapter IDs in `agent.config.ts`
- [x] Implement `syncConventions` — reads `CONVENTIONS.md` and writes to BookStack conventions page
- [x] Identify conventions page IDs for both projects
- [ ] Register `write_bookstack_page` calls for ADR and conventions in the run completion flow
- [ ] Test: ADR created when run generates a new NestJS module
- [x] Test: conventions page updated after `CONVENTIONS.md` changes

---

### E6 — GitLab client + `create_gitlab_mr`

- [x] Create `src/tools/gitlab.ts` with `glGet`, `glPost` client functions
- [x] Implement `createGitLabMR` with generated description builder
- [x] Implement `buildMRDescription` — task spec + verification summary + trace path + BookStack link
- [x] Register `create_gitlab_mr` MCP tool in `router.ts`
- [ ] Add `agent-generated` label to GitLab project (Settings → Labels)
- [ ] Test: MR created with correct source branch, title, and description
- [ ] Test: MR description includes Playwright trace path when present
- [ ] Test: MR description includes BookStack spec link when page URL provided

---

### E7 — `create_gitlab_issue`

- [x] Implement `createGitLabIssue` with failure summary + failures array
- [x] Register `create_gitlab_issue` MCP tool in `router.ts`
- [ ] Add `agent-failed` and `needs-review` labels to GitLab project
- [ ] Test: issue created with correct title (`[Agent failed] ...`) and labels
- [ ] Test: issue description includes run ID and spec link

---

### E8 — `get_gitlab_pipeline_status` + `fetch_gitlab_issue`

- [x] Implement `getGitLabPipelineStatus` — fetch latest pipeline for a branch
- [x] Implement failed job name extraction from pipeline jobs endpoint
- [x] Register `get_gitlab_pipeline_status` MCP tool in `router.ts`
- [x] Implement `fetchGitLabIssue` — fetch issue by ID and return as task content
- [x] Register `fetch_gitlab_issue` MCP tool in `router.ts`
- [ ] Test: pipeline status returned correctly for a branch with a running pipeline
- [ ] Test: failed job names extracted correctly from a failed pipeline
- [ ] Test: GitLab issue fetched and content parseable as a task description

---

### E9 — `mirror.sh` + GitHub mirroring

- [x] Create `packages/agent/scripts/mirror.sh`
- [ ] Add `gitlab` and `github` remotes to the monorepo
- [x] Implement `push_mirrors` action in `src/tools/git.ts`
- [x] Register `git_operation` with `push_mirrors` action in `router.ts`
- [x] Make GitHub push non-fatal — log warning and continue on failure
- [ ] Test: successful run pushes branch to both GitLab and GitHub
- [ ] Test: GitHub push failure does not block or fail the run

---

### E10 — Prometheus client + `check_system_health`

- [x] Create Prometheus `promQuery` and `promQueryRange` functions in `src/tools/grafana.ts`
- [ ] Verify PromQL queries match your actual Prometheus metric names
- [ ] Adjust metric names in `checkSystemHealth` to match your Prometheus exporters
- [x] Implement `checkSystemHealth` with error rate, p95 latency, DB connection checks
- [x] Register `check_system_health` MCP tool in `router.ts`
- [x] Test: health check returns `safe: true` on a healthy system
- [ ] Test: health check returns correct warnings when thresholds are exceeded
- [ ] Test: Opencode surfaces warning and asks before proceeding when `safe: false`

---

### E11 — `capture_metrics_baseline` + `check_performance_regression`

- [x] Add `metrics_snapshots` table to DrizzleORM schema in `src/memory/schema.ts`
- [ ] Run migration to create `metrics_snapshots` table in `agent_memory` DB
- [x] Implement `captureMetricsBaseline` — snapshot four metrics before run
- [x] Implement `checkPerformanceRegression` — compare before/after snapshots
- [ ] Tune regression thresholds to match your system's normal variance
- [x] Register `capture_metrics_baseline` MCP tool in `router.ts`
- [x] Register `check_performance_regression` MCP tool in `router.ts`
- [ ] Test: baseline snapshot written to DB before a run
- [ ] Test: after snapshot written to DB after a run
- [ ] Test: regression detected and reported correctly when p95 latency increases significantly
- [ ] Test: no false positive regression on a clean run

---

### E12 — `get_error_context`

- [x] Implement `getErrorContext` with module and endpoint filter support
- [ ] Verify endpoint label names match your Prometheus HTTP metrics
- [x] Register `get_error_context` MCP tool in `router.ts`
- [ ] (Optional) Add Loki client if log aggregation is available — populate `recentErrors`
- [ ] Test: error rate returned for a specific endpoint
- [ ] Test: anomaly detection flags a spike correctly
- [ ] Test: Opencode injects error context before generating a bugfix

---

### E13 — OpenAPI spec extraction + `sync_openapi_docs`

- [ ] Verify `@nestjs/swagger` is installed and `/api-json` endpoint is active
- [x] Implement `syncOpenApiDocs` — fetch spec, filter by affected modules, build markdown
- [x] Implement `buildApiRefMarkdown` — parameters table, request body, responses
- [x] Implement `resolveSchema` — dereference `$ref` pointers from `components.schemas`
- [x] Identify API reference book IDs for Boffmedia and SmartRotom in BookStack
- [x] Store book IDs in `agent.config.ts`
- [x] Register `sync_openapi_docs` MCP tool in `router.ts`
- [ ] Test: API reference page created for a new module after a successful run
- [ ] Test: existing API reference page updated (not duplicated) on subsequent runs
- [ ] Test: pages tagged correctly (`api-reference`, `agent:generated`, project tag)

---

### E14 — Metrics as memory

- [x] Extend `getRunHistory` query to join `metrics_snapshots` and include performance deltas
- [x] Extend `get_run_history` MCP tool response to include `performanceDelta` field
- [x] Extend memory context builder in context resolver to include performance notes
- [ ] Test: run history includes performance delta for past runs
- [ ] Test: Opencode receives performance notes in context and references them in plan

---

### Validation — full end-to-end workflow

- [ ] Write a task spec page in BookStack (`agent:task`, `boffmedia`)
- [ ] Ask Opencode: "build the feature in BookStack page [ID]"
- [ ] Confirm: `check_system_health` runs first
- [ ] Confirm: `fetch_bookstack_page` fetches the spec correctly
- [ ] Confirm: `search_bookstack` injects relevant docs as context
- [ ] Confirm: `resolve_context` includes both code files and BookStack pages
- [ ] Confirm: `check_guardrails` runs before any file is written
- [ ] Confirm: `run_verification` passes
- [ ] Confirm: `run_playwright` captures trace and screenshots
- [ ] Confirm: `check_performance_regression` runs and reports delta
- [ ] Confirm: `sync_openapi_docs` updates API reference in BookStack
- [ ] Confirm: changelog entry written to BookStack
- [ ] Confirm: `create_gitlab_mr` creates MR with correct description
- [ ] Confirm: branch pushed to both GitLab and GitHub
- [ ] Confirm: `save_run` persists the run with branch and commit SHA

---

## Table of Contents

0. [Progress checklist](#progress-checklist)
1. [Updated package structure](#1-updated-package-structure)
2. [BookStack integration](#2-bookstack-integration)
3. [GitLab integration](#3-gitlab-integration)
4. [Grafana integration](#4-grafana-integration)
5. [OpenAPI → BookStack sync](#5-openapi--bookstack-sync)
6. [BookStack structure reference](#6-bookstack-structure-reference)
7. [Updated MCP tool reference](#7-updated-mcp-tool-reference)
8. [New environment variables](#8-new-environment-variables)
9. [New dependencies](#9-new-dependencies)
10. [Updated data models](#10-updated-data-models)
11. [Implementation order](#11-implementation-order)

---

## 1. Updated package structure

Extensions add the following files to `packages/agent/src/`. Everything else in v1 is unchanged.

```
packages/agent/src/
├── tools/
│   ├── ...existing v1 tools...
│   ├── bookstack.ts          ← BookStack REST API client + tool handlers
│   ├── gitlab.ts             ← GitLab REST API client + tool handlers
│   ├── grafana.ts            ← Grafana/Prometheus query tool handlers
│   └── openapi.ts            ← OpenAPI spec extraction + BookStack sync
├── memory/
│   └── schema.ts             ← extended with metrics_snapshots table
└── scripts/
    ├── ...existing v1 scripts...
    └── mirror.sh             ← push branch to GitHub mirror
```

`router.ts` is updated to register all new tools. No other v1 files change.

---

## 2. BookStack integration

BookStack has a clean REST API. All calls use a single API token stored in `BOOKSTACK_TOKEN`. The base URL points to your self-hosted instance.

### 2.1 BookStack client

```typescript
// src/tools/bookstack.ts
const BASE = process.env.BOOKSTACK_URL!
const HEADERS = {
  'Authorization': `Token ${process.env.BOOKSTACK_TOKEN}`,
  'Content-Type': 'application/json'
}

async function bsGet(path: string) {
  const r = await fetch(`${BASE}/api/${path}`, { headers: HEADERS })
  if (!r.ok) throw new Error(`BookStack GET ${path} failed: ${r.status}`)
  return r.json()
}

async function bsPost(path: string, body: object) {
  const r = await fetch(`${BASE}/api/${path}`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`BookStack POST ${path} failed: ${r.status}`)
  return r.json()
}

async function bsPut(path: string, body: object) {
  const r = await fetch(`${BASE}/api/${path}`, {
    method: 'PUT', headers: HEADERS, body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`BookStack PUT ${path} failed: ${r.status}`)
  return r.json()
}
```

### 2.2 Tool: `fetch_bookstack_page`

Fetches a BookStack page by ID or URL and returns its content as clean markdown. Used by Opencode to read a spec page as a task input.

```typescript
export async function fetchBookStackPage(input: {
  pageId?: number
  url?: string
}): Promise<{ title: string; content: string; tags: string[]; updatedAt: string }> {
  let id = input.pageId

  // Resolve URL to page ID if provided
  if (!id && input.url) {
    const slug = input.url.split('/').pop()
    const results = await bsGet(`pages?filter[slug]=${slug}`)
    id = results.data[0]?.id
    if (!id) throw new Error(`No BookStack page found for URL: ${input.url}`)
  }

  const page = await bsGet(`pages/${id}`)

  return {
    title: page.name,
    content: page.markdown || htmlToMarkdown(page.html),
    tags: page.tags?.map((t: any) => t.name) ?? [],
    updatedAt: page.updated_at
  }
}
```

**How Opencode uses this:**

```
You: "build the feature described at https://bookstack.yourdomain.com/books/boffmedia/page/pokemon-tracker-v2"
Opencode → agent:fetch_bookstack_page { url: "https://..." }
→ returns TaskSpec-ready content
→ Opencode proceeds with the full run
```

### 2.3 Tool: `search_bookstack`

Searches BookStack by query string and optional tag filter. Used by `resolve_context` to inject relevant documentation alongside code files.

```typescript
export async function searchBookStack(input: {
  query: string
  tags?: string[]
  limit?: number
}): Promise<Array<{ pageId: number; title: string; excerpt: string; bookName: string }>> {
  const tag = input.tags?.map(t => `filter[tags]=${t}`).join('&') ?? ''
  const results = await bsGet(
    `search?query=${encodeURIComponent(input.query)}&count=${input.limit ?? 5}&${tag}`
  )

  return results.data.map((r: any) => ({
    pageId: r.id,
    title: r.name,
    excerpt: r.preview_html?.replace(/<[^>]+>/g, '').slice(0, 200),
    bookName: r.book_name
  }))
}
```

**Integration with `resolve_context`:**

The v1 context resolver is extended to also call `searchBookStack` with the task description and the relevant project tag (`boffmedia` or `smartrotom`). The top 3 BookStack results are injected as additional context alongside the code files. This gives the LLM access to your architecture decisions, conventions, and domain knowledge without you explicitly linking pages.

```typescript
// Extension to src/tools/context.ts
const bookstackResults = await searchBookStack({
  query: taskDescription,
  tags: [inferProjectTag(taskDescription)],
  limit: 3
})

// Each result fetched in full and appended to context.files
for (const result of bookstackResults) {
  const page = await fetchBookStackPage({ pageId: result.pageId })
  context.bookstackPages.push(page)
}
```

### 2.4 Tool: `write_bookstack_page`

Creates or updates a BookStack page. Used by the agent after successful runs to write documentation. Never called on pages tagged `agent:readonly` — those are yours alone.

```typescript
export async function writeBookStackPage(input: {
  bookId: number
  chapterId?: number
  pageId?: number       // if provided, updates existing page
  title: string
  content: string       // markdown
  tags?: string[]
}): Promise<{ pageId: number; url: string }> {
  // Guardrail: never overwrite readonly pages
  if (input.pageId) {
    const existing = await bsGet(`pages/${input.pageId}`)
    const isReadonly = existing.tags?.some((t: any) => t.name === 'agent:readonly')
    if (isReadonly) throw new Error(`Page ${input.pageId} is tagged agent:readonly — cannot overwrite`)
  }

  const body = {
    book_id: input.bookId,
    chapter_id: input.chapterId,
    name: input.title,
    markdown: input.content,
    tags: input.tags?.map(name => ({ name })) ?? []
  }

  const result = input.pageId
    ? await bsPut(`pages/${input.pageId}`, body)
    : await bsPost('pages', body)

  return { pageId: result.id, url: result.url }
}
```

### 2.5 What gets written automatically (🤖 pages)

After every successful agent run, the following pages are created or updated:

**API reference page** — one page per NestJS module touched by the run. Content is generated from the OpenAPI spec (see section 5). Tagged `agent:generated`, `api-reference`, and the project tag.

**Changelog entry** — appended to the project's Changelog page. Format:

```markdown
## 2026-05-15 — feat: add GET /products endpoint

**Branch**: agent/add-get-products-endpoint-1716000000  
**Commit**: abc1234  
**Run ID**: 9b1e4f2a  
**Verification**: lint ✔ · jest ✔ · playwright ✔  

Added paginated product listing endpoint with category filtering.
Created: `products.controller.ts`, `products.service.ts`, `products.entity.ts`
```

**ADR page** — created when the run involves a structural decision (new module, new DB table, new service boundary). The LLM generates a short ADR from the plan and writes it to the ADRs chapter. Tagged `adr`, `agent:generated`.

**Conventions page** — the agent reads `CONVENTIONS.md` from the repo and syncs it to the BookStack conventions page on every run. Ensures your BookStack always reflects the current repo state.

### 2.6 Tag conventions

Tags are how the agent navigates BookStack. These are standardised from day one:

| Tag | Meaning |
|---|---|
| `boffmedia` | Belongs to the Boffmedia project |
| `smartrotom` | Belongs to the SmartRotom project |
| `infrastructure` | Belongs to the shared infrastructure shelf |
| `agent:generated` | Written by the agent — safe to overwrite |
| `agent:readonly` | Never touched by the agent — yours only |
| `agent:task` | A spec page the agent reads as task input |
| `adr` | Architecture decision record |
| `api-reference` | Auto-generated API documentation |
| `changelog` | Changelog page |
| `conventions` | Coding conventions |

### 2.7 The `agent:task` page template

Every task spec page you write in BookStack should follow this template so the parser can extract a clean `TaskSpec`. Create a BookStack template for it:

```markdown
# [Task title]

## Description
[What needs to be built or changed]

## Affected apps
- api
- web

## Acceptance criteria
- [Criterion 1]
- [Criterion 2]

## Do not touch
- [Protected area 1]

## Context links
- [Link to relevant architecture page]
- [Link to relevant API page]
```

Tag every task page with `agent:task` and the relevant project tag (`boffmedia` or `smartrotom`). The agent's `fetch_bookstack_page` tool looks for these tags when searching for tasks.

### 2.8 Tool: `list_bookstack_tasks`

Lists all pending task pages tagged `agent:task` for a given project. Used when Opencode needs to pick the next task from the queue without you specifying a page.

```typescript
export async function listBookStackTasks(input: {
  project: 'boffmedia' | 'smartrotom'
  status?: 'pending' | 'in-progress' | 'done'
}): Promise<Array<{ pageId: number; title: string; tags: string[]; url: string }>> {
  const results = await bsGet(
    `pages?filter[tags]=agent:task&filter[tags]=${input.project}&count=20`
  )
  return results.data
    .filter((p: any) => !input.status || p.tags.some((t: any) => t.name === `status:${input.status}`))
    .map((p: any) => ({ pageId: p.id, title: p.name, tags: p.tags.map((t: any) => t.name), url: p.url }))
}
```

---

## 3. GitLab integration

All GitLab operations use the REST API v4 with a personal access token. The base URL points to your self-hosted GitLab instance.

### 3.1 GitLab client

```typescript
// src/tools/gitlab.ts
const GL_BASE = `${process.env.GITLAB_URL}/api/v4`
const GL_HEADERS = {
  'PRIVATE-TOKEN': process.env.GITLAB_TOKEN!,
  'Content-Type': 'application/json'
}
const PROJECT_ID = process.env.GITLAB_PROJECT_ID!

async function glGet(path: string) {
  const r = await fetch(`${GL_BASE}/${path}`, { headers: GL_HEADERS })
  if (!r.ok) throw new Error(`GitLab GET ${path} failed: ${r.status}`)
  return r.json()
}

async function glPost(path: string, body: object) {
  const r = await fetch(`${GL_BASE}/${path}`, {
    method: 'POST', headers: GL_HEADERS, body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`GitLab POST ${path} failed: ${r.status}`)
  return r.json()
}
```

### 3.2 Tool: `create_gitlab_mr`

Creates a merge request after a successful agent run. The description is generated from the task spec, verification results, and Playwright trace path.

```typescript
export async function createGitLabMR(input: {
  sourceBranch: string
  title: string
  taskSpec: string
  verificationSummary: string
  bookstackPageUrl?: string
  tracePath?: string
  runId: string
}): Promise<{ mrId: number; mrUrl: string }> {
  const description = buildMRDescription(input)

  const mr = await glPost(`projects/${PROJECT_ID}/merge_requests`, {
    source_branch: input.sourceBranch,
    target_branch: process.env.GITLAB_DEFAULT_BRANCH ?? 'main',
    title: input.title,
    description,
    labels: ['agent-generated'],
    remove_source_branch: false   // keep branch for trace/screenshot access
  })

  return { mrId: mr.iid, mrUrl: mr.web_url }
}

function buildMRDescription(input: Parameters<typeof createGitLabMR>[0]): string {
  return `## Summary
${input.taskSpec}

## Verification
${input.verificationSummary}

${input.tracePath ? `## Visual review\n\`\`\`\nnpx playwright show-trace ${input.tracePath}\n\`\`\`\n` : ''}
${input.bookstackPageUrl ? `## Spec\n[BookStack task page](${input.bookstackPageUrl})\n` : ''}
---
*Generated by harness agent · Run ID: \`${input.runId}\`*`
}
```

**Full commit gate flow with MR creation:**

```
✔ All verification passed
✔ Playwright trace captured

  View trace: npx playwright show-trace .agent-runs/abc123/trace.zip

  Creating MR on GitLab...
  ✔ MR created: https://gitlab.yourdomain.com/you/project/-/merge_requests/42

  Commit and push to GitLab? (y/N)
```

### 3.3 Tool: `create_gitlab_issue`

Creates a GitLab issue when an agent run fails after max retries. Captures the failure summary, run ID, and links back to the task spec.

```typescript
export async function createGitLabIssue(input: {
  title: string
  failureSummary: string
  failures: string[]
  runId: string
  bookstackPageUrl?: string
}): Promise<{ issueId: number; issueUrl: string }> {
  const description = `## What the agent tried
${input.title}

## Why it failed
${input.failureSummary}

## Failure details
${input.failures.map(f => `- ${f}`).join('\n')}

${input.bookstackPageUrl ? `## Spec\n[BookStack task page](${input.bookstackPageUrl})\n` : ''}
---
*Created by harness agent · Run ID: \`${input.runId}\` · Needs human review*`

  const issue = await glPost(`projects/${PROJECT_ID}/issues`, {
    title: `[Agent failed] ${input.title}`,
    description,
    labels: ['agent-failed', 'needs-review']
  })

  return { issueId: issue.iid, issueUrl: issue.web_url }
}
```

After max retries the orchestrator (or Opencode) calls this automatically — you get a structured GitLab issue ready to turn into a manual fix task.

### 3.4 Tool: `get_gitlab_pipeline_status`

Polls the GitLab CI pipeline for the agent's branch and returns its status. Opencode can call this after pushing to give you CI feedback before reviewing the MR.

```typescript
export async function getGitLabPipelineStatus(input: {
  branch: string
}): Promise<{
  status: 'running' | 'success' | 'failed' | 'canceled' | 'pending' | 'none'
  pipelineUrl?: string
  failedJobs: string[]
}> {
  const pipelines = await glGet(
    `projects/${PROJECT_ID}/pipelines?ref=${encodeURIComponent(input.branch)}&per_page=1`
  )

  if (!pipelines.length) return { status: 'none', failedJobs: [] }

  const pipeline = pipelines[0]
  const jobs = await glGet(`projects/${PROJECT_ID}/pipelines/${pipeline.id}/jobs`)
  const failedJobs = jobs
    .filter((j: any) => j.status === 'failed')
    .map((j: any) => j.name)

  return {
    status: pipeline.status,
    pipelineUrl: pipeline.web_url,
    failedJobs
  }
}
```

### 3.5 GitHub mirror (`mirror.sh`)

Since you push to GitHub as a secondary remote, a shell script handles mirroring after a successful GitLab push. Called by the `git_operation` tool when `action: 'push_mirrors'`.

```bash
#!/usr/bin/env bash
set -euo pipefail
BRANCH=${1}

# Push to GitLab (primary)
git push gitlab "$BRANCH"

# Push to GitHub (mirror) — non-fatal if it fails
git push github "$BRANCH" || echo "⚠ GitHub mirror push failed — continuing"
```

Add both remotes to the repo once:

```bash
git remote add gitlab https://gitlab.yourdomain.com/you/project.git
git remote add github https://github.com/you/project.git
```

The agent always pushes to GitLab first. GitHub is a best-effort mirror — a failure there does not block the run.

### 3.6 GitLab Issues as task tracker

Since you're using GitLab Issues (zero new infrastructure), the agent can also read open issues as task inputs. The `fetch_gitlab_issue` tool fetches an issue and converts it to a `TaskSpec`:

```typescript
export async function fetchGitLabIssue(input: {
  issueId: number
}): Promise<{ title: string; content: string; labels: string[] }> {
  const issue = await glGet(`projects/${PROJECT_ID}/issues/${input.issueId}`)
  return {
    title: issue.title,
    content: issue.description ?? '',
    labels: issue.labels
  }
}
```

**Usage:**

```
You: "work on GitLab issue #47"
Opencode → agent:fetch_gitlab_issue { issueId: 47 }
→ returns title + description as task content
→ Opencode runs the full workflow
→ agent:create_gitlab_mr links back to issue #47 in the MR description
```

---

## 4. Grafana integration

Grafana exposes a REST API for querying dashboards and panels. For metric queries, the agent talks directly to Prometheus (or your configured data source) using PromQL — Grafana is the reference for which queries matter, Prometheus is the data source.

### 4.1 Prometheus client

```typescript
// src/tools/grafana.ts
const PROM_BASE = process.env.PROMETHEUS_URL!

async function promQuery(query: string, time?: number): Promise<number | null> {
  const t = time ?? Math.floor(Date.now() / 1000)
  const url = `${PROM_BASE}/api/v1/query?query=${encodeURIComponent(query)}&time=${t}`
  const r = await fetch(url)
  const data = await r.json()
  const value = data?.data?.result?.[0]?.value?.[1]
  return value != null ? parseFloat(value) : null
}

async function promQueryRange(
  query: string,
  startMs: number,
  endMs: number,
  step = '60s'
): Promise<Array<[number, number]>> {
  const url = `${PROM_BASE}/api/v1/query_range` +
    `?query=${encodeURIComponent(query)}` +
    `&start=${startMs / 1000}&end=${endMs / 1000}&step=${step}`
  const r = await fetch(url)
  const data = await r.json()
  return data?.data?.result?.[0]?.values?.map(([t, v]: [number, string]) =>
    [t * 1000, parseFloat(v)]
  ) ?? []
}
```

### 4.2 Tool: `check_system_health`

Called before any agent run starts. Returns a health summary and a `safe` flag. If `safe` is false, Opencode surfaces the warning before proceeding.

```typescript
interface HealthResult {
  safe: boolean
  warnings: string[]
  metrics: {
    apiErrorRate: number | null
    apiP95LatencyMs: number | null
    dbConnectionsActive: number | null
    dbConnectionsMax: number | null
  }
}

export async function checkSystemHealth(): Promise<HealthResult> {
  const [errorRate, p95, dbActive, dbMax] = await Promise.all([
    promQuery('rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])'),
    promQuery('histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))'),
    promQuery('mysql_global_status_threads_connected'),
    promQuery('mysql_global_variables_max_connections')
  ])

  const warnings: string[] = []

  if (errorRate != null && errorRate > 0.01)
    warnings.push(`API error rate elevated: ${(errorRate * 100).toFixed(1)}% (threshold: 1%)`)

  if (p95 != null && p95 > 500)
    warnings.push(`API p95 latency high: ${p95.toFixed(0)}ms (threshold: 500ms)`)

  if (dbActive != null && dbMax != null && dbActive / dbMax > 0.8)
    warnings.push(`DB connections at ${Math.round(dbActive / dbMax * 100)}% capacity`)

  return {
    safe: warnings.length === 0,
    warnings,
    metrics: {
      apiErrorRate: errorRate,
      apiP95LatencyMs: p95,
      dbConnectionsActive: dbActive,
      dbConnectionsMax: dbMax
    }
  }
}
```

**Opencode usage pattern:**

```
Opencode → agent:check_system_health
→ { safe: false, warnings: ["API error rate elevated: 4.2%"] }
→ Opencode: "⚠ System health check failed. API error rate is 4.2% (threshold: 1%).
             Investigate existing errors before adding new features.
             Proceed anyway? (y/N)"
```

### 4.3 Tool: `capture_metrics_baseline`

Captures current metric values before a run starts. Stored in the `metrics_snapshots` table (see data models). Used for regression comparison after the run.

```typescript
export async function captureMetricsBaseline(input: {
  runId: string
  endpoints?: string[]
}): Promise<MetricsSnapshot> {
  const now = Date.now()

  const snapshot: MetricsSnapshot = {
    runId: input.runId,
    capturedAt: new Date(),
    phase: 'before',
    apiErrorRate: await promQuery('rate(http_requests_total{status=~"5.."}[5m])'),
    apiP95LatencyMs: await promQuery('histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))'),
    dbQueriesPerRequest: await promQuery('rate(mysql_global_status_questions[5m]) / rate(http_requests_total[5m])'),
    memoryUsageMb: await promQuery('process_resident_memory_bytes{job="api"} / 1024 / 1024')
  }

  await db.insert(metricsSnapshots).values(snapshot)
  return snapshot
}
```

### 4.4 Tool: `check_performance_regression`

Compares current metrics against the pre-run baseline. Returns a regression report surfaced at the commit gate alongside the Playwright trace.

```typescript
export async function checkPerformanceRegression(input: {
  runId: string
}): Promise<{
  hasRegression: boolean
  regressions: Array<{ metric: string; before: number; after: number; deltaPercent: number }>
}> {
  const [before] = await db
    .select()
    .from(metricsSnapshots)
    .where(and(eq(metricsSnapshots.runId, input.runId), eq(metricsSnapshots.phase, 'before')))

  if (!before) return { hasRegression: false, regressions: [] }

  const after: MetricsSnapshot = {
    runId: input.runId,
    capturedAt: new Date(),
    phase: 'after',
    apiErrorRate: await promQuery('rate(http_requests_total{status=~"5.."}[5m])'),
    apiP95LatencyMs: await promQuery('histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))'),
    dbQueriesPerRequest: await promQuery('rate(mysql_global_status_questions[5m]) / rate(http_requests_total[5m])'),
    memoryUsageMb: await promQuery('process_resident_memory_bytes{job="api"} / 1024 / 1024')
  }

  await db.insert(metricsSnapshots).values(after)

  const THRESHOLDS: Record<string, number> = {
    apiP95LatencyMs: 0.2,    // 20% increase triggers warning
    dbQueriesPerRequest: 0.5, // 50% increase triggers warning
    memoryUsageMb: 0.3,       // 30% increase triggers warning
    apiErrorRate: 0.005        // absolute threshold: 0.5% new errors
  }

  const regressions = []

  for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
    const b = (before as any)[metric]
    const a = (after as any)[metric]
    if (b == null || a == null || b === 0) continue

    const delta = (a - b) / b
    if (delta > threshold) {
      regressions.push({
        metric,
        before: b,
        after: a,
        deltaPercent: Math.round(delta * 100)
      })
    }
  }

  return { hasRegression: regressions.length > 0, regressions }
}
```

**What Opencode shows at the commit gate:**

```
✔ Verification passed
✔ Playwright: 3/3 passed

⚠ Performance regression detected:
  apiP95LatencyMs     120ms → 380ms  (+217%)
  dbQueriesPerRequest 2.1   → 8.4    (+300%)

  View trace: npx playwright show-trace .agent-runs/abc123/trace.zip

  Commit anyway? (y/N)
```

### 4.5 Tool: `get_error_context`

Fetches recent error logs and metric anomalies for a specific module or endpoint. Called before bugfix tasks to give the LLM real production context.

```typescript
export async function getErrorContext(input: {
  module?: string
  endpoint?: string
  windowMinutes?: number
}): Promise<{
  errorRate: number | null
  recentErrors: Array<{ timestamp: number; message: string; count: number }>
  anomalyDetected: boolean
}> {
  const window = input.windowMinutes ?? 60
  const endMs = Date.now()
  const startMs = endMs - window * 60 * 1000

  // Error rate for the specific endpoint/module
  const query = input.endpoint
    ? `rate(http_requests_total{route="${input.endpoint}",status=~"5.."}[${window}m])`
    : `rate(http_requests_total{status=~"5.."}[${window}m])`

  const errorRate = await promQuery(query)

  // Spike detection — compare last 5min to last hour average
  const recentRate = await promQuery(query.replace(`[${window}m]`, '[5m]'))
  const anomalyDetected = recentRate != null && errorRate != null
    ? recentRate > errorRate * 3
    : false

  // Note: actual log fetching requires Loki or a log aggregator.
  // If you're using Loki, add promQuery-equivalent calls here.
  // Without Loki, return empty recentErrors and rely on errorRate alone.
  return {
    errorRate,
    recentErrors: [],  // extend with Loki queries when available
    anomalyDetected
  }
}
```

### 4.6 Metrics as memory

After each run, the regression report is stored in `metrics_snapshots` (see data models). The `get_run_history` tool is extended to include performance deltas in its output, so future runs on the same module carry forward performance context:

```
Previous similar tasks:
- "add GET /products endpoint" → PASSED.
  Performance: p95 latency +12% (acceptable), DB queries unchanged.
- "add POST /orders endpoint" → PASSED on attempt 2.
  Note: first attempt introduced N+1 query — watch for eager loading issues in DrizzleORM.
```

---

## 5. OpenAPI → BookStack sync

NestJS with `@nestjs/swagger` generates an OpenAPI spec at `/api-json`. The agent fetches this after every successful run and syncs the affected endpoint documentation to BookStack.

### 5.1 Tool: `sync_openapi_docs`

```typescript
// src/tools/openapi.ts
export async function syncOpenApiDocs(input: {
  runId: string
  affectedModules: string[]
  bookId: number              // BookStack book ID for the API reference chapter
  project: 'boffmedia' | 'smartrotom'
}): Promise<{ pagesUpdated: string[]; pagesCreated: string[] }> {
  // Fetch current OpenAPI spec from running NestJS app
  const specUrl = `${process.env.API_BASE_URL}/api-json`
  const r = await fetch(specUrl)
  const spec = await r.json() as OpenAPISpec

  const pagesUpdated: string[] = []
  const pagesCreated: string[] = []

  for (const module of input.affectedModules) {
    // Find all paths belonging to this module (by tag)
    const paths = Object.entries(spec.paths).filter(([, ops]) =>
      Object.values(ops as object).some((op: any) =>
        op.tags?.some((t: string) => t.toLowerCase() === module.toLowerCase())
      )
    )

    if (!paths.length) continue

    const content = buildApiRefMarkdown(module, paths, spec.components)

    // Find existing page for this module
    const existing = await searchBookStack({
      query: `${module} API reference`,
      tags: [input.project, 'api-reference'],
      limit: 1
    })

    if (existing.length) {
      await writeBookStackPage({
        bookId: input.bookId,
        pageId: existing[0].pageId,
        title: `${module} — API reference`,
        content,
        tags: [input.project, 'api-reference', 'agent:generated']
      })
      pagesUpdated.push(module)
    } else {
      await writeBookStackPage({
        bookId: input.bookId,
        title: `${module} — API reference`,
        content,
        tags: [input.project, 'api-reference', 'agent:generated']
      })
      pagesCreated.push(module)
    }
  }

  return { pagesUpdated, pagesCreated }
}

function buildApiRefMarkdown(
  module: string,
  paths: [string, any][],
  components: any
): string {
  const lines = [`# ${module} API reference\n`, `> Auto-generated by harness agent. Do not edit manually.\n`]

  for (const [path, ops] of paths) {
    for (const [method, op] of Object.entries(ops as object) as [string, any][]) {
      lines.push(`## \`${method.toUpperCase()} ${path}\``)
      if (op.summary) lines.push(`\n${op.summary}`)
      if (op.description) lines.push(`\n${op.description}`)

      if (op.parameters?.length) {
        lines.push('\n**Parameters**\n')
        lines.push('| Name | In | Type | Required | Description |')
        lines.push('|---|---|---|---|---|')
        for (const p of op.parameters) {
          lines.push(`| \`${p.name}\` | ${p.in} | ${p.schema?.type ?? '—'} | ${p.required ? 'Yes' : 'No'} | ${p.description ?? '—'} |`)
        }
      }

      if (op.requestBody) {
        lines.push('\n**Request body**\n```json')
        lines.push(JSON.stringify(resolveSchema(op.requestBody, components), null, 2))
        lines.push('```')
      }

      lines.push('\n**Responses**\n')
      for (const [code, res] of Object.entries(op.responses ?? {}) as [string, any][]) {
        lines.push(`- \`${code}\` — ${res.description ?? ''}`)
      }

      lines.push('')
    }
  }

  return lines.join('\n')
}
```

### 5.2 When it runs

`sync_openapi_docs` is called automatically after every successful run that touches the NestJS API (`affectedApps` includes `api`). Opencode calls it as the last step before the commit gate:

```
✔ Verification passed
✔ Playwright passed
✔ OpenAPI docs synced (updated: products, created: —)

  View trace: npx playwright show-trace .agent-runs/abc123/trace.zip
  Commit? (y/N)
```

---

## 6. BookStack structure reference

The agreed structure for your instance. Use this when creating books and chapters manually before the agent starts writing pages.

```
📁 Infrastructure shelf
  📖 Harness Agent
      Architecture (agent:readonly · ✍)
      Tool reference (agent:generated · 🤖)
      Run history (agent:generated · 🤖)
      Conventions — Boffmedia monorepo (agent:generated · 🤖)
  📖 DevOps
      Docker setup — Boffmedia/SmartRotom (agent:readonly · ✍)
      GitLab pipelines (agent:readonly · ✍)
      Grafana dashboards (agent:readonly · ✍)
      Runbooks (agent:readonly · ✍)
  📖 Shared database
      Schema overview (agent:generated · 🤖)
      User relations — boffmedia_users ↔ rotom_users (agent:generated · 🤖)
      Migration log (agent:generated · 🤖)

📁 Boffmedia shelf
  📖 Technical
      Architecture (mixed · ✍ + 🤖)
      ADRs chapter (mixed · ✍ + 🤖)
      Changelog (agent:generated · 🤖)
  📖 API reference
      [one page per module — agent:generated · 🤖]
  📖 Gaming tools
      Pokémon tracker (agent:readonly · ✍)
      Damage calculator (agent:readonly · ✍)
      Monster Hunter build creator (agent:readonly · ✍)
  📖 Events & community
      Event scheduling (agent:readonly · ✍)
      Leaderboards (agent:readonly · ✍)
      Player profiles (agent:readonly · ✍)
      Tournaments — planned (agent:readonly · ✍)
  📖 Agent tasks
      [task spec pages — agent:task · ✍]

📁 SmartRotom shelf
  📖 Technical
      Architecture (mixed · ✍ + 🤖)
      Minecraft integration (agent:readonly · ✍)
      ADRs chapter (mixed · ✍ + 🤖)
      Changelog (agent:generated · 🤖)
  📖 API reference
      [one page per module — agent:generated · 🤖]
  📖 Apps
      Maps (agent:readonly · ✍)
      Bank (agent:readonly · ✍)
      Shop (agent:readonly · ✍)
      Pokémon PC box (agent:readonly · ✍)
      YouTube (agent:readonly · ✍)
      Minigames (agent:readonly · ✍)
  📖 Minecraft integration
      Plugin architecture (agent:readonly · ✍)
      Server events (agent:readonly · ✍)
      External browser flow (agent:readonly · ✍)
      Auth with Minecraft (agent:readonly · ✍)
  📖 Agent tasks
      [task spec pages — agent:task · ✍]
```

**Tag every page on creation.** The agent navigates entirely by tags — it never hardcodes book or chapter IDs. A page without the right tags is invisible to the agent.

---

## 7. Updated MCP tool reference

New tools added to `router.ts` alongside all existing v1 tools.

| Tool | Description | Key inputs | Key outputs |
|---|---|---|---|
| `fetch_bookstack_page` | Fetch a page by ID or URL | `pageId`, `url` | `title`, `content`, `tags` |
| `search_bookstack` | Search pages by query + tags | `query`, `tags`, `limit` | array of page summaries |
| `write_bookstack_page` | Create or update a page | `bookId`, `pageId?`, `title`, `content`, `tags` | `pageId`, `url` |
| `list_bookstack_tasks` | List agent:task pages for a project | `project`, `status` | array of task pages |
| `create_gitlab_mr` | Create a merge request | `sourceBranch`, `title`, `taskSpec`, `verificationSummary` | `mrId`, `mrUrl` |
| `create_gitlab_issue` | Create an issue on agent failure | `title`, `failureSummary`, `failures` | `issueId`, `issueUrl` |
| `get_gitlab_pipeline_status` | Poll CI pipeline for a branch | `branch` | `status`, `pipelineUrl`, `failedJobs` |
| `fetch_gitlab_issue` | Fetch an issue as task input | `issueId` | `title`, `content`, `labels` |
| `check_system_health` | Pre-task health check | — | `safe`, `warnings`, `metrics` |
| `capture_metrics_baseline` | Snapshot metrics before a run | `runId`, `endpoints?` | `MetricsSnapshot` |
| `check_performance_regression` | Compare metrics after a run | `runId` | `hasRegression`, `regressions[]` |
| `get_error_context` | Fetch error rates for a module | `module?`, `endpoint?`, `windowMinutes?` | `errorRate`, `anomalyDetected` |
| `sync_openapi_docs` | Sync NestJS OpenAPI spec to BookStack | `runId`, `affectedModules`, `bookId`, `project` | `pagesUpdated`, `pagesCreated` |

---

## 8. New environment variables

All v1 environment variables remain unchanged.

| Variable | Required | Description |
|---|---|---|
| `BOOKSTACK_URL` | Yes | Base URL of your BookStack instance (e.g. `https://docs.yourdomain.com`) |
| `BOOKSTACK_TOKEN` | Yes | BookStack API token (Settings → API Tokens) |
| `GITLAB_URL` | Yes | Base URL of your GitLab instance |
| `GITLAB_TOKEN` | Yes | GitLab personal access token (scopes: `api`, `write_repository`) |
| `GITLAB_PROJECT_ID` | Yes | Numeric project ID (Settings → General in GitLab) |
| `GITLAB_DEFAULT_BRANCH` | No | Default branch for MR target (default: `main`) |
| `GITHUB_REMOTE_URL` | No | GitHub remote URL for mirroring (optional — mirror.sh uses this) |
| `PROMETHEUS_URL` | Yes (Grafana) | Prometheus base URL (e.g. `http://prometheus:9090`) |
| `API_BASE_URL` | Yes (OpenAPI) | Running NestJS API base URL for spec fetching (e.g. `http://localhost:3000`) |

Store all in `.env.agent` (gitignored).

---

## 9. New dependencies

Add to `packages/agent/package.json`. All existing v1 dependencies remain.

| Package | Purpose |
|---|---|
| (none new required) | BookStack, GitLab, and Prometheus integrations use native `fetch` — no SDK needed. OpenAPI parsing uses plain JSON — no parser library needed. |

All four integrations are implemented with the Fetch API against REST endpoints. This keeps the dependency surface minimal and eliminates SDK version drift.

---

## 10. Updated data models

One new table added to the `agent_memory` MariaDB schema. All v1 tables unchanged.

### `metrics_snapshots`

| Column | Type | Notes |
|---|---|---|
| id | varchar(36) | UUID, PK |
| run_id | varchar(36) | FK → task_runs |
| captured_at | datetime | |
| phase | varchar(10) | `before` or `after` |
| api_error_rate | float | requests/sec with 5xx status |
| api_p95_latency_ms | float | p95 response time in milliseconds |
| db_queries_per_request | float | avg DB queries per HTTP request |
| memory_usage_mb | float | API process RSS in MB |

---

## 11. Implementation order

Build extensions in this order. Each phase is independently useful — stop at any point and the agent still works. Each phase maps directly to a checklist section above.

| Phase | Deliverable | Checklist section | Usable checkpoint |
|---|---|---|---|
| E1 | BookStack client + `fetch_bookstack_page` | [E1](#e1--bookstack-client--fetch_bookstack_page) | Opencode can read BookStack specs as task input |
| E2 | `search_bookstack` + context resolver extension | [E2](#e2--search_bookstack--context-resolver-extension) | Opencode gets BookStack pages injected as context |
| E3 | `write_bookstack_page` + changelog writing | [E3](#e3--write_bookstack_page--changelog-writing) | Agent writes changelog entries after successful runs |
| E4 | `list_bookstack_tasks` | [E4](#e4--list_bookstack_tasks) | Opencode can list and pick pending tasks from BookStack |
| E5 | ADR generation + conventions sync | [E5](#e5--adr-generation--conventions-sync) | Architecture decisions and conventions auto-documented |
| E6 | GitLab client + `create_gitlab_mr` | [E6](#e6--gitlab-client--create_gitlab_mr) | Agent creates MRs after successful runs |
| E7 | `create_gitlab_issue` | [E7](#e7--create_gitlab_issue) | Failed runs create GitLab issues automatically |
| E8 | `get_gitlab_pipeline_status` + `fetch_gitlab_issue` | [E8](#e8--get_gitlab_pipeline_status--fetch_gitlab_issue) | Full GitLab lifecycle connected |
| E9 | `mirror.sh` + GitHub mirroring | [E9](#e9--mirrorsh--github-mirroring) | Branches pushed to both GitLab and GitHub |
| E10 | Prometheus client + `check_system_health` | [E10](#e10--prometheus-client--check_system_health) | Pre-task health check before every run |
| E11 | `capture_metrics_baseline` + `check_performance_regression` | [E11](#e11--capture_metrics_baseline--check_performance_regression) | Post-run regression detection at commit gate |
| E12 | `get_error_context` | [E12](#e12--get_error_context) | Bugfix tasks get real production error context |
| E13 | OpenAPI spec extraction + `sync_openapi_docs` | [E13](#e13--openapi-spec-extraction--sync_openapi_docs) | API docs in BookStack stay current automatically |
| E14 | Metrics as memory | [E14](#e14--metrics-as-memory) | Agent learns from past performance regressions |

> **Tip**: E1–E5 (BookStack) deliver the most immediate daily value for a solo developer. E6–E9 (GitLab) complete the git workflow. E10–E12 (Grafana) add production awareness. E13–E14 are quality-of-life polish. Build in order and stop when you have enough.
