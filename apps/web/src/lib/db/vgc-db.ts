import Dexie, { type Table } from 'dexie';
import type { Match, Series, Session, TeamPreset } from '@/features/vgc-tracker/types';

export type TrackerOutboxTable = 'sessions' | 'matches' | 'series' | 'presets';
export type TrackerOutboxOp = 'upsert' | 'delete';

export interface TrackerOutboxEntry {
  opId: string;
  table: TrackerOutboxTable;
  entityId: string;
  op: TrackerOutboxOp;
  payload: Session | Match | Series | TeamPreset | null;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

class VgcDatabase extends Dexie {
  sessions!: Table<Session, string>;
  matches!: Table<Match, string>;
  presets!: Table<TeamPreset, string>;
  series!: Table<Series, string>;
  trackerOutbox!: Table<TrackerOutboxEntry, string>;

  constructor() {
    super('vgc-tracker');

    this.version(1).stores({
      sessions: 'id, startedAt',
      matches: 'id, sessionId, createdAt',
      presets: 'id, createdAt',
    });

    this.version(2)
      .stores({
        sessions: 'id, startedAt, type',
        matches: 'id, sessionId, createdAt',
        presets: 'id, createdAt',
        series: 'id, sessionId, createdAt',
      })
      .upgrade((tx) =>
        tx.table('sessions').toCollection().modify((s: Session) => {
          if (!s.type) s.type = 'ladder';
        }),
      );

    this.version(3)
      .stores({
        sessions: 'id, startedAt, type, archivedAt',
        matches: 'id, sessionId, createdAt',
        presets: 'id, createdAt',
        series: 'id, sessionId, createdAt',
      })
      .upgrade((tx) =>
        tx.table('presets').toCollection().modify((p: TeamPreset) => {
          if (!p.versions) {
            p.versions = [{
              version: 1,
              name: p.name,
              exportString: p.exportString,
              slots: p.slots,
              savedAt: p.updatedAt ?? p.createdAt,
            }];
            p.currentVersion = 1;
          }
        }),
      );

    this.version(4).stores({
      sessions: 'id, startedAt, type, archivedAt',
      matches: 'id, sessionId, createdAt',
      presets: 'id, createdAt',
      series: 'id, sessionId, createdAt',
      trackerOutbox: 'opId, nextAttemptAt, createdAt, updatedAt, [table+entityId]',
    });
  }
}

export const vgcDb = new VgcDatabase();
