import { apiAuthedDELETE, apiAuthedGET, apiAuthedPUT } from '@/services/boffAPI';
import type { Session, Match, Series, TeamPreset } from '@/features/vgc-tracker/types';

const BASE = '/tools/vgc/tracker';

function ensureSuccess(
  res: { success: boolean; message?: string | string[]; error?: string },
  action: string,
): void {
  if (res.success) return;
  const message = Array.isArray(res.message) ? res.message.join('; ') : res.message;
  const reason = message ?? res.error ?? 'Unknown API error';
  throw new Error(`[TrackerSync] ${action} failed: ${reason}`);
}

// ─── Sync (pull all) ──────────────────────────────────────────────────────────

export interface TrackerSyncData {
  sessions: Session[];
  matches: Match[];
  series: Series[];
  presets: TeamPreset[];
}

type WireSession = Session & { createdAt?: number; updatedAt?: number };
type WireMatch = Match & { updatedAt?: number };
type WireSeries = Series & { updatedAt?: number };
type WirePreset = TeamPreset & { updatedAt?: number };

function toSessionPayload(session: Session): Session {
  return {
    id: session.id,
    type: session.type,
    label: session.label,
    format: session.format,
    regulationId: session.regulationId,
    activePresetId: session.activePresetId,
    startElo: session.startElo,
    startedAt: session.startedAt,
    tournamentName: session.tournamentName,
    limitlessTournamentId: session.limitlessTournamentId,
    archivedAt: session.archivedAt,
    sessionNotes: session.sessionNotes,
    updatedAt: session.updatedAt,
    clientUpdatedAt: session.updatedAt,
  } as Session;
}

function toMatchPayload(match: Match): Match {
  return {
    id: match.id,
    sessionId: match.sessionId,
    format: match.format,
    createdAt: match.createdAt,
    completedAt: match.completedAt,
    myTeam: match.myTeam,
    opponentTeam: match.opponentTeam,
    opponentName: match.opponentName,
    result: match.result,
    eloAfter: match.eloAfter,
    opponentElo: match.opponentElo,
    notes: match.notes,
    outcomeTag: match.outcomeTag,
    turnCount: match.turnCount,
    opponentArchetype: match.opponentArchetype,
    updatedAt: match.updatedAt,
    clientUpdatedAt: match.updatedAt,
  } as Match;
}

function toSeriesPayload(series: Series): Series {
  return {
    id: series.id,
    sessionId: series.sessionId,
    createdAt: series.createdAt,
    completedAt: series.completedAt,
    roundNumber: series.roundNumber,
    opponentName: series.opponentName,
    opponentArchetype: series.opponentArchetype,
    myTeam: series.myTeam,
    opponentTeam: series.opponentTeam,
    games: series.games,
    seriesResult: series.seriesResult,
    notes: series.notes,
    updatedAt: series.updatedAt,
    clientUpdatedAt: series.updatedAt,
  } as Series;
}

function toPresetPayload(preset: TeamPreset): TeamPreset {
  return {
    id: preset.id,
    name: preset.name,
    regulationId: preset.regulationId,
    exportString: preset.exportString,
    slots: preset.slots,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
    clientUpdatedAt: preset.updatedAt,
    currentVersion: preset.currentVersion,
    versions: preset.versions,
  } as TeamPreset;
}

function normalizeSyncData(data: TrackerSyncData): TrackerSyncData {
  return {
    sessions: data.sessions.map((session) => toSessionPayload(session as WireSession)),
    matches: data.matches.map((match) => toMatchPayload(match as WireMatch)),
    series: data.series.map((series) => toSeriesPayload(series as WireSeries)),
    presets: data.presets.map((preset) => toPresetPayload(preset as WirePreset)),
  };
}

export async function syncPull(token: string): Promise<TrackerSyncData | null> {
  const res = await apiAuthedGET<TrackerSyncData>(`${BASE}/sync`, token);
  if (!res.success || !res.data) return null;
  return normalizeSyncData(res.data);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function pushSession(session: Session, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/sessions/${session.id}`, toSessionPayload(session), token);
  ensureSuccess(res, `PUT ${BASE}/sessions/${session.id}`);
}

export async function deleteSession(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/sessions/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/sessions/${id}`);
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function pushMatch(match: Match, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/matches/${match.id}`, toMatchPayload(match), token);
  ensureSuccess(res, `PUT ${BASE}/matches/${match.id}`);
}

export async function deleteMatch(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/matches/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/matches/${id}`);
}

// ─── Series ───────────────────────────────────────────────────────────────────

export async function pushSeries(series: Series, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/series/${series.id}`, toSeriesPayload(series), token);
  ensureSuccess(res, `PUT ${BASE}/series/${series.id}`);
}

export async function deleteSeries(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/series/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/series/${id}`);
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export async function pushPreset(preset: TeamPreset, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/presets/${preset.id}`, toPresetPayload(preset), token);
  ensureSuccess(res, `PUT ${BASE}/presets/${preset.id}`);
}

export async function deletePreset(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/presets/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/presets/${id}`);
}
