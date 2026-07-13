"use client"

import { create } from "zustand"
import type { WpFormat, WpRarity } from "../_types/market.types"

/**
 * The feed's filters.
 *
 * These live in a store rather than in the page's `useState` for one reason: the
 * search box is in the TOP NAV, which is not a child of the feed. Threading a
 * setter up through the layout would mean the nav has to know what a feed is.
 *
 * Not persisted, deliberately — a filter set is a mood, not a preference, and
 * coming back tomorrow to a search you forgot you typed is a bug that looks like an
 * empty marketplace.
 */

export type WpSort = "relevance" | "price-asc" | "price-desc" | "iv" | "recent" | "ending"
export type FeedDensity = "cozy" | "list"

interface FilterState {
  search: string
  format: WpFormat | "all"
  types: string[]
  rarities: WpRarity[]
  shinyOnly: boolean
  legendaryOnly: boolean
  perfectOnly: boolean
  priceMax: number
  sort: WpSort
  density: FeedDensity

  setSearch: (q: string) => void
  setFormat: (f: WpFormat | "all") => void
  toggleType: (t: string) => void
  toggleRarity: (r: WpRarity) => void
  setShinyOnly: (v: boolean) => void
  setLegendaryOnly: (v: boolean) => void
  setPerfectOnly: (v: boolean) => void
  setPriceMax: (n: number) => void
  setSort: (s: WpSort) => void
  setDensity: (d: FeedDensity) => void
  clear: () => void
}

/** The top of the slider. Anything at the cap means "no ceiling", not "≤ 60 000". */
export const PRICE_CAP = 60_000

export const useFeedFilters = create<FilterState>((set) => ({
  search: "",
  format: "all",
  types: [],
  rarities: [],
  shinyOnly: false,
  legendaryOnly: false,
  perfectOnly: false,
  priceMax: PRICE_CAP,
  sort: "relevance",
  density: "cozy",

  setSearch: (search) => set({ search }),
  setFormat: (format) => set({ format }),
  toggleType: (t) =>
    set((s) => ({
      types: s.types.includes(t) ? s.types.filter((x) => x !== t) : [...s.types, t],
    })),
  toggleRarity: (r) =>
    set((s) => ({
      rarities: s.rarities.includes(r) ? s.rarities.filter((x) => x !== r) : [...s.rarities, r],
    })),
  setShinyOnly: (shinyOnly) => set({ shinyOnly }),
  setLegendaryOnly: (legendaryOnly) => set({ legendaryOnly }),
  setPerfectOnly: (perfectOnly) => set({ perfectOnly }),
  setPriceMax: (priceMax) => set({ priceMax }),
  setSort: (sort) => set({ sort }),
  setDensity: (density) => set({ density }),

  // Density and sort are view preferences, not filters — "Limpiar filtros" must
  // not throw the user back to a grid when they chose a list.
  clear: () =>
    set({
      search: "",
      types: [],
      rarities: [],
      shinyOnly: false,
      legendaryOnly: false,
      perfectOnly: false,
      priceMax: PRICE_CAP,
    }),
}))
