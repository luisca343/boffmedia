'use client'

import { useEffect, useRef, useState } from 'react'
import type { VgcPokemon } from '@/services/api/boffmedia/vgcService'

export type { VgcPokemon }

// Module-level cache + promise deduplication — follows the same pattern as
// apps/web/src/features/vgc-tracker/hooks/usePokemonSearch.ts
const _cache: Record<string, VgcPokemon[]> = {}
const _fetchPromise: Record<string, Promise<VgcPokemon[]>> = {}

async function loadLegalPokemon(regulationId: string): Promise<VgcPokemon[]> {
  if (!regulationId) return []
  if (_cache[regulationId]) return _cache[regulationId]
  if (!_fetchPromise[regulationId]) {
    const apiBase = process.env.NEXT_PUBLIC_API ?? ''
    _fetchPromise[regulationId] = fetch(
      `${apiBase}/tools/vgc/champions/${regulationId}/pokemon`,
      { next: { revalidate: 0 } },
    )
      .then((r) => r.json())
      .then((res) => {
        const data: VgcPokemon[] = res?.data ?? []
        _cache[regulationId] = data
        return data
      })
      .catch(() => {
        delete _fetchPromise[regulationId]
        return [] as VgcPokemon[]
      })
  }
  return _fetchPromise[regulationId]
}

/** Normalize a Pokémon name the same way as the tracker's `toId` — lowercase alphanumeric. */
export function toId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Returns the format-legal Pokémon list for the given regulation.
 * Always loads when regulationId is set. Results include types, baseStats, and
 * abilities from the API — do not use @pkmn/dex for these. Follows the same
 * fetch/cache pattern as usePokemonSearch in vgc-tracker.
 */
export function useLegalPokemon(regulationId: string): VgcPokemon[] {
  const [pokemon, setPokemon] = useState<VgcPokemon[]>(_cache[regulationId] ?? [])
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    if (!regulationId) return () => { mounted.current = false }
    loadLegalPokemon(regulationId).then((p) => {
      if (mounted.current) setPokemon(p)
    })
    return () => { mounted.current = false }
  }, [regulationId])

  return pokemon
}
