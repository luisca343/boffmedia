import * as dotenv from 'dotenv';
dotenv.config();

import pino from 'pino';

/**
 * The bootstrap a completely empty database needs before the application can
 * run. Nothing here is demo content: roles, the first administrator, forum
 * categories, the ledger's house accounts, the civic rate card, the mine's drop
 * table and the passport cycle are all things the API assumes exist.
 *
 * Ordering is load-bearing and used to live only in someone's head:
 *   1. `default`          — roles, the admin's rotom_users row, the admin
 *                           account, the app registry. Everything else FKs to
 *                           rows this creates.
 *   2. `forum-categories` — upserted by slug.
 *   3. `gobierno`         — imports and runs `house-accounts` itself, so the
 *                           ledger counterparties exist before any rate refers
 *                           to them.
 *   4. `mine-rewards`     — drop table.
 *   5. `pasaporte`        — the cycle standings are measured inside.
 *   6. `rooker`           — derives one handle per EXISTING rotom_users row, so
 *                           it has to be last.
 *
 * Every step is idempotent, so re-running this is safe.
 *
 * Development fixtures (`packs-dev`, `pasaporte-dev-fixture`) are deliberately
 * NOT here — see `seed:dev`, which refuses to run with NODE_ENV=production.
 */
const logger = pino({ name: 'seed:system' });

const STEPS: { name: string; run: () => Promise<unknown> }[] = [
  { name: 'default', run: () => import('./default') },
  { name: 'forum-categories', run: () => import('./forum-categories') },
  { name: 'gobierno (incl. house accounts)', run: () => import('./gobierno') },
  { name: 'mine-rewards', run: () => import('./mine-rewards') },
  { name: 'pasaporte', run: () => import('./pasaporte') },
  { name: 'rooker', run: () => import('./rooker') },
];

async function main() {
  if (!process.env.SEED_ADMIN_PASSWORD) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is required — the bootstrap creates the first ' +
        'administrator and will not invent a password for it.',
    );
  }

  for (const step of STEPS) {
    logger.info(`▶ ${step.name}`);
    // Each seed script runs its own `main()` on import and closes its own
    // connection; awaiting the import is what sequences them.
    await step.run();
  }

  logger.info('✓ System bootstrap complete');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
