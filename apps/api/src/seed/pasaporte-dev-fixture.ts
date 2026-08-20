import * as dotenv from 'dotenv';
dotenv.config();

import { and, eq, inArray, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import pino from 'pino';
import { env } from '@/config/env';

import {
  rotomAchievements,
  rotomReplays,
  rotomUserAchievements,
  rotomUserReplays,
  rotomUsers,
} from '../_db/schema/SmartRotom';
import {
  starBankAccounts,
  starBankTransactions,
  starBankUserAccounts,
} from '../_db/schema/SmartRotomStarBank';
import { TAXI_ACCOUNT } from '@api/smartrotom/starbank/house-accounts';

/**
 * DEV FIXTURE — NOT a seed. Never run this against production.
 *
 * The dev database has no player progress at all: not one completed achievement,
 * not one replay. That is fine for the API, but it means the passport can only
 * ever be observed EMPTY — no struck seals, no badge pages, no ladder, no stamps.
 * Those are the whole design, so this gives one trainer a plausible history to
 * render against.
 *
 * Everything it writes is tagged so it can be taken back out:
 *   - replays use side2 = FIXTURE_TAG
 *   - taxi fares use the concept prefix "Taxi a " with reason ending in FIXTURE_TAG
 * Run with `--clean` to remove exactly what it added and nothing else.
 */
const logger = pino({ name: 'pasaporte-dev-fixture' });

const TRAINER_UUID = '007d1a64-661c-4396-8844-e27856f2ddfa';
const TRAINER_NAME = 'ProfesorFicus';
const FIXTURE_TAG = 'FIXTURE-RIVAL';

// The trainer's own StarBank account, and the taxi's service account. A fare is a
// transfer INTO the service account whose concept names the stop — that transfer
// IS the trip (see apps/web/.../taxi/_utils/trips.ts), which is what the Bitácora
// reads as a travel stamp. No trips table exists, so this is the only way to make
// one real.
//
// Neither may be a hardcoded id. Ids that happen to exist in a long-lived dev
// database exist in no other, so the fixture dies on a foreign key the moment
// that database is rebuilt — and 0 is an id AUTO_INCREMENT never issues
// (`TAXI_ACCOUNT`'s own comment records that 0 means "burned").
//
// The taxi account is RESOLVED from the house-account registry, never created
// here: it is a real house account owned by `seed:system`, and inventing a
// second SERVICE row under a different name would split the fares in two.

const day = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d;
};

// A believable winning party. `team1` on a replay is what the badge page renders as
// "el equipo de la victoria", and Sprite/typesOf resolve `dex`/`form` against the
// pokédex store — so these must be real dex numbers or the sprites will not load.
const WINNING_TEAM = JSON.stringify([
  {
    dex: 479,
    name: 'Rotom',
    species: 'Rotom',
    level: 71,
    form: 'base',
    palette: 'none',
    moves: ['Rayo', 'Onda Trueno', 'Bola Sombra', 'Sustituto'],
  },
  {
    dex: 6,
    name: 'Charizard',
    species: 'Charizard',
    level: 74,
    form: 'base',
    palette: 'none',
    moves: ['Lanzallamas', 'Danza Dragón', 'Garra Dragón', 'Terremoto'],
  },
  {
    dex: 445,
    name: 'Garchomp',
    species: 'Garchomp',
    level: 72,
    form: 'base',
    palette: 'none',
    moves: ['Terremoto', 'Garra Dragón', 'Roca Afilada', 'Tajo Aéreo'],
  },
  {
    dex: 282,
    name: 'Gardevoir',
    species: 'Gardevoir',
    level: 70,
    form: 'base',
    palette: 'none',
    moves: ['Psíquico', 'Voz Cautivadora', 'Onda Trueno', 'Vendetta'],
  },
  {
    dex: 376,
    name: 'Metagross',
    species: 'Metagross',
    level: 73,
    form: 'base',
    palette: 'none',
    moves: ['Puño Meteoro', 'Terremoto', 'Zen Cabezazo', 'Garra Brutal'],
  },
  {
    dex: 149,
    name: 'Dragonite',
    species: 'Dragonite',
    level: 75,
    form: 'base',
    palette: 'none',
    moves: ['Enfado', 'Cometa Draco', 'Vuelo', 'Danza Dragón'],
  },
]);

// Which achievements the trainer has earned, and when. Deliberately PARTIAL: locked
// badges are half the point of the chapter (a blind-embossed seal next to a struck
// one is the whole visual argument), so several circuits stay incomplete.
const EARNED: Array<[string, number]> = [
  ['medalla_hop', 700],
  ['medalla_elace', 680],
  ['medalla_gosli', 640],
  ['medalla_uring', 610],
  ['medalla_kay', 560],
  ['medalla_elot', 530],
  ['medalla_areth', 480],
  ['medalla_tulipan', 430],
  ['medalla_denki', 400],
  ['medalla_mizu', 360],
  ['medalla_gaku', 320],
  ['medalla_olivo', 280],
  ['medalla_iwa', 210],
  ['medalla_yume', 170],
  ['medalla_sakura', 120],
  ['liga_fukitsu', 95],
  ['liga_narukami', 60],
  ['torre_batalla', 40],
  ['ez', 720],
];

// Battles inside the season window. The season standing is DERIVED from these rows —
// wins/losses/streak/lp/tier/rank are all computed from the real replay history, so
// this is the only thing that can make the Temporada chapter show anything at all.
// Ends on a 4-win streak.
const BATTLE_RESULTS: boolean[] = [
  true,
  true,
  false,
  true,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
];

const TRIPS: Array<[string, number, number]> = [
  ['Ciudad Plateada', 80, 74],
  ['Bosque Verde', 64, 52],
  ['Pueblo Lavanda', 120, 41],
  ['Monte Narukami', 210, 26],
  ['Valle Akina', 180, 12],
  ['Ciudad Plateada', 80, 5],
];

export async function main() {
  const clean = process.argv.includes('--clean');
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    multipleStatements: false,
  });
  const db = drizzle(connection);

  if (env.NODE_ENV === 'production') {
    logger.error('refusing to run against production');
    process.exit(1);
  }

  /**
   * Everything this fixture writes hangs off three rows: the trainer, the
   * trainer's StarBank account and the taxi's service account. None of them
   * exist on a rebuilt database, so create each idempotently and resolve the
   * ids rather than assuming or hardcoding them.
   */
  const findAccount = async (name: string, type: string) => {
    const [row] = await db
      .select({ id: starBankAccounts.id })
      .from(starBankAccounts)
      .where(
        and(
          eq(starBankAccounts.name, name),
          eq(starBankAccounts.type, type as never),
        ),
      )
      .limit(1);
    return row?.id ?? null;
  };

  await db
    .insert(rotomUsers)
    .values({ uuid: TRAINER_UUID, username: TRAINER_NAME })
    .onDuplicateKeyUpdate({ set: { username: TRAINER_NAME } });

  // The trainer's MAIN account is the fixture's own; `(type, name)` is unique,
  // which is what makes this safe to re-run.
  await db
    .insert(starBankAccounts)
    .values({ name: TRAINER_NAME, type: 'MAIN', balance: 100_000 })
    .onDuplicateKeyUpdate({ set: { name: TRAINER_NAME } });
  const TRAINER_ACCOUNT = await findAccount(TRAINER_NAME, 'MAIN');
  if (!TRAINER_ACCOUNT)
    throw new Error("could not resolve the trainer's account");

  const TAXI_SERVICE_ACCOUNT = await findAccount(
    TAXI_ACCOUNT.name,
    TAXI_ACCOUNT.type,
  );
  if (!TAXI_SERVICE_ACCOUNT) {
    throw new Error(
      `the "${TAXI_ACCOUNT.name}" house account is missing — run seed:system first`,
    );
  }

  await db
    .insert(starBankUserAccounts)
    .values({ uuid: TRAINER_UUID, accountId: TRAINER_ACCOUNT })
    .onDuplicateKeyUpdate({ set: { accountId: TRAINER_ACCOUNT } });

  logger.info(
    { trainerAccount: TRAINER_ACCOUNT, taxiAccount: TAXI_SERVICE_ACCOUNT },
    'trainer, StarBank account and taxi service account ready',
  );

  // --- teardown (also runs first on a normal pass, so the fixture is idempotent) ---
  const tagged = await db
    .select({ id: rotomReplays.id })
    .from(rotomReplays)
    .where(eq(rotomReplays.side2, FIXTURE_TAG));
  const ids = tagged.map((r) => r.id);

  if (ids.length) {
    await db
      .delete(rotomUserReplays)
      .where(inArray(rotomUserReplays.replayId, ids));
    await db.delete(rotomReplays).where(inArray(rotomReplays.id, ids));
  }
  await db
    .delete(rotomUserAchievements)
    .where(eq(rotomUserAchievements.uuid, TRAINER_UUID));
  await db
    .delete(starBankTransactions)
    .where(
      and(
        eq(starBankTransactions.toAccountId, TAXI_SERVICE_ACCOUNT),
        eq(starBankTransactions.fromAccountId, TRAINER_ACCOUNT),
        like(starBankTransactions.reason, 'Taxi a %'),
      ),
    );
  logger.info(
    `cleaned ${ids.length} replay(s), the trainer's achievements and their taxi fares`,
  );

  if (clean) {
    await connection.end();
    logger.info('✓ fixture removed');
    return;
  }

  // --- battles → the season standing derives from these ---
  const replayIds: number[] = [];
  for (const [i, won] of BATTLE_RESULTS.entries()) {
    const when = day(80 - i * 4);
    await db.insert(rotomReplays).values({
      side1: TRAINER_NAME,
      side2: FIXTURE_TAG,
      team1: WINNING_TEAM,
      team2: WINNING_TEAM,
      replay: JSON.stringify({ fixture: true, log: [] }),
      winner: won ? TRAINER_NAME : FIXTURE_TAG,
      createdAt: when,
      updatedAt: when,
    });
    const [[row]]: any = await connection.execute(
      'SELECT LAST_INSERT_ID() AS id',
    );
    const id = Number(row.id);
    replayIds.push(id);
    await db
      .insert(rotomUserReplays)
      .values({ uuid: TRAINER_UUID, replayId: id, side: 1 });
  }
  const wins = BATTLE_RESULTS.filter(Boolean).length;
  logger.info(
    `${BATTLE_RESULTS.length} battles (${wins}W/${BATTLE_RESULTS.length - wins}L) → derived lp ${Math.max(0, wins * 20 - (BATTLE_RESULTS.length - wins) * 12)}`,
  );

  // --- achievements. dataId points at a replay so the badge page can offer "Ver Repetición". ---
  const all = await db
    .select({ id: rotomAchievements.id })
    .from(rotomAchievements);
  const known = new Set(all.map((a) => a.id));

  let earned = 0;
  for (const [i, [id, daysAgo]] of EARNED.entries()) {
    if (!known.has(id)) {
      logger.warn(`achievement "${id}" is not in this database — skipped`);
      continue;
    }
    await db.insert(rotomUserAchievements).values({
      achievementId: id,
      uuid: TRAINER_UUID,
      progress: 1,
      completed: 1,
      completedAt: day(daysAgo),
      dataId: replayIds[i % replayIds.length],
    });
    earned++;
  }
  logger.info(
    `${earned} achievement(s) struck, ${known.size - earned} left blind-embossed`,
  );

  // --- taxi fares → the Bitácora's travel stamps ---
  for (const [stop, fare, daysAgo] of TRIPS) {
    await db.insert(starBankTransactions).values({
      fromAccountId: TRAINER_ACCOUNT,
      toAccountId: TAXI_SERVICE_ACCOUNT,
      amount: fare,
      fromBalance: 1000,
      toBalance: 1000,
      reason: `Taxi a ${stop}`,
      type: 'TRANSFER',
      date: day(daysAgo),
    });
  }
  logger.info(
    `${TRIPS.length} taxi fare(s) → ${new Set(TRIPS.map((t) => t[0])).size} distinct destinations`,
  );

  await connection.end();
  logger.info('✓ dev fixture applied — run with --clean to remove it');
}

// Direct invocation only; `seed:system` imports `main` and awaits it.
if (require.main === module) {
  main().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
