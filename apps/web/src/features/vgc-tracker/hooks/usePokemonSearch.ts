'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpeciesEntry } from '../types';

// Module-level cache: fetched once per page load, shared across all autocomplete instances.
let _cache: SpeciesEntry[] | null = null;
let _fetchPromise: Promise<SpeciesEntry[]> | null = null;

async function loadSpecies(regulationId: string): Promise<SpeciesEntry[]> {
  if (_cache) return _cache;
  if (!_fetchPromise) {
    const apiBase = process.env.NEXT_PUBLIC_API ?? '';
    _fetchPromise = fetch(`${apiBase}/tools/vgc/champions/${regulationId}/pokemon`, {
      next: { revalidate: 0 },
    })
      .then((r) => r.json())
      .then((res) => {
        const data: Array<{ name: string; num: number }> = res?.data ?? [];
        _cache = data.map((p) => ({
          id: p.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          name: p.name,
          num: p.num,
        }));
        return _cache;
      })
      .catch(() => []);
  }
  return _fetchPromise;
}

export function usePokemonSearch(regulationId: string) {
  const [species, setSpecies] = useState<SpeciesEntry[]>(_cache ?? []);
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
