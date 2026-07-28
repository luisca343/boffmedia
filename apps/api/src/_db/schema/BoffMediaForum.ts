import {
  timestamp,
  int,
  mysqlTable,
  varchar,
  text,
  index,
  uniqueIndex,
  boolean,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';
import { sql } from 'drizzle-orm';

// FK constraint names are set explicitly: Drizzle's auto-generated
// `{table}_{col}_{reftable}_{col}_fk` overflows MySQL's 64-char identifier
// limit when both table names are long (forum_threads → forum_categories).
//
// The FKs below deliberately omit onDelete/onUpdate, so MySQL applies RESTRICT.
// That is intentional here and NOT the drift it looks like next to the
// cascade/set-null used elsewhere: a forum post must never vanish because its
// author row was removed, and users are only ever soft-deleted (scrubbed in
// place, see users.repository.ts), so RESTRICT can never actually fire.

export const boffMediaForumCategories = mysqlTable(
  'boffmedia_forum_categories',
  {
    id: int('id').primaryKey().autoincrement(),
    slug: varchar('slug', { length: 80 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description').notNull(),
    icon: varchar('icon', { length: 64 }).notNull(),
    hue: int('hue').notNull().default(28),
    locked: boolean('locked').notNull().default(false),
    position: int('position').notNull().default(0),
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
      slugIdx: uniqueIndex('fc_slug_idx').on(table.slug),
    };
  },
);

export type ForumCategory = typeof boffMediaForumCategories.$inferSelect;

export const boffMediaForumThreads = mysqlTable(
  'boffmedia_forum_threads',
  {
    id: int('id').primaryKey().autoincrement(),
    categoryId: int('category_id').notNull(),
    userId: int('user_id').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    pinned: boolean('pinned').notNull().default(false),
    locked: boolean('locked').notNull().default(false),
    solved: boolean('solved').notNull().default(false),
    viewCount: int('view_count').notNull().default(0),
    replyCount: int('reply_count').notNull().default(0),
    voteCount: int('vote_count').notNull().default(0),
    lastPostAt: timestamp('last_post_at'),
    lastPostUserId: int('last_post_user_id'),
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
      categoryFk: foreignKey({
        columns: [table.categoryId],
        foreignColumns: [boffMediaForumCategories.id],
        name: 'ft_category_fk',
      }),
      authorFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [boffMediaUsers.id],
        name: 'ft_author_fk',
      }),
      lastPostFk: foreignKey({
        columns: [table.lastPostUserId],
        foreignColumns: [boffMediaUsers.id],
        name: 'ft_lastpost_fk',
      }),
      categoryIdx: index('ft_category_idx').on(table.categoryId),
      lastPostIdx: index('ft_last_post_idx').on(table.lastPostAt),
    };
  },
);

export type ForumThread = typeof boffMediaForumThreads.$inferSelect;

export const boffMediaForumPosts = mysqlTable(
  'boffmedia_forum_posts',
  {
    id: int('id').primaryKey().autoincrement(),
    threadId: int('thread_id').notNull(),
    userId: int('user_id').notNull(),
    body: text('body').notNull(),
    isSolution: boolean('is_solution').notNull().default(false),
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
      threadFk: foreignKey({
        columns: [table.threadId],
        foreignColumns: [boffMediaForumThreads.id],
        name: 'fp_thread_fk',
      }),
      authorFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [boffMediaUsers.id],
        name: 'fp_author_fk',
      }),
      threadIdx: index('fp_thread_idx').on(table.threadId),
    };
  },
);

export type ForumPost = typeof boffMediaForumPosts.$inferSelect;

export const boffMediaForumVotes = mysqlTable(
  'boffmedia_forum_votes',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id').notNull(),
    threadId: int('thread_id').notNull(),
    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (table) => {
    return {
      userFk: foreignKey({
        columns: [table.userId],
        foreignColumns: [boffMediaUsers.id],
        name: 'fv_user_fk',
      }),
      threadFk: foreignKey({
        columns: [table.threadId],
        foreignColumns: [boffMediaForumThreads.id],
        name: 'fv_thread_fk',
      }),
      userThreadIdx: uniqueIndex('fv_user_thread_idx').on(
        table.userId,
        table.threadId,
      ),
    };
  },
);

export type ForumVote = typeof boffMediaForumVotes.$inferSelect;
