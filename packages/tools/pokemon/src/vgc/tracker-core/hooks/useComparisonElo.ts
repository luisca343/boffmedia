'use client';

import { useEffect, useMemo, useState } from 'react';
import { vgcDb } from '../db';
import type { Match, Session } from '../types';

export interface ComparisonSeries {
  id: string;
  label: string;
  startElo?: number;
  /** Chronological ELO points: index 0 = startElo anchor (if present), rest = match results. */
  points: { matchNum: number; elo: number }[];
}

export function useComparisonElo(
  sessionIds: string[],
  allSessions: Session[],
): { series: ComparisonSeries[]; loading: boolean } {
  const [matchMap, setMatchMap] = useState<Map<string, Match[]>>(new Map());
  const [loading, setLoading] = useState(false);

  // Use a stable string key so a new array reference with the same IDs
  // doesn't retrigger the effect on every render.
  const idsKey = sessionIds.join('\0');

  useEffect(() => {
    if (sessionIds.length === 0) {
      // Bail early without touching state when already empty — avoids
      // infinite re-renders when the caller passes a new `[]` each render.
      setMatchMap((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }
    setLoading(true);

    // One read for every session asked about — `all()` is a single trip, and
    // the per-session `where` this replaced was one trip each.
    vgcDb.matches.all().then((rows) => {
      const results = sessionIds.map(
        (id) => [id, rows.filter((m) => m.sessionId === id)] as [string, Match[]],
      );
      setMatchMap(new Map(results));
      setLoading(false);
    });
   
  }, [idsKey]);

  const series = useMemo((): ComparisonSeries[] => {
    const ids = idsKey ? idsKey.split('\0') : [];
    return ids.flatMap((id) => {
      const session = allSessions.find((s) => s.id === id);
      const matches = matchMap.get(id);
      if (!session || !matches) return [];

      const chronological = matches
        .filter((m) => m.result !== undefined && m.eloAfter !== undefined)
        .sort((a, b) => (a.completedAt ?? a.createdAt) - (b.completedAt ?? b.createdAt));

      const points: ComparisonSeries['points'] = [];
      if (session.startElo !== undefined) {
        points.push({ matchNum: 0, elo: session.startElo });
      }
      chronological.forEach((m, i) => {
        if (m.eloAfter !== undefined) {
          points.push({ matchNum: i + 1, elo: m.eloAfter });
        }
      });

      return [{ id, label: session.label, startElo: session.startElo, points }];
    });
  // allSessions ref changes each render (filtered array from parent) — acceptable cost for useMemo
   
  }, [idsKey, matchMap, allSessions]);

  return { series, loading };
}
