import { sql } from 'drizzle-orm';
import {
  char,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

// The carné. One row per trainer, created on first read of the passport — nothing
// here is a score: `trainerId` is derived from the uuid and `region` from the world
// the player logs in from. Everything the app actually ranks (badges, title, LP) is
// DERIVED from achievements and replays, never stored.
export const pasaporteProfiles = mysqlTable('rotom_pasaporte_profiles', {
  uuid: char('uuid', { length: 36 })
    .primaryKey()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  // Printed on the carné and encoded in its QR — once issued it never changes.
  trainerId: varchar('trainer_id', { length: 16 }).notNull().unique(),
  region: varchar('region', { length: 32 }).notNull().default('Fukitsu'),
  memberSince: timestamp('member_since').default(sql`CURRENT_TIMESTAMP()`),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP()`),
});

export type PasaporteProfile = typeof pasaporteProfiles.$inferSelect;
export type NewPasaporteProfile = typeof pasaporteProfiles.$inferInsert;

// A competitive cycle. It only bounds a time window — the standing inside it is
// computed from rotom_replays, so there is no LP column here (or anywhere).
export const pasaporteSeasons = mysqlTable('rotom_pasaporte_seasons', {
  id: int('id').primaryKey().autoincrement(),
  number: int('number').notNull(),
  name: varchar('name', { length: 64 }).notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  active: int('active').default(1),
});

export type PasaporteSeason = typeof pasaporteSeasons.$inferSelect;
export type NewPasaporteSeason = typeof pasaporteSeasons.$inferInsert;

// Game-design data, not a table: the rungs a derived LP score maps onto. Lives with
// the schema so the API and the seed read one definition; the API also ships it to the
// client in the season payload so nothing duplicates these numbers.
export const SEASON_LADDER = [
  { key: 'bronce', name: 'Bronce', minLp: 0 },
  { key: 'plata', name: 'Plata', minLp: 200 },
  { key: 'oro', name: 'Oro', minLp: 500 },
  { key: 'platino', name: 'Platino', minLp: 900 },
  { key: 'diamante', name: 'Diamante', minLp: 1200 },
  { key: 'maestro', name: 'Maestro', minLp: 1400 },
] as const;

export type SeasonLadderRung = (typeof SEASON_LADDER)[number];
export type SeasonTierKey = SeasonLadderRung['key'];
