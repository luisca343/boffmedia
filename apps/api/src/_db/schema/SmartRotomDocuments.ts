import {
  AnyMySqlColumn,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { smartrotomUsers } from './SmartRotom';

// Note organization: folders form a self-referential tree per owner (uuid).
// Defined before rotomDocuments so its folderId FK can reference it.
export const rotomNoteFolders = mysqlTable('rotom_note_folders', {
  id: int('id').primaryKey().autoincrement(),
  uuid: varchar('uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
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
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export type RotomNoteFolder = typeof rotomNoteFolders.$inferSelect;

export const rotomDocuments = mysqlTable('rotom_documents', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  type: int('type').notNull(),
  content: text('content').notNull(),
  // 0 = private, 1 = public. Referenced by the DTOs/repository (previously
  // written via `as any` with no backing column) — now a real column.
  public: int('public').notNull().default(0),
  pinned: int('pinned').notNull().default(0),
  folderId: int('folder_id').references(() => rotomNoteFolders.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  // Soft-delete: NULL = live, timestamp = in trash.
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export type RotomDocument = typeof rotomDocuments.$inferSelect;

export const rotomDocumentsUsers = mysqlTable('rotom_documents_users', {
  uuid: varchar('uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  documentId: int('document_id')
    .notNull()
    .references(() => rotomDocuments.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
});

export type RotomDocumentUser = typeof rotomDocumentsUsers.$inferSelect;

// Per-owner tags, linked many-to-many to documents.
export const rotomNoteTags = mysqlTable('rotom_note_tags', {
  id: int('id').primaryKey().autoincrement(),
  uuid: varchar('uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  label: varchar('label', { length: 64 }).notNull(),
  color: varchar('color', { length: 32 }).notNull().default('primary'),
  createdAt: timestamp('created_at').notNull(),
});

export type RotomNoteTag = typeof rotomNoteTags.$inferSelect;

export const rotomNoteTagLinks = mysqlTable('rotom_note_tag_links', {
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
});

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
  authorUuid: varchar('author_uuid', { length: 36 }),
  words: int('words').notNull().default(0),
  createdAt: timestamp('created_at').notNull(),
});

export type RotomNoteVersion = typeof rotomNoteVersions.$inferSelect;

export const rotomNews = mysqlTable('rotom_news', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: varchar('subtitle', { length: 255 }),
  category: varchar('category', { length: 255 }),
  subcategory: varchar('subcategory', { length: 255 }),
  published: int('published').notNull().default(0),
  featured: int('featured').notNull().default(0),
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
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

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
  uuid: varchar('uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  body: varchar('body', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export type RotomNewsComment = typeof rotomNewsComments.$inferSelect;

export const rotomNewsletterSubscribers = mysqlTable(
  'rotom_newsletter_subscribers',
  {
    id: int('id').primaryKey().autoincrement(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
  },
);

export type RotomNewsletterSubscriber =
  typeof rotomNewsletterSubscribers.$inferSelect;
