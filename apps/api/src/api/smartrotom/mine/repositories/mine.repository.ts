import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, inArray, max, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  mineGames,
  mineGamesDetail,
  mineRewards,
  PartidaMina,
  DetallePartidaMina,
} from '@/_db/schema/SmartRotomMine';
import {
  smartrotomUsers,
  smartRotomInventory,
  SmartRotomUser,
  SmartRotomInventoryItem,
} from '@/_db/schema/SmartRotom';
import { ResultSetHeader } from 'mysql2';

export interface PlayerEnergy {
  energy: number;
  maxEnergy: number;
  lastCharge: Date;
}

export interface GameSession {
  id: number;
  uuid: string;
  createdAt: Date;
}

export interface MineRewardItem {
  id: number;
  name: string;
  type: string;
  itemId: string;
  value: number;
  width: number;
  height: number;
}

export interface HistoryEntry {
  id: number;
  itemId: string;
  itemName: string;
  claimed: number;
  value: number;
  date: Date;
}

export interface RankingEntry {
  uuid: string;
  username: string;
  totalValue: number;
  gamesPlayed: number;
  rank: number;
}

export interface UnclaimedItem {
  itemId: string;
  type: string;
  amount: number;
}

export interface InventoryEntry {
  uuid: string;
  itemId: string;
  itemType: string;
  name: string;
  amount: number;
  sourceType: string;
  sourceId: number;
  used: number;
  rarity: string;
}

@Injectable()
export class MineRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== ENERGY OPERATIONS ====================

  async findPlayerEnergy(uuid: string): Promise<{ energy: number } | null> {
    const result = await this.db
      .select({ energy: smartrotomUsers.energy })
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid))
      .limit(1);

    return result[0] || null;
  }

  async findPlayerLastCharge(uuid: string): Promise<Date | null> {
    const result = await this.db
      .select({ lastCharge: smartrotomUsers.lastCharge })
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid))
      .limit(1);

    return result[0]?.lastCharge || null;
  }

  async updatePlayerEnergy(
    uuid: string,
    energy: number,
    lastCharge?: Date,
  ): Promise<void> {
    const updateData: Partial<SmartRotomUser> = { energy };
    if (lastCharge) {
      updateData.lastCharge = lastCharge;
    }

    await this.db
      .update(smartrotomUsers)
      .set(updateData as SmartRotomUser)
      .where(eq(smartrotomUsers.uuid, uuid));
  }

  // ==================== GAME SESSION OPERATIONS ====================

  async createGameSession(uuid: string): Promise<{ insertId: number }> {
    const result = (await this.db
      .insert(mineGames)
      .values({ uuid } as PartidaMina)) as ResultSetHeader[];

    return { insertId: result[0].insertId };
  }

  async findLatestGameSession(uuid: string): Promise<GameSession | null> {
    const result = await this.db
      .select({
        id: mineGames.id,
        uuid: mineGames.uuid,
        createdAt: mineGames.createdAt,
      })
      .from(mineGames)
      .where(eq(mineGames.uuid, uuid))
      .orderBy(desc(mineGames.id))
      .limit(1);

    return result[0] || null;
  }

  async findGameSession(gameId: number): Promise<GameSession | null> {
    const result = await this.db
      .select({
        id: mineGames.id,
        uuid: mineGames.uuid,
        createdAt: mineGames.createdAt,
      })
      .from(mineGames)
      .where(eq(mineGames.id, gameId))
      .limit(1);

    return result[0] || null;
  }

  // ==================== REWARD OPERATIONS ====================

  async findAllRewards(): Promise<MineRewardItem[]> {
    return this.db
      .select({
        id: mineRewards.id,
        name: mineRewards.name,
        type: mineRewards.type,
        itemId: mineRewards.itemId,
        value: mineRewards.value,
        width: mineRewards.width,
        height: mineRewards.height,
      })
      .from(mineRewards);
  }

  async findRewardsByIds(ids: number[]): Promise<MineRewardItem[]> {
    return this.db
      .select({
        id: mineRewards.id,
        name: mineRewards.name,
        type: mineRewards.type,
        itemId: mineRewards.itemId,
        value: mineRewards.value,
        width: mineRewards.width,
        height: mineRewards.height,
      })
      .from(mineRewards)
      .where(inArray(mineRewards.id, ids));
  }

  async findMaxRewardValue(): Promise<number> {
    const result = await this.db
      .select({ maxValue: max(mineRewards.value) })
      .from(mineRewards);

    return result[0]?.maxValue || 0;
  }

  async createGameRewards(
    gameId: number,
    rewards: { rewardId: number; value: number; claimed?: number }[],
  ): Promise<void> {
    if (rewards.length === 0) return;

    await this.db.insert(mineGamesDetail).values(
      rewards.map(
        (reward) =>
          ({
            gameId,
            rewardId: reward.rewardId,
            value: reward.value,
          }) as DetallePartidaMina,
      ),
    );
  }

  // ==================== HISTORY OPERATIONS ====================

  async findPlayerHistory(uuid: string): Promise<HistoryEntry[]> {
    return this.db
      .select({
        id: mineGames.id,
        itemId: mineRewards.itemId,
        itemName: mineRewards.name,
        value: mineGamesDetail.value,
        claimed: sql<number>`0`.as('claimed'), // Since claimed field doesn't exist in schema
        date: mineGames.createdAt,
      })
      .from(mineGames)
      .leftJoin(mineGamesDetail, eq(mineGames.id, mineGamesDetail.gameId))
      .leftJoin(mineRewards, eq(mineRewards.id, mineGamesDetail.rewardId))
      .where(eq(mineGames.uuid, uuid))
      .orderBy(desc(mineGames.createdAt));
  }

  // ==================== RANKING OPERATIONS ====================

  async findTopPlayers(limit: number = 10): Promise<RankingEntry[]> {
    const result = await this.db
      .select({
        uuid: smartrotomUsers.uuid,
        username: smartrotomUsers.username,
        totalValue: sql<number>`COALESCE(SUM(${mineGamesDetail.value}), 0)`.as(
          'totalValue',
        ),
        gamesPlayed: sql<number>`COUNT(DISTINCT ${mineGames.id})`.as(
          'gamesPlayed',
        ),
      })
      .from(smartrotomUsers)
      .leftJoin(mineGames, eq(smartrotomUsers.uuid, mineGames.uuid))
      .leftJoin(mineGamesDetail, eq(mineGamesDetail.gameId, mineGames.id))
      .where(sql`${smartrotomUsers.username} IS NOT NULL`)
      .groupBy(smartrotomUsers.uuid, smartrotomUsers.username)
      .orderBy(desc(sql`COALESCE(SUM(${mineGamesDetail.value}), 0)`))
      .limit(limit);

    return result.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      totalValue: Number(entry.totalValue) || 0,
      gamesPlayed: Number(entry.gamesPlayed) || 0,
    }));
  }

  async findPlayerRanking(
    uuid: string,
  ): Promise<{ rank: number; totalValue: number } | null> {
    const allPlayers = await this.findTopPlayers(1000);
    const playerRanking = allPlayers.find((player) => player.uuid === uuid);

    if (!playerRanking) {
      return null;
    }

    return {
      rank: playerRanking.rank,
      totalValue: playerRanking.totalValue,
    };
  }

  // ==================== INVENTORY OPERATIONS ====================

  async createInventoryEntries(entries: InventoryEntry[]): Promise<void> {
    if (entries.length === 0) return;

    await this.db.insert(smartRotomInventory).values(
      entries.map(
        (entry) =>
          ({
            uuid: entry.uuid,
            itemId: entry.itemId,
            itemType: entry.itemType,
            amount: entry.amount,
            sourceType: entry.sourceType,
            used: entry.used,
            rarity: entry.rarity,
            createdAt: new Date(),
          }) as SmartRotomInventoryItem,
      ),
    );
  }

  async findUnclaimedItems(
    uuid: string,
  ): Promise<{ id: number; itemId: string; type: string }[]> {
    return this.db
      .select({
        id: smartRotomInventory.id,
        itemId: smartRotomInventory.itemId,
        type: smartRotomInventory.itemType,
      })
      .from(smartRotomInventory)
      .where(
        and(
          eq(smartRotomInventory.uuid, uuid),
          eq(smartRotomInventory.used, 0),
          eq(smartRotomInventory.sourceType, 'mine'),
        ),
      );
  }

  async claimInventoryItems(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    await this.db
      .update(smartRotomInventory)
      .set({ used: 1 } as SmartRotomInventoryItem)
      .where(inArray(smartRotomInventory.id, ids));
  }

  // ==================== STATISTICS OPERATIONS ====================

  async getPlayerStats(uuid: string): Promise<{
    totalGames: number;
    totalValue: number;
    averageValue: number;
    lastPlayed: Date | null;
  }> {
    const result = await this.db
      .select({
        totalGames: sql<number>`COUNT(DISTINCT ${mineGames.id})`.as(
          'totalGames',
        ),
        totalValue: sql<number>`COALESCE(SUM(${mineGamesDetail.value}), 0)`.as(
          'totalValue',
        ),
        lastPlayed: sql<Date>`MAX(${mineGames.createdAt})`.as('lastPlayed'),
      })
      .from(mineGames)
      .leftJoin(mineGamesDetail, eq(mineGamesDetail.gameId, mineGames.id))
      .where(eq(mineGames.uuid, uuid));

    const stats = result[0];
    const totalGames = Number(stats.totalGames) || 0;
    const totalValue = Number(stats.totalValue) || 0;

    return {
      totalGames,
      totalValue,
      averageValue: totalGames > 0 ? totalValue / totalGames : 0,
      lastPlayed: stats.lastPlayed,
    };
  }
}
