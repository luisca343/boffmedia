'use client';

import { useCallback, useEffect, useState } from 'react';
import { vgcDb } from '../db';
import type { Match, PresetVersion, Series, Session, TeamPreset } from '../types';
import { useTrackerSync } from '../context/TrackerSyncContext';

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useSessions() {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  const refresh = useCallback(async () => {
    const rows = await vgcDb.sessions.all();
    rows.sort((a, b) => b.startedAt - a.startedAt);
    setAllSessions(rows);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh, lastSyncAt]);

  const create = useCallback(async (session: Session) => {
    // `put` returns the row as stored, stamped with the version the server
    // compares. Queueing the caller's unstamped object instead sent a write
    // the server could never tell was newer than anything.
    const stored = await vgcDb.sessions.put(session);
    pushChange('sessions', stored.id, stored);
    await refresh();
  }, [refresh, pushChange]);

  const update = useCallback(async (id: string, patch: Partial<Session>) => {
    const updated = await vgcDb.sessions.update(id, patch);
    if (updated) pushChange('sessions', id, updated);
    await refresh();
  }, [refresh, pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.sessions.remove(id);
    for (const m of await vgcDb.matches.all()) if (m.sessionId === id) await vgcDb.matches.remove(m.id);
    for (const s of await vgcDb.series.all()) if (s.sessionId === id) await vgcDb.series.remove(s.id);
    // Only the session is queued. The server cascades the tombstone to its
    // matches and series, so queueing those too would send DELETEs for rows
    // already gone -- each answered 404, each surfacing as a failed change.
    pushChange('sessions', id, null);
    await refresh();
  }, [refresh, pushChange]);

  const archive = useCallback(async (id: string) => {
    const updated = await vgcDb.sessions.update(id, { archivedAt: Date.now() });
    if (updated) pushChange('sessions', id, updated);
    await refresh();
  }, [refresh, pushChange]);

  const unarchive = useCallback(async (id: string) => {
    const updated = await vgcDb.sessions.update(id, { archivedAt: undefined });
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
    const rows = (await vgcDb.matches.all()).filter((m) => m.sessionId === sessionId);
    rows.sort((a, b) => b.createdAt - a.createdAt);
    setMatches(rows);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh, lastSyncAt]);

  const create = useCallback(async (match: Match) => {
    const stored = await vgcDb.matches.put(match);
    pushChange('matches', stored.id, stored);
    await refresh();
  }, [refresh, pushChange]);

  const save = useCallback(async (match: Match) => {
    const stored = await vgcDb.matches.put(match);
    pushChange('matches', stored.id, stored);
  }, [pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.matches.remove(id);
    pushChange('matches', id, null);
    await refresh();
  }, [refresh, pushChange]);

  return { matches, loading, create, save, remove, refresh };
}

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  // `lastSyncAt` is a dependency for the same reason the list hooks have it:
  // opening a match before the first pull finished read an empty store and
  // rendered "match not found" until the screen was remounted by hand.
  useEffect(() => {
    vgcDb.matches.get(matchId).then((m) => {
      setMatch(m ?? null);
      setLoading(false);
    });
  }, [matchId, lastSyncAt]);

  const save = useCallback(async (updated: Match) => {
    const stored = await vgcDb.matches.put(updated);
    setMatch(stored);
    pushChange('matches', stored.id, stored);
  }, [pushChange]);

  return { match, loading, save };
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export function usePresets() {
  const [presets, setPresets] = useState<TeamPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  const refresh = useCallback(async () => {
    const rows = await vgcDb.presets.all();
    rows.sort((a, b) => b.createdAt - a.createdAt);
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
      const stored = await vgcDb.presets.put(updated);
      pushChange('presets', stored.id, stored);
    } else {
      const toSave: TeamPreset = {
        ...preset,
        versions: preset.versions ?? [],
        currentVersion: preset.currentVersion ?? 1,
      };
      const stored = await vgcDb.presets.put(toSave);
      pushChange('presets', stored.id, stored);
    }
    await refresh();
  }, [refresh, pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.presets.remove(id);
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
    const rows = (await vgcDb.series.all()).filter((s) => s.sessionId === sessionId);
    rows.sort((a, b) => b.createdAt - a.createdAt);
    setSeriesList(rows);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { refresh(); }, [refresh, lastSyncAt]);

  const create = useCallback(async (series: Series) => {
    const stored = await vgcDb.series.put(series);
    pushChange('series', stored.id, stored);
    await refresh();
  }, [refresh, pushChange]);

  const remove = useCallback(async (id: string) => {
    await vgcDb.series.remove(id);
    pushChange('series', id, null);
    await refresh();
  }, [refresh, pushChange]);

  return { seriesList, loading, create, remove, refresh };
}

export function useSingleSeries(seriesId: string) {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushChange, lastSyncAt } = useTrackerSync();

  useEffect(() => {
    vgcDb.series.get(seriesId).then((s) => {
      setSeries(s ?? null);
      setLoading(false);
    });
  }, [seriesId, lastSyncAt]);

  const save = useCallback(async (updated: Series) => {
    const stored = await vgcDb.series.put(updated);
    setSeries(stored);
    pushChange('series', stored.id, stored);
  }, [pushChange]);

  return { series, loading, save };
}

// ─── Single preset ────────────────────────────────────────────────────────────

export function usePreset(presetId: string | null) {
  const [preset, setPreset] = useState<TeamPreset | null>(null);
  const { lastSyncAt } = useTrackerSync();

  useEffect(() => {
    if (!presetId) { setPreset(null); return; }
    vgcDb.presets.get(presetId).then((p) => setPreset(p ?? null));
  }, [presetId, lastSyncAt]);

  return preset;
}
