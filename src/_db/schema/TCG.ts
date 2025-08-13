import { mysqlTable, varchar, int, text, primaryKey, datetime } from "drizzle-orm/mysql-core";

export const tcgSets = mysqlTable("tcg_sets", {
  id: varchar("id", { length: 32 }).primaryKey(),
  series_id: varchar("series_id", { length: 32 }).notNull(),
  name_en: varchar("name_en", { length: 128 }).notNull(),
  name_es: varchar("name_es", { length: 128 }).notNull(),
  logo: varchar("logo", { length: 255 }),
  symbol: varchar("symbol", { length: 255 }),
  logo_local: varchar("logo_local", { length: 255 }),
  symbol_local: varchar("symbol_local", { length: 255 }),
  card_count_official: int("card_count_official"),
  card_count_total: int("card_count_total"),
});

export type TcgSet = typeof tcgSets.$inferSelect;

export const tcgSeries = mysqlTable("tcg_series", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name_en: varchar("name_en", { length: 64 }).notNull(),
  name_es: varchar("name_es", { length: 64 }).notNull(),
  logo: varchar("logo", { length: 255 }),
  logo_local: varchar("logo_local", { length: 255 }),
});

export type TcgSeries = typeof tcgSeries.$inferSelect;

export const tcgCards = mysqlTable("tcg_cards", {
  id: varchar("id", { length: 32 }).primaryKey(),
  set_id: varchar("set_id", { length: 32 }).notNull(),
  local_id: varchar("local_id", { length: 16 }),
  name_en: varchar("name_en", { length: 128 }).notNull(),
  name_es: varchar("name_es", { length: 128 }).notNull(),
  image_local_en: varchar("image_local_en", { length: 255 }),
  image_local_es: varchar("image_local_es", { length: 255 }),
  category: varchar("category", { length: 64 }),
  illustrator: varchar("illustrator", { length: 128 }),
  rarity: varchar("rarity", { length: 64 }),
  hp: int("hp"),
  stage: varchar("stage", { length: 32 }),
  description_en: varchar("description_en", { length: 1024 }),
  description_es: varchar("description_es", { length: 1024 }),
  updated: datetime("updated"),
  
  // TODO: Pensar en cómo manejar estos campos complejos de forma más eficiente
  types: varchar("types", { length: 255 }), // JSON: ["Grass", "Water"]
  weaknesses: varchar("weaknesses", { length: 512 }), // JSON: [{"type": "Fire", "value": "+20"}]
  attacks: text("attacks"), // JSON: [{"cost": [...], "name": "...", "damage": "..."}]
  boosters: varchar("boosters", { length: 512 }), // JSON: [{"id": "...", "name": "..."}]
  variants: varchar("variants", { length: 255 }), // JSON: {"holo": true, "normal": false, ...}
  legal: varchar("legal", { length: 100 }), // JSON: {"standard": false, "expanded": false}
  retreat: int("retreat"), // Simple integer
});

export type TcgCard = typeof tcgCards.$inferSelect;

export const userCards = mysqlTable("tcg_user_cards", {
  id: varchar("id", { length: 32 }).primaryKey(),
  user_id: int("user_id").notNull(),
  card_id: varchar("card_id", { length: 32 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  acquired_date: datetime("acquired_date").notNull(),
  created_at: datetime("created_at").notNull(),
  updated_at: datetime("updated_at").notNull(),
}, (table) => ({
  userCardUnique: primaryKey({
    name: "user_card_unique",
    columns: [table.user_id, table.card_id]
  })
}));

export type UserCard = typeof userCards.$inferSelect;

export const userCardHistory = mysqlTable("tcg_user_card_history", {
  id: varchar("id", { length: 32 }).primaryKey(),
  user_id: int("user_id").notNull(),
  card_id: varchar("card_id", { length: 32 }).notNull(),
  quantity_change: int("quantity_change").notNull(), // +/- amount
  date: datetime("date").notNull(),
});

export type UserCardHistory = typeof userCardHistory.$inferSelect;