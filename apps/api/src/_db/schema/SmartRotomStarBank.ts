import { bigint, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { smartrotomUsers } from './SmartRotom';

export const starBankAccounts = mysqlTable('rotom_bank_accounts', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 32 }).notNull(),
  balance: bigint('balance', { mode: 'number' }).default(0),
  type: varchar('type', { length: 32 }).notNull(),
  image: varchar('image', { length: 255 }),
});

export type StarBankAccount = typeof starBankAccounts.$inferSelect;

export const starBankTransactions = mysqlTable('rotom_bank_transactions', {
  id: int('id').primaryKey().autoincrement(),
  from: int('from')
    .notNull()
    .references(() => starBankAccounts.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  to: int('to')
    .notNull()
    .references(() => starBankAccounts.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  fromBalance: bigint('from_balance', { mode: 'number' }).notNull(),
  toBalance: bigint('to_balance', { mode: 'number' }).notNull(),
  reason: varchar('concept', { length: 255 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  date: varchar('date', { length: 32 }).notNull(),
});

export type StarBankTransaction = typeof starBankTransactions.$inferSelect;

export const starBankUsersAccounts = mysqlTable('rotom_bank_users_accounts', {
  uuid: varchar('uuid', { length: 36 })
    .notNull()
    .references(() => smartrotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  accountId: int('account_id')
    .notNull()
    .references(() => starBankAccounts.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
});

export type StarBankUserAccount = typeof starBankUsersAccounts.$inferSelect;
