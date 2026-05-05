'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { VgcService } from '@/services/api/boffmedia/vgcService'

// ─── Natures — static Gen 3+ game mechanics constants ──────────────────────────
// These 25 natures have never changed since Gen 3 and are fully format-agnostic.

export interface NatureData {
  name: string
  plus: string | null
  minus: string | null
}

export const NATURES: NatureData[] = [
  { name: 'Adamant', plus: 'atk',  minus: 'spa' },
  { name: 'Bashful', plus: null,   minus: null  },
  { name: 'Bold',    plus: 'def',  minus: 'atk' },
  { name: 'Brave',   plus: 'atk',  minus: 'spe' },
  { name: 'Calm',    plus: 'spd',  minus: 'atk' },
  { name: 'Careful', plus: 'spd',  minus: 'spa' },
  { name: 'Docile',  plus: null,   minus: null  },
  { name: 'Gentle',  plus: 'spd',  minus: 'def' },
  { name: 'Hardy',   plus: null,   minus: null  },
  { name: 'Hasty',   plus: 'spe',  minus: 'def' },
  { name: 'Impish',  plus: 'def',  minus: 'spa' },
  { name: 'Jolly',   plus: 'spe',  minus: 'spa' },
  { name: 'Lax',     plus: 'def',  minus: 'spd' },
  { name: 'Lonely',  plus: 'atk',  minus: 'def' },
  { name: 'Mild',    plus: 'spa',  minus: 'def' },
  { name: 'Modest',  plus: 'spa',  minus: 'atk' },
  { name: 'Naive',   plus: 'spe',  minus: 'spd' },
  { name: 'Naughty', plus: 'atk',  minus: 'spd' },
  { name: 'Quiet',   plus: 'spa',  minus: 'spe' },
  { name: 'Quirky',  plus: null,   minus: null  },
  { name: 'Rash',    plus: 'spa',  minus: 'spd' },
  { name: 'Relaxed', plus: 'def',  minus: 'spe' },
  { name: 'Sassy',   plus: 'spd',  minus: 'spe' },
  { name: 'Serious', plus: null,   minus: null  },
  { name: 'Timid',   plus: 'spe',  minus: 'atk' },
]

// ─── Move / item / ability data from server ────────────────────────────────────

export interface MoveData {
  id: string
  name: string
  basePower: number
  type: string
  category: 'Physical' | 'Special' | 'Status'
}

interface GameData {
  moves: MoveData[]
  items: string[]
  abilities: string[]
}

// Module-level cache keyed by regulationId — same pattern as useLegalPokemon.
// One fetch per regulation per page session, shared across all components.
const _cache: Record<string, GameData> = {}
const _fetchPromise: Record<string, Promise<GameData>> = {}

const EMPTY: GameData = { moves: [], items: ['None'], abilities: ['None'] }

async function loadGameData(regulationId: string): Promise<GameData> {
  if (!regulationId) return EMPTY
  if (_cache[regulationId]) return _cache[regulationId]
  if (!_fetchPromise[regulationId]) {
    _fetchPromise[regulationId] = VgcService.getChampionsGameData(regulationId)
      .then((res) => {
        const data = (res.data ?? EMPTY) as GameData
        _cache[regulationId] = data
        return data
      })
      .catch(() => {
        delete _fetchPromise[regulationId]
        return EMPTY
      })
  }
  return _fetchPromise[regulationId]
}

export function useGameData(regulationId: string) {
  const [data, setData] = useState<GameData>(_cache[regulationId] ?? EMPTY)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!regulationId) return () => { mounted.current = false }
    loadGameData(regulationId).then((d) => {
      if (mounted.current) setData(d)
    })
    return () => { mounted.current = false }
  }, [regulationId])

  const moveMap = useMemo(() => {
    const map = new Map<string, MoveData>()
    for (const m of data.moves) map.set(m.name, m)
    return map
  }, [data.moves])

  const moveNames = useMemo(() => data.moves.map((m) => m.name), [data.moves])

  return {
    moveMap,
    moveNames,
    items: data.items,
    abilities: data.abilities,
    natures: NATURES,
    isLoaded: data.moves.length > 0,
  }
}
