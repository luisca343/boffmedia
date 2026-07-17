import { GameSession } from '../../entities/game-session.entity';
import { MineReward } from '../../entities/mine-reward.entity';

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
  id: number;
  itemId: string;
  type: string;
  amount?: number;
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

export interface PlayerStatistics {
  totalGames: number;
  totalValue: number;
  averageValue: number;
  lastPlayed: Date | null;
}

export interface IMineRepository {
  // Energy operations
  findPlayerEnergy(uuid: string): Promise<{ energy: number } | null>;
  findPlayerLastCharge(uuid: string): Promise<Date | null>;
  updatePlayerEnergy(
    uuid: string,
    energy: number,
    lastCharge?: Date,
  ): Promise<void>;

  // Game session operations
  createGameSession(uuid: string): Promise<{ insertId: number }>;
  findLatestGameSession(uuid: string): Promise<GameSession | null>;
  findGameSession(gameId: number): Promise<GameSession | null>;

  // Reward operations
  findAllRewards(): Promise<MineReward[]>;
  findRewardsByIds(ids: number[]): Promise<MineReward[]>;
  findMaxRewardValue(): Promise<number>;
  createGameRewards(
    gameId: number,
    rewards: { rewardId: number; value: number }[],
  ): Promise<void>;

  // History operations
  findPlayerHistory(uuid: string): Promise<HistoryEntry[]>;

  // Ranking operations
  findTopPlayers(limit?: number): Promise<RankingEntry[]>;
  findPlayerRanking(
    uuid: string,
  ): Promise<{ rank: number; totalValue: number } | null>;

  // Inventory operations
  createInventoryEntries(entries: InventoryEntry[]): Promise<void>;
  findUnclaimedItems(uuid: string): Promise<UnclaimedItem[]>;
  /** Atomically claims this player's unclaimed 'mine' rows and returns only the
   *  rows this caller actually won — an empty array means another claim took them. */
  claimUnclaimedFor(uuid: string): Promise<UnclaimedItem[]>;

  // Statistics operations
  getPlayerStats(uuid: string): Promise<PlayerStatistics>;
}
