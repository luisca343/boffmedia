import {
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { boffMediaUsers } from './BoffMedia';
import { jsonColumn } from './_json';

/** A normalized target point in the 0..100 anatomy-board coordinate system. */
export interface MhwildsAnatomyPoint {
  x: number;
  y: number;
}

/**
 * Only the target is overridden. The report's edge anchor remains generated
 * from the game's fixed slot, so an admin can repair a marker without making
 * the leader line stop being a Hunter's Manual callout.
 */
export type MhwildsAnatomyCallouts = Record<string, MhwildsAnatomyPoint>;

/**
 * Admin corrections to generated Hunter's Manual callout positions.
 *
 * The identity is the game's fixed ID plus its variant, never a localized
 * monster name. A game update can regenerate the base bestiary JSON while
 * these rows continue to apply to the same monster.
 */
export const mhwildsAnatomyOverrides = mysqlTable(
  'tools_mhwilds_anatomy_overrides',
  {
    id: int('id').primaryKey().autoincrement(),
    fixedId: int('fixed_id').notNull(),
    variantId: varchar('variant_id', { length: 16 }).notNull(),
    callouts: jsonColumn('callouts').$type<MhwildsAnatomyCallouts>().notNull(),
    updatedBy: int('updated_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    fixedVariantUq: uniqueIndex('mha_fixed_variant_uq').on(
      table.fixedId,
      table.variantId,
    ),
    fixedIdIdx: index('mha_fixed_id_idx').on(table.fixedId),
    updatedByFk: foreignKey({
      name: 'mha_updated_by_fk',
      columns: [table.updatedBy],
      foreignColumns: [boffMediaUsers.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  }),
);

export type MhwildsAnatomyOverride =
  typeof mhwildsAnatomyOverrides.$inferSelect;
