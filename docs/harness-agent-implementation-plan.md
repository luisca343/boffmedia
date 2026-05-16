# Harness Agent — Implementation Plan (v2)

> **Stack**: pnpm workspaces · NestJS · NextJS · MariaDB · DrizzleORM · Docker Compose  
> **Agent language**: TypeScript + Shell scripts  
> **Architecture**: MCP server (stdio + HTTP/SSE) exposing infrastructure tools to external LLMs  
> **Primary client**: Opencode (and any MCP-compatible tool — Claude Code, Copilot, etc.)  
> **Version control strategy**: agent branch per task, confirm before commit  
> **Last updated**: 2026-05-15

---

## Philosophy

The agent is **not** a brain. It is a set of reliable, well-scoped infrastructure tools that any LLM coding assistant can call. Opencode (or Claude Code, or any MCP-compatible tool) supplies the reasoning. The agent supplies what those tools lack:

- An isolated, reproducible test environment
- A verified, automated quality pipeline
- Hard guardrails that cannot be talked around
- Persistent memory across sessions
- Safe git operations with rollback

You already have a powerful LLM session open. This agent makes that session significantly more capable without replacing it.

---

## Table of Contents

- [Harness Agent — Implementation Plan (v2)](#boff-agent--implementation-plan-v2)
  - [Philosophy](#philosophy)
  - [Table of Contents](#table-of-contents)
  - [1. Architecture Overview](#1-architecture-overview)
    - [What the LLM session gains](#what-the-llm-session-gains)
  - [2. Monorepo Structure](#2-monorepo-structure)
  - [3. Phase 1 — Foundation](#3-phase-1--foundation)
    - [1.1 Register the agent package](#11-register-the-agent-package)
    - [1.2 `packages/agent/package.json`](#12-packagesagentpackagejson)
    - [1.3 `tsconfig.json`](#13-tsconfigjson)
    - [1.4 Docker Compose agent environment](#14-docker-compose-agent-environment)
  - [4. Phase 2 — Shell Scripts Layer](#4-phase-2--shell-scripts-layer)
    - [`docker.sh`](#dockersh)
    - [`migrate.sh`](#migratesh)
    - [`seed.sh`](#seedsh)
    - [`git.sh`](#gitsh)
    - [`lint.sh`](#lintsh)
  - [5. Phase 3 — Tool Layer](#5-phase-3--tool-layer)
    - [Shared types](#shared-types)
    - [Tool runner](#tool-runner)
  - [6. Phase 4 — MCP Server (stdio)](#6-phase-4--mcp-server-stdio)
    - [Server setup](#server-setup)
    - [Tool router](#tool-router)
  - [7. Phase 5 — MCP Server (HTTP/SSE)](#7-phase-5--mcp-server-httpsse)
  - [8. Phase 6 — Verification Pipeline](#8-phase-6--verification-pipeline)
  - [9. Phase 7 — Playwright + Trace Capture](#9-phase-7--playwright--trace-capture)
    - [What you see in your Opencode session](#what-you-see-in-your-opencode-session)
  - [10. Phase 8 — Guardrails](#10-phase-8--guardrails)
    - [`.agent-ignore`](#agent-ignore)
  - [11. Phase 9 — Git Operations](#11-phase-9--git-operations)
  - [12. Phase 10 — Agent Memory (MariaDB)](#12-phase-10--agent-memory-mariadb)
    - [DrizzleORM schema](#drizzleorm-schema)
    - [Repository](#repository)
  - [13. Phase 11 — Codebase Context Resolver](#13-phase-11--codebase-context-resolver)
  - [14. Phase 12 — MCP Tool Reference](#14-phase-12--mcp-tool-reference)
  - [15. Phase 13 — Connecting Opencode](#15-phase-13--connecting-opencode)
    - [stdio (local — recommended for daily use)](#stdio-local--recommended-for-daily-use)
    - [HTTP/SSE (remote or persistent)](#httpsse-remote-or-persistent)
    - [Claude Code](#claude-code)
  - [16. Phase 14 — UI/UX Task Workflow](#16-phase-14--uiux-task-workflow)
  - [17. What Comes Next — Autonomous Mode](#17-what-comes-next--autonomous-mode)
  - [18. CI/CD Extension Notes](#18-cicd-extension-notes)
  - [19. Data Models](#19-data-models)
    - [`task_runs`](#task_runs)
    - [`verification_results`](#verification_results)
  - [20. Environment Variables](#20-environment-variables)
    - [Always required](#always-required)
    - [Optional](#optional)
    - [V2 autonomous mode only](#v2-autonomous-mode-only)
  - [21. Dependency Reference](#21-dependency-reference)
    - [V1 (MCP server)](#v1-mcp-server)
    - [V2 additions (autonomous mode)](#v2-additions-autonomous-mode)
  - [22. Implementation Order](#22-implementation-order)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────┐
│           Your LLM Session                  │
│   (Opencode / Claude Code / Copilot)        │
│                                             │
│  "add a /products endpoint"                 │
│  "run the tests"                            │
│  "what broke last time?"                    │
└──────────────┬──────────────────────────────┘
               │ MCP protocol
               │ (stdio locally, HTTP/SSE remotely)
               ▼
┌─────────────────────────────────────────────┐
│         @repo/agent MCP Server              │
│                                             │
│  agent:run_verification                     │
│  agent:run_playwright  ─────────────────► trace.zip + screenshots
│  agent:check_guardrails                     │
│  agent:git_operation                        │
│  agent:get_run_history                      │
│  agent:resolve_context                      │
│  agent:reset_environment                    │
│  agent:seed_database                        │
└──────────────┬──────────────────────────────┘
               │ execa (shell scripts)
               ▼
┌─────────────────────────────────────────────┐
│         Infrastructure Layer                │
│                                             │
│  docker.sh   migrate.sh   seed.sh           │
│  git.sh      lint.sh                        │
│                                             │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │NestJS   │ │NextJS    │ │MariaDB      │  │
│  │:3000    │ │:3001     │ │agent_memory │  │
│  └─────────┘ └──────────┘ └─────────────┘  │
└─────────────────────────────────────────────┘
```

### What the LLM session gains

| Without agent | With agent MCP tools |
|---|---|
| Generates code, you run tests manually | Calls `agent:run_verification` — tests run automatically, results returned structured |
| Tests run against your live dev DB | Isolated Docker environment — your dev DB never touched |
| No memory between sessions | `agent:get_run_history` — knows what failed last week |
| Can touch any file in the repo | `agent:check_guardrails` — hard blocks on protected paths |
| You run git commands manually | `agent:git_operation` — branching, committing, rollback automated |
| No visual evidence for UI changes | `agent:run_playwright` — full trace + screenshots captured automatically |
| Finds context by reading files | `agent:resolve_context` — injects only the relevant files for the task |

---

## 2. Monorepo Structure

```
/
├── apps/
│   ├── api/                              ← NestJS application
│   └── web/                              ← NextJS application
├── packages/
│   ├── shared/                           ← shared types, DTOs, constants
│   └── agent/                            ← harness agent (this package)
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── mcp/
│       │   │   ├── server-stdio.ts       ← stdio MCP server entrypoint
│       │   │   ├── server-http.ts        ← HTTP/SSE MCP server entrypoint
│       │   │   └── router.ts             ← maps MCP tool names → tool handlers
│       │   ├── tools/
│       │   │   ├── runner.ts             ← execa wrapper for shell scripts
│       │   │   ├── verification.ts       ← lint + Jest tool handlers
│       │   │   ├── playwright.ts         ← Playwright + trace capture tool handler
│       │   │   ├── guardrails.ts         ← protected paths checker
│       │   │   ├── git.ts                ← branch, commit, rollback tool handlers
│       │   │   ├── context.ts            ← codebase context resolver
│       │   │   ├── environment.ts        ← Docker environment tool handlers
│       │   │   └── database.ts           ← seed + migrate tool handlers
│       │   ├── memory/
│       │   │   ├── db.ts                 ← DrizzleORM connection (agent_memory schema)
│       │   │   ├── schema.ts             ← MariaDB table definitions
│       │   │   └── repository.ts         ← read/write run history
│       │   └── shared/
│       │       ├── types.ts              ← shared tool input/output types
│       │       └── errors.ts             ← AgentError, GuardrailError
│       └── scripts/
│           ├── docker.sh
│           ├── migrate.sh
│           ├── seed.sh
│           ├── git.sh
│           └── lint.sh
├── docker-compose.yml
├── docker-compose.agent.yml              ← isolated agent environment
├── agent.config.ts                       ← optional config overrides
├── CONVENTIONS.md                        ← codebase conventions (injected as context)
├── .agent-ignore                         ← protected paths
└── pnpm-workspace.yaml
```

---

## 3. Phase 1 — Foundation

### 1.1 Register the agent package

```yaml
# pnpm-workspace.yaml
packages:
  - apps/*
  - packages/*
```

### 1.2 `packages/agent/package.json`

```json
{
  "name": "@repo/agent",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "mcp": "tsx src/mcp/server-stdio.ts",
    "mcp:http": "tsx src/mcp/server-http.ts",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.x",
    "zod": "^3.x",
    "execa": "^8.x",
    "drizzle-orm": "^0.x",
    "mysql2": "^3.x",
    "chalk": "^5.x",
    "glob": "^10.x",
    "ignore": "^5.x",
    "express": "^4.x"
  },
  "devDependencies": {
    "tsx": "^4.x",
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/express": "^4.x",
    "jest": "^29.x",
    "ts-jest": "^29.x"
  }
}
```

### 1.3 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@repo/shared": ["../shared/src/index.ts"]
    }
  }
}
```

### 1.4 Docker Compose agent environment

```yaml
# docker-compose.agent.yml
services:
  agent_db:
    image: mariadb:11
    environment:
      MYSQL_ROOT_PASSWORD: agent_root
      MYSQL_DATABASE: agent_memory
      MYSQL_USER: agent
      MYSQL_PASSWORD: agent_pass
    ports:
      - "3307:3306"
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect"]
      interval: 5s
      timeout: 5s
      retries: 10

  api:
    environment:
      DATABASE_URL: mysql://agent:agent_pass@agent_db:3306/app_test
    depends_on:
      agent_db:
        condition: service_healthy

  web:
    depends_on:
      - api
```

---

## 4. Phase 2 — Shell Scripts Layer

All scripts live in `packages/agent/scripts/`. Rules:
- **Idempotent** — safe to run multiple times
- **Exit-code aware** — non-zero on any failure, no silent errors
- **Always target the agent environment** — never the default compose file

### `docker.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
ACTION=${1:-up}
COMPOSE_FILE="docker-compose.agent.yml"

case "$ACTION" in
  up)     docker compose -f $COMPOSE_FILE up -d --wait ;;
  down)   docker compose -f $COMPOSE_FILE down ;;
  status) docker compose -f $COMPOSE_FILE ps ;;
  *)      echo "Usage: docker.sh [up|down|status]" && exit 1 ;;
esac
```

### `migrate.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../../apps/api"
DATABASE_URL="$AGENT_DATABASE_URL" pnpm drizzle-kit migrate
```

### `seed.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
FIXTURE=${1:-default}
cd "$(dirname "$0")/../../../apps/api"
DATABASE_URL="$AGENT_DATABASE_URL" tsx src/seed/$FIXTURE.ts
```

### `git.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
ACTION=${1}

case "$ACTION" in
  branch)
    git checkout -b "agent/${2}"
    echo "Created branch: agent/${2}"
    ;;
  commit)
    git add -A
    git commit -m "${2}"
    ;;
  reset)
    git checkout -- .
    git clean -fd
    ;;
  current)
    git branch --show-current
    ;;
  *)
    echo "Usage: git.sh [branch <name>|commit <msg>|reset|current]" && exit 1 ;;
esac
```

### `lint.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
APP=${1:-all}

run_lint() {
  echo "Linting $1..."
  pnpm --filter "$1" lint
  pnpm --filter "$1" exec tsc --noEmit
}

if [[ "$APP" == "all" ]]; then
  run_lint "api"
  run_lint "web"
else
  run_lint "$APP"
fi
```

---

## 5. Phase 3 — Tool Layer

The tool layer is the core of the agent. Each file in `src/tools/` exports pure async functions that accept typed inputs and return structured results. They are called by MCP tool handlers — and later, optionally, by the autonomous orchestrator (v2).

### Shared types

```typescript
// src/shared/types.ts

export type ToolStatus = 'pass' | 'fail' | 'skip'

export interface ToolResult {
  status: ToolStatus
  output: string
  durationMs: number
}

export interface VerificationResult {
  status: 'pass' | 'fail' | 'partial'
  stages: {
    lint: ToolResult
    jestUnit: ToolResult
    jestE2e: ToolResult
    playwright: ToolResult & {
      tracePath?: string
      screenshotPaths?: string[]
      reviewInstructions?: string
    }
  }
  failures: string[]
  runId: string
  durationMs: number
}
```

### Tool runner

```typescript
// src/tools/runner.ts
import { execa } from 'execa'
import path from 'path'

const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts')

export async function shell(
  script: string,
  args: string[] = []
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const result = await execa('bash', [
      path.join(SCRIPTS_DIR, script),
      ...args
    ], { reject: false })

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? 0
    }
  } catch (err: any) {
    return { stdout: '', stderr: err.message, exitCode: 1 }
  }
}
```

---

## 6. Phase 4 — MCP Server (stdio)

The stdio transport is standard for local MCP servers. Opencode and Claude Code connect to it by spawning the server process directly — no network port, no auth, zero configuration beyond registering the server.

### Server setup

```typescript
// src/mcp/server-stdio.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerTools } from './router.ts'

const server = new McpServer({
  name: 'boff-agent',
  version: '0.1.0',
  description: 'Infrastructure tools for NestJS/NextJS monorepo development'
})

registerTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)
```

### Tool router

```typescript
// src/mcp/router.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { runVerification } from '../tools/verification.ts'
import { runPlaywright } from '../tools/playwright.ts'
import { checkGuardrails } from '../tools/guardrails.ts'
import { gitOperation } from '../tools/git.ts'
import { resolveContext } from '../tools/context.ts'
import { manageEnvironment } from '../tools/environment.ts'
import { seedDatabase } from '../tools/database.ts'
import { getRunHistory, saveRun } from '../memory/repository.ts'

export function registerTools(server: McpServer) {

  server.tool(
    'run_verification',
    'Run the full verification pipeline: lint → Jest unit → Jest e2e. Returns structured results with failure messages.',
    {
      runId: z.string().describe('Unique ID for this run'),
      apps: z.array(z.enum(['api', 'web'])).optional(),
      skipStages: z.array(z.enum(['lint', 'jest_unit', 'jest_e2e'])).optional()
    },
    async ({ runId, apps, skipStages }) => {
      const result = await runVerification({ runId, apps, skipStages })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'run_playwright',
    'Run Playwright e2e tests and capture a full trace + screenshots. Returns test results and paths to trace.zip and screenshot files for visual review.',
    {
      runId: z.string(),
      specPath: z.string().optional().describe('Path to a specific spec file. Omit to run all e2e specs.'),
      captureTrace: z.boolean().default(true),
      captureScreenshots: z.boolean().default(true)
    },
    async ({ runId, specPath, captureTrace, captureScreenshots }) => {
      const result = await runPlaywright({ runId, specPath, captureTrace, captureScreenshots })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'check_guardrails',
    'Check whether file paths violate protected path rules from .agent-ignore. Always call this before writing any files.',
    {
      paths: z.array(z.string()).describe('File paths to check, relative to repo root')
    },
    async ({ paths }) => {
      const result = await checkGuardrails({ paths })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'git_operation',
    'Perform a git operation: create a branch, commit all changes, reset the working tree, or get the current branch name.',
    {
      action: z.enum(['branch', 'commit', 'reset', 'current_branch']),
      branchName: z.string().optional().describe('Required for action=branch'),
      commitMessage: z.string().optional().describe('Required for action=commit')
    },
    async ({ action, branchName, commitMessage }) => {
      const result = await gitOperation({ action, branchName, commitMessage })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'resolve_context',
    'Given a task description, return the most relevant files from the codebase to use as context. Avoids sending the entire repo to the LLM.',
    {
      taskDescription: z.string(),
      maxFiles: z.number().default(20)
    },
    async ({ taskDescription, maxFiles }) => {
      const result = await resolveContext({ taskDescription, maxFiles })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_run_history',
    'Retrieve past agent run history. Use this to understand what has been tried before on similar tasks, what failed, and how it was resolved.',
    {
      limit: z.number().default(10),
      similarTo: z.string().optional().describe('Task title to find similar past runs'),
      status: z.enum(['passed', 'failed', 'all']).default('all')
    },
    async ({ limit, similarTo, status }) => {
      const result = await getRunHistory({ limit, similarTo, status })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'save_run',
    'Persist a run record to agent memory. Call at task start (status=running) and again on completion.',
    {
      runId: z.string(),
      status: z.enum(['running', 'passed', 'failed']),
      title: z.string(),
      branch: z.string().optional(),
      commitSha: z.string().optional(),
      failureSummary: z.string().optional()
    },
    async (input) => {
      await saveRun(input)
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] }
    }
  )

  server.tool(
    'reset_environment',
    'Start or restart the isolated Docker Compose agent environment. Waits for all services to be healthy before returning.',
    {
      action: z.enum(['up', 'down', 'status']).default('up')
    },
    async ({ action }) => {
      const result = await manageEnvironment({ action })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'seed_database',
    'Seed the agent test database with a named fixture set.',
    {
      fixture: z.string().default('default')
    },
    async ({ fixture }) => {
      const result = await seedDatabase({ fixture })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )
}
```

---

## 7. Phase 5 — MCP Server (HTTP/SSE)

The HTTP/SSE transport enables remote connections — useful when running the agent on a dev server, in Docker, or from CI where stdio is not available.

```typescript
// src/mcp/server-http.ts
import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { registerTools } from './router.ts'

const PORT = process.env.AGENT_HTTP_PORT ?? 4242
const app = express()

const server = new McpServer({ name: 'boff-agent', version: '0.1.0' })
registerTools(server)

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res)
  await server.connect(transport)
})

app.post('/messages', express.json(), async (req, res) => {
  res.status(200).end()
})

app.listen(PORT, () => {
  console.log(`Harness agent MCP server listening on http://localhost:${PORT}`)
})
```

---

## 8. Phase 6 — Verification Pipeline

```typescript
// src/tools/verification.ts
import { shell } from './runner.ts'
import type { VerificationResult, ToolResult } from '../shared/types.ts'

interface VerificationInput {
  runId: string
  apps?: ('api' | 'web')[]
  skipStages?: ('lint' | 'jest_unit' | 'jest_e2e')[]
}

export async function runVerification(input: VerificationInput): Promise<VerificationResult> {
  const { runId, apps = ['api', 'web'], skipStages = [] } = input
  const start = Date.now()
  const stages: Record<string, ToolResult> = {}

  // Stage 1: Lint — fast fail
  if (!skipStages.includes('lint')) {
    const s = Date.now()
    const r = await shell('lint.sh', [apps.join(',')])
    stages.lint = { status: r.exitCode === 0 ? 'pass' : 'fail', output: r.stdout + r.stderr, durationMs: Date.now() - s }
    if (stages.lint.status === 'fail') return buildResult('fail', stages, runId, Date.now() - start)
  }

  // Stage 2: Jest unit
  if (!skipStages.includes('jest_unit')) {
    const s = Date.now()
    const outputFile = `.agent-runs/${runId}/jest-unit.json`
    const r = await shell('pnpm', ['--filter', 'api', 'test', '--json', `--outputFile=${outputFile}`])
    stages.jestUnit = parseJestOutput(r, outputFile, Date.now() - s)
    if (stages.jestUnit.status === 'fail') return buildResult('fail', stages, runId, Date.now() - start)
  }

  // Stage 3: Jest e2e
  if (!skipStages.includes('jest_e2e')) {
    const s = Date.now()
    const outputFile = `.agent-runs/${runId}/jest-e2e.json`
    const r = await shell('pnpm', ['--filter', 'api', 'test:e2e', '--json', `--outputFile=${outputFile}`])
    stages.jestE2e = parseJestOutput(r, outputFile, Date.now() - s)
  }

  const allPassed = Object.values(stages).every(r => r.status === 'pass')
  return buildResult(allPassed ? 'pass' : 'fail', stages, runId, Date.now() - start)
}
```

---

## 9. Phase 7 — Playwright + Trace Capture

This is the key capability for UI/UX tasks. Playwright runs the spec, captures a full trace and screenshots, and returns their paths so the LLM — and you — can review them before committing.

```typescript
// src/tools/playwright.ts
import { shell } from './runner.ts'
import path from 'path'
import fs from 'fs'

interface PlaywrightInput {
  runId: string
  specPath?: string
  captureTrace?: boolean
  captureScreenshots?: boolean
}

export async function runPlaywright(input: PlaywrightInput) {
  const { runId, specPath, captureTrace = true, captureScreenshots = true } = input
  const runDir = path.resolve(`.agent-runs/${runId}`)
  const screenshotDir = path.join(runDir, 'screenshots')

  fs.mkdirSync(runDir, { recursive: true })
  fs.mkdirSync(screenshotDir, { recursive: true })

  const args = [
    '--filter', 'web', 'exec', 'playwright', 'test',
    '--reporter=json',
    `--output-dir=${runDir}`
  ]

  if (captureTrace) args.push('--trace=on')
  if (captureScreenshots) args.push('--screenshot=on')
  if (specPath) args.push(specPath)

  const start = Date.now()
  const result = await shell('pnpm', args)
  const durationMs = Date.now() - start

  const tracePath = captureTrace ? findTrace(runDir) : undefined
  const screenshotPaths = captureScreenshots ? findScreenshots(screenshotDir) : []

  return {
    status: result.exitCode === 0 ? 'pass' : 'fail',
    output: result.stdout + result.stderr,
    durationMs,
    tracePath,
    screenshotPaths,
    // Surfaced to the LLM — it will show this to you before committing
    reviewInstructions: tracePath
      ? `View trace: npx playwright show-trace ${tracePath}\nScreenshots: ${screenshotDir}`
      : undefined
  }
}
```

### What you see in your Opencode session

When Opencode calls `agent:run_playwright` and gets back `reviewInstructions`, a well-configured session presents this to you before asking about the commit:

```
✔ Playwright: 3/3 interactions passed

  View trace:    npx playwright show-trace .agent-runs/abc123/trace.zip
  Screenshots:   .agent-runs/abc123/screenshots/

  Commit to branch agent/navbar-settings-ux? (y/N)
```

You open the trace in a separate terminal tab, look at the screenshots, decide. The agent captured all the evidence — you make the visual call.

---

## 10. Phase 8 — Guardrails

```typescript
// src/tools/guardrails.ts
import fs from 'fs'
import path from 'path'
import ignore from 'ignore'

export async function checkGuardrails(input: { paths: string[] }) {
  const ignorePath = path.resolve('.agent-ignore')

  if (!fs.existsSync(ignorePath)) {
    return { safe: true, violations: [] }
  }

  const ig = ignore().add(fs.readFileSync(ignorePath, 'utf-8'))
  const violations = input.paths
    .filter(p => ig.ignores(p))
    .map(p => ({ path: p, reason: 'Matched .agent-ignore rule' }))

  return { safe: violations.length === 0, violations }
}
```

### `.agent-ignore`

```
# Authentication — never auto-modified
apps/api/src/auth/**

# DrizzleORM migration files — generated by CLI only
apps/api/drizzle/**

# Environment files
.env*
**/config/production*

# Agent's own source
packages/agent/**
```

The LLM calls `agent:check_guardrails` with its intended file paths **before writing anything**. If violations are returned, it must not proceed with those files and must inform you.

---

## 11. Phase 9 — Git Operations

```typescript
// src/tools/git.ts
import { shell } from './runner.ts'

interface GitInput {
  action: 'branch' | 'commit' | 'reset' | 'current_branch'
  branchName?: string
  commitMessage?: string
}

export async function gitOperation(input: GitInput) {
  const { action, branchName, commitMessage } = input

  switch (action) {
    case 'branch': {
      if (!branchName) throw new Error('branchName required')
      const slug = branchName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      const fullName = `agent/${slug}-${Date.now()}`
      const r = await shell('git.sh', ['branch', fullName])
      return { success: r.exitCode === 0, output: r.stdout, branch: fullName }
    }
    case 'commit': {
      if (!commitMessage) throw new Error('commitMessage required')
      const r = await shell('git.sh', ['commit', commitMessage])
      return { success: r.exitCode === 0, output: r.stdout }
    }
    case 'reset': {
      const r = await shell('git.sh', ['reset'])
      return { success: r.exitCode === 0, output: r.stdout }
    }
    case 'current_branch': {
      const r = await shell('git.sh', ['current'])
      return { success: r.exitCode === 0, output: r.stdout.trim() }
    }
  }
}
```

---

## 12. Phase 10 — Agent Memory (MariaDB)

The agent uses a dedicated `agent_memory` database on the existing MariaDB instance — never the application database.

### DrizzleORM schema

```typescript
// src/memory/schema.ts
import { mysqlTable, varchar, text, int, datetime, json } from 'drizzle-orm/mysql-core'

export const taskRuns = mysqlTable('task_runs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  status: varchar('status', { length: 20 }).notNull(),     // running|passed|failed
  title: varchar('title', { length: 255 }).notNull(),
  branch: varchar('branch', { length: 255 }),
  commitSha: varchar('commit_sha', { length: 40 }),
  failureSummary: text('failure_summary'),
  createdAt: datetime('created_at').notNull(),
  finishedAt: datetime('finished_at')
})

export const verificationResults = mysqlTable('verification_results', {
  id: varchar('id', { length: 36 }).primaryKey(),
  runId: varchar('run_id', { length: 36 }).notNull(),
  stage: varchar('stage', { length: 50 }).notNull(),
  status: varchar('status', { length: 10 }).notNull(),
  failures: json('failures'),
  tracePath: varchar('trace_path', { length: 500 }),
  screenshotPaths: json('screenshot_paths'),
  durationMs: int('duration_ms'),
  createdAt: datetime('created_at').notNull()
})
```

### Repository

```typescript
// src/memory/repository.ts

export async function getRunHistory(input: {
  limit: number
  similarTo?: string
  status: 'passed' | 'failed' | 'all'
}): Promise<TaskRun[]> {
  // Returns last N runs, optionally filtered by title similarity and status.
  // The LLM uses this to understand what was tried before on similar tasks.
}

export async function saveRun(input: SaveRunInput): Promise<void> {
  // Upserts a run record.
  // Called by the LLM at run start (status=running) and on completion.
}
```

---

## 13. Phase 11 — Codebase Context Resolver

```typescript
// src/tools/context.ts
import { glob } from 'glob'
import fs from 'fs'
import path from 'path'

export async function resolveContext(input: { taskDescription: string; maxFiles: number }) {
  const { taskDescription, maxFiles } = input
  const desc = taskDescription.toLowerCase()
  const candidates: string[] = []

  // Rule-based file selection
  if (/endpoint|controller|route|api|service/.test(desc))
    candidates.push(...await glob('apps/api/src/**/*.{controller,service,module}.ts'))

  if (/page|component|view|ui|layout/.test(desc))
    candidates.push(...await glob('apps/web/src/app/**/*.{tsx,ts}'))

  // Entity name extraction
  const entities = taskDescription.match(/\b([A-Z][a-z]+)\b/g) ?? []
  for (const entity of entities)
    candidates.push(...await glob(`apps/**/*${entity.toLowerCase()}*.{ts,tsx}`))

  // Always include shared types
  candidates.push(...await glob('packages/shared/src/**/*.ts'))

  const unique = [...new Set(candidates)].slice(0, maxFiles)
  const files = unique.map(p => ({
    path: p,
    content: fs.readFileSync(path.resolve(p), 'utf-8')
  }))

  const conventions = fs.existsSync('CONVENTIONS.md')
    ? fs.readFileSync('CONVENTIONS.md', 'utf-8')
    : ''

  return {
    files,
    moduleList: await glob('apps/api/src/*/*.module.ts')
      .then(f => f.map(p => path.basename(p, '.module.ts'))),
    pageList: await glob('apps/web/src/app/**/page.tsx')
      .then(f => f.map(p => path.dirname(p).replace('apps/web/src/app', ''))),
    conventions,
    totalTokenEstimate: files.reduce((acc, f) => acc + Math.ceil(f.content.length / 4), 0)
  }
}
```

---

## 14. Phase 12 — MCP Tool Reference

| Tool | Description | Key inputs | Key outputs |
|---|---|---|---|
| `run_verification` | Lint → Jest unit → Jest e2e | `runId`, `apps`, `skipStages` | `VerificationResult` with `failures[]` |
| `run_playwright` | Playwright + trace + screenshots | `runId`, `specPath`, `captureTrace` | results + `tracePath` + `screenshotPaths` + `reviewInstructions` |
| `check_guardrails` | Validate paths against `.agent-ignore` | `paths[]` | `safe: bool`, `violations[]` |
| `git_operation` | Branch, commit, reset, current branch | `action`, `branchName`, `commitMessage` | `success`, `output`, `branch` |
| `resolve_context` | Inject relevant codebase files for a task | `taskDescription`, `maxFiles` | `files[]`, `moduleList`, `pageList`, `conventions` |
| `get_run_history` | Query past run outcomes | `limit`, `similarTo`, `status` | array of past runs with failure summaries |
| `save_run` | Persist a run record | `runId`, `status`, `title`, `branch` | `{ ok: true }` |
| `reset_environment` | Docker Compose up/down/status | `action` | `status`, `output` |
| `seed_database` | Apply a DB fixture | `fixture` | `status`, `output` |

---

## 15. Phase 13 — Connecting Opencode

### stdio (local — recommended for daily use)

Add to your Opencode config:

```json
{
  "mcpServers": {
    "boff-agent": {
      "type": "stdio",
      "command": "pnpm",
      "args": ["--filter", "@repo/agent", "mcp"],
      "cwd": "/path/to/your/monorepo"
    }
  }
}
```

Opencode spawns the agent process when it starts. No separate server needed.

### HTTP/SSE (remote or persistent)

Start the server once:
```bash
pnpm --filter @repo/agent mcp:http
# Listening on http://localhost:4242
```

Add to Opencode config:
```json
{
  "mcpServers": {
    "boff-agent": {
      "type": "sse",
      "url": "http://localhost:4242/sse"
    }
  }
}
```

### Claude Code

Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "boff-agent": {
      "command": "pnpm",
      "args": ["--filter", "@repo/agent", "mcp"],
      "cwd": "/path/to/your/monorepo"
    }
  }
}
```

---

## 16. Phase 14 — UI/UX Task Workflow

With the agent connected, here is the exact workflow for "Rearrange the Smartrotom Navbar Settings for better UX":

**1. You describe the task in Opencode**

```
Rearrange the NavbarSettings component. Group items into sections:
"Account" (profile, notifications), "Preferences" (theme, language),
"Danger Zone" (logout, delete). Add visual separators. No functional changes.
```

**2. Opencode calls `agent:check_guardrails`**

Verifies `apps/web/src/components/navbar/NavbarSettings.tsx` is not protected before touching it.

**3. Opencode calls `agent:resolve_context`**

Gets the current `NavbarSettings.tsx`, related components, shared types, and `CONVENTIONS.md` — without reading the whole repo.

**4. Opencode calls `agent:get_run_history`**

Checks if similar UI tasks have been run before. Learns from past failures.

**5. Opencode writes the files**

Opencode is the LLM — it writes `NavbarSettings.tsx` using its own file editing capabilities, informed by the context from step 3.

**6. Opencode calls `agent:run_verification`**

Lint and Jest run automatically. If the rearrangement broke anything, failures are returned and Opencode fixes them.

**7. Opencode calls `agent:run_playwright`**

Playwright runs interaction tests. Full trace and screenshots are captured and paths returned.

**8. Opencode surfaces the review to you**

```
✔ Lint passed
✔ Jest: 14/14 passed
✔ Playwright: 3/3 interactions passed

  View trace:    npx playwright show-trace .agent-runs/abc123/trace.zip
  Screenshots:   .agent-runs/abc123/screenshots/

  Commit to branch agent/navbar-settings-ux? (y/N)
```

**9. You review, say yes**

```
Opencode → agent:git_operation { action: "branch", branchName: "navbar-settings-ux" }
Opencode → agent:git_operation { action: "commit", commitMessage: "refactor: rearrange navbar settings" }
Opencode → agent:save_run { status: "passed", title: "navbar settings ux", ... }
```

The agent provided the infrastructure. Opencode provided the intelligence. You made the visual call.

---

## 17. What Comes Next — Autonomous Mode

When you need to run tasks unattended — overnight queue drains, CI/CD pipelines, or batch automation without an active Opencode session — the autonomous orchestrator loop is the next step.

It is documented separately in **`boff-agent-v2-autonomous.md`**. Everything in that document builds directly on top of this one. The tool layer (`@repo/agent`) is imported as-is — nothing here changes when you add v2.

Build v1 first. Add v2 when the need is real.

---

## 18. CI/CD Extension Notes

```yaml
name: Agent Verification
on:
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      mariadb:
        image: mariadb:11
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: agent_memory
        ports: ["3307:3306"]
        options: --health-cmd="healthcheck.sh --connect" --health-interval=5s
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web exec playwright install --with-deps chromium
      - run: pnpm --filter @repo/agent exec tsx src/cli/verify.ts
        env:
          AGENT_DATABASE_URL: ${{ secrets.AGENT_DATABASE_URL }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-traces
          path: .agent-runs/*/trace.zip
```

Playwright traces are uploaded as CI artifacts — downloadable and inspectable after any run without opening a browser on the runner.

---

## 19. Data Models

### `task_runs`
| Column | Type | Notes |
|---|---|---|
| id | varchar(36) | UUID, PK |
| status | varchar(20) | running / passed / failed |
| title | varchar(255) | |
| branch | varchar(255) | git branch name |
| commit_sha | varchar(40) | populated on success |
| failure_summary | text | short description of what failed |
| created_at | datetime | |
| finished_at | datetime | |

### `verification_results`
| Column | Type | Notes |
|---|---|---|
| id | varchar(36) | UUID, PK |
| run_id | varchar(36) | FK → task_runs |
| stage | varchar(50) | lint / jest_unit / jest_e2e / playwright |
| status | varchar(10) | pass / fail / skip |
| failures | json | array of failure message strings |
| trace_path | varchar(500) | path to trace.zip, nullable |
| screenshot_paths | json | array of screenshot paths, nullable |
| duration_ms | int | |
| created_at | datetime | |

---

## 20. Environment Variables

### Always required

| Variable | Default | Description |
|---|---|---|
| `AGENT_DATABASE_URL` | — | MariaDB URL for `agent_memory` schema |

### Optional

| Variable | Default | Description |
|---|---|---|
| `AGENT_HTTP_PORT` | `4242` | Port for HTTP/SSE MCP server |
| `AGENT_RUNS_DIR` | `.agent-runs` | Directory for traces, screenshots, reports |
| `AGENT_PROTECTED_PATHS` | `.agent-ignore` | Path to protected paths config |

### V2 autonomous mode only

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Anthropic Claude API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `GITHUB_TOKEN` | — | GitHub token for Copilot |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `AGENT_PROVIDER` | auto | Explicit provider override |
| `AGENT_MODEL` | provider default | Explicit model override |
| `AGENT_MAX_RETRIES` | `3` | Max retry attempts per task |
| `AGENT_MAX_TOKENS_PER_RUN` | `50000` | Token budget cap |
| `AGENT_AUTO` | `false` | Disable all confirmation prompts (CI) |

Store secrets in `.env.agent` (gitignored). Never commit API keys.

---

## 21. Dependency Reference

### V1 (MCP server)

| Package | Purpose |
|---|---|
| `@modelcontextprotocol/sdk` | MCP server — stdio + SSE transports |
| `zod` | Tool input schema validation |
| `execa` | Shell script invocation with typed stdout/stderr |
| `drizzle-orm` + `mysql2` | Agent memory database |
| `express` | HTTP server for SSE transport |
| `glob` | File system scanning for context resolver |
| `ignore` | `.agent-ignore` pattern matching |
| `chalk` | Terminal color output |
| `tsx` | Zero-build TypeScript execution |

### V2 additions (autonomous mode)

| Package | Purpose |
|---|---|
| `@anthropic-ai/sdk` | Anthropic Claude adapter |
| `openai` | OpenAI + Copilot adapter |
| `ollama` | Ollama / local model adapter |
| `ora` | Terminal spinner |
| `inquirer` | Interactive clarification Q&A |
| `commander` | CLI argument parsing |

---

## 22. Implementation Order

A useful, connectable agent exists from Phase 4 onward. Build in this order.

| Phase | Status | Deliverable | Usable checkpoint |
|---|---|---|---|
| 1 | ✅ Done | Package scaffolding + Docker Compose env | `docker.sh up` works |
| 2 | ✅ Done | Shell scripts layer | All scripts run and exit correctly |
| 3 | ✅ Done | Tool layer (`runner.ts`, shared types) | Tool functions callable in isolation |
| 4 | ✅ Done | MCP server (stdio) + `run_verification` + `check_guardrails` | Claude Code can lint and check guardrails |
| 5 | ✅ Done | `git_operation` + `reset_environment` + `seed_database` | Claude Code can manage environment and git |
| 6 | ✅ Done | `run_playwright` with trace + screenshot capture | Full verification pipeline via MCP |
| 7 | ✅ Done | Agent memory + `save_run` + `get_run_history` | Claude Code can persist and query run history |
| 8 | ✅ Done | `resolve_context` | Relevant file injection per task |
| 9 | ✅ Done | MCP server (HTTP/SSE) | Remote and persistent connections |
| 10 | ✅ Done | Opencode config + end-to-end workflow test | Agent fully connected, usable in daily work |
| V2 | ⬜ Not started | LLM adapters + orchestrator + queue + CLI | See `boff-agent-v2-autonomous.md` |

> **Tip**: Phase 10 is a complete, production-ready agent for interactive use. V2 is purely additive — build it when you need to run tasks unattended, not before.

---

## 23. Phase 10 Remaining Checklist

MCP is connected (`boff-agent` registered in `.mcp.json` + `enabledMcpjsonServers`). Three things remain before a full end-to-end run.

### 23.1 Fix `.mcp.json` `cwd` path

`.mcp.json` currently has a Windows path. It must match the actual Linux path on this machine.

```json
{
  "mcpServers": {
    "boff-agent": {
      "command": "pnpm",
      "args": ["--filter", "@repo/agent", "mcp"],
      "cwd": "/home/luis/Ficus Labs/boffmedia"
    }
  }
}
```

- [x] Update `cwd` to `/home/luis/Ficus Labs/boffmedia`

### 23.2 Create `.agent-ignore`

Required by `checkGuardrails` — without it the tool returns `safe: true` for everything (no enforcement). Create at repo root:

```
# Authentication — never auto-modified
apps/api/src/auth/**

# DrizzleORM migration files — generated by CLI only
apps/api/drizzle/**

# Environment files
.env*
**/config/production*

# Agent's own source
packages/agent/**
```

- [x] Create `.agent-ignore` at repo root (existed; added `packages/shared/src/**` entry)

### 23.3 Create `CONVENTIONS.md`

Required by `resolveContext` — it's injected as context for every task. Without it the resolver returns an empty `conventions` field.  
Content: repo-specific coding conventions (naming, file placement, import style, etc.).

- [x] Create `CONVENTIONS.md` at repo root

### 23.4 End-to-end smoke test

Once 23.1–23.3 are done, run a quick smoke test from inside Claude Code:

```
→ call agent:reset_environment { action: "up" }         # Docker env healthy
→ call agent:check_guardrails { paths: ["apps/api/src/auth/auth.service.ts"] }  # should block
→ call agent:run_verification { runId: "smoke-001", skipStages: ["jest_e2e"] }  # lint + unit
→ call agent:save_run { runId: "smoke-001", status: "passed", title: "smoke test" }
→ call agent:get_run_history { limit: 1, status: "all" }  # confirms memory works
```

- [x] Smoke test passes end-to-end (2026-05-16 — pipeline live, memory confirmed, revealed pre-existing test failures in `smartrotom/apps` unrelated to agent setup)
