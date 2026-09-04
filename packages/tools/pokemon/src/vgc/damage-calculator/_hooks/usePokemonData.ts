'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { VgcService } from '../../service'
import { NATURES } from '../_lib/natures'

// ─── Natures ─────────────────────────────────────────────────────────────
// The table moved to `../_lib/natures`, which is pure: the spread solver needs
// it and must not pull React and `VgcService` in behind it. Re-exported here so
// every existing import of `NATURES` from this hook keeps working.
export { NATURES, natureEffect, probeNature } from '../_lib/natures'
export type { NatureData, NatureEffect } from '../_lib/natures'

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
