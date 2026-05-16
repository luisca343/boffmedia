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

export function registerTools(server: McpServer) {

  server.tool(
    'begin_task',
    'CALL THIS FIRST before any code changes. Registers the task, loads relevant codebase context, and retrieves prior run history. Returns the step-by-step workflow to follow for this session, including the runId you must pass to all subsequent tools. Every task must start here and end with save_run.',
    {
      title: z.string().describe('Short human-readable task title'),
      taskDescription: z.string().describe('Full description of what needs to be done'),
      taskType: z.enum(['feature', 'ui-ux', 'refactor', 'bugfix']).default('feature').describe('Type of task — drives whether Playwright is included in the workflow')
    },
    async ({ title, taskDescription, taskType }) => {
      const runId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now()}`
      await saveRun({ runId, status: 'running', title })

      const [context, history] = await Promise.all([
        resolveContext({ taskDescription, maxFiles: 20 }),
        getRunHistory({ limit: 5, similarTo: title, status: 'all' })
      ])

      const playwrightStep = taskType === 'ui-ux'
        ? `4b. Call run_playwright (runId: "${runId}") — trace + screenshots. Present reviewInstructions to the user before proceeding to step 5.`
        : `4b. Skip run_playwright unless you made UI changes.`

      const workflow = `
# Boff Agent — Task Started

runId: ${runId}
title: ${title}
taskType: ${taskType}

## Workflow (follow in order)

1. ✅ begin_task — done
2. Call check_guardrails with every file path you intend to write or modify. Stop if violations are returned.
3. Make your code changes using your own file editing tools.
4a. Call run_verification (runId: "${runId}") to run lint + tests. Fix failures before proceeding.
${playwrightStep}
5. Call save_run (runId: "${runId}", status: "passed" | "failed") to close the task.

Do not skip steps. Do not call save_run before run_verification passes.

## Prior runs on similar tasks
${history.length > 0 ? JSON.stringify(history, null, 2) : 'No prior runs found.'}

## Codebase context
Modules: ${context.moduleList.join(', ')}
Pages: ${context.pageList.join(', ')}
Conventions: loaded (${context.totalTokenEstimate} token estimate for full context)
${context.conventions ? '\n' + context.conventions : ''}
`.trim()

      return { content: [{ type: 'text', text: workflow }] }
    }
  )

  server.tool(
    'check_guardrails',
    'CALL THIS BEFORE WRITING ANY FILES — step 2 of the workflow. Check whether file paths violate protected path rules from .agent-ignore. If any violations are returned, do not write those files and inform the user.',
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
    'CALL THIS LAST — step 5 of the workflow. Persists the final run status after run_verification completes. Every task started with begin_task must be closed with save_run. Use the runId returned by begin_task.',
    {
      runId: z.string().describe('The runId returned by begin_task'),
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
    'Given a task description, return the most relevant files from the codebase. Already called automatically by begin_task — use this only if you need to refresh context mid-task.',
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
}
