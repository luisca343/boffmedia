import * as dotenv from 'dotenv';
dotenv.config();

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';

import { boffMediaRoles } from '../_db/schema/BoffMedia';
import { gobiernoTasas } from '../_db/schema/SmartRotomGobierno';
import { seedHouseAccounts } from './house-accounts';
import pino from 'pino';

const logger = pino({ name: 'gobierno-seed' });

// Idempotent rate card. `code` carries the uniqueness — re-running this
// script updates the existing rows in place rather than duplicating them. Percentage-based
// rates (captura) have no fixed `amount`; what's actually collected always derives from the
// StarBank ledger, never from this column.
export const GOB_ROLES = [
  'GOBIERNO',
  'GOB_AGENTE',
  'GOB_INSPECTOR',
  'GOB_ALCALDE',
] as const;

export const TASAS = [
  {
    code: 'TAS-PARCELA',
    concept: 'Impuesto de parcela',
    kind: 'parcela',
    rate: '500₽/parcela',
    amount: 500,
  },
  {
    code: 'TAS-LICENCIA',
    concept: 'Licencia comercial',
    kind: 'comercio',
    rate: '2000₽/trimestre',
    amount: 2000,
  },
  {
    code: 'TAS-PEAJE',
    concept: 'Peaje de ruta',
    kind: 'transporte',
    rate: '50₽/tránsito',
    amount: 50,
  },
  {
    code: 'TAS-CAPTURA',
    concept: 'Tasa de captura',
    kind: 'subasta',
    rate: '5% del botín',
    amount: 0,
  },
  {
    code: 'TAS-REGISTRO',
    concept: 'Registro de propiedad',
    kind: 'parcela',
    rate: '1000₽/traspaso',
    amount: 1000,
  },
];

export async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // ── Roles ──────────────────────────────────────────────────────────────────
  logger.info('Seeding gobierno roles…');
  for (const name of GOB_ROLES) {
    await db
      .insert(boffMediaRoles)
      .values({ name })
      .onDuplicateKeyUpdate({ set: { name: sql`name` } });
  }

  // ── Treasury account ─────────────────────────────────────────────────────────
  // The treasury is one of the house accounts, so it is seeded with the rest of them from a
  // single registry (starbank/house-accounts.ts) rather than by whichever app happens to need
  // it first. Running the whole set here is harmless — it is idempotent.
  await seedHouseAccounts(db);

  // ── Tasas rate card ───────────────────────────────────────────────────────────
  logger.info('Seeding rotom_gobierno_tasas…');
  for (const tasa of TASAS) {
    await db
      .insert(gobiernoTasas)
      .values({ ...tasa, active: true })
      .onDuplicateKeyUpdate({
        set: {
          concept: tasa.concept,
          kind: tasa.kind,
          rate: tasa.rate,
          amount: tasa.amount,
        },
      });
  }

  // ── Zonas ──────────────────────────────────────────────────────────────────────
  // Deliberately left empty: seeding real zonas needs a town → zone-kind mapping that isn't
  // derivable from wingull/towns (which only lists town ids, not their commercial/civic
  // districts). An empty table is fine — the UI handles it — rather than inventing fake zones.

  await connection.end();
  logger.info('✓ Gobierno seed complete');
}

// Direct invocation only; `seed:system` imports `main` and awaits it.
if (require.main === module) {
  main().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
