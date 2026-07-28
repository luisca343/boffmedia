import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  index,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';

export const kartRaces = mysqlTable(
  'rotom_kart_races',
  {
    id: int('id').primaryKey().autoincrement(),
    server: varchar('server', { length: 64 }),
    circuito: varchar('circuito', { length: 128 }).notNull(),
    modo: varchar('modo', { length: 32 }).notNull(),
    vueltas: int('vueltas').notNull(),
    fecha: timestamp('fecha').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP()`),
  },
  (table) => [
    index('idx_kart_races_circuito').on(table.circuito),
    index('idx_kart_races_modo').on(table.modo),
  ],
);

export type KartRace = typeof kartRaces.$inferSelect;

/**
 * Deliberately no FK to `rotom_users`: a kart grid is whoever sat in a kart, and a player
 * only gets a users row once they open SmartRotom. `nombre` is a snapshot for the same
 * reason — the leaderboard has to render a name for a uuid the site has never seen.
 *
 * `tiempo_ms` and `mejor_vuelta_ms` are signed on purpose: the mod sends `-1` for
 * "never finished" / "completed no lap", so an unsigned column would reject the row.
 */
export const kartRacePlayers = mysqlTable(
  'rotom_kart_race_players',
  {
    id: int('id').primaryKey().autoincrement(),
    raceId: int('race_id')
      .notNull()
      .references(() => kartRaces.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: char('uuid', { length: 36 }).notNull(),
    nombre: varchar('nombre', { length: 32 }).notNull(),
    posicion: int('posicion').notNull(),
    tiempoMs: int('tiempo_ms').notNull(),
    mejorVueltaMs: int('mejor_vuelta_ms').notNull(),
    vueltasCompletadas: int('vueltas_completadas').notNull().default(0),
    dnf: boolean('dnf').notNull().default(false),
  },
  (table) => [
    index('idx_kart_race_players_uuid').on(table.uuid),
    index('idx_kart_race_players_race').on(table.raceId),
  ],
);

export type KartRacePlayer = typeof kartRacePlayers.$inferSelect;
