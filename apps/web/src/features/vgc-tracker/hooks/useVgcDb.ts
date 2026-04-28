'use client';

import { useCallback, useEffect, useState } from 'react';
import { vgcDb } from '@/lib/db/vgc-db';
import type { Match, PresetVersion, Series, Session, TeamPreset } from '../types';
import { useTrackerSync } from '../context/TrackerSyncContext';

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useSessions() {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  const refresh = useCallback(async () => {
    const rows = await vgcDb.sessions.orderBy('startedAt').reverse().toArray();
    setAllSessions(rows);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh, lastSyncAt]);

  const create = useCallback(async (session: Session) => {
    await vgcDb.sessions.add(session);
    pushChange('sessions', session.id, session);
    await refresh();
  }, [refresh, pushChange]);

  const update = useCallback(async (id: string, patch: Partial<Session>) => {
    await vgcDb.sessions.update(id, patch);
    const updated = await vgcDb.sessions.get(id);
    if (updated) pushChange('sessions', id, updated);
    await refresh();
  }, [refresh, pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.sessions.delete(id);
    await vgcDb.matches.where('sessionId').equals(id).delete();
    await vgcDb.series.where('sessionId').equals(id).delete();
    pushChange('sessions', id, null);
    await refresh();
  }, [refresh, pushChange]);

  const archive = useCallback(async (id: string) => {
    await vgcDb.sessions.update(id, { archivedAt: Date.now() });
    const updated = await vgcDb.sessions.get(id);
    if (updated) pushChange('sessions', id, updated);
    await refresh();
  }, [refresh, pushChange]);

  const unarchive = useCallback(async (id: string) => {
    await vgcDb.sessions.update(id, { archivedAt: undefined });
    const updated = await vgcDb.sessions.get(id);
    if (updated) pushChange('sessions', id, updated);
    await refresh();
  }, [refresh, pushChange]);

  const sessions = allSessions.filter((s) => !s.archivedAt);
  const archivedSessions = allSessions.filter((s) => !!s.archivedAt);

  return { sessions, archivedSessions, loading, create, update, remove, archive, unarchive, refresh };
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export function useMatches(sessionId: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  const refresh = useCallback(async () => {
    const rows = await vgcDb.matches.where('sessionId').equals(sessionId).toArray();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    setMatches(rows);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh, lastSyncAt]);

  const create = useCallback(async (match: Match) => {
    await vgcDb.matches.add(match);
    pushChange('matches', match.id, match);
    await refresh();
  }, [refresh, pushChange]);

  const save = useCallback(async (match: Match) => {
    await vgcDb.matches.put(match);
    pushChange('matches', match.id, match);
  }, [pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.matches.delete(id);
    pushChange('matches', id, null);
    await refresh();
  }, [refresh, pushChange]);

  return { matches, loading, create, save, remove, refresh };
}

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushChange } = useTrackerSync();

  useEffect(() => {
    vgcDb.matches.get(matchId).then((m) => {
      setMatch(m ?? null);
      setLoading(false);
    });
  }, [matchId]);

  const save = useCallback(async (updated: Match) => {
    await vgcDb.matches.put(updated);
    setMatch(updated);
    pushChange('matches', updated.id, updated);
  }, [pushChange]);

  return { match, loading, save };
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export function usePresets() {
  const [presets, setPresets] = useState<TeamPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  const refresh = useCallback(async () => {
    const rows = await vgcDb.presets.orderBy('createdAt').reverse().toArray();
    setPresets(rows);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh, lastSyncAt]);

  const save = useCallback(async (preset: TeamPreset) => {
    const existing = await vgcDb.presets.get(preset.id);
    if (existing) {
      // Auto-version: snapshot current state before overwriting
      const snapshot: PresetVersion = {
        version: existing.currentVersion,
        name: existing.name,
        exportString: existing.exportString,
        slots: existing.slots,
        savedAt: Date.now(),
      };
      const updated: TeamPreset = {
        ...preset,
        versions: [...(existing.versions ?? []), snapshot],
        currentVersion: (existing.currentVersion ?? 1) + 1,
        updatedAt: Date.now(),
      };
      await vgcDb.presets.put(updated);
      pushChange('presets', updated.id, updated);
    } else {
      const toSave: TeamPreset = {
        ...preset,
        versions: preset.versions ?? [],
        currentVersion: preset.currentVersion ?? 1,
      };
      await vgcDb.presets.put(toSave);
      pushChange('presets', toSave.id, toSave);
    }
    await refresh();
  }, [refresh, pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.presets.delete(id);
    pushChange('presets', id, null);
    await refresh();
  }, [refresh, pushChange]);

  return { presets, loading, save, remove, refresh };
}

// ─── Series ──────────────────────────────────────────────────────────────────

export function useSeries(sessionId: string) {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  const refresh = useCallback(async () => {
    const rows = await vgcDb.series.where('sessionId').equals(sessionId).toArray();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    setSeriesList(rows);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh, lastSyncAt]);

  const create = useCallback(async (series: Series) => {
    await vgcDb.series.add(series);
    pushChange('series', series.id, series);
    await refresh();
  }, [refresh, pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.series.delete(id);
    pushChange('series', id, null);
    await refresh();
  }, [refresh, pushChange]);

  return { seriesList, loading, create, remove, refresh };
}

export function useSingleSeries(seriesId: string) {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushChange } = useTrackerSync();

  useEffect(() => {
    vgcDb.series.get(seriesId).then((s) => {
      setSeries(s ?? null);
      setLoading(false);
    });
  }, [seriesId]);

  const save = useCallback(async (updated: Series) => {
    await vgcDb.series.put(updated);
    setSeries(updated);
    pushChange('series', updated.id, updated);
  }, [pushChange]);

  return { series, loading, save };
}

// ─── Single preset ────────────────────────────────────────────────────────────

export function usePreset(presetId: string | null) {
  const [preset, setPreset] = useState<TeamPreset | null>(null);

  useEffect(() => {
    if (!presetId) { setPreset(null); return; }
    vgcDb.presets.get(presetId).then((p) => setPreset(p ?? null));
  }, [presetId]);

  return preset;
}
