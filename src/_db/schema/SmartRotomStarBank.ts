import exp from "constants";
import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const starBankAccounts = mysqlTable("rotom_starbank_accounts", {
    id: int("id").primaryKey().autoincrement(),
    name: varchar("name", { length: 32 }).notNull(),
    balance: int("balance").default(0),
    type: varchar("type", { length: 32 }).notNull(),
});

export type StarBankAccount = typeof starBankAccounts.$inferSelect;

export const starBankTransactions = mysqlTable("rotom_starbank_transactions", {
    id: int("id").primaryKey().autoincrement(),
    from: int("from").notNull(),
    to: int("to").notNull(),
    amount: int("amount").notNull(),
    fromBalance: int("from_balance").notNull(),
    toBalance: int("to_balance").notNull(),
    reason: varchar("concept", { length: 255 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    date: varchar("date", { length: 32 }).notNull(),
});

export type StarBankTransaction = typeof starBankTransactions.$inferSelect;

export const  starBankUsersAccounts = mysqlTable("rotom_starbank_users_accounts", {
    uuid: varchar("uuid", { length: 36 }).notNull(),
    accountId: int("account_id").notNull(),
});

export type StarBankUserAccount = typeof starBankUsersAccounts.$inferSelect;