import * as dotenv from 'dotenv';
dotenv.config();

import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '@/config/env';

import { boffMediaRoles } from '../_db/schema/BoffMedia';
import { starBankAccounts } from '../_db/schema/SmartRotomStarBank';
import { gobiernoTasas } from '../_db/schema/SmartRotomGobierno';
import pino from 'pino';

const logger = pino({ name: 'gobierno-seed' });

const TREASURY_NAME = 'Tesorería de Teras';

// Idempotent rate card from the handoff. `code` carries the uniqueness — re-running this
// script updates the existing rows in place rather than duplicating them. Percentage-based
// rates (captura) have no fixed `amount`; what's actually collected always derives from the
// StarBank ledger, never from this column.
const TASAS = [
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

async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // ── Roles ──────────────────────────────────────────────────────────────────
  logger.info('Seeding gobierno roles…');
  for (const name of [
    'GOBIERNO',
    'GOB_AGENTE',
    'GOB_INSPECTOR',
    'GOB_ALCALDE',
  ]) {
    await db
      .insert(boffMediaRoles)
      .values({ name })
      .onDuplicateKeyUpdate({ set: { name: sql`name` } });
  }

  // ── Treasury account ─────────────────────────────────────────────────────────
  // No owning player, so it bypasses the normal StarBank account-creation flow (which always
  // links to a uuid in rotom_starbank_user_accounts). There is exactly one — check before insert.
  logger.info('Seeding treasury account…');
  const [existingTreasury] = await db
    .select({ id: starBankAccounts.id })
    .from(starBankAccounts)
    .where(eq(starBankAccounts.type, 'GOVERNMENT'));
  if (!existingTreasury) {
    await db
      .insert(starBankAccounts)
      .values({ name: TREASURY_NAME, balance: 0, type: 'GOVERNMENT' });
    logger.info(`Created treasury account "${TREASURY_NAME}"`);
  } else {
    logger.info(`Treasury account already exists (#${existingTreasury.id})`);
  }

  // ── Tasas rate card ───────────────────────────────────────────────────────────
  logger.info('Seeding rotom_gobierno_tasas…');
  for (const tasa of TASAS) {
    await db
      .insert(gobiernoTasas)
      .values({ ...tasa, active: 1 })
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

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
