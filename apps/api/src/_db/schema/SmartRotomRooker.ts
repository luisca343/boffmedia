import {
  boolean,
  char,
  foreignKey,
  index,
  int,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomReplays, rotomUsers } from './SmartRotom';
import { pokedexRegistry } from './SmartRotomPokedex';

export const ROOKER_POST_TYPES = [
  'text',
  'media',
  'capture',
  'battle',
] as const;
export type RookerPostType = (typeof ROOKER_POST_TYPES)[number];

export const ROOKER_REACTION_TYPES = [
  'heart',
  'pokeball',
  'choque',
  'shiny',
  'fuego',
] as const;
export type RookerReactionType = (typeof ROOKER_REACTION_TYPES)[number];

export const rookerProfiles = mysqlTable('rotom_rooker_profiles', {
  uuid: char('uuid', { length: 36 })
    .primaryKey()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  handle: varchar('handle', { length: 32 }).notNull().unique(),
  displayName: varchar('display_name', { length: 48 }),
  bio: varchar('bio', { length: 280 }),
  link: varchar('link', { length: 120 }),
  // The pokémon shown as banner/partner. Validated against the owner's pokédex
  // (must be a caught species) by the service — no FK, since rotom_pokedex is
  // keyed by row id, not by species.
  partnerPokemonId: int('partner_pokemon_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type RookerProfile = typeof rookerProfiles.$inferSelect;
export type NewRookerProfile = typeof rookerProfiles.$inferInsert;

export const rookerPosts = mysqlTable(
  'rotom_rooker_posts',
  {
    id: int('id').primaryKey().autoincrement(),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    text: varchar('text', { length: 280 }),
    type: varchar('type', { length: 16 }).notNull().default('text'),
    parentId: int('parent_id'),
    pinned: boolean('pinned').notNull().default(false),
    mediaUrl: varchar('media_url', { length: 512 }),
    captureId: int('capture_id').references(() => pokedexRegistry.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    replayId: int('replay_id').references(() => rotomReplays.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => ({
    uuidIdx: index('rotom_rooker_posts_uuid_idx').on(t.uuid),
    parentIdx: index('rotom_rooker_posts_parent_idx').on(t.parentId),
    createdIdx: index('rotom_rooker_posts_created_idx').on(t.createdAt),
    // Self-FK: deleting a trino orphans its replies rather than cascading them away.
    parentFk: foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: 'rotom_rooker_posts_parent_fk',
    }).onDelete('set null'),
  }),
);

export type RookerPost = typeof rookerPosts.$inferSelect;
export type NewRookerPost = typeof rookerPosts.$inferInsert;

// One reaction per user per post — the composite PK is the constraint. Reacting
// again with a different type REPLACES the previous one (upsert), same type toggles OFF.
export const rookerReactions = mysqlTable(
  'rotom_rooker_reactions',
  {
    postId: int('post_id')
      .notNull()
      .references(() => rookerPosts.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    type: varchar('type', { length: 12 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.uuid] }),
  }),
);

export type RookerReaction = typeof rookerReactions.$inferSelect;

export const rookerRetrinos = mysqlTable(
  'rotom_rooker_retrinos',
  {
    postId: int('post_id')
      .notNull()
      .references(() => rookerPosts.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.uuid] }),
  }),
);

export type RookerRetrino = typeof rookerRetrinos.$inferSelect;

export const rookerBookmarks = mysqlTable(
  'rotom_rooker_bookmarks',
  {
    postId: int('post_id')
      .notNull()
      .references(() => rookerPosts.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.uuid] }),
  }),
);

export type RookerBookmark = typeof rookerBookmarks.$inferSelect;

export const rookerFollows = mysqlTable(
  'rotom_rooker_follows',
  {
    followerUuid: char('follower_uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    followeeUuid: char('followee_uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerUuid, t.followeeUuid] }),
    followeeIdx: index('rotom_rooker_follows_followee_idx').on(t.followeeUuid),
  }),
);

export type RookerFollow = typeof rookerFollows.$inferSelect;

// Derived index, not a source of truth: the service re-parses #tags out of
// post.text on create. Trends GROUP BY tag over this table.
export const rookerHashtags = mysqlTable(
  'rotom_rooker_hashtags',
  {
    postId: int('post_id')
      .notNull()
      .references(() => rookerPosts.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    tag: varchar('tag', { length: 64 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tag] }),
    tagIdx: index('rotom_rooker_hashtags_tag_idx').on(t.tag, t.postId),
  }),
);

export type RookerHashtag = typeof rookerHashtags.$inferSelect;
