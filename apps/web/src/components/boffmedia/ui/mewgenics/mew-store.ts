"use client"

// Mewgenics Codex data store — public surface + load orchestration. Loads the real
// dataset from /data/mewgenics/, wires art, drives the normalizers (mew-normalize)
// and the index/resolvers (mew-resolvers) over the shared state (mew-store-state),
// lazy-loads the large abilities file, and exposes the `useMewData` hook.

import * as React from "react"
import { MEW, MEW_CATS, mewValidName, type MewCat } from "./mew-util"
import { setMewArt } from "./mew-art"
import { emit, mewUrl, store, subscribe, type CatData } from "./mew-store-state"
import { compactAbility, normCharacters, normClasses, normEvents, normItems, normKeywords, normMaps, normPassives } from "./mew-normalize"
import { buildIndex, select } from "./mew-resolvers"

export { select } from "./mew-resolvers"

// the fetch boundary handles genuinely untyped JSON; the normalizers re-type it
async function fetchJson(path: string): Promise<any> {
  const r = await fetch(mewUrl(path))
  if (!r.ok) throw new Error(path + " " + r.status)
  return r.json()
}
async function fetchJsonSoft(path: string): Promise<any> {
  try {
    const r = await fetch(mewUrl(path))
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

function loadAbilities() {
  store.remoteState.abilities = "loading"
  fetchJsonSoft("abilities.json").then((raw: any) => {
    if (!raw || !Array.isArray(raw)) { store.remoteState.abilities = "error"; emit(); return }
    const all = raw.map(compactAbility)
    store.allAbilities = all
    ;(store.data as CatData).abilities = all.filter((a) => a.named && mewValidName(a.name))
    store.remoteState.abilities = "ready"
    buildIndex()
    emit()
  })
}

function loadAll(): Promise<void> {
  if (store.promise) return store.promise
  const structural = MEW_CATS.filter((c) => c.file) as (MewCat & { file: string })[]
  store.promise = Promise.all([
    Promise.all(structural.map((c) => fetchJson(c.file).then((j) => [c.key, j] as [string, any]))),
    fetchJsonSoft("strings/es.json"),
    fetchJsonSoft("sprite_map.json"),
    fetchJsonSoft("icon_map.json"),
  ]).then(([pairs, es, spriteMapRaw, iconMap]) => {
    if (es) { store.strings = es as Record<string, string>; store.lang = "es" }
    // art maps → the shared singleton MewTile reads
    const sprites: Record<string, string> = {}
    if (spriteMapRaw) Object.entries(spriteMapRaw).forEach(([id, v]: [string, any]) => { if (v?.svg) sprites[id] = v.svg })
    setMewArt({ sprites, icons: iconMap || {} })

    const rawByKey: Record<string, any> = {}
    ;(pairs as [string, any][]).forEach(([k, j]) => { rawByKey[k] = j })
    const data: CatData = { abilities: [] }
    data.items = normItems(rawByKey.items || [])
    data.characters = normCharacters(rawByKey.characters || [], sprites)
    data.passives = normPassives(rawByKey.passives || [])
    data.keywords = normKeywords(rawByKey.keywords || [])
    data.events = normEvents(rawByKey.events || [])
    data.classes = normClasses(rawByKey.classes || [])
    data.maps = normMaps(rawByKey.maps || [])
    // drop junk-named rows (raw keys that never resolved) except events (already filtered)
    MEW_CATS.forEach((c) => {
      if (c.key === "abilities" || c.key === "events") return
      data[c.key] = (data[c.key] || []).filter((r) => mewValidName(r.name))
    })
    store.data = data
    buildIndex()
    loadAbilities()
  })
  return store.promise
}

// ── public runtime surface ───────────────────────────────────────────────────
export const MewData = {
  get data(): CatData { return store.data || {} },
  get lang() { return store.lang },
  get remoteState() { return store.remoteState },
  select,
  catBy: MEW.catBy,
  cats: MEW_CATS,
  total(): number {
    return Object.values(store.data || {}).reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0)
  },
}

export interface MewDataState { ready: boolean; error: Error | null; rev: number }

export function useMewData(): MewDataState {
  const [state, setState] = React.useState<MewDataState>(() => ({ ready: !!store.data, error: null, rev: store.rev }))
  React.useEffect(() => {
    let alive = true
    const unsub = subscribe(() => { if (alive) setState((s) => ({ ...s, rev: store.rev })) })
    if (store.data) setState((s) => ({ ...s, ready: true }))
    else loadAll().then(() => { if (alive) setState((s) => ({ ...s, ready: true, rev: store.rev })) }).catch((e) => { if (alive) setState((s) => ({ ...s, error: e as Error })) })
    return () => { alive = false; unsub() }
  }, [])
  return state
}
