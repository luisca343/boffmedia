'use client';

import { useEffect, useMemo, useState } from 'react';
import { vgcDb } from '@/lib/db/vgc-db';
import { computeSessionStats, type SessionStats } from '../utils/sessionStats';
import type { Match } from '../types';

/**
 * Loads all matches for a session once on mount and derives stats.
 * Re-derives whenever the session's matches change (e.g. after a new match is saved).
 */
export function useSessionStats(
  sessionId: string,
  startElo?: number,
): { stats: SessionStats; loading: boolean } {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vgcDb.matches
      .where('sessionId')
      .equals(sessionId)
      .toArray()
      .then((rows) => {
        setMatches(rows);
        setLoading(false);
      });
  }, [sessionId]);

  const stats = useMemo(
    () => computeSessionStats(matches, startElo),
    [matches, startElo],
  );

  return { stats, loading };
}
