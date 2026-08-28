import * as dotenv from 'dotenv';
dotenv.config();

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import pino from 'pino';
import { env } from '@/config/env';
import { boffMediaForumCategories } from '../_db/schema/BoffMediaForum';

const logger = pino({ name: 'seed-forum' });

// Admin-seeded forum categories. Idempotent: upserts by slug so re-running
// syncs label/icon/hue/position edits without duplicating rows. `locked`
// categories are read-only to non-admins.
export const CATEGORIES = [
  {
    slug: 'anuncios',
    name: 'Anuncios',
    description: 'Novedades oficiales del equipo Boffmedia.',
    icon: 'bell',
    hue: 18,
    locked: true,
    position: 0,
  },
  {
    slug: 'general',
    name: 'General',
    description:
      'Charla abierta de la comunidad sobre cualquier tema del ecosistema.',
    icon: 'message',
    hue: 28,
    locked: false,
    position: 1,
  },
  {
    slug: 'ayuda',
    name: 'Ayuda y soporte',
    description:
      'Preguntas, dudas y resolución de problemas. Marca la respuesta como resuelta.',
    icon: 'info',
    hue: 152,
    locked: false,
    position: 2,
  },
  {
    slug: 'torneos',
    name: 'Torneos y eventos',
    description: 'Organización, resultados y debate sobre torneos y eventos.',
    icon: 'trophy',
    hue: 265,
    locked: false,
    position: 3,
  },
  {
    slug: 'competitivo',
    name: 'Competitivo VGC',
    description: 'Equipos, metajuego y estrategia del formato competitivo.',
    icon: 'sword',
    hue: 340,
    locked: false,
    position: 4,
  },
  {
    slug: 'herramientas',
    name: 'Herramientas',
    description:
      'Sugerencias y reportes sobre las herramientas de la plataforma.',
    icon: 'wrench',
    hue: 200,
    locked: false,
    position: 5,
  },
  {
    slug: 'off-topic',
    name: 'Off-topic',
    description: 'Todo lo demás: fuera de tema y tiempo libre.',
    icon: 'globe',
    hue: 48,
    locked: false,
    position: 6,
  },
];

export async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  logger.info('Seeding forum categories…');
  for (const c of CATEGORIES) {
    await db
      .insert(boffMediaForumCategories)
      .values(c)
      .onDuplicateKeyUpdate({
        set: {
          name: c.name,
          description: c.description,
          icon: c.icon,
          hue: c.hue,
          locked: c.locked,
          position: c.position,
        },
      });
  }

  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(boffMediaForumCategories);
  logger.info(`Done. ${rows[0].n} forum categories present.`);
  await connection.end();
}

// Direct invocation only; `seed:system` imports `main` and awaits it.
if (require.main === module) {
  main().catch((e) => {
    logger.error(e);
    process.exit(1);
  });
}
