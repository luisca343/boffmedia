import {
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

import { boffMediaUsers } from './BoffMedia';

export const tcgSets = mysqlTable('tools_tcg_sets', {
  id: varchar('id', { length: 32 }).primaryKey(),
  seriesId: varchar('series_id', { length: 32 })
    .notNull()
    .references(() => tcgSeries.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  nameEn: varchar('name_en', { length: 128 }).notNull(),
  nameEs: varchar('name_es', { length: 128 }).notNull(),
  logo: varchar('logo', { length: 255 }),
  symbol: varchar('symbol', { length: 255 }),
  cardCountOfficial: int('card_count_official'),
  cardCountTotal: int('card_count_total'),
});

export type TcgSet = typeof tcgSets.$inferSelect;

export const tcgSeries = mysqlTable('tools_tcg_series', {
  id: varchar('id', { length: 32 }).primaryKey(),
  nameEn: varchar('name_en', { length: 64 }).notNull(),
  nameEs: varchar('name_es', { length: 64 }).notNull(),
  logo: varchar('logo', { length: 255 }),
});

export type TcgSeries = typeof tcgSeries.$inferSelect;

export const tcgCards = mysqlTable('tools_tcg_cards', {
  id: varchar('id', { length: 32 }).primaryKey(),
  setId: varchar('set_id', { length: 32 })
    .notNull()
    .references(() => tcgSets.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  localId: varchar('local_id', { length: 16 }),
  nameEn: varchar('name_en', { length: 128 }).notNull(),
  nameEs: varchar('name_es', { length: 128 }).notNull(),
  imageLocalEn: varchar('image_local_en', { length: 255 }),
  imageLocalEs: varchar('image_local_es', { length: 255 }),
  category: varchar('category', { length: 64 }),
  illustrator: varchar('illustrator', { length: 128 }),
  rarity: varchar('rarity', { length: 64 }),
  hp: int('hp'),
  stage: varchar('stage', { length: 32 }),
  descriptionEn: varchar('description_en', { length: 1024 }),
  descriptionEs: varchar('description_es', { length: 1024 }),
  updated: timestamp('updated'),

  // TODO: Pensar en cómo manejar estos campos complejos de forma más eficiente
  types: varchar('types', { length: 255 }), // JSON: ["Grass", "Water"]
  weaknesses: varchar('weaknesses', { length: 512 }), // JSON: [{"type": "Fire", "value": "+20"}]
  attacks: text('attacks'), // JSON: [{"cost": [...], "name": "...", "damage": "..."}]
  boosters: varchar('boosters', { length: 512 }), // JSON: [{"id": "...", "name": "..."}]
  variants: varchar('variants', { length: 255 }), // JSON: {"holo": true, "normal": false, ...}
  legal: varchar('legal', { length: 100 }), // JSON: {"standard": false, "expanded": false}
  retreat: int('retreat'), // Simple integer
});

export type TcgCard = typeof tcgCards.$inferSelect;

export const tcgUserCards = mysqlTable(
  'tools_tcg_user_cards',
  {
    id: varchar('id', { length: 32 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => boffMediaUsers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    cardId: varchar('card_id', { length: 32 })
      .notNull()
      .references(() => tcgCards.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    quantity: int('quantity').default(1).notNull(),
    acquiredDate: timestamp('acquired_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  // One row per (user, card). This was declared as a second primaryKey(), which
  // MySQL cannot have — the live table only ever got PRIMARY KEY(id), so the
  // rule was unenforced. It is a unique index now (migration 0036).
  (table) => ({
    userCardUq: uniqueIndex('tcg_user_cards_user_card_uq').on(
      table.userId,
      table.cardId,
    ),
  }),
);

export type TcgUserCard = typeof tcgUserCards.$inferSelect;

export const tcgUserCardHistory = mysqlTable('tools_tcg_user_card_history', {
  id: varchar('id', { length: 32 }).primaryKey(),
  userId: int('user_id')
    .notNull()
    .references(() => boffMediaUsers.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  cardId: varchar('card_id', { length: 32 })
    .notNull()
    .references(() => tcgCards.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  quantityChange: int('quantity_change').notNull(), // +/- amount
  date: timestamp('date').notNull(),
});

export type TcgUserCardHistory = typeof tcgUserCardHistory.$inferSelect;
