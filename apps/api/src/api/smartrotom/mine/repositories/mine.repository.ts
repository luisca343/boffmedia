import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, inArray, max, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  mineGames,
  mineGameRewards,
  mineRewards,
  MineGame,
  MineGameReward,
} from '@/_db/schema/SmartRotomMine';
import {
  rotomUsers,
  rotomInventory,
  RotomUser,
  RotomInventoryItem,
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
      .select({ energy: rotomUsers.energy })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid))
      .limit(1);

    return (result[0] || null) as unknown as { energy: number } | null;
  }

  async findPlayerLastCharge(uuid: string): Promise<Date | null> {
    const result = await this.db
      .select({ lastCharge: rotomUsers.lastCharge })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid))
      .limit(1);

    return result[0]?.lastCharge || null;
  }

  async updatePlayerEnergy(
    uuid: string,
    energy: number,
    lastCharge?: Date,
  ): Promise<void> {
    const updateData: Partial<RotomUser> = { energy };
    if (lastCharge) {
      updateData.lastCharge = lastCharge;
    }

    await this.db
      .update(rotomUsers)
      .set(updateData as RotomUser)
      .where(eq(rotomUsers.uuid, uuid));
  }

  // ==================== GAME SESSION OPERATIONS ====================

  async createGameSession(uuid: string): Promise<{ insertId: number }> {
    const result = (await this.db
      .insert(mineGames)
      .values({ uuid } as MineGame)) as ResultSetHeader[];

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

    return (result[0] || null) as unknown as GameSession | null;
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

    return (result[0] || null) as unknown as GameSession | null;
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

    await this.db.insert(mineGameRewards).values(
      rewards.map(
        (reward) =>
          ({
            gameId,
            rewardId: reward.rewardId,
            value: reward.value,
          }) as MineGameReward,
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
        value: mineGameRewards.value,
        claimed: sql<number>`0`.as('claimed'), // Since claimed field doesn't exist in schema
        date: mineGames.createdAt,
      })
      .from(mineGames)
      .leftJoin(mineGameRewards, eq(mineGames.id, mineGameRewards.gameId))
      .leftJoin(mineRewards, eq(mineRewards.id, mineGameRewards.rewardId))
      .where(eq(mineGames.uuid, uuid))
      .orderBy(desc(mineGames.createdAt)) as unknown as HistoryEntry[];
  }

  // ==================== RANKING OPERATIONS ====================

  async findTopPlayers(limit: number = 10): Promise<RankingEntry[]> {
    const result = await this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
        totalValue: sql<number>`COALESCE(SUM(${mineGameRewards.value}), 0)`.as(
          'totalValue',
        ),
        gamesPlayed: sql<number>`COUNT(DISTINCT ${mineGames.id})`.as(
          'gamesPlayed',
        ),
      })
      .from(rotomUsers)
      .leftJoin(mineGames, eq(rotomUsers.uuid, mineGames.uuid))
      .leftJoin(mineGameRewards, eq(mineGameRewards.gameId, mineGames.id))
      .where(sql`${rotomUsers.username} IS NOT NULL`)
      .groupBy(rotomUsers.uuid, rotomUsers.username)
      .orderBy(desc(sql`COALESCE(SUM(${mineGameRewards.value}), 0)`))
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

    await this.db.insert(rotomInventory).values(
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
          }) as RotomInventoryItem,
      ),
    );
  }

  async findUnclaimedItems(
    uuid: string,
  ): Promise<{ id: number; itemId: string; type: string }[]> {
    return this.db
      .select({
        id: rotomInventory.id,
        itemId: rotomInventory.itemId,
        type: rotomInventory.itemType,
      })
      .from(rotomInventory)
      .where(
        and(
          eq(rotomInventory.uuid, uuid),
          eq(rotomInventory.used, 0),
          eq(rotomInventory.sourceType, 'mine'),
        ),
      );
  }

  // Return shape matches IMineRepository's UnclaimedItem, not this file's
  // same-named local interface — that one predates `id` and is unused.
  async claimUnclaimedFor(
    uuid: string,
  ): Promise<{ id: number; itemId: string; type: string; amount?: number }[]> {
    return await this.db.transaction(async (tx) => {
      // FOR UPDATE holds the rows across the read and the write, so a concurrent
      // caller blocks here and then reads zero rows instead of granting the same
      // items again. Reading first is unavoidable: the caller needs the item list,
      // and MySQL's UPDATE cannot return the rows it touched.
      const rows = await tx
        .select({
          id: rotomInventory.id,
          itemId: rotomInventory.itemId,
          type: rotomInventory.itemType,
          // Selected so the caller grants a real quantity. `findUnclaimedItems`
          // omits it, which left the page sending cantidad 0 and relying on the
          // mod clamping it back up to 1.
          amount: rotomInventory.amount,
        })
        .from(rotomInventory)
        .where(
          and(
            eq(rotomInventory.uuid, uuid),
            eq(rotomInventory.used, 0),
            eq(rotomInventory.sourceType, 'mine'),
          ),
        )
        .for('update');

      if (rows.length === 0) return [];

      // `used` is read as a flag here (used = 0) but as a consumed counter by the
      // arcade (amount > used), and arcade's consumeItem does not filter by
      // sourceType — so it can see these rows. Writing `used = 1` on a row with
      // amount 5 would leave the arcade offering the other 4. Setting used to the
      // full amount is correct under both readings.
      await tx
        .update(rotomInventory)
        .set({
          used: sql`COALESCE(${rotomInventory.amount}, 1)`,
        } as unknown as RotomInventoryItem)
        .where(
          and(
            inArray(
              rotomInventory.id,
              rows.map((r) => r.id),
            ),
            eq(rotomInventory.used, 0),
          ),
        );

      return rows.map((r) => ({ ...r, amount: r.amount ?? undefined }));
    });
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
        totalValue: sql<number>`COALESCE(SUM(${mineGameRewards.value}), 0)`.as(
          'totalValue',
        ),
        lastPlayed: sql<Date>`MAX(${mineGames.createdAt})`.as('lastPlayed'),
      })
      .from(mineGames)
      .leftJoin(mineGameRewards, eq(mineGameRewards.gameId, mineGames.id))
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
