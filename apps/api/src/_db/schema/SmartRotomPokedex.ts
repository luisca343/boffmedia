import { sql } from 'drizzle-orm';
import {
  char,
  datetime,
  int,
  mysqlTable,
  varchar,
} from 'drizzle-orm/mysql-core';
import { smartrotomUsers } from './SmartRotom';

export const pokedexRegistry = mysqlTable('rotom_pokedex', {
  id: int('id').primaryKey().autoincrement(),
  uuid: char('uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  pokemonId: int('pokemon_id').notNull(),
  formId: varchar('form_id', { length: 32 }).notNull(),
  paletteId: varchar('palette_id', { length: 32 }).notNull(),
  seenAt: datetime('seen_at').default(sql`CURRENT_TIMESTAMP()`),
  caughtAt: datetime('caught_at'),
});

export type PokedexRegistry = typeof pokedexRegistry.$inferSelect;
