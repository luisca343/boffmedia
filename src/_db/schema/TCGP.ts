import { datetime, int, mysqlTable, primaryKey, unique, varchar } from "drizzle-orm/mysql-core";
import { boffMediaUsers } from "./BoffMedia";
import { count } from "console";

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
    expansion: varchar("expansion", { length: 32 }).notNull().references(() => tcgpExpansions.id, {onDelete: "cascade", onUpdate: "cascade"}),
    number: int("number").notNull(),
    name: varchar("name", { length: 64 }).notNull(),
    rarity: varchar("rarity", { length: 32 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    hp: int("hp"),
    weakness: varchar("weakness", { length: 32 }),
    weakness_value: int("weakness_value"),
    retreat_cost: int("retreat_cost")
}, (table) => (
    {
        primaryKey: primaryKey({ columns: [table.expansion, table.number] })
    }
));

export type TcgpCard = typeof tcgpCards.$inferSelect;

export const tcgpCardsPacks = mysqlTable("tcgp_cards_packs", {
    expansion: varchar("expansion", { length: 32 }).notNull().references(() => tcgpCards.expansion, {onDelete: "cascade", onUpdate: "cascade"}),
    card_number: int("card_number").notNull(),
    pack_id: varchar("pack_id", { length: 32 }).notNull().references(() => tcgpBoosterPacks.name, {onDelete: "cascade", onUpdate: "cascade"}),
}, (table) => (
    {
        primaryKey: primaryKey({ columns: [table.expansion, table.card_number, table.pack_id] }),
        foreignKeys: [
            {
                columns: [table.expansion, table.card_number],
                references: [tcgpCards.expansion, tcgpCards.number],
                onDelete: "cascade",
                onUpdate: "cascade"
            }
        ]
    }
));

export type TcgpCardPack = typeof tcgpCardsPacks.$inferSelect;

export const tcgpUsersCards = mysqlTable("tcgp_users_cards", {
    user_id: int("user_id").notNull().references(() => boffMediaUsers.id, {onDelete: "cascade", onUpdate: "cascade"}),
    expansion: varchar("expansion", { length: 32 }).notNull().references(() => tcgpCards.expansion, {onDelete: "cascade", onUpdate: "cascade"}),
    card_number: int("card_number").notNull(),
    count: int("count").notNull(),
    obtained_at: datetime("obtained_at").notNull()
}, (table) => (
    {
        primaryKey: primaryKey({ columns: [table.user_id, table.expansion, table.card_number] }),
        foreignKeys: [
            {
                columns: [table.expansion, table.card_number],
                references: [tcgpCardsPacks.expansion, tcgpCardsPacks.card_number],
                onDelete: "cascade",
                onUpdate: "cascade"
            }
        ]
    }
));

export type TcgpUserCard = typeof tcgpUsersCards.$inferSelect;