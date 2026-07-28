import { sql } from 'drizzle-orm';
import {
  char,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

export const pokedexRegistry = mysqlTable(
  'rotom_pokedex',
  {
    id: int('id').primaryKey().autoincrement(),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    pokemonId: int('pokemon_id').notNull(),
    formId: varchar('form_id', { length: 32 }).notNull(),
    paletteId: varchar('palette_id', { length: 32 }).notNull(),
    seenAt: timestamp('seen_at').default(sql`CURRENT_TIMESTAMP()`),
    caughtAt: timestamp('caught_at'),
  },
  // A species/form/palette is registered once per trainer. Dex completion is
  // derived from row counts, so a duplicate inflates it (migration 0036).
  (t) => ({
    entryUq: uniqueIndex('rotom_pokedex_entry_uq').on(
      t.uuid,
      t.pokemonId,
      t.formId,
      t.paletteId,
    ),
  }),
);

export type PokedexRegistry = typeof pokedexRegistry.$inferSelect;
