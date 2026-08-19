import {
  char,
  boolean,
  int,
  json,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

// PC marks: favourites + tags for Pokémon stored in the SmartRotom PC.
// The Pokémon live on the external Pixelmon server and have NO id — their
// position (box, index) changes on every move, so marks are keyed on an opaque
// content hash computed by the client (dex|palette|nature|ability|ivs).
// The API never computes nor validates that key.
export const rotomPcMarks = mysqlTable(
  'rotom_pc_marks',
  {
    id: int('id').primaryKey().autoincrement(),
    // Was varchar(64) with no constraint at all: the owner column of a
    // player-owned table, unable to be joined cleanly and free to hold a uuid
    // that belongs to nobody. Now the same char(36) FK every other
    // player-owned table uses.
    userUuid: char('user_uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    pokemonKey: varchar('pokemon_key', { length: 64 }).notNull(),
    favorite: boolean('favorite').notNull().default(false),
    tags: json('tags').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    userKeyIdx: uniqueIndex('rotom_pc_marks_user_key_uq').on(
      t.userUuid,
      t.pokemonKey,
    ),
  }),
);

export type RotomPcMark = typeof rotomPcMarks.$inferSelect;
