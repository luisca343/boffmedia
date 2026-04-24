import Dexie, { type Table } from 'dexie';
import type { Match, Session, TeamPreset } from '@/features/vgc-tracker/types';

class VgcDatabase extends Dexie {
  sessions!: Table<Session, string>;
  matches!: Table<Match, string>;
  presets!: Table<TeamPreset, string>;

  constructor() {
    super('vgc-tracker');
    this.version(1).stores({
      sessions: 'id, startedAt',
      matches: 'id, sessionId, createdAt',
      presets: 'id, createdAt',
    });
  }
}

export const vgcDb = new VgcDatabase();
