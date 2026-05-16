import { shell, REPO_ROOT } from './runner.js'
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
  const runDir = path.resolve(REPO_ROOT, `.agent-runs/${runId}`)

  fs.mkdirSync(runDir, { recursive: true })

  const args = [
    '--filter', 'web', 'exec', 'playwright', 'test',
    '--reporter=json',
    `--output=${runDir}`
  ]

  if (captureTrace) args.push('--trace=on')
  if (specPath) args.push(specPath)

  const start = Date.now()
  const result = await shell('pnpm', args)
  const durationMs = Date.now() - start

  const tracePath = captureTrace ? findTrace(runDir) : undefined
  const screenshotPaths = captureScreenshots ? findScreenshots(runDir) : []

  return {
    status: result.exitCode === 0 ? 'pass' : 'fail',
    output: result.stdout + result.stderr,
    durationMs,
    tracePath,
    screenshotPaths,
    reviewInstructions: tracePath
      ? `View trace: pnpm --filter web exec playwright show-trace "${tracePath}"\nScreenshots: ${runDir}`
      : undefined
  }
}

function findTrace(dir: string): string | undefined {
  if (!fs.existsSync(dir)) return undefined
  const entries = fs.readdirSync(dir, { recursive: true }) as string[]
  const trace = entries.find(f => f.endsWith('trace.zip'))
  return trace ? path.join(dir, trace) : undefined
}

function findScreenshots(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return (fs.readdirSync(dir, { recursive: true }) as string[])
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .map(f => path.join(dir, f))
}
