/**
 * Where battlesim keeps things between visits.
 *
 * One namespace for the whole tool — the kit scopes a store by the tool's id,
 * not by the kind of thing in it — and collections inside it. That is the shape
 * `ToolDb` actually has: `get(collection, id)` / `put(collection, id, value)`,
 * with `list(collection)` returning most-recent-first. A store per kind would
 * mean three namespaces the host has to provision for one tool, and the outbox
 * below could then only cover one of them.
 *
 * Backed by IndexedDB on the web and SQLite in the launcher; the tool does not
 * care which, and must not: everything here has to work with no network and no
 * account, which is the whole point of keeping replays and teams local first.
 */

import { toolDb, toolOutbox, toolStorage } from "@boffmedia/tool-kit";
import type { ReplayRecord, TeamRecord } from "@boffmedia/battle-core";

/** The tool id, which is what the kit keys a store on. */
export const BATTLESIM_STORE = "pokemon.battlesim";

export const COLLECTION = {
  teams: "teams",
  replays: "replays",
} as const;

export const battlesimDb = () => toolDb(BATTLESIM_STORE);

/**
 * Queued writes for when an account is attached and the API is reachable.
 *
 * Every op here carries the WHOLE final state of one document and sets a
 * `dedupeKey`, so a row edited five times offline uploads once. An op meaning
 * "add one" must never be queued this way — see `ToolOutboxOp.dedupeKey`.
 */
export const battlesimOutbox = () => toolOutbox(BATTLESIM_STORE);

// ── replays ─────────────────────────────────────────────────────────────────

export async function listReplays(): Promise<ReplayRecord[]> {
  const docs = await battlesimDb().list<ReplayRecord>(COLLECTION.replays);
  return docs.map((d) => d.value);
}

export async function getReplay(id: string): Promise<ReplayRecord | null> {
  return battlesimDb().get<ReplayRecord>(COLLECTION.replays, id);
}

export async function saveReplay(record: ReplayRecord): Promise<void> {
  await battlesimDb().put(COLLECTION.replays, record.id, record);
}

export async function removeReplay(id: string): Promise<void> {
  await battlesimDb().remove(COLLECTION.replays, id);
}

// ── teams ───────────────────────────────────────────────────────────────────

export async function listTeams(): Promise<TeamRecord[]> {
  const docs = await battlesimDb().list<TeamRecord>(COLLECTION.teams);
  // Tombstones stay on disk so a delete can be told to the server later; they
  // are not something the UI should ever show.
  return docs.map((d) => d.value).filter((t) => !t.deletedAt);
}

/**
 * One team by id, tombstones included.
 *
 * The editor's autosave reads the stored row before every write, and doing
 * that through `listTeams` meant decoding the player's whole shelf three times
 * a second. A point read is what the store is for.
 */
export async function getTeam(clientId: string): Promise<TeamRecord | null> {
  return battlesimDb().get<TeamRecord>(COLLECTION.teams, clientId);
}

export async function saveTeam(record: TeamRecord): Promise<void> {
  await battlesimDb().put(COLLECTION.teams, record.clientId, record);
}

// ── preferences ─────────────────────────────────────────────────────────────
//
// `toolStorage`, not the db: these are single scalars (the last format picked,
// the debug flag), and a document store would give each one an id, a timestamp
// and a collection it does not need.

const PREF_PREFIX = "battlesim.";

export async function getPref<T>(key: string): Promise<T | null> {
  return toolStorage().get<T>(PREF_PREFIX + key);
}

export async function setPref(key: string, value: unknown): Promise<void> {
  await toolStorage().set(PREF_PREFIX + key, value);
}
