'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { vgcDb } from '@/lib/db/vgc-db';
import {
  syncPull,
  pushSession,
  pushMatch,
  pushSeries,
  pushPreset,
  deleteSession as apiDeleteSession,
  deleteMatch as apiDeleteMatch,
  deleteSeries as apiDeleteSeries,
  deletePreset as apiDeletePreset,
} from '@/services/api/boffmedia/vgcTrackerService';
import type { Session, Match, Series, TeamPreset } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncTable = 'sessions' | 'matches' | 'series' | 'presets';
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface TrackerSyncContextValue {
  /** Call after every write. Pass null for data to trigger a DELETE on the server. */
  pushChange: (table: SyncTable, id: string, data: Session | Match | Series | TeamPreset | null) => void;
  syncStatus: SyncStatus;
  /** Increments after each successful pull so hooks know to re-query Dexie. */
  lastSyncAt: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TrackerSyncContext = createContext<TrackerSyncContextValue>({
  pushChange: () => {},
  syncStatus: 'offline',
  lastSyncAt: 0,
});

export function useTrackerSync() {
  return useContext(TrackerSyncContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function TrackerSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(String(session.user.id), 10) : null;

  // Keep a ref so pushChange always reads the latest userId without recreating
  const userIdRef = useRef<number | null>(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [lastSyncAt, setLastSyncAt] = useState(0);

  const ensureParentSessionSynced = useCallback(async (uid: number, sessionId: string) => {
    const localSession = await vgcDb.sessions.get(sessionId);
    if (!localSession) return;
    await pushSession(uid, localSession);
  }, []);

  // ─── Initial pull on login ──────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) {
      setSyncStatus('offline');
      return;
    }

    let cancelled = false;
    setSyncStatus('syncing');

    syncPull(userId)
      .then(async (remote) => {
        if (cancelled || !remote) return;

        const [localSessions, localMatches, localSeries, localPresets] = await Promise.all([
          vgcDb.sessions.toArray(),
          vgcDb.matches.toArray(),
          vgcDb.series.toArray(),
          vgcDb.presets.toArray(),
        ]);

        const localSessionIds = new Set(localSessions.map((s) => s.id));
        const localMatchIds = new Set(localMatches.map((m) => m.id));
        const localSeriesIds = new Set(localSeries.map((s) => s.id));
        const localPresetIds = new Set(localPresets.map((p) => p.id));

        const remoteSessionIds = new Set(remote.sessions.map((s) => s.id));
        const remoteMatchIds = new Set(remote.matches.map((m) => m.id));
        const remoteSeriesIds = new Set(remote.series.map((s) => s.id));
        const remotePresetIds = new Set(remote.presets.map((p) => p.id));

        const newSessions = remote.sessions.filter((s) => !localSessionIds.has(s.id));
        const newMatches = remote.matches.filter((m) => !localMatchIds.has(m.id));
        const newSeries = remote.series.filter((s) => !localSeriesIds.has(s.id));
        const newPresets = remote.presets.filter((p) => !localPresetIds.has(p.id));

        // Push local-only entities so existing offline history (including full BO3 series)
        // is backfilled to cloud storage after login.
        const localOnlySessions = localSessions.filter((s) => !remoteSessionIds.has(s.id));
        const localOnlyMatches = localMatches.filter((m) => !remoteMatchIds.has(m.id));
        const localOnlySeries = localSeries.filter((s) => !remoteSeriesIds.has(s.id));
        const localOnlyPresets = localPresets.filter((p) => !remotePresetIds.has(p.id));

        await Promise.all([
          newSessions.length > 0 ? vgcDb.sessions.bulkAdd(newSessions) : Promise.resolve(),
          newMatches.length > 0 ? vgcDb.matches.bulkAdd(newMatches) : Promise.resolve(),
          newSeries.length > 0 ? vgcDb.series.bulkAdd(newSeries) : Promise.resolve(),
          newPresets.length > 0 ? vgcDb.presets.bulkAdd(newPresets) : Promise.resolve(),
        ]);

        // Parent-first upserts to satisfy FK constraints.
        for (const s of localOnlySessions) await pushSession(userId, s);
        for (const m of localOnlyMatches) await pushMatch(userId, m);
        for (const s of localOnlySeries) await pushSeries(userId, s);
        for (const p of localOnlyPresets) await pushPreset(userId, p);

        if (!cancelled) {
          setSyncStatus('idle');
          setLastSyncAt(Date.now());
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[TrackerSync] Pull failed:', err);
          setSyncStatus('error');
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  // ─── Push individual changes ───────────────────────────────────────────────

  // Stable callback — reads userId from ref so it never needs recreating.
  // Each push is independent; no mutex needed.
  const pushChange = useCallback(
    (table: SyncTable, id: string, data: Session | Match | Series | TeamPreset | null) => {
      const uid = userIdRef.current;
      if (!uid) return; // anonymous — no sync

      const fire = async () => {
        setSyncStatus('syncing');
        try {
          if (data === null) {
            if (table === 'sessions') await apiDeleteSession(id);
            else if (table === 'matches') await apiDeleteMatch(id);
            else if (table === 'series') await apiDeleteSeries(id);
            else if (table === 'presets') await apiDeletePreset(id);
          } else {
            if (table === 'sessions') await pushSession(uid, data as Session);
            else if (table === 'matches') {
              const match = data as Match;
              await ensureParentSessionSynced(uid, match.sessionId);
              await pushMatch(uid, match);
            } else if (table === 'series') {
              const oneSeries = data as Series;
              await ensureParentSessionSynced(uid, oneSeries.sessionId);
              await pushSeries(uid, oneSeries);
            }
            else if (table === 'presets') await pushPreset(uid, data as TeamPreset);
          }
          setSyncStatus('idle');
        } catch (err) {
          console.error(`[TrackerSync] Push failed (${table} ${id}):`, err);
          setSyncStatus('error');
        }
      };

      void fire();
    },
    [ensureParentSessionSynced],
  );

  return (
    <TrackerSyncContext.Provider value={{ pushChange, syncStatus, lastSyncAt }}>
      {children}
    </TrackerSyncContext.Provider>
  );
}

