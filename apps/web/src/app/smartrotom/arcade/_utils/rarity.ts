import type { ArcadeInventoryItem } from "@boffmedia/shared"

/** The five tiers the API can actually store — `ArcadeInventoryItem.rarity`'s enum. */
export type ItemRarity = `${ArcadeInventoryItem.rarity}`

export interface RaritySkin {
  /** i18n key for the tier label — resolve with `useTranslations("arcade")`. */
  nameKey: string
  /**
   * @deprecated Holds the same i18n key as `nameKey`; kept only so the styles
   * showcase (`styles/components/_chapters/ArCabinaChapter.tsx`) still compiles.
   * Remove once that chapter reads `nameKey` through `t()`.
   */
  name: string
  /** Text/border neon. */
  fg: string
  /** The same neon at border strength. */
  bd: string
  /** The same neon as a wash. */
  bg: string
}

/**
 * The rarity ladder. A data-driven colour set, so it lives as a JS map and is
 * applied inline or as a literal class — never as `bg-${rarity}`.
 *
 * `mythic` is design-only: the API's `ItemRarity` union stops at `legendary`
 * and no drop table can produce it. It is kept so the ladder reads complete in
 * the showcase, and so a future sixth tier has a skin waiting.
 */
export const RARITY: Record<ItemRarity | "mythic", RaritySkin> = {
  common: { nameKey: "rarity.common", name: "rarity.common", fg: "#cfd3ee", bd: "rgba(207,211,238,0.55)", bg: "rgba(207,211,238,0.10)" },
  uncommon: { nameKey: "rarity.uncommon", name: "rarity.uncommon", fg: "#7af8ca", bd: "rgba(122,248,202,0.55)", bg: "rgba(122,248,202,0.10)" },
  rare: { nameKey: "rarity.rare", name: "rarity.rare", fg: "#00e5ff", bd: "rgba(0,229,255,0.55)", bg: "rgba(0,229,255,0.10)" },
  epic: { nameKey: "rarity.epic", name: "rarity.epic", fg: "#c79bff", bd: "rgba(199,155,255,0.55)", bg: "rgba(168,85,255,0.10)" },
  legendary: { nameKey: "rarity.legendary", name: "rarity.legendary", fg: "#ffb845", bd: "rgba(255,184,69,0.6)", bg: "rgba(255,184,69,0.12)" },
  mythic: { nameKey: "rarity.mythic", name: "rarity.mythic", fg: "#ff6dbf", bd: "rgba(255,109,191,0.6)", bg: "rgba(255,46,147,0.14)" },
}

export type ArRarity = keyof typeof RARITY

export const RARITY_ORDER: ArRarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic"]

export const raritySkin = (r: string | null | undefined): RaritySkin =>
  RARITY[(r ?? "common") as ArRarity] ?? RARITY.common

/**
 * The lootbox config carries `weight`, not a rarity, and the API does not resolve
 * it — the drop chance IS the rarity. These are the API's `rarityRanges`
 * (arcade/_config/lootboxConfig.ts); keep them in step if the server's change.
 */
const WEIGHT_RANGES: { rarity: ItemRarity; min: number; max: number }[] = [
  { rarity: "legendary", min: 1, max: 2 },
  { rarity: "epic", min: 3, max: 9 },
  { rarity: "rare", min: 10, max: 19 },
  { rarity: "uncommon", min: 20, max: 49 },
  { rarity: "common", min: 50, max: 100 },
]

export function rarityFromWeight(weight: number): ItemRarity {
  const hit = WEIGHT_RANGES.find((r) => weight >= r.min && weight <= r.max)
  return hit?.rarity ?? "common"
}
