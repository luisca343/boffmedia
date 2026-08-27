/**
 * pool.ts — N worker isolates over one pack stack, a queue in front of them,
 * and a cache behind them.
 *
 * Every worker loads the *same* stack independently. That is N times the parse
 * cost and N times the memory, and it is unavoidable rather than sloppy:
 * deepslate's registries are module-global, so a stack cannot be shared between
 * isolates, and `structuredClone` of a built evaluator is not a thing. Measured
 * at ~50 ms of registry build per worker, four workers cost ~200 ms once —
 * against tiles that cost seconds, and there are many tiles.
 *
 * ## The queue
 *
 * Tasks wait here, on the main thread, rather than inside each worker. Comlink
 * calls cannot be cancelled once dispatched, so a worker-side queue would need
 * its own cancel protocol; keeping tasks here until a worker is free means "the
 * user panned away" is a splice, not a message. Waiting tasks are also ordered
 * by distance from wherever the user is looking, so a pan fills the middle of
 * the screen first instead of whichever corner Leaflet happened to ask for
 * first. What cannot be cancelled either way is the tile already running — that
 * one finishes and is discarded by generation.
 *
 * ## The cache
 *
 * A sampled grid is a pure function of (seed, stack, position, spacing), so it
 * never goes stale while those hold. Zooming out and back in, or panning away
 * and returning, otherwise re-derives work that cost seconds. jacobsjo's map
 * does not do this — it drops grids with the tile — and it is the single
 * cheapest win available here, because it costs nothing but memory and loses no
 * fidelity at all.
 */

import { wrap, type Remote } from "comlink";

import type {
  LoadStackResult,
  PrefilterSample,
  SeedCheck,
  SeedsWorkerApi,
  SpecEvalResult,
  TileGrid,
  TileRequest,
  WorkerPackRef,
} from "./worker/seeds-api";

/** Four matches jacobsjo/mc-datapack-map and leaves cores for the UI and paint. */
export const DEFAULT_WORKER_COUNT = 4;

/**
 * Ceiling on the pool during a search.
 *
 * Every worker is a full isolate with its own copy of the registries — ~50 ms
 * of build and tens of megabytes each — so this is a memory bound, not a
 * scheduling one. Sixteen is well past the point where a browsing session
 * benefits and still short of what a 32-thread machine would otherwise spawn.
 */
export const MAX_SEARCH_WORKERS = 16;

/** How large the pool should grow for a search on this machine. */
export function searchPoolTarget(): number {
  const cores = typeof navigator === "undefined" ? 0 : (navigator.hardwareConcurrency ?? 0);
  // Minus two: one core for the UI thread, one for the paint work the map does
  // between tiles. Never below the pool we already have.
  return Math.max(DEFAULT_WORKER_COUNT, Math.min(MAX_SEARCH_WORKERS, cores - 2));
}

/**
 * Cache budget in bytes, not entries.
 *
 * Counting entries was wrong and measurably so: a full-bleed screen is ~48
 * tiles, each of which is asked for twice (a coarse preview and the real
 * thing), so a 64-entry cache was evicted a screen and a half before the user
 * could zoom out and back. Counting bytes also self-balances across quality
 * settings — a coarse preview is 1/16 the size of a full tile and takes 1/16 of
 * the budget, instead of costing the same slot.
 *
 * 48 MB holds roughly 570 balanced tiles or 144 full-resolution ones: several
 * screenfuls across several zoom levels, which is what makes zooming out and
 * back in free.
 */
const DEFAULT_CACHE_BYTES = 48 * 1024 * 1024;

/** Bytes of typed array behind one grid: biome 2B + surfaceY 2B + water 1B. */
function gridBytes(grid: TileGrid): number {
  return grid.biome.byteLength + grid.surfaceY.byteLength + grid.water.byteLength;
}

interface QueuedTask {
  key: string;
  cacheKey: string;
  req: TileRequest;
  generation: number;
  /** Blocks from the point of interest; the queue is drained nearest-first. */
  priority: number;
  resolve: (grid: TileGrid | null) => void;
  reject: (err: unknown) => void;
}

export class SeedsPool {
  private readonly workers: Worker[] = [];
  private readonly remotes: Remote<SeedsWorkerApi>[] = [];
  private readonly idle: number[] = [];

  /**
   * Workers spawned for a search and torn down after it.
   *
   * Kept out of `workers`/`idle` deliberately, which is what makes shrinking
   * safe: the tile queue can only ever dispatch to a base worker, so an extra
   * is never terminated mid-tile. It also keeps map browsing on the four
   * workers it was measured against, rather than leaving eighteen isolates
   * resident after a search ends.
   */
  private extras: { worker: Worker; remote: Remote<SeedsWorkerApi> }[] = [];

  /**
   * What the base workers were last brought up with. Remembered so a worker
   * spawned later can be brought to the same state — a fresh isolate has no
   * registries at all, and a search dispatched to one would throw rather than
   * return a wrong answer, but only after the user had waited for it.
   */
  private lastStack: {
    refs: readonly WorkerPackRef[];
    opts: { bundleBaseUrl: string; audit?: boolean };
  } | null = null;

  private lastSeed: string | null = null;

  private queue: QueuedTask[] = [];

  /** Insertion-ordered, so the oldest key is the first `keys()` yields. */
  private cache = new Map<string, TileGrid>();
  private cacheBytes = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  /** Where the user is looking, in world coordinates. Drives queue order. */
  private focus = { x: 0, z: 0 };

  /**
   * Bumped whenever the world changes — a new seed, a new stack. Results
   * carrying an older generation are dropped rather than painted: a tile that
   * started before the seed changed is a picture of a world nobody asked about,
   * and it would otherwise land on the canvas looking authoritative.
   */
  private generation = 0;

  private disposed = false;

  constructor(
    count: number = DEFAULT_WORKER_COUNT,
    private readonly cacheBudget: number = DEFAULT_CACHE_BYTES,
  ) {
    for (let i = 0; i < count; i++) {
      const worker = new Worker(new URL("./worker/seeds.worker.ts", import.meta.url), { type: "module" });
      this.workers.push(worker);
      this.remotes.push(wrap<SeedsWorkerApi>(worker));
      this.idle.push(i);
    }
  }

  get size(): number {
    return this.workers.length;
  }

  get stats(): {
    cached: number;
    cachedBytes: number;
    hits: number;
    misses: number;
    queued: number;
    running: number;
  } {
    return {
      cached: this.cache.size,
      cachedBytes: this.cacheBytes,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      queued: this.queue.length,
      running: this.workers.length - this.idle.length,
    };
  }

  /** Tell the queue where to look first. Cheap; call it on every map move. */
  setFocus(x: number, z: number): void {
    this.focus = { x, z };
    for (const task of this.queue) task.priority = this.distanceFromFocus(task.req);
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Load the stack into every worker. Returns the first worker's result — they
   * are all building the same thing from the same bytes, so the reports agree;
   * only the timings differ, and the first is as honest as any.
   */
  async loadStack(
    refs: readonly WorkerPackRef[],
    opts: { bundleBaseUrl: string; audit?: boolean },
  ): Promise<LoadStackResult> {
    this.invalidate();
    this.lastStack = { refs, opts };
    const results = await Promise.all(
      // Only the first worker audits. `inspectPacks` is pure analysis of the
      // same files and would give four identical answers for four times the work.
      this.remotes.map((r, i) => r.loadStack(refs, { ...opts, audit: opts.audit && i === 0 })),
    );
    return results[0]!;
  }

  async forSeed(seed: string): Promise<{ seaLevel: number; ms: number }> {
    this.invalidate();
    this.lastSeed = seed;
    const results = await Promise.all(this.remotes.map((r) => r.forSeed(seed)));
    return results[0]!;
  }

  /** One point, exactly. Always worker 0 — it is milliseconds and needs no scheduling. */
  async sample(x: number, z: number, opts?: { climate?: boolean; exact?: boolean }) {
    return this.remotes[0]!.sample(x, z, opts);
  }

  /**
   * Evaluate the spec editor's current spec against one seed.
   *
   * Pinned to worker 1, not 0. The session it holds is worth tens of megabytes
   * of cached grid and only pays for itself when the *same* worker answers the
   * next edit, so it cannot be scheduled like a tile. Worker 0 is already the
   * map's — `sample` pins there for synchronous-feeling hover — and putting the
   * session there too would mean every constraint edit blocks the hover readout
   * for a second and a half.
   *
   * On a single-worker pool it falls back to worker 0, which is correct and
   * simply slower to hover; that configuration is not one the tool ships.
   *
   * A call issued while a search is running queues behind that worker's current
   * seed (~1.5 s worst case). That is accepted rather than scheduled around:
   * see DESIGN.md §4.3.
   */
  async evaluateSpec(spec: unknown, seed: string, scanKey: string): Promise<SpecEvalResult> {
    const remote = this.remotes[this.sessionWorker()];
    if (!remote) throw new Error("The worker pool has been disposed.");
    return remote.evaluateSpec(spec, seed, scanKey);
  }

  /**
   * Measure the prefilter's selectivity by running a batch of seeds through it.
   *
   * Spread across every worker except 0, in equal slices. The map keeps its
   * worker throughout — this is the same reservation a real search uses, and
   * measuring with a different worker count than the search will use would
   * produce a rate that does not predict anything.
   */
  async prefilterBatch(spec: unknown, seeds: readonly string[]): Promise<PrefilterSample> {
    const remotes = this.searchRemotes();
    if (!remotes.length) throw new Error("The worker pool has been disposed.");

    const slices: string[][] = remotes.map(() => []);
    seeds.forEach((seed, i) => slices[i % remotes.length]!.push(seed));

    const t0 = performance.now();
    const parts = await Promise.all(remotes.map((r, i) => r.prefilterBatch(spec, slices[i]!)));

    // Wall-clock across the batch, not the sum of the workers' own timings:
    // they ran concurrently, and the sum would price a search as if they had
    // not.
    return {
      tested: parts.reduce((n, p) => n + p.tested, 0),
      passed: parts.reduce((n, p) => n + p.passed, 0),
      ms: performance.now() - t0,
    };
  }

  /**
   * One seed through prefilter-then-evaluate. The search calls this directly on
   * a remote it owns, so the pool only exposes it for completeness and for the
   * single-worker case.
   */
  async checkSeed(spec: unknown, seed: string): Promise<SeedCheck> {
    const remotes = this.searchRemotes();
    const remote = remotes[0];
    if (!remote) throw new Error("The worker pool has been disposed.");
    return remote.checkSeed(spec, seed);
  }

  /**
   * Grow the pool for a search and hand back the remotes it may use.
   *
   * The extras are brought to the same stack and seed as the base workers
   * before they are returned, so the caller never has to think about a worker
   * that is present but empty. Their ~1–2 s of loading overlaps the search's
   * own first seeds, because the base workers are returned immediately and the
   * caller can start dispatching to them while this resolves.
   */
  async growForSearch(target = searchPoolTarget()): Promise<Remote<SeedsWorkerApi>[]> {
    if (this.disposed || !this.lastStack) return this.searchRemotes();

    const want = Math.max(0, target - this.workers.length - this.extras.length);
    if (want > 0) {
      const { refs, opts } = this.lastStack;
      const spawned = Array.from({ length: want }, () => {
        const worker = new Worker(new URL("./worker/seeds.worker.ts", import.meta.url), {
          type: "module",
        });
        return { worker, remote: wrap<SeedsWorkerApi>(worker) };
      });

      await Promise.all(
        spawned.map(async ({ remote }) => {
          // `audit: false` always: the audit is pure analysis of the same
          // bytes, worker 0 already did it, and it roughly doubles parse cost.
          await remote.loadStack(refs, { ...opts, audit: false });
          if (this.lastSeed) await remote.forSeed(this.lastSeed);
        }),
      );

      // Checked after the await: `dispose()` can land while the stacks load,
      // and pushing into a disposed pool would leak every one of them.
      if (this.disposed) {
        for (const { worker } of spawned) worker.terminate();
        return [];
      }
      this.extras.push(...spawned);
    }

    return this.searchRemotes();
  }

  /**
   * Give the extras back. Safe to call at any time *the caller* has no work in
   * flight on them — nothing else can, because the tile queue never dispatches
   * to an extra.
   */
  releaseSearchWorkers(): void {
    for (const { worker } of this.extras) worker.terminate();
    this.extras = [];
  }

  /** Where the editor's `Session` lives. See `evaluateSpec`. */
  private sessionWorker(): number {
    return this.workers.length > 1 ? 1 : 0;
  }

  /**
   * Every worker the map is not holding: base workers 1..n-1, plus any extras.
   *
   * Worker 0 is reserved so a tile request always has somewhere to go while a
   * search saturates the rest — a reservation, not preemption: nothing in
   * flight is ever cancelled for it, and no priority lane is added.
   */
  private searchRemotes(): Remote<SeedsWorkerApi>[] {
    const base = this.remotes.length > 1 ? this.remotes.slice(1) : this.remotes.slice(0, 1);
    return [...base, ...this.extras.map((e) => e.remote)];
  }

  /**
   * Ask for a tile. Resolves with `null` if it was cancelled or went stale — a
   * normal outcome while panning, not an error, so callers should treat it as
   * "nothing to paint" rather than something to report.
   *
   * A cache hit resolves synchronously-ish (a microtask) and never touches a
   * worker, which is what makes returning to a previous zoom instant.
   */
  requestTile(key: string, req: TileRequest): Promise<TileGrid | null> {
    // A disposed pool has no idle workers, so `pump` can never dispatch: without
    // this the task would sit in the queue and its promise would never settle,
    // Leaflet would never get its `done()`, and the map would be blank with
    // nothing anywhere saying why. That is exactly how holding a stale engine
    // presented itself. Null is the same answer a cancelled tile gets.
    if (this.disposed) return Promise.resolve(null);

    const cacheKey = cacheKeyFor(req);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.cacheHits++;
      // Re-insert so it counts as recently used; Map preserves insertion order,
      // which is the whole LRU mechanism here.
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      return Promise.resolve(cached);
    }
    this.cacheMisses++;

    return new Promise<TileGrid | null>((resolve, reject) => {
      this.queue.push({
        key,
        cacheKey,
        req,
        generation: this.generation,
        priority: this.distanceFromFocus(req),
        resolve,
        reject,
      });
      this.queue.sort((a, b) => a.priority - b.priority);
      this.pump();
    });
  }

  /** Drop a queued tile. A tile already running is left to finish and cached. */
  cancelTile(key: string): void {
    this.queue = this.queue.filter((task) => {
      if (task.key !== key) return true;
      task.resolve(null);
      return false;
    });
  }

  /**
   * Abandon everything queued and forget every cached grid — a new seed or a new
   * pack stack. The cache is keyed by position and spacing only, deliberately:
   * folding the seed into the key would let two worlds share a cache and grow it
   * without bound, and nobody flips between seeds fast enough to benefit.
   */
  invalidate(): void {
    this.generation++;
    for (const task of this.queue) task.resolve(null);
    this.queue = [];
    this.cache.clear();
    this.cacheBytes = 0;
  }

  private distanceFromFocus(req: TileRequest): number {
    const half = (req.samples * req.step) / 2;
    return Math.hypot(req.x0 + half - this.focus.x, req.z0 + half - this.focus.z);
  }

  private pump(): void {
    while (this.idle.length > 0 && this.queue.length > 0 && !this.disposed) {
      const workerId = this.idle.pop()!;
      const task = this.queue.shift()!;
      void this.run(workerId, task);
    }
  }

  private async run(workerId: number, task: QueuedTask): Promise<void> {
    try {
      const grid = await this.remotes[workerId]!.computeTile(task.req);

      // Cached even when stale. It cost seconds, it is still a correct answer
      // for its own (position, spacing) — and if the generation moved on, the
      // next `invalidate` will clear it anyway.
      if (task.generation === this.generation) this.remember(task.cacheKey, grid);

      task.resolve(task.generation === this.generation ? grid : null);
    } catch (err) {
      // A disposed pool tears its workers down mid-call; that is not a failure
      // anyone needs told about.
      if (this.disposed) task.resolve(null);
      else task.reject(err);
    } finally {
      if (!this.disposed) {
        this.idle.push(workerId);
        this.pump();
      }
    }
  }

  private remember(key: string, grid: TileGrid): void {
    if (this.cache.has(key)) return;
    this.cache.set(key, grid);
    this.cacheBytes += gridBytes(grid);

    while (this.cacheBytes > this.cacheBudget) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      const evicted = this.cache.get(oldest)!;
      this.cache.delete(oldest);
      this.cacheBytes -= gridBytes(evicted);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.releaseSearchWorkers();
    this.invalidate();
    for (const worker of this.workers) worker.terminate();
    this.workers.length = 0;
    this.remotes.length = 0;
    this.idle.length = 0;
  }
}

/**
 * What makes two requests the same sampling job. Position and spacing only —
 * seed and pack stack are handled by clearing the whole cache, because they
 * change rarely and change everything.
 */
function cacheKeyFor(req: TileRequest): string {
  return `${req.x0}|${req.z0}|${req.samples}|${req.step}|${req.water ?? "auto"}`;
}
