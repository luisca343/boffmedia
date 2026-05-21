import {
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { smartrotomUsers } from './SmartRotom';

export const rotomDocuments = mysqlTable('rotom_documents', {
  id: int('id').primaryKey().autoincrement(),
  title: varchar('title', { length: 255 }).notNull(),
  type: int('type').notNull(),
  content: text('content').notNull(),
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
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export type RotomNews = typeof rotomNews.$inferSelect;
