import { saveFile } from '@boffmedia/tool-kit';
import { vgcDb } from '../db';
import type { Match, Series, Session } from '../types';
import type { SyncTable } from '../context/TrackerSyncContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionExport {
  _vgcExport: 1;
  exportedAt: number;
  type: 'session';
  session: Session;
  matches: Match[];
  series: Series[];
}

export interface FullExport {
  _vgcExport: 1;
  exportedAt: number;
  type: 'full';
  sessions: Session[];
  matches: Match[];
  series: Series[];
}

export type VgcExport = SessionExport | FullExport;

export interface ImportResult {
  sessions: number;
  matches: number;
  series: number;
}

type ImportEntity = Session | Match | Series;
type ImportSyncCallback = (table: SyncTable, id: string, data: ImportEntity) => void;

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportSession(sessionId: string): Promise<SessionExport> {
  const session = await vgcDb.sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  const [allMatches, allSeries] = await Promise.all([vgcDb.matches.all(), vgcDb.series.all()]);
  const matches = allMatches.filter((m) => m.sessionId === sessionId);
  const series = allSeries.filter((s) => s.sessionId === sessionId);

  return { _vgcExport: 1, exportedAt: Date.now(), type: 'session', session, matches, series };
}

export async function exportAll(): Promise<FullExport> {
  const [sessions, matches, series] = await Promise.all([
    vgcDb.sessions.all(),
    vgcDb.matches.all(),
    vgcDb.series.all(),
  ]);

  return { _vgcExport: 1, exportedAt: Date.now(), type: 'full', sessions, matches, series };
}

/**
 * Hand the export to the host's save flow.
 *
 * This used to be an `<a download>` click. That is inert inside the desktop
 * app's webview — no dialog, no file, no error — so the export button would
 * have looked like it worked and produced nothing. `saveFile` is a real dialog
 * in both hosts.
 */
export function downloadJson(data: VgcExport, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return saveFile({
    suggestedName: filename,
    data: blob,
    mimeType: 'application/json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function parseExportFile(text: string): VgcExport {
  const data = JSON.parse(text);
  if (data._vgcExport !== 1 || !data.type) throw new Error('Invalid file');
  return data as VgcExport;
}

export async function importData(data: VgcExport, onSynced?: ImportSyncCallback): Promise<ImportResult> {
  const result: ImportResult = { sessions: 0, matches: 0, series: 0 };

  const mergeInto = async <T extends ImportEntity>(
    existing: (T | undefined)[],
    incoming: T[],
    putAll: (items: T[]) => Promise<T[]>,
    counter: keyof ImportResult,
    table: SyncTable,
  ) => {
    const existingIds = new Set(existing.filter(Boolean).map((i) => i!.id));
    const toAdd = incoming.filter((i) => !existingIds.has(i.id));
    if (toAdd.length) {
      // Queue what was STORED, not what was in the file: `putMany` stamps each
      // row with the version the server's conflict check compares, and a write
      // queued without one can never be shown to be newer than anything.
      const stored = await putAll(toAdd);
      result[counter] += stored.length;
      if (onSynced) {
        for (const item of stored) onSynced(table, item.id, item);
      }
    }
  };

  if (data.type === 'session') {
    const sessions = [data.session];
    await mergeInto(await vgcDb.sessions.getMany(sessions.map((s) => s.id)), sessions, (items) => vgcDb.sessions.putMany(items), 'sessions', 'sessions');
    await mergeInto(await vgcDb.matches.getMany(data.matches.map((m) => m.id)), data.matches, (items) => vgcDb.matches.putMany(items), 'matches', 'matches');
    await mergeInto(await vgcDb.series.getMany(data.series.map((s) => s.id)), data.series, (items) => vgcDb.series.putMany(items), 'series', 'series');
  } else {
    await mergeInto(await vgcDb.sessions.getMany(data.sessions.map((s) => s.id)), data.sessions, (items) => vgcDb.sessions.putMany(items), 'sessions', 'sessions');
    await mergeInto(await vgcDb.matches.getMany(data.matches.map((m) => m.id)), data.matches, (items) => vgcDb.matches.putMany(items), 'matches', 'matches');
    await mergeInto(await vgcDb.series.getMany(data.series.map((s) => s.id)), data.series, (items) => vgcDb.series.putMany(items), 'series', 'series');
  }

  return result;
}
