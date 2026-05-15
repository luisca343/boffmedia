import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema.js'

type AgentDb = MySql2Database<typeof schema> & { $client: mysql.Pool }

let _db: AgentDb | null = null

export async function getDb(): Promise<AgentDb> {
  if (_db) return _db

  const url = process.env.AGENT_DATABASE_URL
  if (!url) throw new Error('AGENT_DATABASE_URL environment variable is required')

  const pool = mysql.createPool(url)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_runs (
      id VARCHAR(36) PRIMARY KEY,
      status VARCHAR(20) NOT NULL,
      title VARCHAR(255) NOT NULL,
      branch VARCHAR(255),
      commit_sha VARCHAR(40),
      failure_summary TEXT,
      created_at DATETIME NOT NULL,
      finished_at DATETIME
    )
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS verification_results (
      id VARCHAR(36) PRIMARY KEY,
      run_id VARCHAR(36) NOT NULL,
      stage VARCHAR(50) NOT NULL,
      status VARCHAR(10) NOT NULL,
      failures JSON,
      trace_path VARCHAR(500),
      screenshot_paths JSON,
      duration_ms INT,
      created_at DATETIME NOT NULL
    )
  `)

  _db = drizzle(pool, { schema, mode: 'default' }) as AgentDb
  return _db
}
