import { eq, desc, like, and } from 'drizzle-orm'
import { getDb } from './db.js'
import { taskRuns } from './schema.js'
import type { TaskRun, SaveRunInput } from '../shared/types.js'

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

  return rows.map(r => ({
    id: r.id,
    status: r.status as TaskRun['status'],
    title: r.title,
    branch: r.branch ?? undefined,
    commitSha: r.commitSha ?? undefined,
    failureSummary: r.failureSummary ?? undefined,
    createdAt: r.createdAt,
    finishedAt: r.finishedAt ?? undefined
  }))
}
