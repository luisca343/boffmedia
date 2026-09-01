/**
 * The tracker's server side: the sync pull, and the payload shapes its writes
 * take.
 *
 * The difference from the web original this was lifted from is that nothing
 * here CALLS the write endpoints. The web service exported `pushSession`,
 * `deleteMatch` and six siblings, each taking a bearer token, and
 * `TrackerSyncContext` drove them through a retry loop it implemented itself.
 * Writes are now `ToolOutboxOp` descriptors — the kit's queue owns ordering,
 * retry, backoff and replay-after-reconnect, and the host owns the bearer.
 *
 * So this module exports two kinds of thing: `syncPull`, which reads, and
 * `*Op` builders, which describe a write without performing one.
 */

import type { ToolOutboxOp } from "@boffmedia/tool-kit";
import type {
  CreateMatchDto,
  CreateTrackerPresetDto,
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
} from "@boffmedia/shared";

import { request } from "../api";
import type { SyncTable } from "./tracker-core/db";

const BASE = '/tools/vgc/tracker';

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

type TrackerPresetWrite = CreateTrackerPresetDto & {
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

function toPresetPayload(preset: TrackerPresetWrite): CreateTrackerPresetDto {
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

/** A pull that could not be performed, as opposed to one that found nothing. */
export class TrackerSyncError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TrackerSyncError";
  }
}

/**
 * The whole account's tracker data.
 *
 * Throws when the request FAILED and returns `null` only when the server
 * genuinely had nothing. Collapsing the two — which is what returning `null`
 * for both did — meant an expired session or a 500 looked exactly like an empty
 * account: the merge did nothing, the badge went green, and the tool reported a
 * successful sync it had not performed.
 */
export async function syncPull(): Promise<TrackerSyncData | null> {
  const res = await request<TrackerSyncData>(`${BASE}/sync`, { auth: "required" });
  if (!res.success) {
    throw new TrackerSyncError(
      res.statusCode ?? 0,
      res.userMessage ?? res.error ?? "Tracker sync failed",
    );
  }
  return res.data ?? null;
}

// ─── Write descriptors ───────────────────────────────────────────────────────
//
// `dedupeKey` is `<table>:<id>` — the same key the old hand-rolled outbox used
// as its `opId`, and correct here for the same reason: every one of these ops
// carries the entity's WHOLE final state, so a row edited five times offline
// sends one PUT of the fifth state rather than five PUTs.

export function sessionOp(session: TrackerSessionWrite): ToolOutboxOp {
  return {
    method: "PUT",
    path: `${BASE}/sessions/${session.id}`,
    body: toSessionPayload(session),
    dedupeKey: `sessions:${session.id}`,
  };
}

export function matchOp(match: TrackerMatchWrite): ToolOutboxOp {
  return {
    method: "PUT",
    path: `${BASE}/matches/${match.id}`,
    body: toMatchPayload(match),
    dedupeKey: `matches:${match.id}`,
  };
}

export function seriesOp(series: TrackerSeriesWrite): ToolOutboxOp {
  return {
    method: "PUT",
    path: `${BASE}/series/${series.id}`,
    body: toSeriesPayload(series),
    dedupeKey: `series:${series.id}`,
  };
}

export function presetOp(preset: TrackerPresetWrite): ToolOutboxOp {
  return {
    method: "PUT",
    path: `${BASE}/presets/${preset.id}`,
    body: toPresetPayload(preset),
    dedupeKey: `presets:${preset.id}`,
  };
}

/**
 * A delete shares the upsert's dedupe key on purpose: deleting a row that still
 * has a pending edit should REPLACE that edit, not follow it.
 *
 * `clientDeletedAt` rides in the query string rather than a body — a DELETE
 * body is carried inconsistently, and this has to survive both the browser's
 * fetch and the desktop app's Rust replay. The server stores it as the
 * tombstone's timestamp, which is what an offline edit of the same row is later
 * compared against.
 */
export function deleteOp(table: SyncTable, id: string, at: number = Date.now()): ToolOutboxOp {
  return {
    method: "DELETE",
    path: `${BASE}/${table}/${id}?clientDeletedAt=${at}`,
    dedupeKey: `${table}:${id}`,
  };
}
