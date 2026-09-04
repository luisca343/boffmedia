import { Histogram, Counter } from 'prom-client';
import { Logger } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';

/**
 * Query-level observability for the mysql2 pool.
 *
 * The HTTP histogram in `metrics.middleware.ts` says a request took 3 seconds.
 * It cannot say whether that was one unindexed query or forty fast ones, which
 * is the only thing worth knowing when a route gets slow. This measures the
 * layer underneath.
 *
 * Instrumented by wrapping the pool rather than through drizzle's `logger`
 * option: that hook fires BEFORE execution and is handed no result, so it can
 * report what ran but never how long it took. Wrapping `query`/`execute` is the
 * only place in this stack where a duration exists.
 *
 * LABEL CARDINALITY IS THE TRAP HERE, and it is why the SQL text is not a
 * label. Prometheus keeps one time series per distinct label combination, and
 * query text is effectively unbounded (every `IN (?, ?, ?)` of a different
 * length is a new string) — labelling by it would grow the scrape payload
 * without limit and eventually take the metrics endpoint down. So the series
 * are labelled by operation only, which is a closed set of five, and the SQL
 * goes in the slow-query LOG line where high cardinality costs nothing.
 */

const queryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'MySQL query duration in milliseconds, by operation',
  labelNames: ['operation'],
  // Tighter at the bottom than the HTTP histogram: a query that takes 500 ms is
  // already a problem, whereas a request that takes 500 ms may be fine.
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000],
});

const slowQueryTotal = new Counter({
  name: 'db_slow_queries_total',
  help: 'Queries slower than the slow-query threshold, by operation',
  labelNames: ['operation'],
});

const queryErrorTotal = new Counter({
  name: 'db_query_errors_total',
  help: 'Queries that threw, by operation',
  labelNames: ['operation'],
});

/** The closed set the `operation` label is allowed to take. */
type Operation = 'select' | 'insert' | 'update' | 'delete' | 'other';

function operationOf(sql: string): Operation {
  // Skip leading whitespace and any leading comment drizzle may prepend.
  const head = sql.trimStart().slice(0, 6).toLowerCase();
  if (head.startsWith('select')) return 'select';
  if (head.startsWith('insert')) return 'insert';
  if (head.startsWith('update')) return 'update';
  if (head.startsWith('delete')) return 'delete';
  return 'other';
}

/**
 * Slow queries are logged with their SQL. Parameters are NOT logged: they carry
 * passwords, tokens and email addresses, and a log line is the one place those
 * are most likely to be shipped somewhere with weaker access control than the
 * database itself.
 */
function truncate(sql: string, max = 500): string {
  const flat = sql.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

export interface InstrumentOptions {
  /** Queries at or above this many ms are logged at warn. */
  slowQueryMs: number;
}

/**
 * Wrap a mysql2 pool so every query is timed. Returns the same pool object —
 * the methods are replaced in place, so anything already holding a reference
 * (drizzle included) is instrumented too.
 */
export function instrumentPool(pool: Pool, opts: InstrumentOptions): Pool {
  const logger = new Logger('DbMetrics');
  const target = pool as unknown as Record<string, unknown>;

  for (const method of ['query', 'execute'] as const) {
    const original = target[method];
    if (typeof original !== 'function') continue;
    const originalFn = original as (...args: unknown[]) => unknown;

    target[method] = function instrumented(this: unknown, ...args: unknown[]) {
      const first = args[0];
      // mysql2 accepts a string or an options object with `sql`.
      const sql =
        typeof first === 'string'
          ? first
          : typeof (first as { sql?: unknown })?.sql === 'string'
            ? ((first as { sql: string }).sql)
            : '';
      const operation = operationOf(sql);
      const start = process.hrtime.bigint();

      const finish = (failed: boolean) => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        queryDuration.observe({ operation }, ms);
        if (failed) queryErrorTotal.inc({ operation });
        if (ms >= opts.slowQueryMs) {
          slowQueryTotal.inc({ operation });
          logger.warn(
            `slow query ${ms.toFixed(1)}ms [${operation}] ${truncate(sql)}`,
          );
        }
      };

      let result: unknown;
      try {
        result = originalFn.apply(this, args);
      } catch (error) {
        // A synchronous throw (bad arguments) never becomes a promise.
        finish(true);
        throw error;
      }

      // mysql2/promise returns a thenable; the callback form does not. Only the
      // promise API is used in this codebase, but the callback path must still
      // not be broken by instrumentation, so it is passed through untimed
      // rather than wrapped incorrectly.
      if (result instanceof Promise || typeof (result as { then?: unknown })?.then === 'function') {
        return (result as Promise<unknown>).then(
          (value) => {
            finish(false);
            return value;
          },
          (error) => {
            finish(true);
            throw error;
          },
        );
      }

      return result;
    };
  }

  logger.log(
    `query metrics enabled (slow-query threshold ${opts.slowQueryMs}ms)`,
  );
  return pool;
}
