'use client';

import { useEffect, useMemo, useState } from 'react';
import { vgcDb } from '@/lib/db/vgc-db';
import { buildOppUsage, type PokemonUsage, type FinishedMatch } from '../utils/sessionStats';
import type { Match } from '../types';

export interface RegulationMeta {
  preview: PokemonUsage[];
  leads: PokemonUsage[];
  backs: PokemonUsage[];
  totalMatches: number;
}

export function useRegulationMeta(
  regulationId: string | undefined,
): { meta: RegulationMeta | null; loading: boolean } {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regulationId) {
      setLoading(false);
      return;
    }

    vgcDb.sessions.toArray().then(async (sessions) => {
      const ids = sessions
        .filter((s) => s.regulationId === regulationId)
        .map((s) => s.id);

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const all = await vgcDb.matches.where('sessionId').anyOf(ids).toArray();
      setMatches(all);
      setLoading(false);
    });
  }, [regulationId]);

  const meta = useMemo((): RegulationMeta | null => {
    const finished = matches.filter(
      (m): m is FinishedMatch => m.result !== undefined,
    );
    if (finished.length === 0) return null;

    return {
      preview: buildOppUsage(finished, () => true, true),
      leads: buildOppUsage(finished, (r) => r === 'lead1' || r === 'lead2', false),
      backs: buildOppUsage(finished, (r) => r === 'back1' || r === 'back2', false),
      totalMatches: finished.length,
    };
  }, [matches]);

  return { meta, loading };
}
