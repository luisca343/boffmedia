import { Injectable } from '@nestjs/common';

/**
 * A small in-process TTL cache for the leaderboard reads (audit A10).
 *
 * WHY THIS EXISTS. The three public leaderboard routes recompute on every
 * request, and the queries behind them are not cheap: a three-table join with
 * `GROUP BY` and six conditional aggregates over the whole progress table, with
 * no `LIMIT` on the global board. They are also `@Public()`, so nothing about
 * being logged out reduces the load. The finding says this is fine at today's
 * traffic and that the first large event will show it.
 *
 * WHAT IT CACHES, AND WHAT IT DELIBERATELY DOES NOT. It caches leaderboard
 * DATA, keyed only on which board is being read. It never caches an
 * authorization decision: `EventsFacadeService` calls `validateEventVisible`
 * BEFORE asking for a board, and that check still runs on every single
 * request. This matters — the event routes take `includePrivate` and `userId`,
 * and a cache placed one layer up, keyed on `eventId` alone, would happily
 * serve an admin's private-event board to an anonymous caller. The board rows
 * themselves depend on nothing but the event, which is why keying on the board
 * identity is correct here and would not be one layer higher.
 *
 * SINGLE INSTANCE, ON PURPOSE. This is per-process state. The API deploys as
 * one container (`docker run --name`, see `scripts/deploy/deploy.sh`), so one
 * process means one cache. THE DAY A SECOND REPLICA APPEARS this becomes N
 * independent caches: a write invalidates only the replica that served it, and
 * the others keep serving a stale board for up to `ttlMs`. That is a
 * correctness cliff, not a performance one, and open question Q9 ("will the API
 * ever run with more than one replica?") is what decides it. If the answer
 * becomes yes, this class is the thing to replace — with a shared store, or
 * with the lease-row approach `A8` used for exactly this reason — not to patch.
 */
@Injectable()
export class LeaderboardCacheService {
  private readonly store = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();

  /**
   * Short by design. Explicit invalidation on a progress write is what keeps a
   * board fresh; this TTL is only the backstop for the paths that change a
   * board WITHOUT going through `ProgressService.updateProgress` — an
   * achievement's points being edited, a participant being removed. Those are
   * admin-rate actions, so tens of seconds of staleness is the right trade
   * against enumerating every one of them and getting the list wrong.
   */
  private readonly ttlMs = 30_000;

  /**
   * A bound, so this cannot become a memory leak.
   *
   * Only boards for events that passed `validateEventVisible` are ever cached,
   * so an unknown id cannot create an entry today. The bound is defence
   * against that guarantee changing somewhere upstream without anyone
   * remembering this cache is keyed on a value that arrives in a URL.
   */
  private readonly maxEntries = 500;

  /**
   * Read through the cache, computing on a miss.
   *
   * `compute` failures are NOT cached: an error is not a value, and caching one
   * would turn a transient database blip into 30 seconds of guaranteed
   * failure for every caller.
   */
  async through<T>(key: string, compute: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }

    const value = await compute();

    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      // Oldest insertion first — Map preserves insertion order. Not an LRU,
      // and does not need to be: the bound exists to cap memory, and the
      // working set here is "events people are currently looking at".
      const oldest = this.store.keys().next();
      if (!oldest.done) this.store.delete(oldest.value);
    }

    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  /**
   * Drop every cached board.
   *
   * Deliberately not selective. A single progress write moves the participant's
   * event board AND the global board, and — through team score recomputation —
   * that event's team board. Invalidating precisely would mean deriving the
   * affected event id from a participant id, which is another query on the
   * write path to save re-running three reads that are about to be re-run
   * anyway. The cache holds at most a few hundred small entries.
   */
  invalidateAll(): void {
    this.store.clear();
  }

  /** Entry count. For tests and for a future `/health/detail`. */
  get size(): number {
    return this.store.size;
  }
}
