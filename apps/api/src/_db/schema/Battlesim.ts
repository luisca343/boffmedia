import {
  bigint,
  index,
  int,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

import { boffMediaUsers } from './BoffMedia';

/**
 * Battlesim's own storage: the replays a player keeps and the teams they build.
 *
 * IDENTITY IS THE BOFFMEDIA ACCOUNT (`user_id`), not the Minecraft uuid.
 *
 * The port plan (§5.3) proposed keying these on `rotom_users.uuid`, following
 * the 27 tables that do. That is the right key for anything reachable from
 * inside Minecraft, and the wrong one here: battlesim is a website and desktop
 * tool with no in-game surface at all, `AuthPrincipal.mcUuid` is OPTIONAL, and
 * `DesktopOrUserAuthGuard` always resolves a `userId` but only sometimes an
 * `mcUuid`. Keying on the uuid would mean a Boffmedia account that never linked
 * Minecraft could not save a replay or queue for a battle — a silent lockout of
 * the tool's main audience. `_db/CONVENTIONS.md` draws exactly this line
 * (`user_id int` = Boffmedia account, `uuid char(36)` = in-game identity), and
 * every other `tools_*` family — VGC tracker, TCG Pocket, randomizer — is on
 * `user_id` for the same reason.
 *
 * The liga's `rotom_replays` is untouched and keeps its own uuid-based shape;
 * these tables are separate storage for a separate surface.
 */

/** How a replay came to exist. */
export const BATTLESIM_REPLAY_SOURCES = ['local', 'pvp'] as const;

export const battlesimReplays = mysqlTable(
  'tools_battlesim_replays',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    /**
     * The id the client generated for this replay before it had ever seen the
     * server. It is what makes the upload idempotent: the tool queues a PUT
     * through the outbox, which may be retried any number of times, and
     * `(user_id, client_id)` is what collapses those retries into one row.
     */
    clientId: varchar('client_id', { length: 64 }).notNull(),
    format: varchar('format', { length: 64 }).notNull(),
    p1Name: varchar('p1_name', { length: 64 }).notNull(),
    p2Name: varchar('p2_name', { length: 64 }).notNull(),
    winner: varchar('winner', { length: 64 }),
    /**
     * The protocol log, the whole battle.
     *
     * MEDIUMTEXT, not TEXT. `rotom_replays.replay` is TEXT — 64 KB — and a long
     * battle overflows it, which MySQL will happily do by truncating the tail:
     * the replay then plays back to a point and stops, with nothing logged.
     * A 60-turn doubles battle is comfortably past 64 KB.
     */
    log: mediumtext('log').notNull(),
    /** Team snapshots as JSON, for the preview screen. */
    teams: text('teams'),
    source: mysqlEnum('source', BATTLESIM_REPLAY_SOURCES).notNull().default('local'),
    /** The other account in a PvP battle, so it is listed for both players. */
    opponentUserId: int('opponent_user_id').references(() => boffMediaUsers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    /**
     * When the battle was PLAYED, on the client's clock (epoch ms).
     *
     * Deliberately not a server `timestamp`, the same exception the VGC tracker
     * documents: a replay is created offline and uploaded whenever the network
     * comes back, so a server-set time would sort a week-old battle above one
     * played this morning.
     */
    playedAt: bigint('played_at', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    /** Tombstone (client clock). A hard delete is invisible to an offline device. */
    deletedAt: bigint('deleted_at', { mode: 'number' }),
  },
  (t) => ({
    ownerUq: uniqueIndex('bsim_replays_owner_client_uq').on(t.userId, t.clientId),
    // The listing is always "mine, newest first, excluding tombstones".
    ownerPlayedIdx: index('bsim_replays_owner_played_idx').on(t.userId, t.deletedAt, t.playedAt),
    opponentIdx: index('bsim_replays_opponent_idx').on(t.opponentUserId),
  }),
);

export type BattlesimReplay = typeof battlesimReplays.$inferSelect;
export type NewBattlesimReplay = typeof battlesimReplays.$inferInsert;

export const battlesimTeams = mysqlTable(
  'tools_battlesim_teams',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    /** See the note on `tools_battlesim_replays.client_id`. */
    clientId: varchar('client_id', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    format: varchar('format', { length: 64 }).notNull(),
    /** Showdown packed-team format — the sim's own wire shape. */
    packed: text('packed').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
    /**
     * The CLIENT's stamp for the last write this row accepted.
     *
     * Merge-on-sign-in compares this against the local copy's stamp — never
     * `updated_at`, which is the server's clock. Two clocks means a device
     * running a few minutes slow loses every conflict it should win.
     */
    clientUpdatedAt: bigint('client_updated_at', { mode: 'number' }),
    /** Tombstone (client clock); a tombstone beats a live row on merge. */
    deletedAt: bigint('deleted_at', { mode: 'number' }),
  },
  (t) => ({
    ownerUq: uniqueIndex('bsim_teams_owner_client_uq').on(t.userId, t.clientId),
    ownerIdx: index('bsim_teams_owner_deleted_idx').on(t.userId, t.deletedAt),
  }),
);

export type BattlesimTeam = typeof battlesimTeams.$inferSelect;
export type NewBattlesimTeam = typeof battlesimTeams.$inferInsert;
