import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  index,
  int,
  json,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const dungeonRuns = mysqlTable('rotom_dungeon_runs', {
  id: int('id').primaryKey().autoincrement(),
  server: varchar('server', { length: 64 }),
  semilla: varchar('semilla', { length: 64 }).notNull(),
  etapaInicial: int('etapa_inicial').notNull(),
  etapaFinal: int('etapa_final').notNull(),
  pisosSuperados: int('pisos_superados').notNull(),
  completada: boolean('completada').notNull(),
  duracionMs: bigint('duracion_ms', { mode: 'number' }).notNull(),
  maldiciones: json('maldiciones').$type<string[]>().notNull(),
  monedasGanadas: int('monedas_ganadas').notNull(),
  monedasGastadas: int('monedas_gastadas').notNull(),
  monedasConvertidas: int('monedas_convertidas').notNull(),
  fecha: timestamp('fecha').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP()`),
});

export type PartidaMazmorra = typeof dungeonRuns.$inferSelect;

/**
 * Deliberately no FK to `rotom_users`: a dungeon party is whoever walked in, and a player
 * only gets a users row once they open SmartRotom. `nombre` is a snapshot for the same
 * reason — the leaderboard has to render a name for a uuid the site has never seen.
 */
export const dungeonRunPlayers = mysqlTable(
  'rotom_dungeon_run_players',
  {
    id: int('id').primaryKey().autoincrement(),
    runId: int('run_id')
      .notNull()
      .references(() => dungeonRuns.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: char('uuid', { length: 36 }).notNull(),
    nombre: varchar('nombre', { length: 32 }).notNull(),
    muertes: int('muertes').notNull().default(0),
    abandono: boolean('abandono').notNull().default(false),
  },
  (table) => [
    index('idx_dungeon_run_players_uuid').on(table.uuid),
    index('idx_dungeon_run_players_run').on(table.runId),
  ],
);

export type ParticipanteMazmorra = typeof dungeonRunPlayers.$inferSelect;
