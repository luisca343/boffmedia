import * as dotenv from 'dotenv';
dotenv.config();

import { and, eq } from 'drizzle-orm';
import { MySql2Database, drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';

import { starBankAccounts } from '../_db/schema/SmartRotomStarBank';
import {
  HOUSE_ACCOUNTS,
  HouseAccount,
} from '../api/smartrotom/starbank/house-accounts';
import { AccountType } from '../api/smartrotom/starbank/enums/account-type.enum';
import pino from 'pino';

const logger = pino({ name: 'house-accounts-seed' });

/**
 * Re-asserts the ownerless accounts every money flow settles against.
 *
 * Migration 0040 already inserts them; this exists so a hand-restored or partially seeded
 * database can be brought back in line without a migration re-run. Idempotent, and it never
 * touches balances — only existence.
 */
export async function seedHouseAccounts(
  db: MySql2Database<Record<string, never>>,
): Promise<void> {
  for (const account of HOUSE_ACCOUNTS) {
    const existing = await findExisting(db, account);
    if (existing) {
      logger.info(
        `House account "${account.name}" (${account.type}) already exists (#${existing.id})`,
      );
      continue;
    }
    // No owning player, so it bypasses the normal StarBank account-creation flow, which always
    // links to a uuid in rotom_starbank_user_accounts.
    await db
      .insert(starBankAccounts)
      .values({ name: account.name, balance: 0, type: account.type });
    logger.info(`Created house account "${account.name}" (${account.type})`);
  }
}

// SERVICE is one row per app, so it is identified by (type, name). The other types are
// singletons: matching on the name too would mint a second treasury if one was ever renamed.
async function findExisting(
  db: MySql2Database<Record<string, never>>,
  account: HouseAccount,
): Promise<{ id: number } | undefined> {
  const where =
    account.type === AccountType.SERVICE
      ? and(
          eq(starBankAccounts.type, account.type),
          eq(starBankAccounts.name, account.name),
        )
      : eq(starBankAccounts.type, account.type);

  const [row] = await db
    .select({ id: starBankAccounts.id })
    .from(starBankAccounts)
    .where(where);
  return row;
}

async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  logger.info('Seeding StarBank house accounts…');
  await seedHouseAccounts(db);
  logger.info('Done.');

  await connection.end();
}

if (require.main === module) {
  main().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}
