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
  }
}

export const vgcDb = new VgcDatabase();
