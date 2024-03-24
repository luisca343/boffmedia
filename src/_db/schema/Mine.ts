import { sql } from "drizzle-orm";
import { char, datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const mineGames = mysqlTable("mine_games", {
    id: int("id").primaryKey().autoincrement().primaryKey(),
    uuid: char("uuid", { length: 36 }).notNull(),
    createdAt: datetime("created_at").default(sql`CURRENT_TIMESTAMP()`),
});

export type PartidaMina = typeof mineGames.$inferSelect;

export const mineRewards = mysqlTable("mine_rewards", {
    id: int("id").primaryKey().autoincrement().primaryKey(),
    value: int("value").notNull(),
    name: varchar("name", { length: 32 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    itemId: varchar("item_id", { length: 32 }).notNull(),
    width: int("width").notNull(),
    height: int("height").notNull(),
});

export type RecompensaMina = typeof mineRewards.$inferSelect;

export const mineGamesDetail = mysqlTable("mine_games_detail", {
    id: int("id").primaryKey().autoincrement().primaryKey(),
    gameId: int("game_id").notNull(),
    rewardId: int("reward_id").notNull(),
    value: int("value").notNull(),
    claimed: int("claimed").notNull().default(0),
});

export type DetallePartidaMina = typeof mineGamesDetail.$inferSelect;