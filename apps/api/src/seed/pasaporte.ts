import * as dotenv from 'dotenv';
dotenv.config();

import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';

import { rotomAchievements } from '../_db/schema/SmartRotom';
import { pasaporteSeasons } from '../_db/schema/SmartRotomPasaporte';
import pino from 'pino';

const logger = pino({ name: 'pasaporte-seed' });

// Passports are NOT seeded: the API provisions one on first read, so a trainer who
// never opens the app never gets a row. What has to exist up front is the cycle the
// standings are measured inside, and the weight/tier of each achievement.

export const SEASON_NUMBER = 7;
export const SEASON_NAME = 'Ciclo de Otoño';
export const SEASON_DAYS = 90;

// Game-design data: what an achievement is WORTH, by category. The columns default to
// (10, 'bronce'), so the backfill only touches rows still sitting at that default —
// re-running this never overwrites a value someone tuned by hand.
export const CATEGORY_WEIGHTS: Record<string, { tier: string; points: number }> = {
  Gimnasios: { tier: 'plata', points: 25 },
  Ligas: { tier: 'oro', points: 50 },
  'Frente Batalla': { tier: 'platino', points: 100 },
};
export const DEFAULT_WEIGHT = { tier: 'bronce', points: 10 };

export const DEFAULT_POINTS = 10;
export const DEFAULT_TIER = 'bronce';

export async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // ---- the active cycle ----
  const active = await db
    .select({ id: pasaporteSeasons.id, name: pasaporteSeasons.name })
    .from(pasaporteSeasons)
    .where(eq(pasaporteSeasons.active, true))
    .limit(1);

  if (active.length > 0) {
    logger.info(
      `season already active (#${active[0].id} "${active[0].name}") — leaving it alone`,
    );
  } else {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();

    await db.insert(pasaporteSeasons).values({
      number: SEASON_NUMBER,
      name: SEASON_NAME,
      startsAt: new Date(now - SEASON_DAYS * day),
      endsAt: new Date(now + SEASON_DAYS * day),
      active: true,
    });
    logger.info(
      `✓ season ${SEASON_NUMBER} "${SEASON_NAME}" created — a ${SEASON_DAYS * 2}-day window around today`,
    );
  }

  // ---- points / tier backfill ----
  const pending = await db
    .select({
      id: rotomAchievements.id,
      category: rotomAchievements.category,
    })
    .from(rotomAchievements)
    .where(
      and(
        eq(rotomAchievements.points, DEFAULT_POINTS),
        eq(rotomAchievements.tier, DEFAULT_TIER),
      ),
    );

  logger.info(`${pending.length} achievement(s) still at the default weight`);

  let updated = 0;
  for (const achievement of pending) {
    const weight = CATEGORY_WEIGHTS[achievement.category] ?? DEFAULT_WEIGHT;

    // "anything else → bronce/10" is already the default — skip the write.
    if (weight.points === DEFAULT_POINTS && weight.tier === DEFAULT_TIER) {
      continue;
    }

    await db
      .update(rotomAchievements)
      .set({ points: weight.points, tier: weight.tier })
      .where(eq(rotomAchievements.id, achievement.id));
    updated++;
  }

  await connection.end();
  logger.info(`✓ Pasaporte seed complete — ${updated} achievement(s) weighted`);
}

// Direct invocation only; `seed:system` imports `main` and awaits it.
if (require.main === module) {
  main().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
