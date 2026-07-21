import { MEW, mewHuman, type MewRec } from "../mew-util"

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
  colorFn?: (v: string) => string
}

export const CX_FILTERS: Record<string, FilterDef[]> = {
  items: [
    { key: "kind", label: "filter.kind", from: (r) => r.kind || "", order: ["weapon", "head", "face", "neck", "trinket"], labelFn: (v) => "filter.kind." + v },
    { key: "rarity", label: "filter.rarity", from: (r) => r.rarity || "", labelFn: (v) => mewHuman(v), colorFn: (v) => "hsl(" + MEW.rarity(v).hue + " 70% 60%)" },
  ],
  characters: [
    { key: "faction", label: "filter.faction", from: (r) => r.faction || "", labelFn: (v) => mewHuman(v), colorFn: (v) => "hsl(" + MEW.faction(v).hue + " 70% 60%)" },
    { key: "type", label: "filter.type", from: (r) => r.type || "", labelFn: (v) => mewHuman(v) },
  ],
  passives: [{ key: "cls", label: "filter.cls", from: (r) => r.cls || "—", labelFn: (v) => (v === "—" ? "filter.cls.general" : mewHuman(v)) }],
  maps: [{ key: "act", label: "filter.act", from: (r) => "Acto " + r.act, labelFn: (v) => v }],
}

export const CX_SORT: Record<string, { v: string; label: string }[]> = {
  items: [{ v: "name", label: "sort.name" }, { v: "rarity", label: "sort.rarity" }, { v: "kind", label: "sort.kind" }],
  characters: [{ v: "name", label: "sort.name" }, { v: "hp", label: "sort.hp" }, { v: "faction", label: "sort.faction" }],
}

export function cxSearchText(cat: string, r: MewRec): string {
  if (cat === "items") return (r.name + " " + (r.desc || "") + " " + (r.kind || "")).toLowerCase()
  if (cat === "characters") return (r.name + " " + (r.tip || "") + " " + (r.faction || "") + " " + (r.type || "")).toLowerCase()
  if (cat === "abilities") return (r.name + " " + (r.desc || "") + " " + (r.cls || "") + " " + (r.tags || []).join(" ")).toLowerCase()
  if (cat === "passives") return (r.name + " " + (r.desc || "") + " " + (r.cls || "")).toLowerCase()
  if (cat === "keywords") return (r.name + " " + (r.tip || "")).toLowerCase()
  if (cat === "events") return (r.name + " " + (r.subject || "")).toLowerCase()
  if (cat === "maps") return (r.name + " " + (r.tileset || "")).toLowerCase()
  return (r.name || r.id || "").toLowerCase()
}
export function cxTitle(r: MewRec): string { return r.name || r.id }

export type TrailItem = { key: string; cat: string; id: string; name: string }

export function cxReadHash(): { c: string | null; id: string | null } {
  if (typeof window === "undefined") return { c: null, id: null }
  const q = window.location.hash.split("?")[1] || ""
  const p = new URLSearchParams(q)
  return { c: p.get("c"), id: p.get("id") }
}
export function cxWriteHash(cat?: string, id?: string | null) {
  const base = window.location.hash.split("?")[0]
  const p = new URLSearchParams()
  if (cat) p.set("c", cat)
  if (id) p.set("id", id)
  window.history.replaceState(null, "", base + (p.toString() ? "?" + p.toString() : ""))
}
