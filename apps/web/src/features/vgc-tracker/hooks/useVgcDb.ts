'use client';

import { useCallback, useEffect, useState } from 'react';
import { vgcDb } from '@/lib/db/vgc-db';
import type { Match, Series, Session, TeamPreset } from '../types';

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await vgcDb.sessions.orderBy('startedAt').reverse().toArray();
    setSessions(rows);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (session: Session) => {
    await vgcDb.sessions.add(session);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.sessions.delete(id);
    await vgcDb.matches.where('sessionId').equals(id).delete();
    await vgcDb.series.where('sessionId').equals(id).delete();
    await refresh();
  }, [refresh]);

  return { sessions, loading, create, remove, refresh };
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export function useMatches(sessionId: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await vgcDb.matches.where('sessionId').equals(sessionId).toArray();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    setMatches(rows);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (match: Match) => {
    await vgcDb.matches.add(match);
    await refresh();
  }, [refresh]);

  const save = useCallback(async (match: Match) => {
    await vgcDb.matches.put(match);
  }, []);

  const remove = useCallback(async (id: string) => {
    await vgcDb.matches.delete(id);
    await refresh();
  }, [refresh]);

  return { matches, loading, create, save, remove, refresh };
}

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vgcDb.matches.get(matchId).then((m) => {
      setMatch(m ?? null);
      setLoading(false);
    });
  }, [matchId]);

  const save = useCallback(async (updated: Match) => {
    await vgcDb.matches.put(updated);
    setMatch(updated);
  }, []);

  return { match, loading, save };
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export function usePresets() {
  const [presets, setPresets] = useState<TeamPreset[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await vgcDb.presets.orderBy('createdAt').reverse().toArray();
    setPresets(rows);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (preset: TeamPreset) => {
    await vgcDb.presets.put(preset);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.presets.delete(id);
    await refresh();
  }, [refresh]);

  return { presets, loading, save, remove, refresh };
}

// ─── Series ──────────────────────────────────────────────────────────────────

export function useSeries(sessionId: string) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await vgcDb.series.where('sessionId').equals(sessionId).toArray();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    setSeriesList(rows);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (series: Series) => {
    await vgcDb.series.add(series);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.series.delete(id);
    await refresh();
  }, [refresh]);

  return { seriesList, loading, create, remove, refresh };
}

export function useSingleSeries(seriesId: string) {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vgcDb.series.get(seriesId).then((s) => {
      setSeries(s ?? null);
      setLoading(false);
    });
  }, [seriesId]);

  const save = useCallback(async (updated: Series) => {
    await vgcDb.series.put(updated);
    setSeries(updated);
  }, []);

  return { series, loading, save };
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export function usePreset(presetId: string | null) {
  const [preset, setPreset] = useState<TeamPreset | null>(null);

  useEffect(() => {
    if (!presetId) { setPreset(null); return; }
    vgcDb.presets.get(presetId).then((p) => setPreset(p ?? null));
  }, [presetId]);

  return preset;
}
