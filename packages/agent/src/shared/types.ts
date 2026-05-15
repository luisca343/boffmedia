export type ToolStatus = 'pass' | 'fail' | 'skip'

export interface ToolResult {
  status: ToolStatus
  output: string
  durationMs: number
}

export interface PlaywrightToolResult extends ToolResult {
  tracePath?: string
  screenshotPaths?: string[]
  reviewInstructions?: string
}

export interface VerificationResult {
  status: 'pass' | 'fail' | 'partial'
  stages: {
    lint?: ToolResult
    jestUnit?: ToolResult
    jestE2e?: ToolResult
    playwright?: PlaywrightToolResult
  }
  failures: string[]
  runId: string
  durationMs: number
}

export interface TaskRun {
  id: string
  status: 'running' | 'passed' | 'failed'
  title: string
  branch?: string
  commitSha?: string
  failureSummary?: string
  createdAt: Date
  finishedAt?: Date
}

export interface SaveRunInput {
  runId: string
  status: 'running' | 'passed' | 'failed'
  title: string
  branch?: string
  commitSha?: string
  failureSummary?: string
}
