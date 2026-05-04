'use client'

import { useMemo } from 'react'
import { Dex } from '@pkmn/dex'

export interface SpeciesData {
  id: string
  name: string
  types: string[]
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number }
  abilities: Record<string, string>
  spriteId: string
}

export interface MoveData {
  id: string
  name: string
  basePower: number
  type: string
  category: 'Physical' | 'Special' | 'Status'
}

export interface NatureData {
  name: string
  plus: string | null
  minus: string | null
}

function buildSpeciesMap(): Map<string, SpeciesData> {
  const map = new Map<string, SpeciesData>()
  for (const s of Dex.species.all()) {
    if (s.num <= 0 || s.isNonstandard || s.forme === 'Totem') continue
    map.set(s.name, {
      id: s.id,
      name: s.name,
      types: s.types,
      baseStats: s.baseStats,
      abilities: s.abilities as unknown as Record<string, string>,
      spriteId: s.id,
    })
  }
  return map
}

function buildMoveMap(): Map<string, MoveData> {
  const map = new Map<string, MoveData>()
  for (const m of Dex.moves.all()) {
    if (m.isNonstandard || m.num <= 0) continue
    map.set(m.name, {
      id: m.id,
      name: m.name,
      basePower: m.basePower,
      type: m.type,
      category: m.category as MoveData['category'],
    })
  }
  return map
}

function buildNatures(): NatureData[] {
  const natures: NatureData[] = []
  for (const n of Dex.natures.all()) {
    natures.push({
      name: n.name,
      plus: n.plus ?? null,
      minus: n.minus ?? null,
    })
  }
  return natures.sort((a, b) => a.name.localeCompare(b.name))
}

function buildItems(): string[] {
  const items: string[] = ['None']
  for (const i of Dex.items.all()) {
    if (i.isNonstandard || i.num <= 0) continue
    items.push(i.name)
  }
  return items.sort()
}

function buildAbilities(): string[] {
  const abs: string[] = ['None']
  for (const a of Dex.abilities.all()) {
    if (a.isNonstandard || a.num <= 0) continue
    abs.push(a.name)
  }
  return abs.sort()
}

// Singletons — Dex is static so these are computed once at module load
const SPECIES_MAP = buildSpeciesMap()
const MOVE_MAP = buildMoveMap()
const NATURES = buildNatures()
const ITEMS = buildItems()
const ABILITIES = buildAbilities()

const SPECIES_NAMES = Array.from(SPECIES_MAP.keys()).sort()
const MOVE_NAMES = Array.from(MOVE_MAP.keys()).sort()

export function usePokemonData() {
  return useMemo(
    () => ({
      speciesMap: SPECIES_MAP,
      moveMap: MOVE_MAP,
      natures: NATURES,
      items: ITEMS,
      abilities: ABILITIES,
      speciesNames: SPECIES_NAMES,
      moveNames: MOVE_NAMES,
    }),
    [],
  )
}

export { SPECIES_MAP, MOVE_MAP, NATURES, ITEMS, ABILITIES, SPECIES_NAMES, MOVE_NAMES }
