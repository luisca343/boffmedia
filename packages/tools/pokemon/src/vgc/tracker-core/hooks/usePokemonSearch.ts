'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { VgcService } from '../../service';
import type { SpeciesEntry } from '../types';

// Module-level cache keyed by regulationId — fetched once per key per page load.
const _cache: Record<string, SpeciesEntry[]> = {};
const _fetchPromise: Record<string, Promise<SpeciesEntry[]>> = {};

async function loadSpecies(regulationId: string): Promise<SpeciesEntry[]> {
  if (!regulationId) return [];
  if (_cache[regulationId]) return _cache[regulationId];
  if (!_fetchPromise[regulationId]) {
    _fetchPromise[regulationId] = VgcService.getChampionsLegalPokemon(regulationId)
      .then((res) => {
        const data = res?.data ?? [];
        _cache[regulationId] = data.map((p) => ({
          id: p.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name: p.name,
          num: p.num,
        }));
        return _cache[regulationId];
      })
      .catch(() => {
        // Clear so the next call can retry instead of returning a stale empty promise.
        delete _fetchPromise[regulationId];
        return [] as SpeciesEntry[];
      });
  }
  return _fetchPromise[regulationId];
}

export function usePokemonSearch(regulationId: string) {
  const [species, setSpecies] = useState<SpeciesEntry[]>(_cache[regulationId] ?? []);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadSpecies(regulationId).then((s) => {
      if (mounted.current) setSpecies(s);
    });
    return () => { mounted.current = false; };
  }, [regulationId]);

  const search = useCallback(
    (query: string): SpeciesEntry[] => {
      if (!query || query.length < 2) return [];
      const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      return species
        .filter((s) => s.id.startsWith(q) || s.name.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 8);
    },
    [species],
  );

  return { search, isLoaded: species.length > 0 };
}
