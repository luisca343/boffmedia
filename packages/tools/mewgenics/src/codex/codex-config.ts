import { MEW, mewHuman, mewRarityColor, mewRarityLabel, mewFactionLabel, type MewRec } from "../mew-util"

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
    { key: "rarity", label: "filter.rarity", from: (r) => r.rarity || "", labelFn: (v) => "data.rarity." + v, colorFn: (v) => mewRarityColor(v) },
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
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
    { v: "rarity", label: "sort.rarity" },
    { v: "kind", label: "sort.kind" },
  ],
  characters: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
    { v: "hp", label: "sort.hp" },
    { v: "faction", label: "sort.faction" },
  ],
  abilities: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  passives: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  keywords: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  events: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  classes: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  maps: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  furniture: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
    { v: "comfort", label: "sort.furniture.comfort" },
    { v: "appeal", label: "sort.furniture.appeal" },
    { v: "stimulation", label: "sort.furniture.stimulation" },
  ],
  mutations: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  sets: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  story_cats: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
  statuses: [
    { v: "default", label: "sort.default" },
    { v: "name", label: "sort.name" },
  ],
}

export function cxSearchText(cat: string, r: MewRec): string {
  const extra = [r.id, r.aliases, r.alias, r.quest_item_alias, r.nk, r.tk, r.dk]
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => value != null && value !== "")
  const search = (...parts: unknown[]) => parts.concat(extra).join(" ").toLowerCase()

  if (cat === "items") return search(r.name, r.desc, r.kind)
  if (cat === "characters") return search(r.name, r.tip, r.faction, r.type)
  if (cat === "abilities") return search(r.name, r.desc, r.cls, r.tags)
  if (cat === "passives") return search(r.name, r.desc, r.cls)
  if (cat === "keywords") return search(r.name, r.tip)
  if (cat === "events") return search(r.name, r.subject, r.prompt)
  if (cat === "maps") return search(r.name, r.tileset, r.chapter, r.act)
  if (cat === "furniture") return search(r.name, r.desc)
  if (cat === "mutations") return search(r.name, r.desc, r.body_part, r.statMods)
  if (cat === "sets") return search(r.name, r.desc)
  if (cat === "story_cats") return search(r.name, r.desc, r.voice)
  if (cat === "statuses") return search(r.name, r.desc, r.status_kind, r.effects, r.passives)
  return search(r.name || r.id)
}
export function cxTitle(r: MewRec): string { return r.name || r.id }

export type TrailItem = { key: string; cat: string; id: string; name: string }

/**
 * The codex address, encoded and decoded.
 *
 * These used to read and write `window.location.hash` themselves. They are pure
 * string functions now because the desktop app has no address bar to read — the
 * hash is carried by `MewNav` (see `../nav`) and only its BACKING differs
 * between the hosts. The wire format is unchanged, so a link copied from the
 * website before this change still opens the same entry.
 */
export function cxParseHash(hash: string): { c: string | null; id: string | null; q: string; filters: Record<string, string>; sort: string } {
  const p = new URLSearchParams(hash.split("?")[1] || "")
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
    sort: p.get("sort") || "default",
  }
}

/** The inverse: `"?c=items&id=SkullCap"`, or `""` when there is nothing to say. */
export function cxBuildHash(cat?: string, id?: string | null, query?: string, filters?: Record<string, string>, sort?: string): string {
  const p = new URLSearchParams()
  if (cat) p.set("c", cat)
  if (id) p.set("id", id)
  if (query && query !== "") p.set("q", query)
  if (sort && sort !== "default") p.set("sort", sort)
  if (filters) {
    for (const [key, val] of Object.entries(filters)) {
      if (val) p.set("f_" + key, val)
    }
  }
  return p.toString() ? "?" + p.toString() : ""
}

