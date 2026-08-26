/**
 * search.ts — run many seeds past one spec, and report as it goes.
 *
 * This is the piece the CLI could not lend us: its `search.mjs` is Node
 * `worker_threads`, so the orchestration ideas port and the code does not.
 *
 * The shape is deliberately not a queue. Each worker runs its own loop —
 * *take the next seed, await it, repeat* — which gives backpressure for free
 * (a worker asks for work exactly when it can do work) and makes stopping
 * trivial: stop handing out seeds and ignore what lands. There is nothing to
 * cancel, because a seed check holds no state.
 *
 * Three things are load-bearing:
 *
 * - **Worker 0 is never used.** `pool.growForSearch()` returns workers 1..n-1
 *   plus the extras it spawned, so a map tile always has somewhere to go while
 *   a search runs. That costs ~25% of throughput on a four-core machine and is
 *   the deliberate trade recorded as D2.
 * - **The ETA is measured, not predicted.** The published baselines turned out
 *   to be ~2× conservative in a real browser, so once enough seeds have been
 *   checked the estimate comes from this run's own observed rate. A prediction
 *   that disagrees with the thing it is predicting is worse than no prediction.
 * - **Updates are batched.** A saturating prefilter rejects hundreds of seeds a
 *   second; a `setState` per seed would spend the machine on React instead of
 *   on worldgen.
 */

import type { SeedsPool } from "./pool";
import type { SpecEvalResult } from "./worker/seeds-api";

/** How often the UI hears about progress, however fast seeds are going by. */
const FLUSH_MS = 250;

/**
 * Seeds to check before the ETA switches from the published baseline to this
 * run's own rate. Small, because the first surviving seed dominates the average
 * and one is usually along within a few dozen.
 */
const CALIBRATION_SEEDS = 24;

/** Hits kept. Beyond this the tail is worse than what is already listed. */
export const MAX_HITS = 200;

/**
 * Per-worker, per-second, from the CLI's 18-thread figures scaled by the 1.35×
 * advantage the browser measured. Used only until this run has its own numbers
 * — and measured at 2× these in practice, so they are a floor, not a forecast.
 */
export const BASELINE = { prefilterPerWorker: 26, evalPerWorker: 0.7 };

export interface SearchProgress {
  readonly running: boolean;
  readonly total: number;
  readonly checked: number;
  /** Seeds that survived the prefilter and were fully evaluated. */
  readonly evaluated: number;
  readonly hits: number;
  /**
   * Hits that ranked below the kept `MAX_HITS`. Part of the snapshot rather
   * than a getter to read alongside it: a getter is read at a different
   * instant from the counts it belongs to, so a late insert could put a
   * `dropped` on screen that no listed total accounts for.
   */
  readonly dropped: number;
  readonly elapsedMs: number;
  /** Null until there is something honest to say. */
  readonly etaMs: number | null;
  readonly workers: number;
  readonly error: string | null;
  /**
   * Per-constraint failure tallies summed over every evaluated seed, with each
   * type's share of the total failures. What the attrition report renders:
   * which constraint is doing the rejecting.
   */
  readonly attrition: Readonly<Record<string, { count: number; percentage: number }>> | null;
}

export const IDLE_PROGRESS: SearchProgress = {
  running: false,
  total: 0,
  checked: 0,
  evaluated: 0,
  hits: 0,
  dropped: 0,
  elapsedMs: 0,
  etaMs: null,
  workers: 0,
  error: null,
  attrition: null,
};

/**
 * How many search workers can actually be running arithmetic at once.
 *
 * Checking a seed is pure computation — noise sampling and density functions,
 * never waiting on disk or network — so parallelism is capped by cores, not by
 * how many workers exist. Past that the OS time-slices them: each goes
 * proportionally slower and the total stands still.
 *
 * One core is held back for the main thread, which has to paint the UI and the
 * map while this runs. When the browser will not report a core count, no cap is
 * applied — a wrong cap would be worse than none.
 */
export function effectiveWorkers(pool: number, cores: number): number {
  const searching = Math.max(1, pool - 1); // worker 0 is the map's
  if (cores <= 0) return searching;
  return Math.min(searching, Math.max(1, cores - 1));
}

/**
 * Estimate before a search starts.
 *
 * Two things decide whether this is honest, and both were wrong once:
 *
 * **Whether the spec HAS a prefilter.** Without one there is no cheap first
 * pass and every seed pays for a full evaluation, so `survivorRate` is 1 and
 * the prefilter term is zero. Teras carries no prefilter, and assuming the
 * worked example's 0.32 there under-counted full evaluations threefold.
 *
 * **What one evaluation actually costs for THIS spec.** A single global
 * constant cannot serve both a one-location spec and a 21-location one with a
 * walking-distance BFS in it; the two differ by more than an order of
 * magnitude. `perSeedMs`, when the editor has timed a cold evaluation, is that
 * spec measured on this machine and beats any constant. `BASELINE` is only the
 * fallback for before anything has been measured.
 *
 * `cores` matters: without it this divides by the worker count forever and
 * promises a speed-up the machine cannot deliver — the estimate kept falling as
 * the slider went past the core count, directly contradicting the warning
 * printed next to it.
 */
export function estimateMs(
  total: number,
  workers: number,
  survivorRate = 0.32,
  cores = 0,
  opts: { prefiltered?: boolean; perSeedMs?: number | null } = {},
): number {
  const searching = effectiveWorkers(workers, cores);
  const prefiltered = opts.prefiltered ?? true;
  const survivors = prefiltered ? survivorRate : 1;

  if (opts.perSeedMs && opts.perSeedMs > 0) {
    // A measured evaluation replaces the eval baseline; the prefilter pass, if
    // there is one, is still the cheap constant — it is a different code path
    // and the meter beside it measures that one directly.
    const prefilter = prefiltered ? total / (BASELINE.prefilterPerWorker * searching) : 0;
    return prefilter * 1000 + (total * survivors * opts.perSeedMs) / searching;
  }

  const prefilter = prefiltered ? total / (BASELINE.prefilterPerWorker * searching) : 0;
  const evaluation = (total * survivors) / (BASELINE.evalPerWorker * searching);
  return (prefilter + evaluation) * 1000;
}

/**
 * `getRandomValues` fills at most 65536 BYTES per call and throws
 * QuotaExceededError past that, so a Java long being 8 bytes puts the ceiling
 * at 8192 seeds in one go — every search larger than that must be filled in
 * chunks.
 */
const SEEDS_PER_DRAW = 8192;

/** A crypto-random Java long, as a decimal string. */
function randomSeeds(n: number): string[] {
  const buf = new BigUint64Array(n);
  for (let i = 0; i < n; i += SEEDS_PER_DRAW) {
    crypto.getRandomValues(buf.subarray(i, Math.min(i + SEEDS_PER_DRAW, n)));
  }
  // Reinterpreted as signed: Minecraft seeds are Java longs, and drawing only
  // from the non-negative half would search half the worlds that exist.
  return Array.from(buf, (v) => BigInt.asIntN(64, v).toString());
}

/** Whether a core spec declares a prefilter — `scan.prefilter` with locations. */
export function hasPrefilter(spec: unknown): boolean {
  const scan = (spec as { scan?: { prefilter?: unknown } } | null)?.scan;
  return Boolean(scan && scan.prefilter);
}

export interface SeedSearchOptions {
  pool: SeedsPool;
  /** The core spec, already serialised. */
  spec: unknown;
  total: number;
  survivorRate?: number;
  /** A cold evaluation of this spec, timed by the editor. See `estimateMs`. */
  perSeedMs?: number | null;
  /** Total pool size to grow to. One of them stays reserved for the map. */
  workerTarget?: number;
  onProgress: (p: SearchProgress) => void;
  onHits: (hits: SpecEvalResult[]) => void;
}

export class SeedSearch {
  private stopped = false;
  private started = 0;
  private issued = 0;
  private checked = 0;
  private evaluated = 0;
  private workers = 0;
  private error: string | null = null;

  /** Ranked best-first, capped at `MAX_HITS`. */
  private hits: SpecEvalResult[] = [];
  private dropped = 0;

  private seeds: string[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private dirty = false;
  private attritionCounts: Record<string, number> = {};

  constructor(private readonly opts: SeedSearchOptions) {}

  get hitList(): readonly SpecEvalResult[] {
    return this.hits;
  }

  async run(): Promise<void> {
    const { pool, spec, total } = this.opts;

    this.started = performance.now();

    try {
      // Drawn up front rather than per worker: a fixed list is what makes
      // "checked N of M" a promise instead of an estimate, and 50k Java longs is
      // ~1 MB of strings — cheaper than the first seed's evaluation.
      this.seeds = randomSeeds(total);
      this.flushTimer = setInterval(() => this.flush(), FLUSH_MS);
      this.emit();

      const remotes = await pool.growForSearch(this.opts.workerTarget);
      if (this.stopped) return;
      this.workers = remotes.length;
      this.emit(true);

      // One independent loop per worker. `Promise.all` resolves when every loop
      // has run out of seeds or been stopped.
      await Promise.all(
        remotes.map(async (remote) => {
          while (!this.stopped && this.issued < this.seeds.length) {
            const seed = this.seeds[this.issued++]!;
            try {
              const check = await remote.checkSeed(spec, seed);
              if (this.stopped) return;
              this.checked++;
              if (check.prefiltered) this.evaluated++;
              // Only passing seeds are hits: the spec IS the filter, and a
              // ranked list of seeds that failed it would rank nothing.
              if (check.result?.pass) this.insert(check.result);
              if (check.result?.attrition) {
                for (const [type, a] of Object.entries(check.result.attrition)) {
                  this.attritionCounts[type] = (this.attritionCounts[type] ?? 0) + a.count;
                }
              }
              this.dirty = true;
            } catch (e) {
              // One worker dying should not take the search with it — the
              // others keep going and the count simply stops rising for this
              // loop. A disposed pool arrives here too, and is not news.
              if (!this.stopped) this.error = e instanceof Error ? e.message : String(e);
              return;
            }
          }
        }),
      );
    } catch (e) {
      // Anything that fails before the worker loops — drawing the seed list,
      // growing the pool — is still a failed search and has to reach the
      // panel. `run` is called as a floating promise, so a throw that is not
      // recorded here is a search that silently never starts.
      if (!this.stopped) this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.finish();
    }
  }

  stop(): void {
    this.stopped = true;
    this.finish();
  }

  private finish(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.stopped = true;
    // Extras go back even on the error path: eighteen isolates left resident
    // after a failed search is the same leak as after a successful one.
    this.opts.pool.releaseSearchWorkers();
    this.flush();
    this.emit(true);
  }

  /** Bounded insert, best-first. */
  private insert(hit: SpecEvalResult): void {
    let lo = 0;
    let hi = this.hits.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.hits[mid]!.score >= hit.score) lo = mid + 1;
      else hi = mid;
    }
    if (lo >= MAX_HITS) {
      this.dropped++;
      return;
    }
    this.hits.splice(lo, 0, hit);
    if (this.hits.length > MAX_HITS) {
      this.hits.length = MAX_HITS;
      this.dropped++;
    }
  }

  private flush(): void {
    if (!this.dirty) return;
    this.dirty = false;
    // A copy, because the array is mutated in place by `insert` and React
    // compares by identity.
    this.opts.onHits(this.hits.slice());
    this.emit();
  }

  private emit(force = false): void {
    if (this.flushTimer === null && !force) return;
    const elapsedMs = performance.now() - this.started;
    this.opts.onProgress({
      running: !this.stopped,
      total: this.seeds.length,
      checked: this.checked,
      evaluated: this.evaluated,
      hits: this.hits.length,
      dropped: this.dropped,
      elapsedMs,
      etaMs: this.eta(elapsedMs),
      workers: this.workers,
      error: this.error,
      attrition: this.attritionSnapshot(),
    });
  }

  private attritionSnapshot(): SearchProgress["attrition"] {
    const entries = Object.entries(this.attritionCounts);
    if (!entries.length) return null;
    const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
    const out: Record<string, { count: number; percentage: number }> = {};
    for (const [type, count] of entries) out[type] = { count, percentage: (count / total) * 100 };
    return out;
  }

  private eta(elapsedMs: number): number | null {
    const remaining = this.seeds.length - this.checked;
    if (remaining <= 0 || this.stopped) return null;

    // Observed rate once there is one worth trusting; the baseline before that,
    // so the figure never jumps from nothing to a number.
    if (this.checked >= CALIBRATION_SEEDS && elapsedMs > 0) {
      return (remaining / (this.checked / elapsedMs)) | 0;
    }
    if (!this.workers) return null;
    const survivors = this.checked ? this.evaluated / this.checked : (this.opts.survivorRate ?? 0.32);
    const cores = typeof navigator === "undefined" ? 0 : (navigator.hardwareConcurrency ?? 0);
    const prefiltered = hasPrefilter(this.opts.spec);
    // `+ 1` because `estimateMs` is quoted for a POOL, worker 0 included, which
    // is what the panel passes before a search starts. The two only agree while
    // the pool granted matches the pool asked for; the panel is what says so
    // when they part company.
    return estimateMs(remaining, this.workers + 1, survivors, cores, {
      prefiltered,
      perSeedMs: this.opts.perSeedMs ?? null,
    });
  }
}
