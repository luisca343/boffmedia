import { apiAuthedDELETE, apiAuthedGET, apiAuthedPUT } from '@/services/boffAPI';
import type {
  CreateMatchDto,
  CreatePresetDto,
  CreateSessionDto,
  MatchDto,
  MatchNoteDto,
  MatchSlotDto,
  PresetSlotDto,
  PresetVersionDto,
  SeriesDto,
  SeriesGameDto,
  SessionDto,
  TeamPresetDto,
  TeamSnapshotDto,
  TrackerSyncDataDto,
  UpsertSeriesDto,
} from '@boffmedia/shared';

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

type TrackerFormat = 'BO1' | 'BO3';
type TrackerSessionType = 'ladder' | 'tournament';
type TrackerResult = 'win' | 'loss' | 'draw';
type TrackerOutcomeTag = 'skill' | 'misplay' | 'luck' | 'disconnect';
type TrackerNotePhase = 'live' | 'post' | 'series';
type TrackerSlotIndex = 0 | 1 | 2 | 3 | 4 | 5;
type TrackerSlotRole = 'lead1' | 'lead2' | 'back1' | 'back2' | 'unknown';

type TrackerPresetSlot = Omit<PresetSlotDto, 'slotIndex'> & {
  slotIndex: TrackerSlotIndex;
};

type TrackerPresetVersion = Omit<PresetVersionDto, 'slots'> & {
  slots: TrackerPresetSlot[];
};

type TrackerTeamPreset = Omit<TeamPresetDto, 'slots' | 'versions'> & {
  slots: TrackerPresetSlot[];
  versions: TrackerPresetVersion[];
};

type TrackerMatchSlot = Omit<MatchSlotDto, 'slotIndex' | 'role'> & {
  slotIndex: TrackerSlotIndex;
  role: TrackerSlotRole;
};

type TrackerTeamSnapshot = Omit<TeamSnapshotDto, 'slots'> & {
  slots: TrackerMatchSlot[];
};

type TrackerMatchNote = Omit<MatchNoteDto, 'phase'> & {
  phase: TrackerNotePhase;
};

type TrackerSession = Omit<SessionDto, 'format' | 'type'> & {
  format: TrackerFormat;
  type: TrackerSessionType;
};

type TrackerMatch = Omit<MatchDto, 'format' | 'result' | 'outcomeTag' | 'myTeam' | 'opponentTeam' | 'notes'> & {
  format: TrackerFormat;
  result?: TrackerResult;
  outcomeTag?: TrackerOutcomeTag;
  myTeam: TrackerTeamSnapshot;
  opponentTeam: TrackerTeamSnapshot;
  notes: TrackerMatchNote[];
};

type TrackerSeriesGame = Omit<SeriesGameDto, 'gameNumber' | 'result' | 'outcomeTag' | 'mySlots' | 'opponentSlots' | 'notes'> & {
  gameNumber: 1 | 2 | 3;
  result?: TrackerResult;
  outcomeTag?: TrackerOutcomeTag;
  mySlots: TrackerMatchSlot[];
  opponentSlots: TrackerMatchSlot[];
  notes: TrackerMatchNote[];
};

type TrackerSeries = Omit<SeriesDto, 'seriesResult' | 'myTeam' | 'opponentTeam' | 'games' | 'notes'> & {
  seriesResult?: TrackerResult;
  myTeam: TrackerTeamSnapshot;
  opponentTeam: TrackerTeamSnapshot;
  games: TrackerSeriesGame[];
  notes: TrackerMatchNote[];
};

export type TrackerSyncData = Omit<TrackerSyncDataDto, 'sessions' | 'matches' | 'series' | 'presets'> & {
  sessions: TrackerSession[];
  matches: TrackerMatch[];
  series: TrackerSeries[];
  presets: TrackerTeamPreset[];
};

type TrackerSessionWrite = Omit<CreateSessionDto, 'format' | 'type'> & {
  format: TrackerFormat;
  type?: TrackerSessionType;
  updatedAt?: number;
};

type TrackerMatchWrite = Omit<CreateMatchDto, 'format' | 'result' | 'outcomeTag'> & {
  format: TrackerFormat;
  result?: TrackerResult;
  outcomeTag?: TrackerOutcomeTag;
  updatedAt?: number;
};

type TrackerSeriesWrite = Omit<UpsertSeriesDto, 'seriesResult'> & {
  seriesResult?: TrackerResult;
  updatedAt?: number;
};

type TrackerPresetWrite = CreatePresetDto & {
  updatedAt?: number;
};

function toSessionPayload(session: TrackerSessionWrite): CreateSessionDto {
  return {
    id: session.id,
    type: session.type as CreateSessionDto.type | undefined,
    label: session.label,
    format: session.format as CreateSessionDto.format,
    regulationId: session.regulationId,
    activePresetId: session.activePresetId,
    startElo: session.startElo,
    startedAt: session.startedAt,
    tournamentName: session.tournamentName,
    limitlessTournamentId: session.limitlessTournamentId,
    archivedAt: session.archivedAt,
    sessionNotes: session.sessionNotes,
    clientUpdatedAt: session.clientUpdatedAt ?? session.updatedAt,
  };
}

function toMatchPayload(match: TrackerMatchWrite): CreateMatchDto {
  return {
    id: match.id,
    sessionId: match.sessionId,
    format: match.format as CreateMatchDto.format,
    createdAt: match.createdAt,
    completedAt: match.completedAt,
    myTeam: match.myTeam,
    opponentTeam: match.opponentTeam,
    opponentName: match.opponentName,
    result: match.result as CreateMatchDto.result | undefined,
    eloAfter: match.eloAfter,
    opponentElo: match.opponentElo,
    notes: match.notes,
    outcomeTag: match.outcomeTag,
    turnCount: match.turnCount,
    opponentArchetype: match.opponentArchetype,
    clientUpdatedAt: match.clientUpdatedAt ?? match.updatedAt,
  };
}

function toSeriesPayload(series: TrackerSeriesWrite): UpsertSeriesDto {
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
    clientUpdatedAt: series.clientUpdatedAt ?? series.updatedAt,
  };
}

function toPresetPayload(preset: TrackerPresetWrite): CreatePresetDto {
  return {
    id: preset.id,
    name: preset.name,
    regulationId: preset.regulationId,
    exportString: preset.exportString,
    slots: preset.slots,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
    clientUpdatedAt: preset.clientUpdatedAt ?? preset.updatedAt,
    currentVersion: preset.currentVersion,
    versions: preset.versions,
  };
}

export async function syncPull(token: string): Promise<TrackerSyncData | null> {
  const res = await apiAuthedGET<TrackerSyncData>(`${BASE}/sync`, token);
  if (!res.success || !res.data) return null;
  return res.data;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function pushSession(session: TrackerSessionWrite, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/sessions/${session.id}`, toSessionPayload(session), token);
  ensureSuccess(res, `PUT ${BASE}/sessions/${session.id}`);
}

export async function deleteSession(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/sessions/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/sessions/${id}`);
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function pushMatch(match: TrackerMatchWrite, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/matches/${match.id}`, toMatchPayload(match), token);
  ensureSuccess(res, `PUT ${BASE}/matches/${match.id}`);
}

export async function deleteMatch(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/matches/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/matches/${id}`);
}

// ─── Series ───────────────────────────────────────────────────────────────────

export async function pushSeries(series: TrackerSeriesWrite, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/series/${series.id}`, toSeriesPayload(series), token);
  ensureSuccess(res, `PUT ${BASE}/series/${series.id}`);
}

export async function deleteSeries(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/series/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/series/${id}`);
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export async function pushPreset(preset: TrackerPresetWrite, token: string): Promise<void> {
  const res = await apiAuthedPUT(`${BASE}/presets/${preset.id}`, toPresetPayload(preset), token);
  ensureSuccess(res, `PUT ${BASE}/presets/${preset.id}`);
}

export async function deletePreset(id: string, token: string): Promise<void> {
  const res = await apiAuthedDELETE(`${BASE}/presets/${id}`, token);
  ensureSuccess(res, `DELETE ${BASE}/presets/${id}`);
}
