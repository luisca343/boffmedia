'use client';

import { useEffect, useMemo, useState } from 'react';
import { storeRevision, trackerNamespace, vgcDb } from '../db';
import { buildOppUsage, type PokemonUsage, type FinishedMatch } from '../utils/sessionStats';
import { VgcService } from '../../service';
import type { Match } from '../types';

const regulationMatchesCache = new Map<string, Match[]>();
const regulationMatchesInflight = new Map<string, Promise<Match[]>>();

// The revision this cache was built against. The store has no change events, so
// this is how the cache learns that a match was recorded, imported or synced —
// without it, stats showed the state from whenever the screen first asked.
let cachedRevision = storeRevision();

function dropCacheIfStale(): void {
  if (cachedRevision === storeRevision()) return;
  cachedRevision = storeRevision();
  regulationMatchesCache.clear();
}

const tournamentUsageCache = new Map<string, Map<string, number>>();
const tournamentUsageInflight = new Map<string, Promise<Map<string, number> | undefined>>();

async function loadMatchesByRegulation(regulationId: string): Promise<Match[]> {
  // Keyed by the STORE as well as the regulation. This cache holds one
  // account's matches, and the store is now per-account: keyed by regulation
  // alone, signing in would be served the previous player's games out of a map
  // that never noticed the switch. The API-backed cache below needs no such
  // key — its contents are the same for everyone.
  dropCacheIfStale();
  const key = `${trackerNamespace()}|${regulationId}`;
  const cached = regulationMatchesCache.get(key);
  if (cached) return cached;

  const inflight = regulationMatchesInflight.get(key);
  if (inflight) return inflight;

  const request = vgcDb.sessions.all().then(async (sessions) => {
    const ids = new Set(
      sessions.filter((s) => s.regulationId === regulationId).map((s) => s.id),
    );

    if (ids.size === 0) {
      return [];
    }

    const all = (await vgcDb.matches.all()).filter((m) => ids.has(m.sessionId));
    regulationMatchesCache.set(key, all);
    return all;
  }).finally(() => {
    regulationMatchesInflight.delete(key);
  });

  regulationMatchesInflight.set(key, request);
  return request;
}

async function loadTournamentUsageMap(regulationId: string): Promise<Map<string, number> | undefined> {
  const cached = tournamentUsageCache.get(regulationId);
  if (cached) return cached;

  const inflight = tournamentUsageInflight.get(regulationId);
  if (inflight) return inflight;

  const request = VgcService.getLimitlessCombinedUsage(regulationId)
    .then((response) => {
      if (!response.success || !response.data) {
        return undefined;
      }

      const map = new Map<string, number>();
      response.data.forEach((entry) => {
        map.set(entry.speciesId, entry.usagePercent);
      });
      tournamentUsageCache.set(regulationId, map);
      return map;
    })
    .catch(() => undefined)
    .finally(() => {
      tournamentUsageInflight.delete(regulationId);
    });

  tournamentUsageInflight.set(regulationId, request);
  return request;
}

export interface RegulationMeta {
  preview: PokemonUsage[];
  leads: PokemonUsage[];
  backs: PokemonUsage[];
  totalMatches: number;
  /** Optional tournament usage % per speciesId (from Limitless combined usage) */
  tournamentUsageMap?: Map<string, number>;
}

export function useRegulationMeta(
  regulationId: string | undefined,
  limitlessTournamentId?: number,
): { meta: RegulationMeta | null; loading: boolean } {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentUsageMap, setTournamentUsageMap] = useState<Map<string, number>>();

  useEffect(() => {
    let cancelled = false;

    if (!regulationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadMatchesByRegulation(regulationId).then((all) => {
      if (cancelled) {
        return;
      }

      setMatches(all);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setMatches([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [regulationId]);

  // Fetch tournament usage data if a tournament ID is provided
  useEffect(() => {
    let cancelled = false;

    if (!regulationId || !limitlessTournamentId) {
      setTournamentUsageMap(undefined);
      return;
    }

    loadTournamentUsageMap(regulationId)
      .then((map) => {
        if (!cancelled) {
          setTournamentUsageMap(map);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTournamentUsageMap(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [regulationId, limitlessTournamentId]);

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
      tournamentUsageMap,
    };
  }, [matches, tournamentUsageMap]);

  return { meta, loading };
}
