import { shell } from './runner.js'
import type { VerificationResult, ToolResult } from '../shared/types.js'

interface VerificationInput {
  runId: string
  apps?: ('api' | 'web')[]
  skipStages?: ('lint' | 'jest_unit' | 'jest_e2e')[]
}

export async function runVerification(input: VerificationInput): Promise<VerificationResult> {
  const { runId, apps = ['api', 'web'], skipStages = [] } = input
  const start = Date.now()
  const stages: VerificationResult['stages'] = {}
  const failures: string[] = []

  if (!skipStages.includes('lint')) {
    const s = Date.now()
    const r = await shell('lint.sh', [apps.join(',')])
    stages.lint = {
      status: r.exitCode === 0 ? 'pass' : 'fail',
      output: r.stdout + r.stderr,
      durationMs: Date.now() - s
    }
    if (stages.lint.status === 'fail') {
      failures.push(`Lint failed:\n${stages.lint.output.slice(0, 2000)}`)
      return buildResult('fail', stages, failures, runId, Date.now() - start)
    }
  }

  if (!skipStages.includes('jest_unit')) {
    const s = Date.now()
    const r = await shell('pnpm', ['--filter', 'api', 'test', '--passWithNoTests'])
    stages.jestUnit = {
      status: r.exitCode === 0 ? 'pass' : 'fail',
      output: r.stdout + r.stderr,
      durationMs: Date.now() - s
    }
    if (stages.jestUnit.status === 'fail') {
      failures.push(`Jest unit failed:\n${stages.jestUnit.output.slice(0, 2000)}`)
      return buildResult('fail', stages, failures, runId, Date.now() - start)
    }
  }

  if (!skipStages.includes('jest_e2e')) {
    const s = Date.now()
    const r = await shell('pnpm', ['--filter', 'api', 'test:e2e', '--passWithNoTests'])
    stages.jestE2e = {
      status: r.exitCode === 0 ? 'pass' : 'fail',
      output: r.stdout + r.stderr,
      durationMs: Date.now() - s
    }
    if (stages.jestE2e.status === 'fail') {
      failures.push(`Jest e2e failed:\n${stages.jestE2e.output.slice(0, 2000)}`)
    }
  }

  const allPassed = Object.values(stages).every((r): r is ToolResult => r?.status === 'pass')
  return buildResult(allPassed ? 'pass' : failures.length > 0 ? 'fail' : 'partial', stages, failures, runId, Date.now() - start)
}

function buildResult(
  status: VerificationResult['status'],
  stages: VerificationResult['stages'],
  failures: string[],
  runId: string,
  durationMs: number
): VerificationResult {
  return { status, stages, failures, runId, durationMs }
}
