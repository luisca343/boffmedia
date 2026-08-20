import * as dotenv from 'dotenv';
dotenv.config();

import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcrypt';
import { env } from '@/config/env';

import {
  boffMediaRoles,
  boffMediaUserRoles,
  boffMediaUsers,
} from '../_db/schema/BoffMedia';
import { rotomApps, rotomUsers } from '../_db/schema/SmartRotom';
import pino from 'pino';

const logger = pino({ name: 'util' });

export async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // ── Roles ──────────────────────────────────────────────────────────────────
  logger.info('Seeding roles…');
  for (const name of ['BOFF_ADMIN', 'ROTOM_ADMIN']) {
    await db
      .insert(boffMediaRoles)
      .values({ name })
      .onDuplicateKeyUpdate({ set: { name: sql`name` } });
  }

  // ── SmartRotom user (parent FK — must precede boffmedia_users) ─────────────
  logger.info('Seeding rotom_users…');
  const ADMIN_UUID = '00000000-0000-0000-0000-000000000001';
  await db
    .insert(rotomUsers)
    .values({ uuid: ADMIN_UUID, username: 'admin' })
    .onDuplicateKeyUpdate({ set: { username: sql`username` } });

  // ── BoffMedia user ──────────────────────────────────────────────────────────
  // The password comes from the environment and has NO default. This is the
  // only script that creates an administrator, so a literal fallback here would
  // put a live site's admin credentials in the repository.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required (min 12 chars). Refusing to seed an ' +
        'administrator with a guessable password.',
    );
  }

  logger.info('Seeding boffmedia_users…');
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await db
    .insert(boffMediaUsers)
    .values({
      username: 'admin',
      password: hashedPassword,
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@boffmedia.es',
      uuid: ADMIN_UUID,
    })
    // Existing row wins: re-running the bootstrap must never silently reset a
    // password that has since been changed.
    .onDuplicateKeyUpdate({ set: { username: sql`username` } });

  // ── User → role assignments ─────────────────────────────────────────────────
  logger.info('Seeding user roles…');
  const [adminUser] = await db
    .select({ id: boffMediaUsers.id })
    .from(boffMediaUsers)
    .where(eq(boffMediaUsers.username, 'admin'));

  const allRoles = await db.select().from(boffMediaRoles);

  for (const role of allRoles) {
    const [existing] = await db
      .select({ id: boffMediaUserRoles.id })
      .from(boffMediaUserRoles)
      .where(
        and(
          eq(boffMediaUserRoles.userId, adminUser.id),
          eq(boffMediaUserRoles.roleId, role.id),
        ),
      );
    if (!existing) {
      await db
        .insert(boffMediaUserRoles)
        .values({ userId: adminUser.id, roleId: role.id });
    }
  }

  // ── Apps ────────────────────────────────────────────────────────────────────
  logger.info('Seeding rotom_apps…');
  const apps = [
    { name: 'ChatApp', active: true },
    { name: 'StarBank', active: true },
    { name: 'Pokedex', active: true },
  ];
  for (const app of apps) {
    const [existing] = await db
      .select({ id: rotomApps.id })
      .from(rotomApps)
      .where(eq(rotomApps.name, app.name));
    if (!existing) {
      await db.insert(rotomApps).values(app);
    }
  }

  await connection.end();
  logger.info('✓ Seed complete');
}

// Direct invocation only; `seed:system` imports `main` and awaits it.
if (require.main === module) {
  main().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
