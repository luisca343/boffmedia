
import { mysqlTable, varchar, int } from "drizzle-orm/mysql-core";
export const tcgSets = mysqlTable("tcg_sets", {
  id: varchar("id", { length: 32 }).primaryKey(),
  series_id: varchar("series_id", { length: 32 }).notNull(),
  name_en: varchar("name_en", { length: 128 }).notNull(),
  name_es: varchar("name_es", { length: 128 }).notNull(),
  logo: varchar("logo", { length: 255 }),
  symbol: varchar("symbol", { length: 255 }),
  card_count_official: int("card_count_official"),
  card_count_total: int("card_count_total"),
});

export type TcgSet = typeof tcgSets.$inferSelect;

export const tcgSeries = mysqlTable("tcg_series", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name_en: varchar("name_en", { length: 64 }).notNull(),
  name_es: varchar("name_es", { length: 64 }).notNull(),
  logo: varchar("logo", { length: 255 }),
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
  description_en: varchar("description_en", { length: 1024 }),
  description_es: varchar("description_es", { length: 1024 }),
  updated: varchar("updated", { length: 32 }),
});

export type TcgCard = typeof tcgCards.$inferSelect;
