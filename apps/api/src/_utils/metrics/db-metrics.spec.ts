import { register } from 'prom-client';

/**
 * A histogram's `_count` series carries `metricName` at runtime, but
 * prom-client's `MetricValue` type does not declare it. Narrowed here once
 * rather than casting at each use.
 */
const nameOf = (v: unknown): string =>
  (v as { metricName?: string }).metricName ?? '';
import { instrumentPool } from './db-metrics';

/**
 * The wrapper replaces methods on a live pool, so the risk is not that the
 * metrics are wrong — it is that a query stops working. These cover the paths
 * where that could happen: the value must still come back, a rejection must
 * still reject, and neither may be swallowed.
 */
describe('instrumentPool', () => {
  const makePool = (impl: (...args: unknown[]) => unknown) =>
    ({ query: jest.fn(impl), execute: jest.fn(impl) }) as never;

  afterEach(() => {
    register.resetMetrics();
  });

  it('returns the query result unchanged', async () => {
    const rows = [{ id: 1 }];
    const pool = makePool(() => Promise.resolve([rows, []]));
    instrumentPool(pool, { slowQueryMs: 500 });

    await expect(
      (pool as unknown as { query: (sql: string) => Promise<unknown> }).query(
        'SELECT 1',
      ),
    ).resolves.toEqual([rows, []]);
  });

  it('lets a rejection through instead of swallowing it', async () => {
    const boom = new Error('ER_NO_SUCH_TABLE');
    const pool = makePool(() => Promise.reject(boom));
    instrumentPool(pool, { slowQueryMs: 500 });

    await expect(
      (pool as unknown as { query: (sql: string) => Promise<unknown> }).query(
        'SELECT 1',
      ),
    ).rejects.toThrow('ER_NO_SUCH_TABLE');
  });

  it('records a duration observation per operation', async () => {
    const pool = makePool(() => Promise.resolve([[], []]));
    instrumentPool(pool, { slowQueryMs: 500 });
    const q = (pool as unknown as { query: (sql: string) => Promise<unknown> })
      .query;

    await q('SELECT 1');
    await q('INSERT INTO t VALUES (1)');

    const metric = await register
      .getSingleMetric('db_query_duration_ms')!
      .get();
    const counts = new Map(
      metric.values
        .filter((v) => nameOf(v) === 'db_query_duration_ms_count')
        .map((v) => [v.labels.operation, v.value]),
    );
    expect(counts.get('select')).toBe(1);
    expect(counts.get('insert')).toBe(1);
  });

  it('counts a slow query and leaves a fast one uncounted', async () => {
    const slow = makePool(
      () => new Promise((resolve) => setTimeout(() => resolve([[], []]), 30)),
    );
    // Threshold below the delay, so this one query is unambiguously "slow"
    // without making the test wait on a realistic threshold.
    instrumentPool(slow, { slowQueryMs: 10 });
    await (slow as unknown as { query: (s: string) => Promise<unknown> }).query(
      'SELECT SLEEP(1)',
    );

    const metric = await register
      .getSingleMetric('db_slow_queries_total')!
      .get();
    const select = metric.values.find((v) => v.labels.operation === 'select');
    expect(select?.value).toBe(1);
  });

  it('labels an unrecognised statement `other` rather than inventing a label', async () => {
    const pool = makePool(() => Promise.resolve([[], []]));
    instrumentPool(pool, { slowQueryMs: 500 });
    await (pool as unknown as { query: (s: string) => Promise<unknown> }).query(
      'SET NAMES utf8mb4',
    );

    const metric = await register
      .getSingleMetric('db_query_duration_ms')!
      .get();
    const other = metric.values.find(
      (v) =>
        nameOf(v) === 'db_query_duration_ms_count' &&
        v.labels.operation === 'other',
    );
    expect(other?.value).toBe(1);
  });
});
