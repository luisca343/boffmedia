import { ASSET, staticAsset } from '@/lib/assets';
import { mewHuman, type MewRec } from "./mew-util"

// Shared mutable store singleton + localization + a tiny rev/subscribe bus. Kept
// separate so the normalizers (which localize) and the resolvers (which index)
// depend only on this, not on each other or the load orchestration.

export const BASE = staticAsset(ASSET.boffmedia.tools.mewgenics)

// raw wiki_data JSON is genuinely untyped external input the normalizers re-type
export type Raw = Record<string, any>
export type CatData = Record<string, MewRec[]>

export interface MewIndex {
  byCat: Record<string, Record<string, MewRec>>
  lowerChar: Record<string, MewRec>
  effect: Record<string, { kind: string; rec: MewRec }>
  abilAll: Record<string, MewRec>
}

export const store = {
  data: null as CatData | null,
  index: null as MewIndex | null,
  strings: null as Record<string, string> | null,
  lang: "en" as "es" | "en",
  rev: 0,
  promise: null as Promise<void> | null,
  allAbilities: [] as MewRec[],
  remoteState: { abilities: "idle" as "idle" | "loading" | "ready" | "error" },
  subs: new Set<() => void>(),
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
