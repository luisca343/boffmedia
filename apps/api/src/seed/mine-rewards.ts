import * as dotenv from 'dotenv';
dotenv.config();

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import pino from 'pino';
import { env } from '@/config/env';
import { mineRewards } from '../_db/schema/SmartRotomMine';

const logger = pino({ name: 'seed-mine-rewards' });

// Drop table for the mina minigame.
//
// `value` is a single column doing three jobs at once, and they pull against each
// other:
//   1. drop weight  — utils.ts picks by roulette wheel, so P(pick) = value/total.
//                     Higher value means MORE common, not rarer.
//   2. score        — jugar/page.tsx sends it to endGame; the ranking SUMs it.
//   3. rarity label — game.service.ts calculateRarityFromWeight: >=1000 legendary.
//
// So an item cannot be both scarce and worth a lot. What breaks the tie is that a
// category's share of the roll is the SUM of its rows: gems stay the highest-value
// single item (so score and rarity read correctly) while the 60-odd low-value
// fossil/plate rows soak up most of the wheel. Gems land near 16% of picks.
//
// Values stay under 1000 so the rarity label tops out at `epic`; nothing here should
// be minting `legendary` inventory rows on a routine dig.
//
// `itemId` is load-bearing twice over, which constrains what can be listed here:
//   - the sprite is resolved as `recompensas/${itemId.split(':')[1]}.png`, so the
//     part after the colon MUST match a file in
//     apps/web/public/smartrotom/img/apps/mina/recompensas/.
//   - reclamar/page.tsx forwards it to the mod verbatim as the item to grant, so
//     the whole string must be a real in-game id.
// Every row below is a sprite that exists on disk. `nada.png` is deliberately absent
// — it is the empty-cell art, not a drop.
//
// Namespaces: `pixelmon:` for stock Pixelmon items (plates, evolution stones),
// `teras:` for this server's custom art, matching the `teras:gema_prisma` example in
// mine.controller.ts. See the note in the run output about verifying the custom ids.

type Reward = {
  name: string;
  type: string;
  itemId: string;
  value: number;
  width: number;
  height: number;
};

// The board is 10 rows x 18 cols (jugar/page.tsx) and only 5 rewards are placed per
// game, so footprints stay between 1x1 and 3x2. width = columns, height = rows.
const REWARDS: Reward[] = [
  // ── Gemas ────────────────────────────────────────────────────────────────────
  // Highest single-item value: best score, `epic` rarity, still scarce in aggregate
  // because there are only five of them against ~65 cheaper rows.
  { name: 'Gema prisma', type: 'Gemas', itemId: 'teras:gema_prisma', value: 900, width: 2, height: 2 },
  { name: 'Gema blanca', type: 'Gemas', itemId: 'teras:gema_blanca', value: 850, width: 2, height: 2 },
  { name: 'Gema roja', type: 'Gemas', itemId: 'teras:gema_roja', value: 800, width: 2, height: 2 },
  { name: 'Gema azul', type: 'Gemas', itemId: 'teras:gema_azul', value: 800, width: 2, height: 2 },
  { name: 'Gema verde', type: 'Gemas', itemId: 'teras:gema_verde', value: 800, width: 2, height: 2 },

  // ── Gemas pequeñas ───────────────────────────────────────────────────────────
  // 1x1 consolation version of the above: easy to uncover, worth roughly a third.
  { name: 'Gema prisma pequeña', type: 'Gemas pequeñas', itemId: 'teras:gema_prisma_peque', value: 320, width: 1, height: 1 },
  { name: 'Gema blanca pequeña', type: 'Gemas pequeñas', itemId: 'teras:gema_blanca_peque', value: 300, width: 1, height: 1 },
  { name: 'Gema roja pequeña', type: 'Gemas pequeñas', itemId: 'teras:gema_roja_peque', value: 280, width: 1, height: 1 },
  { name: 'Gema azul pequeña', type: 'Gemas pequeñas', itemId: 'teras:gema_azul_peque', value: 280, width: 1, height: 1 },
  { name: 'Gema verde pequeña', type: 'Gemas pequeñas', itemId: 'teras:gema_verde_peque', value: 280, width: 1, height: 1 },

  // ── Piedras especiales ───────────────────────────────────────────────────────
  { name: 'Piedra Teras', type: 'Piedras especiales', itemId: 'teras:piedra_teras', value: 750, width: 2, height: 2 },
  { name: 'Piedra espíritu', type: 'Piedras especiales', itemId: 'teras:piedra_espiritu', value: 700, width: 2, height: 2 },

  // ── Piezas de deseo ──────────────────────────────────────────────────────────
  { name: 'Pieza de deseo', type: 'Piezas de deseo', itemId: 'pixelmon:wishing_piece', value: 600, width: 2, height: 2 },
  { name: 'Pieza de deseo acuática', type: 'Piezas de deseo', itemId: 'teras:waterdude_wishing_piece', value: 600, width: 2, height: 2 },

  // ── Fósiles ──────────────────────────────────────────────────────────────────
  // Cleaned//revivable fossils. Fifteen rows at a middling value: individually
  // uncommon, collectively one of the two big slices of the wheel.
  { name: 'Fósil hélix', type: 'Fósiles', itemId: 'teras:fosil_helix', value: 260, width: 2, height: 2 },
  { name: 'Fósil domo', type: 'Fósiles', itemId: 'teras:fosil_domo', value: 260, width: 2, height: 2 },
  { name: 'Fósil ámbar', type: 'Fósiles', itemId: 'teras:fosil_ambar', value: 280, width: 2, height: 2 },
  { name: 'Fósil raíz', type: 'Fósiles', itemId: 'teras:fosil_raiz', value: 240, width: 2, height: 2 },
  { name: 'Fósil garra', type: 'Fósiles', itemId: 'teras:fosil_garra', value: 240, width: 2, height: 2 },
  { name: 'Fósil cráneo', type: 'Fósiles', itemId: 'teras:fosil_craneo', value: 250, width: 2, height: 2 },
  { name: 'Fósil coraza', type: 'Fósiles', itemId: 'teras:fosil_coraza', value: 250, width: 2, height: 2 },
  { name: 'Fósil tapa', type: 'Fósiles', itemId: 'teras:fosil_tapa', value: 230, width: 2, height: 2 },
  { name: 'Fósil pluma', type: 'Fósiles', itemId: 'teras:fosil_pluma', value: 230, width: 2, height: 2 },
  { name: 'Fósil mandíbula', type: 'Fósiles', itemId: 'teras:fosil_mandibula', value: 270, width: 3, height: 2 },
  { name: 'Fósil aleta', type: 'Fósiles', itemId: 'teras:fosil_aleta', value: 270, width: 3, height: 2 },
  { name: 'Fósil pájaro', type: 'Fósiles', itemId: 'teras:fosil_pajaro', value: 240, width: 2, height: 2 },
  { name: 'Fósil pez', type: 'Fósiles', itemId: 'teras:fosil_pez', value: 240, width: 2, height: 2 },
  { name: 'Fósil dragón', type: 'Fósiles', itemId: 'teras:fosil_dragon', value: 290, width: 3, height: 2 },
  { name: 'Fósil dino', type: 'Fósiles', itemId: 'teras:fosil_dino', value: 290, width: 3, height: 2 },

  // ── Fósiles cubiertos ────────────────────────────────────────────────────────
  // The buried/uncleaned counterpart of the set above — what you actually pull out
  // of the rock — so it is cheaper and the most common thing on the board.
  { name: 'Hélix cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_helix_fossil', value: 180, width: 2, height: 2 },
  { name: 'Domo cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_dome_fossil', value: 180, width: 2, height: 2 },
  { name: 'Ámbar cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_old_amber', value: 190, width: 2, height: 2 },
  { name: 'Raíz cubierta', type: 'Fósiles cubiertos', itemId: 'teras:covered_root_fossil', value: 170, width: 2, height: 2 },
  { name: 'Garra cubierta', type: 'Fósiles cubiertos', itemId: 'teras:covered_claw_fossil', value: 170, width: 2, height: 2 },
  { name: 'Cráneo cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_skull_fossil', value: 175, width: 2, height: 2 },
  { name: 'Coraza cubierta', type: 'Fósiles cubiertos', itemId: 'teras:covered_armor_fossil', value: 175, width: 2, height: 2 },
  { name: 'Tapa cubierta', type: 'Fósiles cubiertos', itemId: 'teras:covered_cover_fossil', value: 160, width: 2, height: 2 },
  { name: 'Pluma cubierta', type: 'Fósiles cubiertos', itemId: 'teras:covered_plume_fossil', value: 160, width: 2, height: 2 },
  { name: 'Mandíbula cubierta', type: 'Fósiles cubiertos', itemId: 'teras:covered_jaw_fossil', value: 185, width: 3, height: 2 },
  { name: 'Aleta cubierta', type: 'Fósiles cubiertos', itemId: 'teras:covered_sail_fossil', value: 185, width: 3, height: 2 },
  { name: 'Pájaro cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_bird_fossil', value: 170, width: 2, height: 2 },
  { name: 'Pez cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_fish_fossil', value: 170, width: 2, height: 2 },
  { name: 'Dragón cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_drake_fossil', value: 195, width: 3, height: 2 },
  { name: 'Dino cubierto', type: 'Fósiles cubiertos', itemId: 'teras:covered_dino_fossil', value: 195, width: 3, height: 2 },

  // ── Piedras evolutivas ───────────────────────────────────────────────────────
  // Stock Pixelmon ids; names follow locales/es/items.json.
  { name: 'Piedra Fuego', type: 'Piedras evolutivas', itemId: 'pixelmon:fire_stone', value: 340, width: 1, height: 1 },
  { name: 'Piedra Agua', type: 'Piedras evolutivas', itemId: 'pixelmon:water_stone', value: 340, width: 1, height: 1 },
  { name: 'Piedra Trueno', type: 'Piedras evolutivas', itemId: 'pixelmon:thunder_stone', value: 340, width: 1, height: 1 },
  { name: 'Piedra Hoja', type: 'Piedras evolutivas', itemId: 'pixelmon:leaf_stone', value: 340, width: 1, height: 1 },
  { name: 'Piedra Lunar', type: 'Piedras evolutivas', itemId: 'pixelmon:moon_stone', value: 360, width: 1, height: 1 },
  { name: 'Piedra Solar', type: 'Piedras evolutivas', itemId: 'pixelmon:sun_stone', value: 360, width: 1, height: 1 },
  { name: 'Piedra Alba', type: 'Piedras evolutivas', itemId: 'pixelmon:dawn_stone', value: 380, width: 1, height: 1 },
  { name: 'Piedra Noche', type: 'Piedras evolutivas', itemId: 'pixelmon:dusk_stone', value: 380, width: 1, height: 1 },
  { name: 'Piedra Día', type: 'Piedras evolutivas', itemId: 'pixelmon:shiny_stone', value: 380, width: 1, height: 1 },
  { name: 'Piedra Hielo', type: 'Piedras evolutivas', itemId: 'pixelmon:ice_stone', value: 360, width: 1, height: 1 },

  // ── Tablas ───────────────────────────────────────────────────────────────────
  // The Arceus plate set. Sixteen rows, so this is the other big slice of the wheel.
  // pixie_plate is named in items.json but has no sprite on disk, so it is omitted.
  { name: 'Tabla draco', type: 'Tablas', itemId: 'pixelmon:draco_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla terror', type: 'Tablas', itemId: 'pixelmon:dread_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla terrax', type: 'Tablas', itemId: 'pixelmon:earth_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla fuerte', type: 'Tablas', itemId: 'pixelmon:fist_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla llama', type: 'Tablas', itemId: 'pixelmon:flame_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla helada', type: 'Tablas', itemId: 'pixelmon:icicle_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla bicho', type: 'Tablas', itemId: 'pixelmon:insect_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla acero', type: 'Tablas', itemId: 'pixelmon:iron_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla pradal', type: 'Tablas', itemId: 'pixelmon:meadow_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla mental', type: 'Tablas', itemId: 'pixelmon:mind_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla cielo', type: 'Tablas', itemId: 'pixelmon:sky_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla linfa', type: 'Tablas', itemId: 'pixelmon:splash_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla siniestra', type: 'Tablas', itemId: 'pixelmon:spooky_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla pétrea', type: 'Tablas', itemId: 'pixelmon:stone_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla tóxica', type: 'Tablas', itemId: 'pixelmon:toxic_plate', value: 300, width: 2, height: 2 },
  { name: 'Tabla trueno', type: 'Tablas', itemId: 'pixelmon:zap_plate', value: 300, width: 2, height: 2 },
];

// `name`, `type` and `item_id` are all varchar(32). Truncation would be silent under
// a non-strict sql_mode and would break the sprite lookup, so fail loudly instead.
function assertFits(rewards: Reward[]) {
  const tooLong = rewards.flatMap((r) =>
    (['name', 'type', 'itemId'] as const)
      .filter((f) => r[f].length > 32)
      .map((f) => `${r.itemId}: ${f} is ${r[f].length} chars (max 32)`),
  );
  if (tooLong.length) {
    throw new Error(`Values exceed their column width:\n  ${tooLong.join('\n  ')}`);
  }

  const seen = new Set<string>();
  const dupes = rewards.filter((r) => !seen.add(r.itemId)).map((r) => r.itemId);
  if (dupes.length) {
    throw new Error(`Duplicate itemIds: ${dupes.join(', ')}`);
  }
}

async function main() {
  const DATABASE_URL = env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is required');

  assertFits(REWARDS);

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  // Idempotent by item_id, which is the natural key — the table's only unique index
  // is the surrogate id, so onDuplicateKeyUpdate has nothing to catch on. Rows are
  // never deleted: rotom_mine_games_detail.reward_id references this table ON DELETE
  // CASCADE, so clearing it to re-seed would take every player's game history and
  // ranking score with it.
  const existing = await db
    .select({ id: mineRewards.id, itemId: mineRewards.itemId })
    .from(mineRewards);
  const byItemId = new Map(existing.map((r) => [r.itemId, r.id]));

  let inserted = 0;
  let updated = 0;

  for (const reward of REWARDS) {
    const id = byItemId.get(reward.itemId);
    if (id === undefined) {
      await db.insert(mineRewards).values(reward);
      inserted++;
    } else {
      await db
        .update(mineRewards)
        .set({
          name: reward.name,
          type: reward.type,
          value: reward.value,
          width: reward.width,
          height: reward.height,
        })
        .where(sql`${mineRewards.id} = ${id}`);
      updated++;
    }
  }

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(mineRewards);

  const totalWeight = REWARDS.reduce((sum, r) => sum + r.value, 0);
  const byType = new Map<string, number>();
  for (const r of REWARDS) {
    byType.set(r.type, (byType.get(r.type) ?? 0) + r.value);
  }

  logger.info(`Inserted ${inserted}, updated ${updated}. ${n} reward rows present.`);
  logger.info('Share of the roll per category:');
  for (const [type, weight] of [...byType].sort((a, b) => b[1] - a[1])) {
    const pct = ((weight / totalWeight) * 100).toFixed(1);
    logger.info(`  ${type.padEnd(20)} ${pct.padStart(5)}%`);
  }
  logger.info(
    'Custom `teras:` ids (gemas, fósiles, piedras especiales) are inferred from the ' +
      'sprite filenames — verify them against the mod item registry before prod, or ' +
      'claiming will render fine but grant nothing in-game.',
  );

  await connection.end();
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});
