import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { runVerification } from '../tools/verification.js'
import { runPlaywright } from '../tools/playwright.js'
import { checkGuardrails } from '../tools/guardrails.js'
import { gitOperation } from '../tools/git.js'
import { resolveContext } from '../tools/context.js'
import { manageEnvironment } from '../tools/environment.js'
import { seedDatabase } from '../tools/database.js'
import { getRunHistory, saveRun } from '../memory/repository.js'
import {
  fetchBookStackPage,
  searchBookStack,
  writeBookStackPage,
  listBookStackTasks,
  createBookStackShelf,
  createBookStackBook,
  addBooksToShelf,
  createBookStackChapter,
  writeAdr,
  syncConventions,
  updateTaskStatus
} from '../tools/bookstack.js'
import { detectStructuralChanges } from '../tools/structural.js'
import { ADR_CHAPTER_IDS, API_REFERENCE_BOOK_IDS, CONVENTIONS_PAGE_IDS, TECHNICAL_BOOK_IDS } from '../agent.config.js'
import {
  createGitLabMR,
  createGitLabIssue,
  getGitLabPipelineStatus,
  fetchGitLabIssue
} from '../tools/gitlab.js'
import {
  checkSystemHealth,
  captureMetricsBaseline,
  checkPerformanceRegression,
  getErrorContext
} from '../tools/grafana.js'
import { syncOpenApiDocs } from '../tools/openapi.js'

export function registerTools(server: McpServer) {

  server.tool(
    'begin_task',
    'CALL THIS FIRST before any code changes. Registers the task, loads relevant codebase context, and retrieves prior run history. Returns the step-by-step workflow to follow for this session, including the runId you must pass to all subsequent tools. Every task must start here and end with save_run.',
    {
      title: z.string().describe('Short human-readable task title'),
      taskDescription: z.string().describe('Full description of what needs to be done'),
      taskType: z.enum(['feature', 'ui-ux', 'refactor', 'bugfix']).default('feature').describe('Type of task — drives whether Playwright is included in the workflow'),
      bookstackTaskPageId: z.number().optional().describe('BookStack page ID of the agent:task page — if provided, status tag is updated to in-progress automatically')
    },
    async ({ title, taskDescription, taskType, bookstackTaskPageId }) => {
      // Fix 4: clean slug — strip leading/trailing hyphens, fall back to 'task'
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'task'
      const runId = `${slug}-${Date.now()}`
      await saveRun({ runId, status: 'running', title })
      if (bookstackTaskPageId) {
        await updateTaskStatus(bookstackTaskPageId, 'in-progress').catch(() => {})
      }

      // Fix 1: run health check and capture metrics baseline in parallel with context/history
      const [context, history, health, _baseline] = await Promise.all([
        resolveContext({ taskDescription, maxFiles: 20 }),
        getRunHistory({ limit: 5, similarTo: title, status: 'all' }),
        checkSystemHealth(),
        captureMetricsBaseline({ runId }).catch(() => null)
      ])

      // Fix 1: surface health warnings in the workflow output
      const healthSection = !health.safe
        ? `\n## ⚠ System health warning\nThe following issues were detected before starting:\n${health.warnings.map((w: string) => `- ${w}`).join('\n')}\n\nConsider investigating before proceeding. Ask the user if you should continue.\n`
        : ''

      // Fix 6: explicit playwright condition with file-type criteria
      const playwrightStep = taskType === 'ui-ux'
        ? `4b. Call run_playwright (runId: "${runId}") — REQUIRED for ui-ux tasks. Present reviewInstructions to the user before proceeding to step 5.`
        : `4b. Call run_playwright (runId: "${runId}") only if you modified .tsx or .jsx files inside apps/web/src. Skip if all changes were in apps/api or packages only.`

      const bookstackSection = context.bookstackPages.length > 0
        ? `\n## BookStack context (${context.bookstackPages.length} pages)\n${context.bookstackPages.map(p => `- **${p.title}** (updated ${p.updatedAt})`).join('\n')}`
        : ''

      const performanceNotes = history
        .filter(r => r.performanceDelta?.length)
        .map(r => {
          const notes = r.performanceDelta!.map(d => {
            const sign = d.deltaPercent > 0 ? '+' : ''
            return `${d.metric} ${sign}${d.deltaPercent}% (${d.before.toFixed(1)} → ${d.after.toFixed(1)})`
          }).join(', ')
          return `- "${r.title}" → ${r.status}. Performance: ${notes}`
        })
        .join('\n')

      const performanceSection = performanceNotes
        ? `\n## Performance notes from similar past runs\n${performanceNotes}`
        : ''

      // Fix 5: compact history format — no raw JSON dump
      const historyBlock = history.length > 0
        ? history.map(r => {
            const failure = r.failureSummary ? ` — failed: ${r.failureSummary}` : ''
            return `- "${r.title}" → ${r.status} · branch: ${r.branch ?? 'unknown'}${failure}`
          }).join('\n')
        : 'No prior runs found.'

      const branchSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'task'

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
   If you discover additional files are needed during implementation, call check_guardrails
   again before writing them.

3. Make your code changes using your own file editing tools.

3b. Call reset_environment (action: "up") and seed_database (fixture: "default")
    to guarantee a clean test environment.

4a. Call run_verification (runId: "${runId}") to run lint + tests.
    Fix failures before proceeding.

### If verification fails and you cannot fix the code:
    - Call git_operation (action: "reset") to restore the working tree to a clean state
    - Call save_run (runId: "${runId}", status: "failed", failureSummary: "<reason>")
    - Consider calling create_gitlab_issue to document the failure for future review.
    - Stop. Do not proceed to step 5.

${playwrightStep}

4c. Call detect_structural_changes. If adrRecommended=true, call write_adr.
    Always call sync_conventions after (non-fatal if BookStack is unreachable).
    Always call write_adr if you made any of these structural changes, regardless of adrRecommended:
    - New NestJS module, controller, service, or repository
    - New or modified Drizzle/TypeORM schema (tables, columns, relations)
    - New or modified shared DTO in packages/shared (public API surface change)
    - Auth flow change, shared type change, new cron job or background process

4d. If you created or modified any NestJS controller, DTO, or route decorator,
    call sync_openapi_docs (runId: "${runId}") with the affected module names.
    Non-fatal if BookStack is unreachable — log and continue.

4e. Call check_performance_regression (runId: "${runId}").
    If hasRegression=true, present regressions to the user and ask whether to proceed.
    Performance regressions do NOT automatically block — the user decides.

5. Git operations:
   a. Create branch: git_operation (action: "branch", branchName: "${branchSlug}")
   b. Commit changes: git_operation (action: "commit", commitMessage: "<descriptive message>")
   c. Push: git_operation (action: "push_mirrors", branchName: "<same branch name>")
   If the branch already exists, use it — do not abort.
   If GitHub mirror push fails, log the warning and continue.
   If GitLab push fails, call save_run(failed) and abort.

6. Call save_run (runId: "${runId}", status: "passed"${bookstackTaskPageId ? `, bookstackTaskPageId: ${bookstackTaskPageId}` : ''})
   to close the task.

## Rules
- Do not skip steps. Do not call save_run before run_verification passes.
- Steps 4c, 4d (BookStack sync) are non-fatal. If BookStack is unreachable, continue to step 5 and inform the user that BookStack sync was skipped.
- ⚠ NEVER call create_gitlab_mr during this workflow.
  MR creation is the user's explicit decision after reviewing the pushed branch.
  Calling it automatically bypasses the visual review and commit approval step.
  If the user wants an MR, they will ask you separately after reviewing the branch.

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

      return { content: [{ type: 'text', text: workflow }] }
    }
  )

  server.tool(
    'check_guardrails',
    'CALL THIS BEFORE WRITING ANY FILES — step 2 of the workflow. Check whether file paths violate protected path rules from .agent-ignore. If any violations are returned, do not write those files and inform the user. If you discover additional files are needed during implementation, call check_guardrails again before writing them.',

    {
      paths: z.array(z.string()).describe('File paths to check, relative to repo root')
    },
    async ({ paths }) => {
      const result = await checkGuardrails({ paths })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'run_verification',
    'CALL THIS AFTER ALL CODE CHANGES — step 4a of the workflow. Runs lint → Jest unit → Jest e2e and returns structured results. Fix any failures before calling save_run. Use the runId returned by begin_task.',
    {
      runId: z.string().describe('The runId returned by begin_task'),
      apps: z.array(z.enum(['api', 'web'])).optional(),
      skipStages: z.array(z.enum(['lint', 'jest_unit', 'jest_e2e'])).optional()
    },
    async ({ runId, apps, skipStages }) => {
      const result = await runVerification({ runId, apps, skipStages })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'save_run',
    'CALL THIS LAST — step 6 of the workflow. Persists the final run status after run_verification completes. Every task started with begin_task must be closed with save_run. Use the runId returned by begin_task. If bookstackTaskPageId is provided, updates the task page status to done (passed) or pending (failed).',
    {
      runId: z.string().describe('The runId returned by begin_task'),
      status: z.enum(['running', 'passed', 'failed']),
      title: z.string(),
      branch: z.string().optional(),
      commitSha: z.string().optional(),
      failureSummary: z.string().optional(),
      bookstackTaskPageId: z.number().optional().describe('BookStack page ID of the agent:task page — if provided, status tag is updated to done (passed) or pending (failed)')
    },
    async (input) => {
      await saveRun(input)
      if (input.bookstackTaskPageId) {
        const newStatus = input.status === 'passed' ? 'done' : 'pending'
        await updateTaskStatus(input.bookstackTaskPageId, newStatus).catch(() => {})
      }
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] }
    }
  )

  server.tool(
    'run_playwright',
    'Step 4b of the workflow for ui-ux tasks. Run Playwright e2e tests and capture a full trace + screenshots. Returns test results, paths to trace.zip, screenshot files, and reviewInstructions to present to the user. Use the runId returned by begin_task.',
    {
      runId: z.string().describe('The runId returned by begin_task'),
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
    'git_operation',
    'Perform a git operation: create a branch, commit all changes, reset the working tree, get the current branch name, or push to all configured remotes.',
    {
      action: z.enum(['branch', 'commit', 'reset', 'current_branch', 'push_mirrors']),
      branchName: z.string().optional().describe('Required for action=branch and action=push_mirrors'),
      commitMessage: z.string().optional().describe('Required for action=commit')
    },
    async ({ action, branchName, commitMessage }) => {
      const result = await gitOperation({ action, branchName, commitMessage })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'resolve_context',
    'Given a task description, return the most relevant files from the codebase plus matching BookStack documentation pages. Already called automatically by begin_task — use this only if you need to refresh context mid-task.',
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
    'Retrieve past agent run history. Already called automatically by begin_task — use this only if you need to query history mid-task with different filters.',
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

  // ── BookStack tools (E1–E5) ──────────────────────────────────────────────

  server.tool(
    'fetch_bookstack_page',
    'Fetch a BookStack page by ID or URL and return its content as clean markdown. Use this to read a spec or documentation page as task input.',
    {
      pageId: z.number().optional().describe('BookStack page ID'),
      url: z.string().optional().describe('Full BookStack page URL — will be resolved to a page ID')
    },
    async ({ pageId, url }) => {
      const result = await fetchBookStackPage({ pageId, url })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'search_bookstack',
    'Search BookStack pages by query string and optional tag filter. Returns page summaries — use fetch_bookstack_page to get full content.',
    {
      query: z.string().describe('Search query'),
      tags: z.array(z.string()).optional().describe('Optional tag filters (e.g. ["boffmedia", "api-reference"])'),
      limit: z.number().default(5).describe('Maximum number of results')
    },
    async ({ query, tags, limit }) => {
      const result = await searchBookStack({ query, tags, limit })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'write_bookstack_page',
    'Create or update a BookStack page with markdown content. Never writes to pages tagged agent:readonly.',
    {
      bookId: z.number().describe('BookStack book ID'),
      chapterId: z.number().optional().describe('Optional chapter ID within the book'),
      pageId: z.number().optional().describe('If provided, updates the existing page instead of creating a new one'),
      title: z.string().describe('Page title'),
      content: z.string().describe('Page content in markdown'),
      tags: z.array(z.string()).optional().describe('Tags to apply to the page')
    },
    async ({ bookId, chapterId, pageId, title, content, tags }) => {
      const result = await writeBookStackPage({ bookId, chapterId, pageId, title, content, tags })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'list_bookstack_tasks',
    'List all agent:task pages for a project. Use this to discover pending tasks without being given a specific page URL.',
    {
      project: z.enum(['boffmedia', 'smartrotom']),
      status: z.enum(['pending', 'in-progress', 'done']).optional()
    },
    async ({ project, status }) => {
      const result = await listBookStackTasks({ project, status })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // ── E5: structural detection + ADR + conventions ────────────────────────

  server.tool(
    'detect_structural_changes',
    'Analyse the current git diff to detect new NestJS modules, entities, services, controllers, and schema changes. Call after run_verification passes (step 4c). If adrRecommended=true, follow up with write_adr.',
    {},
    async () => {
      const result = await detectStructuralChanges()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'write_adr',
    'Write an Architecture Decision Record to BookStack when a run introduces a structural change (new module, entity, schema, shared DTO, auth flow change, or new background process). Call when detect_structural_changes returns adrRecommended=true, or whenever you make a structural change regardless of that flag.',

    {
      title: z.string().describe('ADR title — use suggestedAdrTitle from detect_structural_changes or write your own'),
      context: z.string().describe('Why this decision was needed — the forces at play'),
      decision: z.string().describe('What was decided and how it was implemented'),
      consequences: z.string().describe('Trade-offs, risks, and follow-up tasks'),
      project: z.enum(['boffmedia', 'smartrotom']).describe('Project the ADR belongs to'),
      runId: z.string().describe('Run ID from begin_task')
    },
    async ({ title, context, decision, consequences, project, runId }) => {
      // Fix 13: get current branch for traceability in the ADR footer
      const branchResult = await gitOperation({ action: 'current_branch' }).catch(() => ({ output: 'unknown', success: false }))
      const branch = branchResult.output?.trim() || 'unknown'
      const result = await writeAdr({
        bookId: TECHNICAL_BOOK_IDS[project],
        chapterId: ADR_CHAPTER_IDS[project],
        title,
        context,
        decision,
        consequences,
        project,
        runId,
        branch
      })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'sync_conventions',
    'Sync the repo CONVENTIONS.md to the BookStack conventions page. Call as part of step 4c after detect_structural_changes.',
    {
      project: z.enum(['boffmedia', 'smartrotom']).describe('Project to sync conventions for')
    },
    async ({ project }) => {
      // Fix 9: both projects share the same CONVENTIONS.md — fall back to boffmedia page for SmartRotom
      const pageId = (CONVENTIONS_PAGE_IDS as Record<string, number>)[project] ?? CONVENTIONS_PAGE_IDS.boffmedia
      await syncConventions({ bookId: TECHNICAL_BOOK_IDS[project], pageId, project })
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] }
    }
  )

  // ── GitLab tools (E6–E8) ────────────────────────────────────────────────

  server.tool(
    'create_gitlab_mr',
    'Create a GitLab merge request. Call this only when explicitly asked by the user — MR creation is never automatic. The description is built from the task spec, verification results, and optional Playwright trace path.',
    {
      sourceBranch: z.string().describe('Branch to merge from'),
      title: z.string().describe('MR title'),
      taskSpec: z.string().describe('Task specification summary'),
      verificationSummary: z.string().describe('Verification results summary'),
      bookstackPageUrl: z.string().optional().describe('BookStack spec page URL to include in the MR description'),
      tracePath: z.string().optional().describe('Path to Playwright trace.zip for visual review'),
      runId: z.string().describe('Run ID from begin_task')
    },
    async ({ sourceBranch, title, taskSpec, verificationSummary, bookstackPageUrl, tracePath, runId }) => {
      const result = await createGitLabMR({ sourceBranch, title, taskSpec, verificationSummary, bookstackPageUrl, tracePath, runId })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'create_gitlab_issue',
    'Create a GitLab issue when an agent run fails after max retries. Captures the failure summary and links back to the spec page.',
    {
      title: z.string().describe('Issue title (without [Agent failed] prefix — it is added automatically)'),
      failureSummary: z.string().describe('Short explanation of why the run failed'),
      failures: z.array(z.string()).describe('List of individual failure messages'),
      runId: z.string().describe('Run ID from begin_task'),
      bookstackPageUrl: z.string().optional().describe('BookStack spec page URL')
    },
    async ({ title, failureSummary, failures, runId, bookstackPageUrl }) => {
      const result = await createGitLabIssue({ title, failureSummary, failures, runId, bookstackPageUrl })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_gitlab_pipeline_status',
    'Poll the GitLab CI pipeline for a branch and return its current status plus any failed job names.',
    {
      branch: z.string().describe('Branch name to check')
    },
    async ({ branch }) => {
      const result = await getGitLabPipelineStatus({ branch })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'fetch_gitlab_issue',
    'Fetch a GitLab issue by ID and return its title and description as task input.',
    {
      issueId: z.number().describe('GitLab issue number')
    },
    async ({ issueId }) => {
      const result = await fetchGitLabIssue({ issueId })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // ── Grafana / Prometheus tools (E10–E12) ─────────────────────────────────

  server.tool(
    'check_system_health',
    'Run a pre-task system health check against Prometheus. Returns safe=true when all metrics are within thresholds. Surface any warnings to the user before proceeding with code changes.',
    {},
    async () => {
      const result = await checkSystemHealth()
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'capture_metrics_baseline',
    'Snapshot current Prometheus metrics before a run starts. Call once at the start of a task so check_performance_regression has a baseline to compare against.',
    {
      runId: z.string().describe('Run ID from begin_task'),
      endpoints: z.array(z.string()).optional().describe('Specific API endpoints to include in the snapshot')
    },
    async ({ runId, endpoints }) => {
      const result = await captureMetricsBaseline({ runId, endpoints })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'check_performance_regression',
    'Compare current Prometheus metrics against the pre-run baseline captured by capture_metrics_baseline. Call this at the commit gate alongside the Playwright trace review.',
    {
      runId: z.string().describe('Run ID from begin_task')
    },
    async ({ runId }) => {
      const result = await checkPerformanceRegression({ runId })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_error_context',
    'Fetch current error rates and anomaly detection data from Prometheus for a specific module or endpoint. Call before bugfix tasks to give the model real production context.',
    {
      module: z.string().optional().describe('NestJS module name to filter by'),
      endpoint: z.string().optional().describe('Specific route path to filter by (e.g. /api/products)'),
      windowMinutes: z.number().default(60).describe('Time window in minutes for rate calculations')
    },
    async ({ module, endpoint, windowMinutes }) => {
      const result = await getErrorContext({ module, endpoint, windowMinutes })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // ── BookStack structure tools ────────────────────────────────────────────

  server.tool(
    'create_bookstack_shelf',
    '[SETUP ONLY — do not call during normal task workflow] Create a new BookStack shelf (top-level container for books).',

    {
      name: z.string().describe('Shelf name'),
      description: z.string().optional().describe('Short description shown under the shelf name'),
      books: z.array(z.number()).optional().describe('Book IDs to include in the shelf on creation')
    },
    async ({ name, description, books }) => {
      const result = await createBookStackShelf({ name, description, books })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'create_bookstack_book',
    '[SETUP ONLY — do not call during normal task workflow] Create a new BookStack book. Books hold chapters and pages.',

    {
      name: z.string().describe('Book name'),
      description: z.string().optional().describe('Short description shown under the book name')
    },
    async ({ name, description }) => {
      const result = await createBookStackBook({ name, description })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'add_books_to_shelf',
    '[SETUP ONLY — do not call during normal task workflow] Assign books to a shelf. Replaces the current book list — include all book IDs you want in the shelf.',

    {
      shelfId: z.number().describe('Shelf ID'),
      bookIds: z.array(z.number()).describe('Complete list of book IDs to assign to the shelf')
    },
    async ({ shelfId, bookIds }) => {
      await addBooksToShelf({ shelfId, bookIds })
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true }) }] }
    }
  )

  server.tool(
    'create_bookstack_chapter',
    '[SETUP ONLY — do not call during normal task workflow] Create a new chapter inside a book. Chapters are optional groupings of pages within a book.',

    {
      bookId: z.number().describe('Book ID to create the chapter in'),
      name: z.string().describe('Chapter name'),
      description: z.string().optional().describe('Short description')
    },
    async ({ bookId, name, description }) => {
      const result = await createBookStackChapter({ bookId, name, description })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  // ── OpenAPI tool (E13) ───────────────────────────────────────────────────

  server.tool(
    'sync_openapi_docs',
    'Fetch the NestJS OpenAPI spec and sync API reference pages to BookStack for all affected modules. Call this after run_verification passes (step 4d). Non-fatal if BookStack is unreachable.',
    {
      runId: z.string().describe('Run ID from begin_task'),
      affectedModules: z.array(z.string()).describe('NestJS module names that were changed in this run'),
      project: z.enum(['boffmedia', 'smartrotom'])
    },
    async ({ runId, affectedModules, project }) => {
      // Fix 8: bookId is a static config value — read from config instead of requiring the caller to know it
      const bookId = API_REFERENCE_BOOK_IDS[project]
      if (!bookId) {
        return { content: [{ type: 'text', text: JSON.stringify({ ok: false, reason: `No API reference book configured for project: ${project}` }) }] }
      }
      const result = await syncOpenApiDocs({ runId, affectedModules, bookId, project })
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )
}
