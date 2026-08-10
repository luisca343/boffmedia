import {
  timestamp,
  int,
  mysqlTable,
  varchar,
  text,
  primaryKey,
  mysqlEnum,
  index,
  foreignKey,
  boolean,
  unique,
  AnyMySqlColumn,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';
import { packs } from './Packs';
import { sql } from 'drizzle-orm';

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const VISIBILITY_STATUS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export const PARTICIPANT_STATUS = {
  REGISTERED: 'registered',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  REMOVED: 'removed',
} as const;

export const boffMediaGames = mysqlTable('boffmedia_games', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }).notNull(),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  deletedAt: timestamp('deleted_at'),
});

export type Game = typeof boffMediaGames.$inferSelect;

export const boffMediaEvents = mysqlTable(
  'boffmedia_events',
  {
    id: int('id').primaryKey().autoincrement(),
    parentId: int('parent_id').references(
      (): AnyMySqlColumn => boffMediaEvents.id,
      {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      },
    ),
    title: varchar('title', { length: 255 }).notNull(),
    gameId: int('game_id').references(() => boffMediaGames.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
    description: text('description'),
    icon: varchar('icon', { length: 255 }).notNull(),
    banner: varchar('banner', { length: 255 }),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    status: mysqlEnum('status', [
      EVENT_STATUS.UPCOMING,
      EVENT_STATUS.ACTIVE,
      EVENT_STATUS.COMPLETED,
    ])
      .notNull()
      .default(EVENT_STATUS.UPCOMING),
    visibility: mysqlEnum('visibility', [
      VISIBILITY_STATUS.PUBLIC,
      VISIBILITY_STATUS.PRIVATE,
    ])
      .notNull()
      .default(VISIBILITY_STATUS.PRIVATE),
    type: mysqlEnum('type', ['event', 'server']).notNull(),
    packId: varchar('pack_id', { length: 32 }),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      gameIdx: index('game_idx').on(table.gameId),
      statusIdx: index('event_status_idx').on(table.status),
      visibilityIdx: index('event_visibility_idx').on(table.visibility),
      typeIdx: index('event_type_idx').on(table.type),
      packFk: foreignKey({
        name: 'be_pack_fk',
        columns: [table.packId],
        foreignColumns: [packs.id],
      }).onDelete('set null'),
      packIdx: index('be_pack_idx').on(table.packId),
    };
  },
);

export type Event = typeof boffMediaEvents.$inferSelect;

export const boffMediaParticipants = mysqlTable(
  'boffmedia_participants',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id'), // May be null for anonymous participants
    nickname: varchar('nickname', { length: 32 }),
    avatar: varchar('avatar', { length: 255 }),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => {
    return {
      userIdx: index('p_user_idx').on(table.userId),
      // One participant identity per user: concurrent first-joins used to fork
      // a user into two rows, splitting progress/trophies/entitlement. MySQL
      // allows multiple NULLs, so anonymous participants are unaffected.
      userUq: unique('p_user_uq').on(table.userId),
      userFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [boffMediaUsers.id],
        name: 'p_user_fk',
      })
        .onDelete('set null')
        .onUpdate('cascade'),
    };
  },
);

export type Participant = typeof boffMediaParticipants.$inferSelect;

// Teams table with role-based leadership
export const boffMediaEventTeams = mysqlTable(
  'boffmedia_event_teams',
  {
    id: int('id').primaryKey().autoincrement(),
    eventId: int('event_id').references(() => boffMediaEvents.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    tag: varchar('tag', { length: 10 }), // Short team tag/code
    icon: varchar('icon', { length: 255 }),
    totalScore: int('total_score').notNull().default(0),
    status: mysqlEnum('status', ['active', 'disqualified', 'withdrew'])
      .notNull()
      .default('active'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      eventIdx: index('et_event_idx').on(table.eventId),
    };
  },
);

export type EventTeam = typeof boffMediaEventTeams.$inferSelect;

export const boffMediaEventTeamMembers = mysqlTable(
  'boffmedia_event_team_members',
  {
    teamId: int('team_id'),
    participantId: int('participant_id'),
    role: mysqlEnum('role', ['leader', 'member']).notNull().default('member'),
    joinedAt: timestamp('joined_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.teamId, table.participantId] }),
      roleIdx: index('etm_role_idx').on(table.teamId, table.role),
      teamFk: foreignKey({
        columns: [table.teamId],
        foreignColumns: [boffMediaEventTeams.id],
        name: 'etm_team_fk',
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      participantFk: foreignKey({
        columns: [table.participantId],
        foreignColumns: [boffMediaParticipants.id],
        name: 'etm_participant_fk',
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
    };
  },
);

export type EventTeamMember = typeof boffMediaEventTeamMembers.$inferSelect;

export const boffMediaEventParticipants = mysqlTable(
  'boffmedia_event_participants',
  {
    id: int('id').primaryKey().autoincrement(),
    participantId: int('participant_id').notNull(),
    eventId: int('event_id').notNull(),
    status: mysqlEnum('status', [
      PARTICIPANT_STATUS.REGISTERED,
      PARTICIPANT_STATUS.CONFIRMED,
      PARTICIPANT_STATUS.DECLINED,
      PARTICIPANT_STATUS.REMOVED,
    ])
      .notNull()
      .default(PARTICIPANT_STATUS.REGISTERED),
    comment: text('comment'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => {
    return {
      eventIdx: index('ep_event_idx').on(table.eventId),
      participantIdx: index('ep_participant_idx').on(table.participantId),
      // Membership is the source of truth for pack entitlement, so a duplicate
      // row would mean two contradictory statuses for the same person and a
      // leave that only half-removes them.
      participantEventUq: unique('ep_participant_event_uq').on(
        table.participantId,
        table.eventId,
      ),
      participantFk: foreignKey({
        columns: [table.participantId],
        foreignColumns: [boffMediaParticipants.id],
        name: 'ep_participant_fk',
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      eventFk: foreignKey({
        columns: [table.eventId],
        foreignColumns: [boffMediaEvents.id],
        name: 'ep_event_fk',
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
    };
  },
);

export type EventParticipant = typeof boffMediaEventParticipants.$inferSelect;

/**
 * Invitations to a *private* event. A private event is unlisted and cannot be
 * joined from the public site, so without these it can only ever be populated
 * by an admin — and since event membership is what grants pack access, that
 * made private events unusable rather than merely discreet.
 *
 * Deliberately shaped like `pack_invites`: same fields, same revocation model.
 */
export const boffMediaEventInvites = mysqlTable(
  'boffmedia_event_invites',
  {
    code: varchar('code', { length: 32 }).primaryKey(),
    eventId: int('event_id').notNull(),
    createdBy: int('created_by'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    expiresAt: timestamp('expires_at'),
    maxUses: int('max_uses').notNull().default(1),
    uses: int('uses').notNull().default(0),
    revoked: boolean('revoked').notNull().default(false),
  },
  (table) => ({
    eventIdx: index('ei_event_idx').on(table.eventId),
    eventFk: foreignKey({
      columns: [table.eventId],
      foreignColumns: [boffMediaEvents.id],
      name: 'ei_event_fk',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    creatorFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [boffMediaUsers.id],
      name: 'ei_creator_fk',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export type EventInvite = typeof boffMediaEventInvites.$inferSelect;

// Unified achievements table
export const boffMediaAchievements = mysqlTable(
  'boffmedia_achievements',
  {
    id: int('id').primaryKey().autoincrement(),
    itemType: mysqlEnum('item_type', ['achievement', 'medal']).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 255 }).notNull(),
    maxProgress: int('max_progress').notNull().default(1),
    points: int('points').notNull().default(0),
    eventId: int('event_id'),
    category: mysqlEnum('category', [
      'competition', // For ranked/placement achievements (1st, 2nd, 3rd)
      'challenge', // For specific tasks in events
      'participation', // For simply taking part in events
      'achievement', // Exclusive for server-based long-term accomplishments
    ]).notNull(),
    rarity: mysqlEnum('rarity', [
      'bronze',
      'silver',
      'gold',
      'platinum',
      'diamond',
    ]),
    hidden: boolean('hidden').notNull().default(false),
    order: int('order').notNull().default(0),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      eventIdx: index('a_event_idx').on(table.eventId),
      categoryIdx: index('a_category_idx').on(table.category),
      eventFk: foreignKey({
        columns: [table.eventId],
        foreignColumns: [boffMediaEvents.id],
        name: 'a_event_fk',
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
    };
  },
);

export type Achievement = typeof boffMediaAchievements.$inferSelect;

// Unified user progress tracking
export const boffMediaParticipantProgress = mysqlTable(
  'boffmedia_participant_progress',
  {
    participantId: int('participant_id').notNull(),
    achievementId: int('achievement_id').notNull(),
    currentProgress: int('current_progress').notNull().default(0),
    isCompleted: boolean('is_completed').notNull().default(false),
    completedAt: timestamp('completed_at'),
    lastUpdated: timestamp('last_updated')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.participantId, table.achievementId] }),
      achievementIdx: index('pp_achievement_idx').on(table.achievementId),
      // Supports leaderboard aggregation: filter completed rows, group by
      // participant, join achievements — see LeaderboardsService.
      completedIdx: index('pp_completed_idx').on(
        table.isCompleted,
        table.participantId,
        table.achievementId,
      ),
      participantFk: foreignKey({
        columns: [table.participantId],
        foreignColumns: [boffMediaParticipants.id],
        name: 'pp_participant_fk',
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      achievementFk: foreignKey({
        columns: [table.achievementId],
        foreignColumns: [boffMediaAchievements.id],
        name: 'pp_achievement_fk',
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
    };
  },
);

export type ParticipantProgress =
  typeof boffMediaParticipantProgress.$inferSelect;

export const SUGGESTION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Community event proposals (the /eventos/sugerir form). A suggestion is NOT a
// published event — an admin reviews it and can then create a real event.
export const boffMediaEventSuggestions = mysqlTable(
  'boffmedia_event_suggestions',
  {
    id: int('id').primaryKey().autoincrement(),
    // FK declared table-level below: the auto-generated name is 66 chars and
    // MySQL caps identifiers at 64, so the constraint could never be created.
    proposerUserId: int('proposer_user_id'),
    title: varchar('title', { length: 255 }).notNull(),
    gameName: varchar('game_name', { length: 255 }).notNull(),
    type: varchar('type', { length: 64 }).notNull(),
    description: text('description').notNull(),
    additionalInfo: text('additional_info'),
    suggestedDate: timestamp('suggested_date'),
    endDate: timestamp('end_date'),
    maxParticipants: int('max_participants'),
    status: mysqlEnum('status', [
      SUGGESTION_STATUS.PENDING,
      SUGGESTION_STATUS.APPROVED,
      SUGGESTION_STATUS.REJECTED,
    ])
      .notNull()
      .default(SUGGESTION_STATUS.PENDING),
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
    updatedAt: timestamp('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()`),
  },
  (table) => {
    return {
      statusIdx: index('es_status_idx').on(table.status),
      proposerFk: foreignKey({
        name: 'es_proposer_fk',
        columns: [table.proposerUserId],
        foreignColumns: [boffMediaUsers.id],
      })
        .onDelete('set null')
        .onUpdate('cascade'),
    };
  },
);

export type EventSuggestion = typeof boffMediaEventSuggestions.$inferSelect;

/**
 * Helper function to validate participant before awarding progress
 * @param participantId Participant ID to validate
 * @param achievementId Achievement ID
 * @returns Boolean indicating if participant can receive progress for this achievement
 */
export async function validateParticipantCanReceiveAchievement(
  participantId: number,
  achievementId: number,
  db: any,
): Promise<boolean> {
  // 1. Get the event ID for the achievement
  const achievement = await db.query.boffMediaAchievements.findFirst({
    where: (achievements: any, { eq, and, isNull }: any) =>
      and(
        eq(achievements.id, achievementId),
        isNull(achievements.deletedAt), // Ensure achievement is not soft-deleted
      ),
  });

  if (!achievement || !achievement.eventId) return false; // Achievement might be server-wide (no eventId) or deleted

  // Check if the event itself is soft-deleted
  const event = await db.query.boffMediaEvents.findFirst({
    where: (events: any, { eq, and, isNull }: any) =>
      and(eq(events.id, achievement.eventId), isNull(events.deletedAt)),
  });
  if (!event) return false; // Event is soft-deleted

  // 2. Check if participant is registered for this event
  const eventParticipant = await db.query.boffMediaEventParticipants.findFirst({
    where: (p: any, { eq, and, inArray }: any) =>
      and(
        eq(p.participantId, participantId),
        eq(p.eventId, achievement.eventId), // Use achievement.eventId safely now
        inArray(p.status, [
          PARTICIPANT_STATUS.REGISTERED,
          PARTICIPANT_STATUS.CONFIRMED,
        ]),
      ),
  });

  return !!eventParticipant;
}
