import { sql } from 'drizzle-orm';
import {
  bigint,
  index,
  foreignKey,
  int,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

export const starBankAccounts = mysqlTable('rotom_starbank_accounts', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 32 }).notNull(),
  // notNull: a NULL balance makes every sum, transfer guard and reconciliation
  // over it NULL rather than wrong-but-visible (migration 0036).
  balance: bigint('balance', { mode: 'number' }).notNull().default(0),
  type: varchar('type', { length: 32 }).notNull(),
  image: varchar('image', { length: 255 }),
});

export type StarBankAccount = typeof starBankAccounts.$inferSelect;

export const starBankTransactions = mysqlTable(
  'rotom_starbank_transactions',
  {
    id: int('id').primaryKey().autoincrement(),
    // Were `from` / `to` — reserved words, and unqualified names for account
    // ids. Renamed in migration 0035.
    // Both FKs are named explicitly: the auto-generated names run 71-73 chars
    // and MySQL caps identifiers at 64, so they could never be created.
    fromAccountId: int('from_account_id').notNull(),
    toAccountId: int('to_account_id').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    fromBalance: bigint('from_balance', { mode: 'number' }).notNull(),
    toBalance: bigint('to_balance', { mode: 'number' }).notNull(),
    // Column was named `concept` while the property said `reason`.
    reason: varchar('reason', { length: 255 }).notNull(),
    type: varchar('type', { length: 32 }).notNull(),
    // Was varchar(32): the money ledger's own timestamp was an unsortable,
    // unindexable, locale-dependent string. Converted in migration 0036.
    date: timestamp('date')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP()`),
  },
  (t) => ({
    dateIdx: index('sb_tx_date_idx').on(t.date),
    fromIdx: index('sb_tx_from_idx').on(t.fromAccountId, t.date),
    toIdx: index('sb_tx_to_idx').on(t.toAccountId, t.date),
    fromFk: foreignKey({
      name: 'sb_tx_from_fk',
      columns: [t.fromAccountId],
      foreignColumns: [starBankAccounts.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    toFk: foreignKey({
      name: 'sb_tx_to_fk',
      columns: [t.toAccountId],
      foreignColumns: [starBankAccounts.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type StarBankTransaction = typeof starBankTransactions.$inferSelect;

export const starBankUserAccounts = mysqlTable(
  'rotom_starbank_user_accounts',
  {
    uuid: varchar('uuid', { length: 36 })
      .notNull()
      .references(() => rotomUsers.uuid, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    accountId: int('account_id').notNull(),
  },
  // One link per (user, account) — shipped without a PK (migration 0036).
  (t) => ({
    pk: primaryKey({ columns: [t.uuid, t.accountId] }),
    accountFk: foreignKey({
      name: 'sb_user_accounts_account_fk',
      columns: [t.accountId],
      foreignColumns: [starBankAccounts.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export type StarBankUserAccount = typeof starBankUserAccounts.$inferSelect;
