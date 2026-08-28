import { sql } from 'drizzle-orm';
import {
  char,
  mysqlEnum,
  uniqueIndex,
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

// The closed set of account kinds. Mirrored by `AccountType`
// (api/smartrotom/starbank/enums/account-type.enum.ts), which documents what each
// one means and carries a compile-time assertion that the two stay in step.
export const STARBANK_ACCOUNT_TYPES = [
  'MAIN',
  'SECONDARY',
  'SYSTEM',
  'GOVERNMENT',
  'MARKET',
  'SERVICE',
] as const;

export const starBankAccounts = mysqlTable(
  'rotom_starbank_accounts',
  {
    id: int('id').primaryKey().autoincrement(),
    name: varchar('name', { length: 32 }).notNull(),
    // notNull: a NULL balance makes every sum, transfer guard and reconciliation
    // over it NULL rather than wrong-but-visible (migration 0036).
    balance: bigint('balance', { mode: 'number' }).notNull().default(0),
    type: mysqlEnum('type', STARBANK_ACCOUNT_TYPES).notNull(),
    image: varchar('image', { length: 255 }),
  },
  // A unique `(type, name)` is what keeps the house accounts (src/seed/house-accounts.ts)
  // singleton: it makes every house-account insert idempotent by construction,
  // while still allowing many USER accounts and one SERVICE row per service
  // name. An application-level `WHERE NOT EXISTS` races and cannot be trusted.
  // The plain `type` index serves the lookups that resolve a house account on
  // every transfer.
  (t) => ({
    typeNameUq: uniqueIndex('starbank_accounts_type_name_uq').on(
      t.type,
      t.name,
    ),
    typeIdx: index('starbank_accounts_type_idx').on(t.type),
  }),
);

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
    /**
     * Optional idempotency key, scoped to the paying account. NULL means "never
     * deduplicate", so an unkeyed transaction behaves exactly as before. A retry
     * with the same key receives the original transaction instead of moving money
     * a second time.     *
     * The UNIQUE below spans (actor, key), NOT the key alone. Scoped to the key
     * only, one caller's key would match another caller's row: the second user
     * would be handed back the FIRST user's record and their own operation would
     * silently never happen. A composite UNIQUE still permits many NULL keys,
     * because NULL never equals NULL in MySQL.
     */
    idempotencyKey: varchar('idempotency_key', { length: 255 }),
  },
  (t) => ({
    dateIdx: index('sb_tx_date_idx').on(t.date),
    fromIdx: index('sb_tx_from_idx').on(t.fromAccountId, t.date),
    toIdx: index('sb_tx_to_idx').on(t.toAccountId, t.date),
    idempotencyUq: uniqueIndex('sb_tx_idempotency_uq').on(
      t.fromAccountId,
      t.idempotencyKey,
    ),
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
    uuid: char('uuid', { length: 36 })
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
