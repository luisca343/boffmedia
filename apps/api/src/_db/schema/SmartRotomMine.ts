import {
  char,
  int,
  mysqlTable,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core';
import { rotomUsers } from './SmartRotom';

export const mineGames = mysqlTable('rotom_mine_games', {
  id: int('id').primaryKey().autoincrement(),
  uuid: char('uuid', { length: 36 })
    .notNull()
    .references(() => rotomUsers.uuid, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type MineGame = typeof mineGames.$inferSelect;

export const mineRewards = mysqlTable('rotom_mine_rewards', {
  id: int('id').primaryKey().autoincrement(),
  value: int('value').notNull(),
  name: varchar('name', { length: 32 }).notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  itemId: varchar('item_id', { length: 32 }).notNull(),
  width: int('width').notNull(),
  height: int('height').notNull(),
});

export type MineReward = typeof mineRewards.$inferSelect;

export const mineGameRewards = mysqlTable('rotom_mine_game_rewards', {
  id: int('id').primaryKey().autoincrement(),
  gameId: int('game_id')
    .notNull()
    .references(() => mineGames.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  rewardId: int('reward_id')
    .notNull()
    .references(() => mineRewards.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  value: int('value').notNull(),
});

export type MineGameReward = typeof mineGameRewards.$inferSelect;
