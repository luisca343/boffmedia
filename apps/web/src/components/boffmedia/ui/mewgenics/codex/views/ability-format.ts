import { mewHuman, type MewRec } from "../../mew-util"

// Shared ability formatting used by both the full ability fiche and the compact
// inline card, so the labels stay in one place.

export const MEW_TARGET_MODE: Record<string, string> = { none: "Sin objetivo", self: "Sí mismo", single: "Un objetivo", tile: "Una casilla", direction: "Dirección", direction4: "Dirección", direction8: "Dirección", line: "Línea", cone: "Cono", all: "Todos", aoe: "Área" }

export function mewClassName(c?: string) { return mewHuman(String(c || "").replace(/Ability$/, "")) }

/** "2", "2–4" or null from an ability target's min/max range. */
export function abilityRange(tgt: NonNullable<MewRec["target"]>): string | null {
  if (tgt.min_range == null && tgt.max_range == null) return null
  return tgt.min_range === tgt.max_range ? String(tgt.max_range || 0) : (tgt.min_range || 0) + "–" + (tgt.max_range || 0)
}
