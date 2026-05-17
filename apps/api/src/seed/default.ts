import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as bcrypt from 'bcrypt';

import {
  boffMediaRoles,
  boffMediaUserRoles,
  boffMediaUsers,
} from '../_db/schema/BoffMedia';
import { smartrotomApps, smartrotomUsers } from '../_db/schema/SmartRotom';
import pino from 'pino';

const logger = pino({ name: 'util' });

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
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
    .insert(smartrotomUsers)
    .values({ uuid: ADMIN_UUID, username: 'admin' })
    .onDuplicateKeyUpdate({ set: { username: sql`username` } });

  // ── BoffMedia user ──────────────────────────────────────────────────────────
  logger.info('Seeding boffmedia_users…');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await db
    .insert(boffMediaUsers)
    .values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@boffmedia.com',
      uuid: ADMIN_UUID,
    })
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
    { name: 'ChatApp', active: 1 },
    { name: 'StarBank', active: 1 },
    { name: 'Pokedex', active: 1 },
  ];
  for (const app of apps) {
    const [existing] = await db
      .select({ id: smartrotomApps.id })
      .from(smartrotomApps)
      .where(eq(smartrotomApps.name, app.name));
    if (!existing) {
      await db.insert(smartrotomApps).values(app);
    }
  }

  await connection.end();
  logger.info('✓ Seed complete');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
