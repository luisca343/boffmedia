import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';

import { smartrotomUsers } from '../_db/schema/SmartRotom';
import { rookerProfiles } from '../_db/schema/SmartRotomRooker';
import pino from 'pino';

const logger = pino({ name: 'rooker-seed' });

// Profiles are the only thing seeded. Trinos are NOT fabricated — the feed starts
// empty and real players fill it. What makes Rooker usable on day one is that every
// existing rotom_user already has a handle to be mentioned, followed and searched by.

const HANDLE_MIN = 3;
const HANDLE_MAX = 32;

// The handle column is the identity users see: ^[a-z0-9_]{3,32}$.
function baseHandle(username: string): string {
  const cleaned = username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, HANDLE_MAX);
  return cleaned.length >= HANDLE_MIN
    ? cleaned
    : cleaned.padEnd(HANDLE_MIN, '_');
}

// Two players can share a sanitised handle ("Ash!" and "ash?" both → "ash_").
// The first one keeps it; the rest get a numeric suffix that fits inside 32 chars.
function dedupe(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = String(n);
    const trimmed = base.slice(0, HANDLE_MAX - suffix.length);
    const candidate = `${trimmed}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  const [users, existing] = await Promise.all([
    db
      .select({
        uuid: smartrotomUsers.uuid,
        username: smartrotomUsers.username,
      })
      .from(smartrotomUsers),
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
    const handle = dedupe(baseHandle(user.username), taken);
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

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
