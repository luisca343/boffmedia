import type {
  ArcadeInventoryItem,
  ArcadeInventoryResponse,
  LootboxBoxConfig,
  LootboxConfigEntity,
} from "@boffmedia/shared"
import { rarityFromWeight } from "./rarity"

/** How many of this row are still unspent. `used` is an int count, not a flag. */
export const remaining = (item: ArcadeInventoryItem): number => item.amount - (item.used || 0)

/**
 * Owned boxes, keyed by box id.
 *
 * Derived from the box ids the config itself declares — NOT from a hardcoded
 * name map. The old map keyed the battle box as `battle-box` while the API
 * stores `battle_box`, so a battle box a player owned never showed up as owned.
 */
export function ownedBoxes(
  inventory: ArcadeInventoryResponse | undefined,
  boxes: LootboxBoxConfig[],
): Record<string, number> {
  const ids = new Set(boxes.map((b) => b.id))
  const owned: Record<string, number> = {}
  for (const item of inventory?.items ?? []) {
    if (!ids.has(item.itemId)) continue
    owned[item.itemId] = (owned[item.itemId] ?? 0) + Math.max(0, remaining(item))
  }
  return owned
}

export const totalBoxesOwned = (owned: Record<string, number>): number =>
  Object.values(owned).reduce((sum, n) => sum + n, 0)

/**
 * The collection: everything unspent that is not itself an unopened box. A box
 * is inventory too, but it belongs on the Cajas screen, not in the item grid.
 */
export function collectionItems(
  inventory: ArcadeInventoryResponse | undefined,
  boxes: LootboxBoxConfig[],
): ArcadeInventoryItem[] {
  const boxIds = new Set(boxes.map((b) => b.id))
  return (inventory?.items ?? []).filter((i) => !boxIds.has(i.itemId) && remaining(i) > 0)
}

/**
 * The drop table with each item's rarity and real odds resolved. The API sends
 * only `weight`; probability is the weight over the box's total, and the rarity
 * is which band the weight falls in.
 */
export interface ResolvedBox extends LootboxBoxConfig {
  odds: { rarity: string; pct: number }[]
}

export function resolveBoxes(config: LootboxConfigEntity | undefined): ResolvedBox[] {
  const boxes = config?.lootboxConfig?.boxes ?? []
  return boxes.map((box) => {
    const items = box.items ?? []
    const total = items.reduce((sum, i) => sum + (i.weight || 0), 0)
    const byRarity = new Map<string, number>()
    for (const item of items) {
      const rarity = item.rarity ?? rarityFromWeight(item.weight)
      byRarity.set(rarity, (byRarity.get(rarity) ?? 0) + (item.weight || 0))
    }
    return {
      ...box,
      items: items.map((i) => ({ ...i, rarity: i.rarity ?? rarityFromWeight(i.weight) })),
      odds: [...byRarity.entries()]
        .map(([rarity, weight]) => ({ rarity, pct: total > 0 ? (weight / total) * 100 : 0 }))
        .sort((a, b) => b.pct - a.pct),
    }
  })
}

/** The box themes the config ships (`blue`/`green`/`red`) mapped onto arcade neons. */
export const BOX_ACCENT: Record<string, "cyan" | "lime" | "magenta" | "violet" | "amber"> = {
  blue: "cyan",
  green: "lime",
  red: "magenta",
  purple: "violet",
  gold: "amber",
  default: "violet",
}

export const boxAccent = (theme: string | undefined) => BOX_ACCENT[theme ?? "default"] ?? "violet"
