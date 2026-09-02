import { mewAssetUrl } from "./asset"
import { mewHuman, type MewRec } from "./mew-util"

// Shared mutable store singleton + localization + a tiny rev/subscribe bus. Kept
// separate so the normalizers (which localize) and the resolvers (which index)
// depend only on this, not on each other or the load orchestration.

/** Publish stamp of the loaded dataset (manifest.version), or "" before the
 *  manifest arrives. The extractor rewrites every file in place at the same
 *  paths, so without this a browser keeps serving the previous build from
 *  cache — which is how freshly fixed cat equipment stayed invisible. */
let datasetVersion = ""

export function setMewDatasetVersion(v: string | undefined) {
  if (v && v !== datasetVersion) datasetVersion = v
}

/** The loaded dataset's publish stamp, or "" before `manifest.json` (or the
 *  remembered fallback) has landed. The dataset snapshot cache keys on this. */
export function getMewDatasetVersion(): string {
  return datasetVersion
}

/** Resolve a dataset file under the Mewgenics asset prefix. A joiner, not a
 *  bare prefix: the prefix carries no trailing slash, so concatenating onto it
 *  silently produces `/boffmedia/tools/mewgenicsitems.json`. */
export const mewUrl = (path: string) => {
  const url = mewAssetUrl(path)
  return datasetVersion ? `${url}?v=${datasetVersion}` : url
}

// raw wiki_data JSON is genuinely untyped external input the normalizers re-type
export type Raw = Record<string, any>
export type CatData = Record<string, MewRec[]>

export interface MewIndex {
  byCat: Record<string, Record<string, MewRec>>
  lowerChar: Record<string, MewRec>
  effect: Record<string, { kind: string; rec: MewRec }>
  /** shop id → every item id it can stock (its pool slots, resolved). */
  shopStock?: Record<string, string[]>
  abilAll: Record<string, MewRec>
  keywordAppliedBy?: Record<string, MewRec[]> // keyword id → abilities that apply it
  passiveGrantedBy?: Record<string, { kind: string; recs: MewRec[] }> // passive id → {kind, recs} that grant it
  classToCharacters?: Record<string, MewRec[]> // class id → characters of that class
  abilityUsedBy?: Record<string, { chars: MewRec[]; classes: MewRec[] }> // ability id → {chars, classes} that use it
  itemToSources?: Record<string, { pools: MewRec[]; shops: MewRec[] }> // item id → {pools, shops}
  characterToMaps?: Record<string, MewRec[]> // character id → maps containing them
  mapToMusic?: Record<string, MewRec | null> // map id → music record
}

/** Per-item source counts, keyed by item id. Its own alias because
 *  `dataset-cache.ts` needs the exact shape to type the persisted snapshot. */
export type MewItemSources = Record<
  string,
  { from_pools?: string[]; from_shops?: string[]; from_pools_count?: number; from_shops_count?: number; total_source_count?: number }
> | null

export const store = {
  data: null as CatData | null,
  index: null as MewIndex | null,
  strings: null as Record<string, string> | null,
  lang: "en" as "es" | "en",
  rev: 0,
  promise: null as Promise<void> | null,
  allAbilities: [] as MewRec[],
  remoteState: { abilities: "idle" as "idle" | "loading" | "ready" | "error", extras: "idle" as "idle" | "loading" | "ready" | "error" },
  subs: new Set<() => void>(),
  itemSources: null as MewItemSources,
}

export function emit() {
  store.rev++
  store.subs.forEach((f) => {
    try { f() } catch { /* noop */ }
  })
}
export function subscribe(fn: () => void) {
  store.subs.add(fn)
  return () => { store.subs.delete(fn) }
}

/** Resolve a localisation key → Spanish → provided English fallback → humanized id. */
export function T(key?: string, fallback?: string): string {
  if (key && store.strings) {
    const v = store.strings[key]
    if (v != null && v !== "") return String(v).replace(/\r/g, "")
  }
  if (fallback != null && fallback !== "") return String(fallback).replace(/\r/g, "")
  return key ? mewHuman(key) : ""
}
