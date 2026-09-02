import { mewHuman, type MewRec } from "../../mew-util"

// Shared ability formatting used by both the full ability fiche and the compact
// inline card, so the labels stay in one place.

export function getTargetMode(t: (k: string) => string): Record<string, string> {
  return { none: t("targetMode.none"), self: t("targetMode.self"), single: t("targetMode.single"), tile: t("targetMode.tile"), direction: t("targetMode.direction"), direction4: t("targetMode.direction"), direction8: t("targetMode.direction"), line: t("targetMode.line"), cone: t("targetMode.cone"), all: t("targetMode.all"), aoe: t("targetMode.aoe") }
}

export function mewClassName(c?: string) { return mewHuman(String(c || "").replace(/Ability$/, "")) }

/** "2", "2–4" or null from an ability target's min/max range. */
export function abilityRange(tgt: NonNullable<MewRec["target"]>): string | null {
  if (tgt.min_range == null && tgt.max_range == null) return null
  return tgt.min_range === tgt.max_range ? String(tgt.max_range || 0) : (tgt.min_range || 0) + "–" + (tgt.max_range || 0)
}
