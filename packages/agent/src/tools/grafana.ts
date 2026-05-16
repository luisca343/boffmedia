import { randomUUID } from 'crypto'
import { eq, and } from 'drizzle-orm'
import { getDb } from '../memory/db.js'
import { metricsSnapshots } from '../memory/schema.js'
import type { MetricsSnapshot } from '../shared/types.js'

const PROM_BASE = process.env.PROMETHEUS_URL!

async function promQuery(query: string, time?: number): Promise<number | null> {
  const t = time ?? Math.floor(Date.now() / 1000)
  const url = `${PROM_BASE}/api/v1/query?query=${encodeURIComponent(query)}&time=${t}`
  const r = await fetch(url)
  const data = await r.json()
  const value = data?.data?.result?.[0]?.value?.[1]
  return value != null ? parseFloat(value) : null
}

// Used for anomaly spike detection in getErrorContext
async function promQueryRange(
  query: string,
  startMs: number,
  endMs: number,
  step = '60s'
): Promise<Array<[number, number]>> {
  const url =
    `${PROM_BASE}/api/v1/query_range` +
    `?query=${encodeURIComponent(query)}` +
    `&start=${startMs / 1000}&end=${endMs / 1000}&step=${step}`
  const r = await fetch(url)
  const data = await r.json()
  return (
    data?.data?.result?.[0]?.values?.map(([t, v]: [number, string]) => [
      t * 1000,
      parseFloat(v)
    ]) ?? []
  )
}

interface HealthResult {
  safe: boolean
  warnings: string[]
  metrics: {
    hostCpuPercent: number | null
    hostMemPercent: number | null
    diskUsedPercent: number | null
    oomEventsLastHour: number | null
  }
}

// E10: pre-task system health check (uses node_exporter + cAdvisor — no app-level metrics)
export async function checkSystemHealth(): Promise<HealthResult> {
  const [cpu, mem, disk, oom] = await Promise.all([
    promQuery('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
    promQuery('(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'),
    promQuery(
      '(1 - (node_filesystem_avail_bytes{fstype!="tmpfs",mountpoint="/"} / node_filesystem_size_bytes{fstype!="tmpfs",mountpoint="/"})) * 100'
    ),
    promQuery('sum(increase(container_oom_events_total[1h])) or vector(0)')
  ])

  const warnings: string[] = []
  if (cpu != null && cpu > 85)
    warnings.push(`CPU utilization high: ${cpu.toFixed(1)}% (threshold: 85%)`)
  if (mem != null && mem > 90)
    warnings.push(`Host memory utilization high: ${mem.toFixed(1)}% (threshold: 90%)`)
  if (disk != null && disk > 85)
    warnings.push(`Disk usage high: ${disk.toFixed(1)}% (threshold: 85%)`)
  if (oom != null && oom > 0)
    warnings.push(`${Math.round(oom)} container OOM event(s) in the last hour`)

  return {
    safe: warnings.length === 0,
    warnings,
    metrics: { hostCpuPercent: cpu, hostMemPercent: mem, diskUsedPercent: disk, oomEventsLastHour: oom }
  }
}

// E11: snapshot metrics before a run starts
export async function captureMetricsBaseline(input: {
  runId: string
  endpoints?: string[]
}): Promise<MetricsSnapshot> {
  const db = await getDb()

  // Only memoryUsageMb is available — no app-level or DB exporters in this Prometheus instance
  const snapshot: MetricsSnapshot = {
    runId: input.runId,
    capturedAt: new Date(),
    phase: 'before',
    apiErrorRate: null,
    apiP95LatencyMs: null,
    dbQueriesPerRequest: null,
    memoryUsageMb: await promQuery(
      '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024'
    )
  }

  await db.insert(metricsSnapshots).values({ id: randomUUID(), ...snapshot })
  return snapshot
}

// E11: compare metrics after a run against the pre-run baseline
export async function checkPerformanceRegression(input: { runId: string }): Promise<{
  hasRegression: boolean
  regressions: Array<{ metric: string; before: number; after: number; deltaPercent: number }>
}> {
  const db = await getDb()

  const [before] = await db
    .select()
    .from(metricsSnapshots)
    .where(
      and(
        eq(metricsSnapshots.runId, input.runId),
        eq(metricsSnapshots.phase, 'before')
      )
    )

  if (!before) return { hasRegression: false, regressions: [] }

  const afterSnapshot: MetricsSnapshot = {
    runId: input.runId,
    capturedAt: new Date(),
    phase: 'after',
    apiErrorRate: null,
    apiP95LatencyMs: null,
    dbQueriesPerRequest: null,
    memoryUsageMb: await promQuery(
      '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / 1024 / 1024'
    )
  }

  await db.insert(metricsSnapshots).values({ id: randomUUID(), ...afterSnapshot })

  type MetricKey = 'apiP95LatencyMs' | 'dbQueriesPerRequest' | 'memoryUsageMb' | 'apiErrorRate'

  const THRESHOLDS: Record<MetricKey, number> = {
    apiP95LatencyMs: 0.2,
    dbQueriesPerRequest: 0.5,
    memoryUsageMb: 0.3,
    apiErrorRate: 0.005
  }

  const regressions: Array<{ metric: string; before: number; after: number; deltaPercent: number }> = []

  for (const [metric, threshold] of Object.entries(THRESHOLDS) as [MetricKey, number][]) {
    const b = before[metric]
    const a = afterSnapshot[metric]
    if (b == null || a == null || b === 0) continue

    const delta = (a - b) / b
    if (delta > threshold) {
      regressions.push({
        metric,
        before: b,
        after: a,
        deltaPercent: Math.round(delta * 100)
      })
    }
  }

  return { hasRegression: regressions.length > 0, regressions }
}

// E12: fetch error rates and anomaly detection for a module or endpoint
export async function getErrorContext(input: {
  module?: string
  endpoint?: string
  windowMinutes?: number
}): Promise<{
  errorRate: number | null
  recentErrors: Array<{ timestamp: number; message: string; count: number }>
  anomalyDetected: boolean
}> {
  const window = input.windowMinutes ?? 60

  // Use memory pressure stall rate as infrastructure error signal (no app-level HTTP metrics available)
  const pressureWindow = `rate(node_pressure_memory_stalled_seconds_total[${window}m])`
  const pressureRecent = 'rate(node_pressure_memory_stalled_seconds_total[5m])'
  const oomQuery = `sum(increase(container_oom_events_total[${window}m]))`

  const [errorRate, recentRate, oomCount] = await Promise.all([
    promQuery(pressureWindow),
    promQuery(pressureRecent),
    promQuery(oomQuery)
  ])

  void promQueryRange  // available for future Loki integration

  const anomalyDetected =
    recentRate != null && errorRate != null && errorRate > 0 ? recentRate > errorRate * 3 : false

  const recentErrors: Array<{ timestamp: number; message: string; count: number }> = []
  if (oomCount != null && oomCount > 0) {
    recentErrors.push({
      timestamp: Date.now(),
      message: 'Container OOM events detected',
      count: Math.round(oomCount)
    })
  }

  return { errorRate, recentErrors, anomalyDetected }
}
