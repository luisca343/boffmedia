"use client"

import { useMemo, useState } from "react"
import type { ArcadeInventoryItem } from "@boffmedia/shared"
import { RARITY_ORDER, type ArRarity, type ItemRarity } from "../../_utils/rarity"

export const ITEMS_PER_PAGE = 18

export type RarityFilter = ItemRarity | "all"
export type TypeFilter = string

/**
 * Search + rarity + type + pagination over the collection. Ported from the old
 * `loot/_hooks/useCollectionFilter.ts`; the item-type axis and the name match are
 * new (the old one only matched raw `itemId`, so searching "Poké Ball" found nothing).
 */
export function useCollectionFilter(
  items: ArcadeInventoryItem[],
  nameOf: (item: ArcadeInventoryItem) => string,
) {
  const [search, setSearch] = useState("")
  const [rarity, setRarity] = useState<RarityFilter>("all")
  const [type, setType] = useState<TypeFilter>("all")
  const [page, setPage] = useState(0)

  const types = useMemo(
    () => [...new Set(items.map((i) => i.itemType).filter(Boolean))].sort(),
    [items],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter(
        (item) =>
          (rarity === "all" || item.rarity === rarity) &&
          (type === "all" || item.itemType === type) &&
          (q === "" ||
            item.itemId.toLowerCase().includes(q) ||
            nameOf(item).toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          RARITY_ORDER.indexOf(b.rarity as ArRarity) - RARITY_ORDER.indexOf(a.rarity as ArRarity),
      )
  }, [items, rarity, type, search, nameOf])

  const pageCount = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const current = Math.min(page, pageCount - 1)
  const paginated = useMemo(
    () => filtered.slice(current * ITEMS_PER_PAGE, (current + 1) * ITEMS_PER_PAGE),
    [filtered, current],
  )

  return {
    search,
    rarity,
    type,
    types,
    page: current,
    pageCount,
    filtered,
    paginated,
    onSearch: (value: string) => {
      setSearch(value)
      setPage(0)
    },
    onRarity: (value: RarityFilter) => {
      setRarity(value)
      setPage(0)
    },
    onType: (value: TypeFilter) => {
      setType(value)
      setPage(0)
    },
    onPrevious: () => setPage((p) => Math.max(0, p - 1)),
    onNext: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
  }
}
