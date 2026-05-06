import { vgcDb } from '@/lib/db/vgc-db';
import type { Match, Series, Session, TeamPreset } from '../types';
import type { SyncTable } from '../context/TrackerSyncContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionExport {
  _vgcExport: 1;
  exportedAt: number;
  type: 'session';
  session: Session;
  matches: Match[];
  series: Series[];
  preset?: TeamPreset;
}

export interface FullExport {
  _vgcExport: 1;
  exportedAt: number;
  type: 'full';
  sessions: Session[];
  matches: Match[];
  series: Series[];
  presets: TeamPreset[];
}

export type VgcExport = SessionExport | FullExport;

export interface ImportResult {
  sessions: number;
  matches: number;
  series: number;
  presets: number;
}

type ImportEntity = Session | Match | Series | TeamPreset;
type ImportSyncCallback = (table: SyncTable, id: string, data: ImportEntity) => void;

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportSession(sessionId: string): Promise<SessionExport> {
  const session = await vgcDb.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const [matches, series] = await Promise.all([
    vgcDb.matches.where('sessionId').equals(sessionId).toArray(),
    vgcDb.series.where('sessionId').equals(sessionId).toArray(),
  ]);

  const preset = session.activePresetId
    ? await vgcDb.presets.get(session.activePresetId)
    : undefined;

  return { _vgcExport: 1, exportedAt: Date.now(), type: 'session', session, matches, series, preset };
}

export async function exportAll(): Promise<FullExport> {
  const [sessions, matches, series, presets] = await Promise.all([
    vgcDb.sessions.toArray(),
    vgcDb.matches.toArray(),
    vgcDb.series.toArray(),
    vgcDb.presets.toArray(),
  ]);

  return { _vgcExport: 1, exportedAt: Date.now(), type: 'full', sessions, matches, series, presets };
}

export function downloadJson(data: VgcExport, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function parseExportFile(text: string): VgcExport {
  const data = JSON.parse(text);
  if (data._vgcExport !== 1 || !data.type) throw new Error('Invalid file');
  return data as VgcExport;
}

export async function importData(data: VgcExport, onSynced?: ImportSyncCallback): Promise<ImportResult> {
  const result: ImportResult = { sessions: 0, matches: 0, series: 0, presets: 0 };

  const mergeInto = async <T extends ImportEntity>(
    existing: (T | undefined)[],
    incoming: T[],
    putAll: (items: T[]) => Promise<unknown>,
    counter: keyof ImportResult,
    table: SyncTable,
  ) => {
    const existingIds = new Set(existing.filter(Boolean).map((i) => i!.id));
    const toAdd = incoming.filter((i) => !existingIds.has(i.id));
    if (toAdd.length) {
      await putAll(toAdd);
      result[counter] += toAdd.length;
      if (onSynced) {
        for (const item of toAdd) onSynced(table, item.id, item);
      }
    }
  };

  if (data.type === 'session') {
    const sessions = [data.session];
    await mergeInto(await vgcDb.sessions.bulkGet(sessions.map((s) => s.id)), sessions, (items) => vgcDb.sessions.bulkPut(items), 'sessions', 'sessions');
    await mergeInto(await vgcDb.matches.bulkGet(data.matches.map((m) => m.id)), data.matches, (items) => vgcDb.matches.bulkPut(items), 'matches', 'matches');
    await mergeInto(await vgcDb.series.bulkGet(data.series.map((s) => s.id)), data.series, (items) => vgcDb.series.bulkPut(items), 'series', 'series');
    if (data.preset) {
      const presets = [data.preset];
      await mergeInto(await vgcDb.presets.bulkGet(presets.map((p) => p.id)), presets, (items) => vgcDb.presets.bulkPut(items), 'presets', 'presets');
    }
  } else {
    await mergeInto(await vgcDb.sessions.bulkGet(data.sessions.map((s) => s.id)), data.sessions, (items) => vgcDb.sessions.bulkPut(items), 'sessions', 'sessions');
    await mergeInto(await vgcDb.matches.bulkGet(data.matches.map((m) => m.id)), data.matches, (items) => vgcDb.matches.bulkPut(items), 'matches', 'matches');
    await mergeInto(await vgcDb.series.bulkGet(data.series.map((s) => s.id)), data.series, (items) => vgcDb.series.bulkPut(items), 'series', 'series');
    await mergeInto(await vgcDb.presets.bulkGet(data.presets.map((p) => p.id)), data.presets, (items) => vgcDb.presets.bulkPut(items), 'presets', 'presets');
  }

  return result;
}
