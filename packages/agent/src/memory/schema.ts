import { mysqlTable, varchar, text, int, datetime, json } from 'drizzle-orm/mysql-core'

export const taskRuns = mysqlTable('agent_task_runs', {
  id: varchar('id', { length: 80 }).primaryKey(),
  status: varchar('status', { length: 20 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  branch: varchar('branch', { length: 255 }),
  commitSha: varchar('commit_sha', { length: 40 }),
  failureSummary: text('failure_summary'),
  createdAt: datetime('created_at').notNull(),
  finishedAt: datetime('finished_at')
})

export const verificationResults = mysqlTable('agent_verification_results', {
  id: varchar('id', { length: 80 }).primaryKey(),
  runId: varchar('run_id', { length: 80 }).notNull(),
  stage: varchar('stage', { length: 50 }).notNull(),
  status: varchar('status', { length: 10 }).notNull(),
  failures: json('failures'),
  tracePath: varchar('trace_path', { length: 500 }),
  screenshotPaths: json('screenshot_paths'),
  durationMs: int('duration_ms'),
  createdAt: datetime('created_at').notNull()
})
