import type { StateCreator } from 'zustand'
import type { CalcPokemon, SavedEntry } from '../../_types/calculator'
import type { CalculatorState } from '../types'

type Creator<T> = StateCreator<CalculatorState, [['zustand/subscribeWithSelector', never]], [], T>

// ─── localStorage helpers (client-only) ───────────────────────────────────────

const LS_KEY = 'boffmedia_saved_teams'

function persistSaved(entries: SavedEntry[]): void {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(LS_KEY, JSON.stringify(entries)) } catch {}
  }
}

function loadPersistedSaved(): SavedEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as SavedEntry[]
  } catch {
    return []
  }
}

// ─── Slice type ───────────────────────────────────────────────────────────────

export type SavedSlice = {
  saved: SavedEntry[]
  hydrateFromStorage: () => void
  saveGroup: (name: string, pokeList: CalcPokemon[]) => void
  deleteSaved: (id: number) => void
  renameSaved: (id: number, newName: string) => void
  reorderSaved: (fromIdx: number, toIdx: number) => void
  loadSavedAsTeam: (id: number) => void
  loadSavedAsManyList: (id: number) => void
}

// ─── Slice creator ────────────────────────────────────────────────────────────

export const createSavedSlice: Creator<SavedSlice> = (set) => ({
  saved: [],

  hydrateFromStorage: () => set({ saved: loadPersistedSaved() }),

  saveGroup: (name, pokeList) =>
    set((s) => {
      const entry: SavedEntry = { id: Date.now(), name, pokeList, savedAt: new Date().toISOString() }
      const saved = [...s.saved, entry]
      persistSaved(saved)
      return { saved }
    }),

  deleteSaved: (id) =>
    set((s) => {
      const saved = s.saved.filter((e) => e.id !== id)
      persistSaved(saved)
      return { saved }
    }),

  renameSaved: (id, newName) =>
    set((s) => {
      const saved = s.saved.map((e) => e.id === id ? { ...e, name: newName } : e)
      persistSaved(saved)
      return { saved }
    }),

  reorderSaved: (fromIdx, toIdx) =>
    set((s) => {
      if (fromIdx === toIdx) return {}
      const saved = [...s.saved]
      const [item] = saved.splice(fromIdx, 1)
      saved.splice(toIdx, 0, item)
      persistSaved(saved)
      return { saved }
    }),

  loadSavedAsTeam: (id) =>
    set((s) => {
      const entry = s.saved.find((e) => e.id === id)
      return entry ? { team: entry.pokeList.slice(0, 6) } : {}
    }),

  loadSavedAsManyList: (id) =>
    set((s) => {
      const entry = s.saved.find((e) => e.id === id)
      return entry ? { many: entry.pokeList.slice(0, 12) } : {}
    }),
})
