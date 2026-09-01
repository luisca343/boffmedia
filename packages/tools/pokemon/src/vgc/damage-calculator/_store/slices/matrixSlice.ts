import type { StateCreator } from 'zustand'
import type { CalcPokemon } from '../../_types/calculator'
import type { CalculatorState } from '../types'

type Creator<T> = StateCreator<CalculatorState, [['zustand/subscribeWithSelector', never]], [], T>

export type MatrixSlice = {
  team: CalcPokemon[]   // up to 6 — attackers in teamvsmany, defenders in manyvsteam
  many: CalcPokemon[]   // up to 12 — defenders in teamvsmany, attackers in manyvsteam

  addToTeam: (p: CalcPokemon) => void
  removeFromTeam: (idx: number) => void
  updateTeamPokemon: (idx: number, patch: Partial<CalcPokemon>) => void
  setTeamFull: (team: CalcPokemon[]) => void

  addToMany: (p: CalcPokemon) => void
  removeFromMany: (idx: number) => void
  updateManyPokemon: (idx: number, patch: Partial<CalcPokemon>) => void
  setManyFull: (many: CalcPokemon[]) => void
}

export const createMatrixSlice: Creator<MatrixSlice> = (set) => ({
  team: [],
  many: [],

  addToTeam: (p) => set((s) => ({ team: s.team.length < 6 ? [...s.team, p] : s.team })),
  removeFromTeam: (idx) => set((s) => ({ team: s.team.filter((_, i) => i !== idx) })),
  updateTeamPokemon: (idx, patch) =>
    set((s) => ({ team: s.team.map((p, i) => i === idx ? { ...p, ...patch } : p) })),
  setTeamFull: (team) => set({ team }),

  addToMany: (p) => set((s) => ({ many: s.many.length < 12 ? [...s.many, p] : s.many })),
  removeFromMany: (idx) => set((s) => ({ many: s.many.filter((_, i) => i !== idx) })),
  updateManyPokemon: (idx, patch) =>
    set((s) => ({ many: s.many.map((p, i) => i === idx ? { ...p, ...patch } : p) })),
  setManyFull: (many) => set({ many }),
})
