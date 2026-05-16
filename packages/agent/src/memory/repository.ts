import { eq, desc, like, and, inArray } from 'drizzle-orm'
import { getDb } from './db.js'
import { taskRuns, metricsSnapshots } from './schema.js'
import type { TaskRun, SaveRunInput, PerformanceDelta } from '../shared/types.js'

export async function saveRun(input: SaveRunInput): Promise<void> {
  const db = await getDb()
  const now = new Date()

  const existing = await db
    .select()
    .from(taskRuns)
    .where(eq(taskRuns.id, input.runId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(taskRuns)
      .set({
        status: input.status,
        branch: input.branch,
        commitSha: input.commitSha,
        failureSummary: input.failureSummary,
        finishedAt: input.status !== 'running' ? now : undefined
      })
      .where(eq(taskRuns.id, input.runId))
  } else {
    await db.insert(taskRuns).values({
      id: input.runId,
      status: input.status,
      title: input.title,
      branch: input.branch,
      commitSha: input.commitSha,
      failureSummary: input.failureSummary,
      createdAt: now,
      finishedAt: input.status !== 'running' ? now : undefined
    })
  }
}

type MetricKey = 'apiP95LatencyMs' | 'dbQueriesPerRequest' | 'memoryUsageMb' | 'apiErrorRate'

const METRIC_THRESHOLDS: Record<MetricKey, number> = {
  apiP95LatencyMs: 0.2,
  dbQueriesPerRequest: 0.5,
  memoryUsageMb: 0.3,
  apiErrorRate: 0.005
}

function computeDeltas(
  before: Record<MetricKey, number | null>,
  after: Record<MetricKey, number | null>
): PerformanceDelta[] {
  const deltas: PerformanceDelta[] = []
  for (const [metric, threshold] of Object.entries(METRIC_THRESHOLDS) as [MetricKey, number][]) {
    const b = before[metric]
    const a = after[metric]
    if (b == null || a == null || b === 0) continue
    const delta = (a - b) / b
    if (Math.abs(delta) > threshold) {
      deltas.push({
        metric,
        before: b,
        after: a,
        deltaPercent: Math.round(delta * 100)
      })
    }
  }
  return deltas
}

export async function getRunHistory(input: {
  limit: number
  similarTo?: string
  status: 'passed' | 'failed' | 'all'
}): Promise<TaskRun[]> {
  const db = await getDb()

  const conditions = []
  if (input.status !== 'all') {
    conditions.push(eq(taskRuns.status, input.status))
  }
  if (input.similarTo) {
    conditions.push(like(taskRuns.title, `%${input.similarTo}%`))
  }

  const rows = await db
    .select()
    .from(taskRuns)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(taskRuns.createdAt))
    .limit(input.limit)

  if (!rows.length) return []

  // Fetch all metric snapshots for these runs in a single query (E14)
  const runIds = rows.map(r => r.id)
  const snapshots = await db
    .select()
    .from(metricsSnapshots)
    .where(inArray(metricsSnapshots.runId, runIds))

  // Group snapshots by runId and phase
  const snapshotMap = new Map<string, { before?: typeof snapshots[0]; after?: typeof snapshots[0] }>()
  for (const snap of snapshots) {
    const entry = snapshotMap.get(snap.runId) ?? {}
    if (snap.phase === 'before') entry.before = snap
    if (snap.phase === 'after') entry.after = snap
    snapshotMap.set(snap.runId, entry)
  }

  return rows.map(r => {
    const snaps = snapshotMap.get(r.id)
    let performanceDelta: PerformanceDelta[] | undefined

    if (snaps?.before && snaps?.after) {
      const before: Record<MetricKey, number | null> = {
        apiP95LatencyMs: snaps.before.apiP95LatencyMs,
        dbQueriesPerRequest: snaps.before.dbQueriesPerRequest,
        memoryUsageMb: snaps.before.memoryUsageMb,
        apiErrorRate: snaps.before.apiErrorRate
      }
      const after: Record<MetricKey, number | null> = {
        apiP95LatencyMs: snaps.after.apiP95LatencyMs,
        dbQueriesPerRequest: snaps.after.dbQueriesPerRequest,
        memoryUsageMb: snaps.after.memoryUsageMb,
        apiErrorRate: snaps.after.apiErrorRate
      }
      const deltas = computeDeltas(before, after)
      if (deltas.length) performanceDelta = deltas
    }

    return {
      id: r.id,
      status: r.status as TaskRun['status'],
      title: r.title,
      branch: r.branch ?? undefined,
      commitSha: r.commitSha ?? undefined,
      failureSummary: r.failureSummary ?? undefined,
      createdAt: r.createdAt,
      finishedAt: r.finishedAt ?? undefined,
      performanceDelta
    }
  })
}
