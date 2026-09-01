/**
 * The tracker's local store, on `@boffmedia/tool-kit`'s `db` capability.
 *
 * This replaces a Dexie database (`apps/web/src/lib/db/vgc-db.ts`, four schema
 * versions plus a hand-rolled `trackerOutbox` table). The tracker is not the
 * only tool that needs "works with no connection, syncs when there is one", and
 * it was the second implementation of it in this app — TCG Pocket's collection
 * was the first. The kit's store is that seam, so the tracker uses it and the
 * queue lives in `TrackerSyncContext` on top of `ToolOutbox`.
 *
 * What changes in practice: in the desktop app this is SQLite under the app's
 * data directory, replayed by Rust, so a session survives a webview cache clear
 * and a restart; on the web it is IndexedDB, which is the same durability Dexie
 * gave it. The queue is no longer a table the UI can see half-written.
 *
 * Two rules this module owns, because getting either wrong is silent:
 *
 * * **The store is scoped to whoever is signed in.** The Dexie database was one
 *   per device, so signing in on a shared machine handed the new account the
 *   previous player's sessions, notes and opponent names — and the first sync
 *   uploaded them. Each account gets its own namespace; signed-out work lives
 *   in its own, and only moves on an explicit claim (see `claimAnonymousData`).
 * * **A local write stamps `updatedAt`; adopting a server row does not.** That
 *   stamp is the version conflict detection compares, so a write that forgets
 *   it is a write the server can never tell is newer.
 *
 * What is deliberately NOT here: indexes. Dexie's `where('sessionId')` and
 * `orderBy('startedAt')` became in-memory filters and sorts in the hooks. A
 * tracker holds hundreds of matches, not millions, and the alternative is a
 * query language on top of a document store — a lot of machinery to avoid an
 * `Array.prototype.filter`.
 */

import { toolDb } from "@boffmedia/tool-kit";

import type { Match, Series, Session, TeamPreset } from "./types";

/** Whose tracker this is: a Boffmedia user id, or `null` for signed-out work. */
export type TrackerOwner = string | null;

/** The four collections, in FK-safe order. */
export type SyncTable = "sessions" | "matches" | "series" | "presets";

const BASE_NS = "pokemon.vgc-tracker";

/**
 * The store namespace for one owner.
 *
 * Signed-out work keeps the bare namespace — it is what every install already
 * had, so nothing written before this shipped moves or disappears.
 */
export function trackerNs(owner: TrackerOwner): string {
  return owner ? `${BASE_NS}:u${owner}` : BASE_NS;
}

// Module-level rather than React state, and deliberately so: `vgcDb` is imported
// directly by hooks, utilities and dialogs all over the tracker, and threading a
// handle through every one of them would be a large change for no gain. The
// provider sets this during ITS render, which is before any child of it reads —
// see the note where it is called.
let currentOwner: TrackerOwner = null;

export function setTrackerOwner(owner: TrackerOwner): void {
  currentOwner = owner;
}

export function getTrackerOwner(): TrackerOwner {
  return currentOwner;
}

/** The namespace the tracker is reading and writing right now. */
export function trackerNamespace(): string {
  return trackerNs(currentOwner);
}

// Bumped by every write below. Read by caches that derive from the store and
// have no other way to learn that it changed — see `useRegulationMeta`, whose
// map of matches-by-regulation otherwise survived recording a game and showed
// the player stats from before it.
let revision = 0;

export function storeRevision(): number {
  return revision;
}

/** One collection, typed. Ids are the entity's own `id`. */
export interface VgcTable<T> {
  get(id: string): Promise<T | null>;
  /** Several by id, in the order asked for; `undefined` where a row is gone. */
  getMany(ids: string[]): Promise<(T | undefined)[]>;
  /** Everything in the collection. Callers sort — see the note above. */
  all(): Promise<T[]>;
  /**
   * A LOCAL write. Stamps `updatedAt` and returns what was stored, so the
   * caller queues the same version the store holds rather than the unstamped
   * object it happened to be holding.
   */
  put(value: T): Promise<T>;
  /** Merges a partial over what is stored, stamping it. Null when it is gone. */
  update(id: string, patch: Partial<T>): Promise<T | null>;
  /** Several local writes. Stamps each. */
  putMany(values: T[]): Promise<T[]>;
  /**
   * Take rows from the server VERBATIM — no stamp.
   *
   * The server's copy already carries the stamp of whichever device wrote it,
   * and re-stamping here would tell this device's next write that it is newer
   * than a row it has never touched.
   */
  adopt(values: T[]): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Anything the tracker stores: identified, and versioned by a client clock. */
type Stored = { id: string; updatedAt?: number; clientUpdatedAt?: number };

/**
 * @param collection which of the four
 * @param owner      a FUNCTION, not a value: `vgcDb` has to follow whoever is
 *                   signed in right now, while the claim flow pins a store to
 *                   one specific account. Resolving per call serves both, and
 *                   avoids the trap of swapping a module-level owner around an
 *                   async call — the restore would run at the first `await`,
 *                   long before a loop of writes had finished.
 */
function table<T extends Stored>(
  collection: string,
  owner: () => TrackerOwner,
): VgcTable<T> {
  const db = () => toolDb(trackerNs(owner()));
  // BOTH stamps, and that matters. A row adopted from the server arrives with
  // the writing device's `clientUpdatedAt`; moving only `updatedAt` would leave
  // this device's next write claiming that older version, which the server then
  // reads as equal rather than newer — and a genuinely stale write from a third
  // device would compare equal too, and be accepted.
  const stamp = (value: T): T => {
    const at = Date.now();
    return { ...value, updatedAt: at, clientUpdatedAt: at };
  };

  const write = async (value: T): Promise<T> => {
    const stamped = stamp(value);
    await db().put(collection, stamped.id, stamped);
    revision += 1;
    return stamped;
  };

  return {
    get: (id) => db().get<T>(collection, id),
    getMany: async (ids) => {
      // One `all()` and a map, not N gets: the desktop pays an IPC round trip
      // per get, and every caller of this passes a whole import file's ids.
      const byId = new Map((await db().list<T>(collection)).map((doc) => [doc.id, doc.value]));
      return ids.map((id) => byId.get(id));
    },
    all: async () => (await db().list<T>(collection)).map((doc) => doc.value),
    put: write,
    update: async (id, patch) => {
      const current = await db().get<T>(collection, id);
      if (!current) return null;
      return write({ ...current, ...patch });
    },
    putMany: async (values) => {
      // Sequential rather than Promise.all: on the desktop each write is one
      // IPC round trip into SQLite, and firing a few hundred at once is how a
      // post-login backfill turns into a stalled webview.
      const out: T[] = [];
      for (const value of values) out.push(await write(value));
      return out;
    },
    adopt: async (values) => {
      if (!values.length) return;
      for (const value of values) await db().put(collection, value.id, value);
      revision += 1;
    },
    remove: async (id) => {
      await db().remove(collection, id);
      revision += 1;
    },
  };
}

/** The four collections for one specific owner. */
export function trackerStore(owner: TrackerOwner) {
  const pinned = () => owner;
  return {
    sessions: table<Session>("sessions", pinned),
    matches: table<Match>("matches", pinned),
    series: table<Series>("series", pinned),
    presets: table<TeamPreset>("presets", pinned),
  };
}

/** The store for whoever is signed in right now. What the whole tool uses. */
export const vgcDb = {
  sessions: table<Session>("sessions", getTrackerOwner),
  matches: table<Match>("matches", getTrackerOwner),
  series: table<Series>("series", getTrackerOwner),
  presets: table<TeamPreset>("presets", getTrackerOwner),
};

/** True when signed-out work exists and is worth offering to import. */
export async function hasAnonymousData(): Promise<boolean> {
  const anon = trackerStore(null);
  const [sessions, presets] = await Promise.all([anon.sessions.all(), anon.presets.all()]);
  return sessions.length > 0 || presets.length > 0;
}

/**
 * Move signed-out work into the account that is now signed in.
 *
 * Copy, then clear: a crash between the two leaves the data in both places,
 * which is recoverable, where clearing first and failing to write loses a
 * tournament. Ids are preserved so a row claimed on two devices converges
 * instead of duplicating.
 */
export async function claimAnonymousData(owner: string): Promise<void> {
  const anon = trackerStore(null);
  const mine = trackerStore(owner);

  const [sessions, matches, series, presets] = await Promise.all([
    anon.sessions.all(),
    anon.matches.all(),
    anon.series.all(),
    anon.presets.all(),
  ]);

  // Stamped as a fresh local write, not adopted: as far as the server is
  // concerned this account has never seen these rows, and they need a version
  // for the push that follows.
  await mine.sessions.putMany(sessions);
  await mine.matches.putMany(matches);
  await mine.series.putMany(series);
  await mine.presets.putMany(presets);

  for (const row of sessions) await anon.sessions.remove(row.id);
  for (const row of matches) await anon.matches.remove(row.id);
  for (const row of series) await anon.series.remove(row.id);
  for (const row of presets) await anon.presets.remove(row.id);
}
