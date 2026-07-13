import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  int,
  json,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

// PC marks: favourites + tags for Pokémon stored in the SmartRotom PC.
// The Pokémon live on the external Pixelmon server and have NO id — their
// position (box, index) changes on every move, so marks are keyed on an opaque
// content hash computed by the client (dex|palette|nature|ability|ivs).
// The API never computes nor validates that key.
export const rotomPcMarks = mysqlTable(
  'rotom_pc_marks',
  {
    id: int('id').primaryKey().autoincrement(),
    userUuid: varchar('user_uuid', { length: 64 }).notNull(),
    pokemonKey: varchar('pokemon_key', { length: 64 }).notNull(),
    favorite: boolean('favorite').notNull().default(false),
    tags: json('tags').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (t) => ({
    userKeyIdx: uniqueIndex('rotom_pc_marks_user_key_idx').on(
      t.userUuid,
      t.pokemonKey,
    ),
    userIdx: index('rotom_pc_marks_user_idx').on(t.userUuid),
  }),
);

export type RotomPcMark = typeof rotomPcMarks.$inferSelect;
