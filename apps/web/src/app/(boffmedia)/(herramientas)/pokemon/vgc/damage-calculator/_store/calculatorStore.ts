'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  CalcPokemon,
  CalcField,
  CalcMove,
  CalcTab,
  MoveSlots,
  SideConditions,
  StatValues,
} from '../_types/calculator'

const DEFAULT_IVS: StatValues = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
const DEFAULT_EVS: StatValues = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }

const EMPTY_MOVE: CalcMove = { name: '', bp: 0, type: 'Normal', category: 'Physical', crit: false }

const DEFAULT_SIDE: SideConditions = {
  stealthRock: false,
  spikes: 0,
  reflect: false,
  lightScreen: false,
  auroraVeil: false,
  tailwind: false,
  helpingHand: false,
}

export const DEFAULT_FIELD: CalcField = {
  format: 'Doubles',
  weather: 'None',
  terrain: 'None',
  trickRoom: false,
  gravity: false,
  magicRoom: false,
  wonderRoom: false,
  attackerSide: { ...DEFAULT_SIDE },
  defenderSide: { ...DEFAULT_SIDE },
}

export function defaultPokemon(name = 'Miraidon'): CalcPokemon {
  return {
    name,
    level: 50,
    nature: 'Serious',
    ability: '',
    item: 'None',
    status: 'Healthy',
    teraType: 'None',
    evs: { ...DEFAULT_EVS },
    ivs: { ...DEFAULT_IVS },
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    currentHP: -1,
    moves: [
      { ...EMPTY_MOVE },
      { ...EMPTY_MOVE },
      { ...EMPTY_MOVE },
      { ...EMPTY_MOVE },
    ] as MoveSlots,
  }
}

interface CalculatorState {
  poke1: CalcPokemon
  poke2: CalcPokemon
  team: CalcPokemon[]   // up to 6, used as attackers in teamvsmany / defenders in manyvsteam
  many: CalcPokemon[]   // up to 12, used as defenders in teamvsmany / attackers in manyvsteam
  field: CalcField
  activeTab: CalcTab
  activeMove1: number | null
  activeMove2: number | null
  regulation: string
  useChampions: boolean

  setPoke1: (patch: Partial<CalcPokemon>) => void
  setPoke2: (patch: Partial<CalcPokemon>) => void
  setField: (patch: Partial<CalcField>) => void
  setAttackerSide: (patch: Partial<SideConditions>) => void
  setDefenderSide: (patch: Partial<SideConditions>) => void
  setActiveTab: (tab: CalcTab) => void
  setActiveMove1: (idx: number | null) => void
  setActiveMove2: (idx: number | null) => void
  setRegulation: (reg: string) => void
  setUseChampions: (val: boolean) => void
  updateMove1: (idx: number, patch: Partial<CalcMove>) => void
  updateMove2: (idx: number, patch: Partial<CalcMove>) => void
  addToTeam: (p: CalcPokemon) => void
  removeFromTeam: (idx: number) => void
  updateTeamPokemon: (idx: number, patch: Partial<CalcPokemon>) => void
  setTeamFull: (team: CalcPokemon[]) => void
  addToMany: (p: CalcPokemon) => void
  removeFromMany: (idx: number) => void
  updateManyPokemon: (idx: number, patch: Partial<CalcPokemon>) => void
  setManyFull: (many: CalcPokemon[]) => void
}

export const useCalculatorStore = create<CalculatorState>()(
  subscribeWithSelector((set) => ({
    poke1: defaultPokemon('Miraidon'),
    poke2: defaultPokemon('Rillaboom'),
    team: [],
    many: [],
    field: DEFAULT_FIELD,
    activeTab: '1v1',
    activeMove1: null,
    activeMove2: null,
    regulation: 'gen9championsvgc2026regma',
    useChampions: true,

    setPoke1: (patch) => set((s) => ({ poke1: { ...s.poke1, ...patch } })),
    setPoke2: (patch) => set((s) => ({ poke2: { ...s.poke2, ...patch } })),
    setField: (patch) => set((s) => ({ field: { ...s.field, ...patch } })),
    setAttackerSide: (patch) =>
      set((s) => ({
        field: { ...s.field, attackerSide: { ...s.field.attackerSide, ...patch } },
      })),
    setDefenderSide: (patch) =>
      set((s) => ({
        field: { ...s.field, defenderSide: { ...s.field.defenderSide, ...patch } },
      })),
    setActiveTab: (activeTab) => set({ activeTab }),
    setActiveMove1: (activeMove1) => set({ activeMove1 }),
    setActiveMove2: (activeMove2) => set({ activeMove2 }),
    setRegulation: (regulation) => set({ regulation }),
    setUseChampions: (useChampions) => set({ useChampions }),
    updateMove1: (idx, patch) =>
      set((s) => ({
        poke1: {
          ...s.poke1,
          moves: s.poke1.moves.map((m, i) =>
            i === idx ? { ...m, ...patch } : m,
          ) as MoveSlots,
        },
      })),
    updateMove2: (idx, patch) =>
      set((s) => ({
        poke2: {
          ...s.poke2,
          moves: s.poke2.moves.map((m, i) =>
            i === idx ? { ...m, ...patch } : m,
          ) as MoveSlots,
        },
      })),
    addToTeam: (p) =>
      set((s) => ({ team: s.team.length < 6 ? [...s.team, p] : s.team })),
    removeFromTeam: (idx) =>
      set((s) => ({ team: s.team.filter((_, i) => i !== idx) })),
    updateTeamPokemon: (idx, patch) =>
      set((s) => ({
        team: s.team.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
      })),
    setTeamFull: (team) => set({ team }),
    addToMany: (p) =>
      set((s) => ({ many: s.many.length < 12 ? [...s.many, p] : s.many })),
    removeFromMany: (idx) =>
      set((s) => ({ many: s.many.filter((_, i) => i !== idx) })),
    updateManyPokemon: (idx, patch) =>
      set((s) => ({
        many: s.many.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
      })),
    setManyFull: (many) => set({ many }),
  })),
)
