import {
  boolean,
  AnyMySqlColumn,
  char,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

// Note organization: folders form a self-referential tree per owner (uuid).
// Defined before rotomDocuments so its folderId FK can reference it.
export const rotomNoteFolders = mysqlTable('rotom_note_folders', {
  id: int('id').primaryKey().autoincrement(),
  uuid: char('uuid', { length: 36 })
    .notNull()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  name: varchar('name', { length: 255 }).notNull(),
  // semantic palette key: primary | secondary | accent | success | warning | error | info
  color: varchar('color', { length: 32 }).notNull().default('primary'),
  parentId: int('parent_id').references(
    (): AnyMySqlColumn => rotomNoteFolders.id,
    { onDelete: 'set null', onUpdate: 'cascade' },
  ),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type RotomNoteFolder = typeof rotomNoteFolders.$inferSelect;

export const rotomDocuments = mysqlTable('rotom_documents', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  type: int('type').notNull(),
  content: text('content').notNull(),
  // 0 = private, 1 = public. A real column: the DTOs and repository read it,
  // and writing it through `as any` with no backing column silently drops it.
  public: boolean('public').notNull().default(false),
  pinned: boolean('pinned').notNull().default(false),
  folderId: int('folder_id').references(() => rotomNoteFolders.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  // Soft-delete: NULL = live, timestamp = in trash.
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export type RotomDocument = typeof rotomDocuments.$inferSelect;

export const rotomUserDocuments = mysqlTable(
  'rotom_user_documents',
  {
    uuid: char('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    documentId: int('document_id')
      .notNull()
      .references(() => rotomDocuments.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  // One access row per (user, document) — shipped without a PK (migration 0036).
  (table) => ({
    pk: primaryKey({ columns: [table.uuid, table.documentId] }),
  }),
);

export type RotomUserDocument = typeof rotomUserDocuments.$inferSelect;

// Per-owner tags, linked many-to-many to documents.
export const rotomNoteTags = mysqlTable('rotom_note_tags', {
  id: int('id').primaryKey().autoincrement(),
  uuid: char('uuid', { length: 36 })
    .notNull()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  label: varchar('label', { length: 64 }).notNull(),
  color: varchar('color', { length: 32 }).notNull().default('primary'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type RotomNoteTag = typeof rotomNoteTags.$inferSelect;

export const rotomNoteTagLinks = mysqlTable(
  'rotom_note_tag_links',
  {
    documentId: int('document_id')
      .notNull()
      .references(() => rotomDocuments.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    tagId: int('tag_id')
      .notNull()
      .references(() => rotomNoteTags.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  // A tag applies to a document once — shipped without a PK (migration 0036).
  (table) => ({
    pk: primaryKey({ columns: [table.documentId, table.tagId] }),
  }),
);

export type RotomNoteTagLink = typeof rotomNoteTagLinks.$inferSelect;

// Version history: one row snapshotted per save.
export const rotomNoteVersions = mysqlTable('rotom_note_versions', {
  id: int('id').primaryKey().autoincrement(),
  documentId: int('document_id')
    .notNull()
    .references(() => rotomDocuments.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  label: varchar('label', { length: 255 }),
  content: text('content').notNull(),
  authorUuid: char('author_uuid', { length: 36 }),
  words: int('words').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type RotomNoteVersion = typeof rotomNoteVersions.$inferSelect;

export const rotomNews = mysqlTable(
  'rotom_news',
  {
    id: int('id').primaryKey().autoincrement(),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: varchar('subtitle', { length: 255 }),
    category: varchar('category', { length: 255 }),
    subcategory: varchar('subcategory', { length: 255 }),
    published: boolean('published').notNull().default(false),
    featured: boolean('featured').notNull().default(false),
    content: text('content').notNull(),
    buttonText: varchar('button_text', { length: 255 }),
    imageUrl: varchar('image_url', { length: 255 }),
    // Editorial byline. `authorRole` is the masthead role ("Editora de comunidad");
    // the editorial board is derived by grouping news on this pair, not stored.
    author: varchar('author', { length: 255 }),
    authorRole: varchar('author_role', { length: 255 }),
    // Magazine issue number. The back-issue archive is derived by grouping on it.
    issue: int('issue'),
    claps: int('claps').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  // The public feed is always "published, newest first"; the front page adds
  // `featured`. Both were full scans.
  (t) => ({
    publishedIdx: index('rotom_news_published_idx').on(
      t.published,
      t.createdAt,
    ),
    featuredIdx: index('rotom_news_featured_idx').on(t.featured, t.createdAt),
  }),
);

export type RotomNews = typeof rotomNews.$inferSelect;

// Reader comments ("viñetas de lectores") on a news article.
export const rotomNewsComments = mysqlTable('rotom_news_comments', {
  id: int('id').primaryKey().autoincrement(),
  newsId: int('news_id')
    .notNull()
    .references(() => rotomNews.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  uuid: char('uuid', { length: 36 })
    .notNull()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  body: varchar('body', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type RotomNewsComment = typeof rotomNewsComments.$inferSelect;

export const rotomNewsletterSubscribers = mysqlTable(
  'rotom_newsletter_subscribers',
  {
    id: int('id').primaryKey().autoincrement(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export type RotomNewsletterSubscriber =
  typeof rotomNewsletterSubscribers.$inferSelect;
