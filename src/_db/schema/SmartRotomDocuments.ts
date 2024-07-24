import { date, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { smartrotomUsers } from "./SmartRotom";

export const rotomDocuments = mysqlTable("rotom_documents", {
    id: int("id").primaryKey().autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    type: int("type").notNull(),
    public: int("public").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export type RotomDocument = typeof rotomDocuments.$inferSelect;

export const rotomDocumentsUsers = mysqlTable("rotom_documents_users", {
    uuid: varchar("uuid", { length: 36 }).notNull().references(() => smartrotomUsers.uuid, {onDelete: "cascade", onUpdate: "cascade"}),
    documentId: int("document_id").notNull().references(() => rotomDocuments.id, {onDelete: "cascade", onUpdate: "cascade"}),
});

export type RotomDocumentUser = typeof rotomDocumentsUsers.$inferSelect;