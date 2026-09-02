"use client"

/**
 * Persisted snapshot of the normalised dataset, so a returning player skips
 * the ~32 requests + normalisation pass that `mew-store.ts` otherwise runs on
 * every boot.
 *
 * Lives behind `toolDb('misc.mewgenics')` — SQLite on desktop, IndexedDB on
 * web — NOT `toolStorage`: that seam is `localStorage` on BOTH hosts
 * (`tool-host.ts`), capped around 5 MB and shared with the rest of the shell,
 * while this snapshot is single-digit MB. `data` is not declared in either
 * Mewgenics manifest's `requiredCapabilities`: it is a mandatory field on
 * `ToolHost` (every host that can mount a tool at all provides it — see
 * `host.ts`), so there is nothing for a host to lack; adding it there would
 * only risk hiding both tools (`Tools.tsx` gates on that list). A write that
 * fails or is too large for the host to hold is caught and logged once —
 * the tool just fetches the dataset again next time, exactly as before this
 * cache existed.
 *
 * What is deliberately NOT in the snapshot: `store.index` (rebuilt by
 * `buildIndex()` on every hydrate, snapshot or fresh fetch alike — it holds
 * records BY REFERENCE across 8+ reverse-index maps, so serialising it would
 * multiply the payload for zero gain), `store.promise` / the `mew-promise-*`
 * cache keys (in-flight state, meaningless across a reload) and `store.subs`.
 */

import { toolDb } from "@boffmedia/tool-kit"
import type { CatData, MewItemSources } from "./mew-store-state"
import type { MewRec } from "./mew-util"

const NAMESPACE = "misc.mewgenics"
const COLLECTION = "dataset"

export interface DatasetSnapshot {
  data: CatData
  allAbilities: MewRec[]
  strings: Record<string, string> | null
  itemSources: MewItemSources
  lang: "es" | "en"
}

const docId = (version: string, lang: string) => `${version}:${lang}`

let warned = false
/** One console line per session, not one per failed write — a snapshot that
 *  cannot be written is a routine (quota, offline host) event, not a crash. */
function warnOnce(action: string, err: unknown) {
  if (warned) return
  warned = true
  // eslint-disable-next-line no-console
  console.warn(`[mewgenics] dataset snapshot ${action} failed`, err)
}

/** Snapshot for (version, lang), or null on a miss OR any failure — a caller
 *  never needs to distinguish "not cached" from "cache broke". */
export async function readDatasetSnapshot(
  version: string,
  lang: "es" | "en",
): Promise<DatasetSnapshot | null> {
  if (!version) return null
  try {
    return await toolDb(NAMESPACE).get<DatasetSnapshot>(COLLECTION, docId(version, lang))
  } catch (err) {
    warnOnce("read", err)
    return null
  }
}

/** Writes the snapshot for (version, snapshot.lang) and deletes every row
 *  from an OTHER version (both langs of the current version are kept, so a
 *  player who switches locale mid-session does not re-pay the fetch). Never
 *  throws. */
export async function writeDatasetSnapshot(
  version: string,
  snapshot: DatasetSnapshot,
): Promise<void> {
  if (!version) return
  try {
    const db = toolDb(NAMESPACE)
    const id = docId(version, snapshot.lang)
    await db.put(COLLECTION, id, snapshot)
    const rows = await db.list<DatasetSnapshot>(COLLECTION)
    const stale = rows.filter((r) => r.id !== id && !r.id.startsWith(`${version}:`))
    await Promise.all(stale.map((r) => db.remove(COLLECTION, r.id).catch(() => {})))
  } catch (err) {
    // A failed or oversized write must never block the tool.
    warnOnce("write", err)
  }
}
