import { sql } from "drizzle-orm";
import { datetime, int, mysqlTable, unique, varchar } from "drizzle-orm/mysql-core";

export const tcgpExpansions = mysqlTable("tcgp_expansions", {
    id: varchar("id", { length: 32 }).notNull().primaryKey().unique(),
    name: varchar("name", { length: 32 }).notNull().unique(),
    logo_url: varchar("logo_url", { length: 255 }).notNull(),
    icon_url: varchar("icon_url", { length: 255 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    release_date: datetime("release_date"),
}); 

export type TcgpExpansion = typeof tcgpExpansions.$inferSelect;

export const tcgpBoosterPacks = mysqlTable("tcgp_booster_packs", {
    name: varchar("name", { length: 32 }).notNull().primaryKey().unique(),
    expansion: varchar("expansion", { length: 32 }).notNull().references(() => tcgpExpansions.id, {onDelete: "cascade", onUpdate: "cascade"}),
});

export type TcgpBoosterPack = typeof tcgpBoosterPacks.$inferSelect;

export const tcgpCards = mysqlTable("tcgp_cards", {
    id: int("id").primaryKey().autoincrement(),
    expansion: varchar("expansion", { length: 32 }).notNull().references(() => tcgpExpansions.id, {onDelete: "cascade", onUpdate: "cascade"}),
    name: varchar("name", { length: 64 }).notNull(),
    number: int("number").notNull(),
    rarity: varchar("rarity", { length: 32 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    hp: int("hp"),
    weakness: varchar("weakness", { length: 32 }),
    weakness_value: int("weakness_value"),
    retreat_cost: int("retreat_cost")
}, (table) => (
    {
        unique: unique().on(table.expansion, table.number)
    }
));

export type TcgpCard = typeof tcgpCards.$inferSelect;

export const tcgpCardsPacks = mysqlTable("tcgp_cards_packs", {
    card_id: int("card_id").notNull().references(() => tcgpCards.id, {onDelete: "cascade", onUpdate: "cascade"}),
    pack_id: varchar("pack_id", { length: 32 }).notNull().references(() => tcgpBoosterPacks.name, {onDelete: "cascade", onUpdate: "cascade"}),
});

export type TcgpCardPack = typeof tcgpCardsPacks.$inferSelect;