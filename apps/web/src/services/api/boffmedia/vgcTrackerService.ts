import { apiGET, apiPUT, apiDELETE } from '@/services/boffAPI';
import type { Session, Match, Series, TeamPreset } from '@/features/vgc-tracker/types';

const BASE = '/tools/vgc/tracker';

function ensureSuccess(res: { success: boolean; message?: string; error?: string }, action: string): void {
  if (res.success) return;
  const reason = res.error ?? res.message ?? 'Unknown API error';
  throw new Error(`[TrackerSync] ${action} failed: ${reason}`);
}

// ─── Sync (pull all) ──────────────────────────────────────────────────────────

export interface TrackerSyncData {
  sessions: Session[];
  matches: Match[];
  series: Series[];
  presets: TeamPreset[];
}

export async function syncPull(userId: number): Promise<TrackerSyncData | null> {
  const res = await apiGET<TrackerSyncData>(`${BASE}/sync?userId=${userId}`);
  if (!res.success || !res.data) return null;
  return res.data;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function pushSession(userId: number, session: Session): Promise<void> {
  const res = await apiPUT(`${BASE}/sessions/${session.id}`, { ...session, userId });
  ensureSuccess(res, `PUT ${BASE}/sessions/${session.id}`);
}

export async function deleteSession(id: string): Promise<void> {
  const res = await apiDELETE(`${BASE}/sessions/${id}`);
  ensureSuccess(res, `DELETE ${BASE}/sessions/${id}`);
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function pushMatch(userId: number, match: Match): Promise<void> {
  // Use PUT so it acts as upsert (create or update)
  const res = await apiPUT(`${BASE}/matches/${match.id}`, { ...match, userId });
  ensureSuccess(res, `PUT ${BASE}/matches/${match.id}`);
}

export async function deleteMatch(id: string): Promise<void> {
  const res = await apiDELETE(`${BASE}/matches/${id}`);
  ensureSuccess(res, `DELETE ${BASE}/matches/${id}`);
}

// ─── Series ───────────────────────────────────────────────────────────────────

export async function pushSeries(userId: number, series: Series): Promise<void> {
  const res = await apiPUT(`${BASE}/series/${series.id}`, { ...series, userId });
  ensureSuccess(res, `PUT ${BASE}/series/${series.id}`);
}

export async function deleteSeries(id: string): Promise<void> {
  const res = await apiDELETE(`${BASE}/series/${id}`);
  ensureSuccess(res, `DELETE ${BASE}/series/${id}`);
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export async function pushPreset(userId: number, preset: TeamPreset): Promise<void> {
  const res = await apiPUT(`${BASE}/presets/${preset.id}`, { ...preset, userId });
  ensureSuccess(res, `PUT ${BASE}/presets/${preset.id}`);
}

export async function deletePreset(id: string): Promise<void> {
  const res = await apiDELETE(`${BASE}/presets/${id}`);
  ensureSuccess(res, `DELETE ${BASE}/presets/${id}`);
}
