import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';

import { rotomUsers } from '../_db/schema/SmartRotom';
import { rookerProfiles } from '../_db/schema/SmartRotomRooker';
import pino from 'pino';

// The same derivation the runtime uses when a player is created — one definition, so a
// backfilled handle and a freshly minted one can never disagree.
import {
  baseHandle,
  dedupeHandle,
} from '../api/smartrotom/rooker/handle';

const logger = pino({ name: 'rooker-seed' });

// Profiles are the only thing seeded. Trinos are NOT fabricated — the feed starts
// empty and real players fill it. What makes Rooker usable on day one is that every
// existing rotom_user already has a handle to be mentioned, followed and searched by.

export async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const [users, existing] = await Promise.all([
    db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomUsers),
    db
      .select({ uuid: rookerProfiles.uuid, handle: rookerProfiles.handle })
      .from(rookerProfiles),
  ]);

  const withProfile = new Set(existing.map((p) => p.uuid));
  const taken = new Set(existing.map((p) => p.handle));

  const pending = users.filter((u) => !withProfile.has(u.uuid));

  logger.info(
    `${users.length} rotom_users · ${existing.length} already have a profile · seeding ${pending.length}`,
  );

  let created = 0;
  for (const user of pending) {
    const handle = dedupeHandle(baseHandle(user.username), taken);
    taken.add(handle);

    await db.insert(rookerProfiles).values({
      uuid: user.uuid,
      handle,
      displayName: user.username,
    });
    created++;
  }

  await connection.end();
  logger.info(`✓ Rooker seed complete — ${created} profile(s) created`);
}

// Direct invocation only; `seed:system` imports `main` and awaits it.
if (require.main === module) {
  main().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
