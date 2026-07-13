import type { SmartView } from "../_types/pc.types"

/**
 * The always-there views. Every one of them is backed by something real: shiny is
 * a palette, legendary is the dex list, "con objeto" is a non-air held item, and
 * favourite/Competitivo come out of the marks table.
 */
export const SMART_VIEWS: SmartView[] = [
  { id: "sv-shiny", name: "Todos los Shiny", icon: "sparkles", tone: "text-pc-gold", filters: { isShiny: true } },
  { id: "sv-legend", name: "Legendarios", icon: "zap", tone: "text-pc-violet", filters: { isLegendary: true } },
  { id: "sv-fav", name: "Favoritos", icon: "heart", tone: "text-pc-rose", filters: { isFavorited: true } },
  { id: "sv-comp", name: "Competitivos", icon: "sword", tone: "text-pc-accent", filters: { tag: "Competitivo" } },
  { id: "sv-item", name: "Con Objeto", icon: "tag", tone: "text-pc-amber", filters: { hasItem: true } },
]

const KEY = "smartrotom-pc-views-v1"

/**
 * User-saved views are a pure client-side convenience (a named bundle of filters),
 * so they live in localStorage rather than costing an endpoint.
 */
export function loadSavedViews(): SmartView[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v): v is SmartView =>
        !!v && typeof v === "object" && typeof (v as SmartView).id === "string" && typeof (v as SmartView).name === "string",
    )
  } catch {
    return []
  }
}

export function saveSavedViews(views: SmartView[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(views))
  } catch {
    // Non-fatal: the view just does not survive a reload.
  }
}
