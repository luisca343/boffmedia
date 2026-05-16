export type ToolStatus = 'pass' | 'fail' | 'skip'

export interface BookStackPage {
  title: string
  content: string
  tags: string[]
  updatedAt: string
}

export interface MetricsSnapshot {
  runId: string
  capturedAt: Date
  phase: 'before' | 'after'
  apiErrorRate: number | null
  apiP95LatencyMs: number | null
  dbQueriesPerRequest: number | null
  memoryUsageMb: number | null
}

export interface ResolvedContext {
  files: Array<{ path: string; content: string }>
  moduleList: string[]
  pageList: string[]
  conventions: string
  totalTokenEstimate: number
  bookstackPages: BookStackPage[]
}

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

export interface PerformanceDelta {
  metric: string
  before: number
  after: number
  deltaPercent: number
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
  performanceDelta?: PerformanceDelta[]
}

export interface SaveRunInput {
  runId: string
  status: 'running' | 'passed' | 'failed'
  title: string
  branch?: string
  commitSha?: string
  failureSummary?: string
}
