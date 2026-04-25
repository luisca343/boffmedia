import Dexie, { type Table } from 'dexie';
import type { Match, Series, Session, TeamPreset } from '@/features/vgc-tracker/types';

class VgcDatabase extends Dexie {
  sessions!: Table<Session, string>;
  matches!: Table<Match, string>;
  presets!: Table<TeamPreset, string>;
  series!: Table<Series, string>;

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
  }
}

export const vgcDb = new VgcDatabase();
