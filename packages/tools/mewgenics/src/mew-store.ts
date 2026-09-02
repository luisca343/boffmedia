"use client"

// Mewgenics Codex data store — public surface + load orchestration. Loads the real
// dataset from /data/mewgenics/, wires art, drives the normalizers (mew-normalize)
// and the index/resolvers (mew-resolvers) over the shared state (mew-store-state),
// lazy-loads the large abilities file, and exposes the `useMewData` hook.

import * as React from "react"
import { mewRead, mewWrite } from "./storage"
import { MEW, MEW_CATS, mewValidName, type MewCat } from "./mew-util"
import { setMewArt } from "./mew-art"
import { emit, getMewDatasetVersion, mewUrl, setMewDatasetVersion, store, subscribe, type CatData } from "./mew-store-state"
import { compactAbility, normCharacters, normClasses, normEvents, normFurniture, normItems, normKeywords, normMaps, normMutations, normPassives, normSets, normStoryCats, normItemPools, normShops, normWorld, normSpawns, normMusic, normWeather, normInjuries, normEliteBuffs, normProgressionUnlocks } from "./mew-normalize"
import { buildIndex, select } from "./mew-resolvers"
import { readDatasetSnapshot, writeDatasetSnapshot, type DatasetSnapshot } from "./dataset-cache"

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

/** Returns when abilities have landed (or failed) so a caller can wait for a
 *  complete `store` before snapshotting it — see `loadAll`'s dataset cache
 *  write. */
function loadAbilities(): Promise<void> {
  store.remoteState.abilities = "loading"
  return fetchJsonSoft("abilities.json").then((raw: any) => {
    if (!raw || !Array.isArray(raw)) { store.remoteState.abilities = "error"; emit(); return }
    const all = raw.map(compactAbility)
    store.allAbilities = all
    ;(store.data as CatData).abilities = all.filter((a) => a.named && mewValidName(a.name))
    store.remoteState.abilities = "ready"
    buildIndex()
    emit()
  })
}

/** Same reasoning as `loadAbilities`: returns its completion for the
 *  dataset-cache write to wait on. */
function loadExtras(): Promise<void> {
  store.remoteState.extras = "loading"
  return Promise.all([
    fetchJsonSoft("spawns.json"),
    fetchJsonSoft("music.json"),
    fetchJsonSoft("weather.json"),
    fetchJsonSoft("injuries.json"),
    fetchJsonSoft("elite_buffs.json"),
    fetchJsonSoft("progression_unlocks.json"),
    fetchJsonSoft("boss_cutscenes.json"),
  ]).then(([spawns, music, weather, injuries, eliteBuffs, progressionUnlocks, bossCutscenes]) => {
    const data = store.data as CatData
    if (spawns && Array.isArray(spawns)) data.spawns = normSpawns(spawns)
    if (music && Array.isArray(music)) data.music = normMusic(music)
    if (weather && Array.isArray(weather)) data.weather = normWeather(weather)
    if (injuries && Array.isArray(injuries)) data.injuries = normInjuries(injuries)
    if (eliteBuffs && Array.isArray(eliteBuffs)) data.elite_buffs = normEliteBuffs(eliteBuffs)
    if (progressionUnlocks && Array.isArray(progressionUnlocks)) data.progression_unlocks = normProgressionUnlocks(progressionUnlocks)
    if (bossCutscenes && Array.isArray(bossCutscenes)) (data as any).boss_cutscenes = bossCutscenes
    // Synthetic "statuses" category merging weather + injuries + elite_buffs.
    // Ids are prefixed with their kind: the source files reuse ids across
    // kinds (weather and elite_buffs both have an "Absorbant"), which broke
    // React keys and made deep links ambiguous.
    const statuses = []
    if (data.weather) statuses.push(...data.weather.map((w) => ({ ...w, id: `weather:${w.id}`, status_kind: "weather" })))
    if (data.injuries) statuses.push(...data.injuries.map((i) => ({ ...i, id: `injuries:${i.id}`, status_kind: "injuries" })))
    if (data.elite_buffs) statuses.push(...data.elite_buffs.map((e) => ({ ...e, id: `elite_buffs:${e.id}`, status_kind: "elite_buffs" })))
    if (statuses.length > 0) data.statuses = statuses
    store.remoteState.extras = "ready"
    buildIndex()
    emit()
  }).catch(() => {
    store.remoteState.extras = "error"
    emit()
  })
}

/** Read the publish stamp before anything else, so every later asset URL is
 *  version-tagged. Fetched with `cache: "no-store"` because this one request
 *  is what detects that the cached copy of everything else is stale. */
async function loadDatasetVersion(): Promise<void> {
  try {
    const r = await fetch(mewUrl("manifest.json"), { cache: "no-store" })
    if (!r.ok) throw new Error("manifest unavailable")
    const m = await r.json()
    if (typeof m?.version === "string") {
      setMewDatasetVersion(m.version)
      mewWrite("dataset-version", m.version)
    }
  } catch {
    // Falling back to the LAST KNOWN version rather than to no version at all,
    // and that distinction is what makes the codex work offline in the desktop
    // app. There the stamp is part of the asset cache's key, so an unstamped
    // url is a different key: dropping it would have missed every one of the
    // files this tool had already downloaded, and an offline launch would show
    // an empty codex instead of the one the player was reading yesterday.
    const remembered = await mewRead<string>("dataset-version")
    if (remembered) setMewDatasetVersion(remembered)
  }
}

/** Hydrate `store` from an already-normalised snapshot: no fetch, no
 *  normalizers, just the reverse index rebuilt over what was restored (the
 *  index is never itself persisted — see `dataset-cache.ts`). */
function hydrateFromSnapshot(snapshot: DatasetSnapshot): void {
  store.data = snapshot.data
  store.allAbilities = snapshot.allAbilities
  store.strings = snapshot.strings
  store.itemSources = snapshot.itemSources
  store.lang = snapshot.lang
  store.remoteState.abilities = "ready"
  store.remoteState.extras = "ready"
  buildIndex()
  emit()
}

function loadAll(lang: "es" | "en" = "es"): Promise<void> {
  const cacheKey = `mew-promise-${lang}`
  if ((store as any)[cacheKey]) return (store as any)[cacheKey]
  const structural = MEW_CATS.filter((c) => c.file) as (MewCat & { file: string })[]
  const promise = loadDatasetVersion().then(async () => {
    const version = getMewDatasetVersion()
    if (version) {
      const snapshot = await readDatasetSnapshot(version, lang)
      if (snapshot) {
        hydrateFromSnapshot(snapshot)
        return
      }
    }
    return Promise.all([
    Promise.all(structural.map((c) => fetchJson(c.file).then((j) => [c.key, j] as [string, any]))),
    fetchJsonSoft(`strings/${lang}.json`).then((res) => res || fetchJsonSoft("strings/es.json")),
    fetchJsonSoft("sprite_map.json"),
    fetchJsonSoft("icon_map.json"),
    fetchJsonSoft("ui_map.json"),
    fetchJsonSoft("media_map.json"),
    fetchJsonSoft("map_assets.json"),
    fetchJsonSoft("portraits.json"),
    fetchJsonSoft("class_assets.json"),
  ]).then(([pairs, strings, spriteMapRaw, iconMap, uiMapRaw, mediaMapRaw, mapAssetsRaw, portraitsRaw, classAssetsRaw]) => {
    if (strings) { store.strings = strings as Record<string, string>; store.lang = lang }
    // art maps → the shared singleton MewTile reads
    const sprites: Record<string, string> = {}
    if (spriteMapRaw) Object.entries(spriteMapRaw).forEach(([id, v]: [string, any]) => { if (v?.svg) sprites[id] = v.svg })

    const artUpdate: any = { sprites, icons: iconMap || {} }

    if (uiMapRaw) {
      artUpdate.tokens = uiMapRaw.tokens || {}
      artUpdate.panels = uiMapRaw.panels || {}
      artUpdate.slots = uiMapRaw.slots || {}
      artUpdate.backgrounds = uiMapRaw.backgrounds || {}
      artUpdate.cursors = uiMapRaw.cursors || {}
    }

    if (mediaMapRaw) {
      artUpdate.textures = mediaMapRaw.textures || {}
      artUpdate.cursorData = mediaMapRaw.cursors || {}
      artUpdate.sfx = mediaMapRaw.sfx || {}
    }

    if (mapAssetsRaw && typeof mapAssetsRaw === "object") {
      artUpdate.mapAssets = mapAssetsRaw
    }

    if (portraitsRaw && typeof portraitsRaw === "object") {
      artUpdate.portraits = portraitsRaw
    }

    if (classAssetsRaw && typeof classAssetsRaw === "object") {
      artUpdate.classAssets = classAssetsRaw
    }

    setMewArt(artUpdate)

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
    data.furniture = normFurniture(rawByKey.furniture || [])
    data.mutations = normMutations(rawByKey.mutations || [])
    data.sets = normSets(rawByKey.sets || [])
    data.story_cats = normStoryCats(rawByKey.story_cats || [])
    // drop junk-named rows (raw keys that never resolved) except events (already filtered)
    MEW_CATS.forEach((c) => {
      if (c.key === "abilities" || c.key === "events") return
      data[c.key] = (data[c.key] || []).filter((r) => mewValidName(r.name))
    })
    store.data = data
    buildIndex()
    const abilitiesPromise = loadAbilities()
    // Load eager support data: item_pools, shops, world (small files)
    const supportPromise = Promise.all([
      fetchJsonSoft("item_pools.json"),
      fetchJsonSoft("shops.json"),
      fetchJsonSoft("world.json"),
    ]).then(([itemPoolsRaw, shopsRaw, worldRaw]) => {
      const data = store.data as CatData
      if (itemPoolsRaw && Array.isArray(itemPoolsRaw)) data.item_pools = normItemPools(itemPoolsRaw)
      if (shopsRaw && Array.isArray(shopsRaw)) data.shops = normShops(shopsRaw)
      if (worldRaw && Array.isArray(worldRaw)) data.world = normWorld(worldRaw)
      buildIndex()
      emit()
    })
    // Load lazy support data: spawns, music, weather, injuries, elite_buffs, progression_unlocks
    const extrasPromise = loadExtras()
    const itemSourcesPromise = fetchJsonSoft("item_sources.json").then((raw: any) => {
      // The file is an array of records; callers look sources up by item id,
      // so it has to be indexed here or every lookup silently misses.
      if (Array.isArray(raw)) {
        const byId: Record<string, any> = {}
        raw.forEach((r) => { if (r && r._id) byId[r._id] = r })
        store.itemSources = byId
        emit()
      }
    })
    // Snapshot once everything that ends up inside `store.data`/`allAbilities`/
    // `itemSources` has actually landed — writing any earlier (e.g. right off
    // `itemSourcesPromise` alone, which can resolve before the slower
    // `abilities.json`/extras fetches) would persist a dataset missing
    // whichever piece was still in flight, and that gap would then survive
    // every future boot until the dataset version next changes.
    Promise.all([abilitiesPromise, supportPromise, extrasPromise, itemSourcesPromise]).then(() => {
      const version = getMewDatasetVersion()
      if (!version) return
      void writeDatasetSnapshot(version, {
        data: store.data as CatData,
        allAbilities: store.allAbilities,
        strings: store.strings,
        itemSources: store.itemSources,
        lang,
      })
    })
  })
  })
  ;(store as any)[cacheKey] = promise
  return promise
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

export function useMewData(lang: "es" | "en" = "es"): MewDataState {
  const [state, setState] = React.useState<MewDataState>(() => ({ ready: !!store.data, error: null, rev: store.rev }))
  React.useEffect(() => {
    let alive = true
    const unsub = subscribe(() => { if (alive) setState((s) => ({ ...s, rev: store.rev })) })
    if (store.data) setState((s) => ({ ...s, ready: true }))
    else {
      loadAll(lang).then(() => { if (alive) setState((s) => ({ ...s, ready: true, rev: store.rev })) }).catch((e) => { if (alive) setState((s) => ({ ...s, error: e as Error })) })
    }
    return () => { alive = false; unsub() }
  }, [lang])
  return state
}
