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
