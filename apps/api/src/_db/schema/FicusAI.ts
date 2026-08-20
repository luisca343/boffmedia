import {
  char,
  index,
  int,
  json,
  mysqlTable,
  timestamp,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

// Chat history for the in-app assistant. Deliberately NOT soft-deleted: "borrar
// mis mensajes" has to mean the assistant stops seeing them, and the previous
// `deleted_at` was honoured by `countByUuid` alone — every read that actually
// fed the model ignored it, so a cleared conversation kept answering from the
// messages the player thought they had deleted.
export const ficusAiMessages = mysqlTable(
  'rotom_ficusai_messages',
  {
    id: int('id').primaryKey().autoincrement(),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    content: json('content'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  // Every read is "the last N messages for this player", newest first.
  (t) => ({
    ownerRecentIdx: index('rotom_ficusai_messages_owner_recent_idx').on(
      t.uuid,
      t.id,
    ),
  }),
);

export type FicusAiMessage = typeof ficusAiMessages.$inferSelect;
