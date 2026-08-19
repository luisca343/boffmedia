import * as dotenv from 'dotenv';
dotenv.config();

import pino from 'pino';

/**
 * Development and demo fixtures. NOT required for the application to work — the
 * system bootstrap (`seed:system`) is.
 *
 * These used to sit next to the required seeds with no marker of any kind, one
 * `ts-node` away from being run against production. This entrypoint refuses to
 * do that.
 */
const logger = pino({ name: 'seed:dev' });

const STEPS: { name: string; run: () => Promise<unknown> }[] = [
  { name: 'packs-dev', run: () => import('./packs-dev').then((m) => m.main()) },
  {
    name: 'pasaporte-dev-fixture',
    run: () => import('./pasaporte-dev-fixture').then((m) => m.main()),
  },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'seed:dev is demo data and must never run against production.',
    );
  }

  for (const step of STEPS) {
    logger.info(`▶ ${step.name}`);
    await step.run();
  }

  logger.info('✓ Dev fixtures loaded');
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
