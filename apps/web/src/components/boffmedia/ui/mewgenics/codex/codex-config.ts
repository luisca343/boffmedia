import { MEW, mewHuman, mewRarityLabel, mewFactionLabel, type MewRec } from "../mew-util"

// Pure codex configuration: per-category filters/sort, the search-text projection,
// title accessor and the deep-link hash helpers. No React — imported by the state
// hook and kept separate so the filter/sort rules are editable in one place.

export const CX_CAP = 300 // roster render cap (search to narrow past this)

export interface FilterDef {
  key: string
  label: string
  from: (r: MewRec) => string
  order?: string[]
  labelFn?: (v: string) => string
  labelKey?: string
  colorFn?: (v: string) => string
}

export const CX_FILTERS: Record<string, FilterDef[]> = {
  items: [
    { key: "kind", label: "filter.kind.label", from: (r) => r.kind || "", order: ["weapon", "head", "face", "neck", "trinket"], labelFn: (v) => "filter.kind." + v },
    { key: "rarity", label: "filter.rarity", from: (r) => r.rarity || "", labelFn: (v) => "data.rarity." + v, colorFn: (v) => "hsl(" + MEW.rarity(v).hue + " 70% 60%)" },
  ],
  characters: [
    { key: "faction", label: "filter.faction", from: (r) => r.faction || "", labelFn: (v) => "data.faction." + v, colorFn: (v) => "hsl(" + MEW.faction(v).hue + " 70% 60%)" },
    { key: "type", label: "filter.type", from: (r) => r.type || "", labelFn: (v) => mewHuman(v) },
  ],
  abilities: [
    { key: "cls", label: "filter.cls.label", from: (r) => r.cls || "—", labelFn: (v) => (v === "—" ? "filter.cls.general" : mewHuman(v)) },
  ],
  passives: [
    { key: "cls", label: "filter.cls.label", from: (r) => r.cls || "—", labelFn: (v) => (v === "—" ? "filter.cls.general" : mewHuman(v)) },
  ],
  keywords: [],
  // Events deliberately have no facets: the only field they carried was the raw
  // `subject_frame` art id, which is an asset name, not something to browse by.
  events: [],
  classes: [],
  maps: [
    { key: "act", label: "filter.act", from: (r) => String(r.act || ""), labelKey: "browse.act", labelFn: (v) => "browse.act" },
  ],
  furniture: [
    { key: "stat", label: "filter.furniture.stat", from: (r) => {
      const stats = (r.stats || {}) as Record<string, number>
      // Facet only on the five room stats — the bespoke idol effects
      // (FoodStorage, FightRisk, …) have no filter labels and one record each.
      const keys = Object.keys(stats)
        .filter((k) => ["comfort", "appeal", "stimulation", "health", "evolution"].includes(k))
        .sort((a, b) => (stats[b] || 0) - (stats[a] || 0))
      return keys.length ? keys[0] : ""
    }, order: ["comfort", "appeal", "stimulation", "health", "evolution"], labelFn: (v) => "filter.furniture." + v },
    { key: "special", label: "filter.furniture.special", from: (r) => {
      if (r.removed) return "removed"
      if (r.special) return "special"
      return "normal"
    }, order: ["special", "removed", "normal"], labelFn: (v) => "filter.furniture." + v },
  ],
  mutations: [
    { key: "body_part", label: "filter.mutations.bodyPart", from: (r) => r.body_part || "", labelFn: (v: string) => "filter.mutations." + v },
  ],
  sets: [],
  story_cats: [],
  statuses: [
    { key: "status_kind", label: "filter.statuses.kind", from: (r) => (r as any).status_kind || "", order: ["weather", "injuries", "elite_buffs"], labelFn: (v: string) => "filter.statuses." + v },
  ],
}

export const CX_SORT: Record<string, { v: string; label: string }[]> = {
  items: [
    { v: "name", label: "sort.name" },
    { v: "rarity", label: "sort.rarity" },
    { v: "kind", label: "sort.kind" },
  ],
  characters: [
    { v: "name", label: "sort.name" },
    { v: "hp", label: "sort.hp" },
    { v: "faction", label: "sort.faction" },
  ],
  abilities: [
    { v: "name", label: "sort.name" },
  ],
  passives: [
    { v: "name", label: "sort.name" },
  ],
  keywords: [
    { v: "name", label: "sort.name" },
  ],
  events: [
    { v: "name", label: "sort.name" },
  ],
  classes: [
    { v: "name", label: "sort.name" },
  ],
  maps: [
    { v: "name", label: "sort.name" },
  ],
  furniture: [
    { v: "name", label: "sort.name" },
    { v: "comfort", label: "sort.furniture.comfort" },
    { v: "appeal", label: "sort.furniture.appeal" },
    { v: "stimulation", label: "sort.furniture.stimulation" },
  ],
  mutations: [
    { v: "name", label: "sort.name" },
  ],
  sets: [
    { v: "name", label: "sort.name" },
  ],
  story_cats: [
    { v: "name", label: "sort.name" },
  ],
  statuses: [
    { v: "name", label: "sort.name" },
  ],
}

export function cxSearchText(cat: string, r: MewRec): string {
  if (cat === "items") return (r.name + " " + (r.desc || "") + " " + (r.kind || "")).toLowerCase()
  if (cat === "characters") return (r.name + " " + (r.tip || "") + " " + (r.faction || "") + " " + (r.type || "")).toLowerCase()
  if (cat === "abilities") return (r.name + " " + (r.desc || "") + " " + (r.cls || "") + " " + (r.tags || []).join(" ")).toLowerCase()
  if (cat === "passives") return (r.name + " " + (r.desc || "") + " " + (r.cls || "")).toLowerCase()
  if (cat === "keywords") return (r.name + " " + (r.tip || "")).toLowerCase()
  if (cat === "events") return (r.name + " " + (r.subject || "")).toLowerCase()
  if (cat === "maps") return (r.name + " " + (r.tileset || "")).toLowerCase()
  if (cat === "furniture") return (r.name + " " + (r.desc || "")).toLowerCase()
  if (cat === "mutations") return (r.name + " " + (r.desc || "") + " " + (r.body_part || "")).toLowerCase()
  if (cat === "sets") return (r.name + " " + (r.desc || "")).toLowerCase()
  if (cat === "story_cats") return (r.name + " " + (r.desc || "")).toLowerCase()
  if (cat === "statuses") return (r.name + " " + (r.desc || "") + " " + (r.status_kind || "")).toLowerCase()
  return (r.name || r.id || "").toLowerCase()
}
export function cxTitle(r: MewRec): string { return r.name || r.id }

export type TrailItem = { key: string; cat: string; id: string; name: string }

export function cxReadHash(): { c: string | null; id: string | null; q: string; filters: Record<string, string>; sort: string } {
  if (typeof window === "undefined") return { c: null, id: null, q: "", filters: {}, sort: "name" }
  const q = window.location.hash.split("?")[1] || ""
  const p = new URLSearchParams(q)
  const filters: Record<string, string> = {}
  for (const [key, val] of p.entries()) {
    if (key.startsWith("f_")) {
      filters[key.substring(2)] = val
    }
  }
  return {
    c: p.get("c"),
    id: p.get("id"),
    q: p.get("q") || "",
    filters,
    sort: p.get("sort") || "name",
  }
}
export function cxWriteHash(cat?: string, id?: string | null, query?: string, filters?: Record<string, string>, sort?: string) {
  const base = window.location.hash.split("?")[0]
  const p = new URLSearchParams()
  if (cat) p.set("c", cat)
  if (id) p.set("id", id)
  if (query && query !== "") p.set("q", query)
  if (sort && sort !== "name") p.set("sort", sort)
  if (filters) {
    for (const [key, val] of Object.entries(filters)) {
      if (val) p.set("f_" + key, val)
    }
  }
  window.history.replaceState(null, "", base + (p.toString() ? "?" + p.toString() : ""))
}
