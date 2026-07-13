"use client"

import { create } from "zustand"
import type { PokemonFilter, SlotLoc, SmartView, Sort } from "../_types/pc.types"
import type { BoxTheme } from "../_utils/boxThemes"
import { loadBoxMeta, saveBoxMeta, type BoxMetaMap } from "../_utils/boxMeta"
import { loadSavedViews, saveSavedViews } from "../_utils/smartViews"
import { TOTAL_BOXES } from "../_utils/constants"

/**
 * A slot's address as a string, so it can live in a Set. Selection, comparison and
 * the open detail drawer are all keyed by *position*, not by the content hash —
 * two identical clones share a hash, and "favourite this one" has to mean the one
 * the user clicked. (Marks are looked up by hash at the point of writing.)
 */
export const locId = (loc: SlotLoc): string =>
  loc.kind === "party" ? `party:${loc.index}` : `box:${loc.box}:${loc.index}`

export function parseLocId(id: string): SlotLoc | null {
  const parts = id.split(":")
  if (parts[0] === "party" && parts.length === 2) {
    return { kind: "party", index: Number(parts[1]) }
  }
  if (parts[0] === "box" && parts.length === 3) {
    return { kind: "box", box: Number(parts[1]), index: Number(parts[2]) }
  }
  return null
}

interface PcUiState {
  activeBox: number
  secondaryBox: number | null
  dualMode: boolean

  detail: SlotLoc | null
  multiMode: boolean
  selected: Set<string>
  compare: string[]

  filters: PokemonFilter
  search: string
  sort: Sort
  activeView: SmartView | null
  savedViews: SmartView[]

  boxMeta: BoxMetaMap

  /** The app's real audio (TURN_ON/TURN_OFF) plays only while this is on. */
  sound: boolean
  setSound: (on: boolean) => void

  setActiveBox: (i: number) => void
  setSecondaryBox: (i: number | null) => void
  toggleDual: () => void

  setDetail: (loc: SlotLoc | null) => void
  setMultiMode: (on: boolean) => void
  toggleSelected: (id: string) => void
  setSelected: (ids: string[]) => void
  clearSelection: () => void
  toggleCompare: (id: string) => string | null
  setCompare: (ids: string[]) => void

  setFilters: (f: PokemonFilter) => void
  setSearch: (s: string) => void
  setSort: (s: Sort) => void
  applyView: (v: SmartView) => void
  clearFilters: () => void
  saveView: (v: SmartView) => void
  deleteView: (id: string) => void

  renameBox: (box: number, name: string) => void
  setBoxTheme: (box: number, theme: BoxTheme) => void
}

const MAX_COMPARE = 4

export const usePcUi = create<PcUiState>((set, get) => ({
  activeBox: 0,
  secondaryBox: null,
  dualMode: false,

  detail: null,
  multiMode: false,
  selected: new Set<string>(),
  compare: [],

  filters: {},
  search: "",
  sort: { field: "box", dir: "asc" },
  activeView: null,
  savedViews: [],

  boxMeta: {},

  sound: true,
  setSound: (on) => set({ sound: on }),

  // Navigating to a box always leaves whatever filtered view was showing — the box
  // and the results grid occupy the same stage, so one has to win.
  setActiveBox: (i) =>
    set({ activeBox: Math.max(0, Math.min(TOTAL_BOXES - 1, i)), activeView: null, filters: {}, search: "" }),
  setSecondaryBox: (i) => set({ secondaryBox: i }),
  toggleDual: () => {
    const { dualMode, secondaryBox, activeBox } = get()
    const on = !dualMode
    set({
      dualMode: on,
      secondaryBox: on && secondaryBox == null ? (activeBox + 1) % TOTAL_BOXES : secondaryBox,
    })
  },

  setDetail: (loc) => set({ detail: loc }),
  setMultiMode: (on) => set({ multiMode: on, selected: new Set() }),
  toggleSelected: (id) =>
    set((s) => {
      const next = new Set(s.selected)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selected: next }
    }),
  setSelected: (ids) => set({ selected: new Set(ids) }),
  clearSelection: () => set({ selected: new Set() }),
  toggleCompare: (id) => {
    const { compare } = get()
    if (compare.includes(id)) {
      set({ compare: compare.filter((x) => x !== id) })
      return null
    }
    if (compare.length >= MAX_COMPARE) return `Máx. ${MAX_COMPARE} para comparar`
    set({ compare: [...compare, id] })
    return null
  },
  setCompare: (ids) => set({ compare: ids }),

  setFilters: (f) => set({ filters: f, activeView: null }),
  setSearch: (s) => set({ search: s, activeView: null }),
  setSort: (s) => set({ sort: s }),
  applyView: (v) => set({ filters: v.filters ?? {}, search: v.search ?? "", activeView: v }),
  clearFilters: () => set({ filters: {}, search: "", activeView: null }),
  saveView: (v) =>
    set((s) => {
      const next = [...s.savedViews, v]
      saveSavedViews(next)
      return { savedViews: next, activeView: v }
    }),
  deleteView: (id) =>
    set((s) => {
      const next = s.savedViews.filter((v) => v.id !== id)
      saveSavedViews(next)
      return {
        savedViews: next,
        activeView: s.activeView?.id === id ? null : s.activeView,
        filters: s.activeView?.id === id ? {} : s.filters,
        search: s.activeView?.id === id ? "" : s.search,
      }
    }),

  renameBox: (box, name) =>
    set((s) => {
      const next: BoxMetaMap = { ...s.boxMeta, [box]: { ...s.boxMeta[box], name: name.trim() || undefined } }
      saveBoxMeta(next)
      return { boxMeta: next }
    }),
  setBoxTheme: (box, theme) =>
    set((s) => {
      const next: BoxMetaMap = { ...s.boxMeta, [box]: { ...s.boxMeta[box], theme } }
      saveBoxMeta(next)
      return { boxMeta: next }
    }),
}))

/**
 * Box names, wallpapers and saved views live in localStorage, which does not exist
 * during SSR. Reading them in the store's initialiser would hydrate-mismatch, so
 * they are pulled in once on the client instead.
 */
export function hydratePcUi(): void {
  usePcUi.setState({ boxMeta: loadBoxMeta(), savedViews: loadSavedViews() })
}
