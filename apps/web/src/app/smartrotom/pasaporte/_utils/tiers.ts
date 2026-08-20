import type { useTranslations } from "next-intl"
import type { LogroTier, Rarity, StandingTier } from "../_types"

/**
 * One metal ramp, used twice: a logro's medal and a ladder rung of the same name are the
 * same gold. Logros only reach `platino`; the season ladder carries on to `maestro`.
 *
 * Every class below is written out in full. `text-ps-tier-${tier}` would compile to
 * nothing at all — no error, no warning, just an uncoloured medal.
 */
type Metal = LogroTier | StandingTier

export const TIER_TEXT: Record<Metal, string> = {
  bronce: "text-ps-tier-bronce",
  plata: "text-ps-tier-plata",
  oro: "text-ps-tier-oro",
  platino: "text-ps-tier-platino",
  diamante: "text-ps-tier-diamante",
  maestro: "text-ps-tier-maestro",
}

export const TIER_BG: Record<Metal, string> = {
  bronce: "bg-ps-tier-bronce",
  plata: "bg-ps-tier-plata",
  oro: "bg-ps-tier-oro",
  platino: "bg-ps-tier-platino",
  diamante: "bg-ps-tier-diamante",
  maestro: "bg-ps-tier-maestro",
}

/** Weakest first. Lets a caller ask "is this the top metal?" without naming a number. */
export const TIER_RANK: Record<Metal, number> = {
  bronce: 0,
  plata: 1,
  oro: 2,
  platino: 3,
  diamante: 4,
  maestro: 5,
}

/**
 * `rarity` is a REAL percentage from the API — the share of players who completed the
 * logro — so the bands read the way a player expects: the fewer who have it, the rarer.
 */
export function rarityInfo(rarity: number, t: ReturnType<typeof useTranslations>): Rarity {
  if (rarity <= 5) return { label: t("rarity.legendary"), className: "text-ps-tier-oro" }
  if (rarity <= 15) return { label: t("rarity.epic"), className: "text-ps-plum" }
  if (rarity <= 35) return { label: t("rarity.rare"), className: "text-ps-teal" }
  return { label: t("rarity.common"), className: "text-ps-ink-faint" }
}
