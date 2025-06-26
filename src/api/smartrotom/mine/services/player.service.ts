import { Injectable } from '@nestjs/common';
import { MineRepository, HistoryEntry, RankingEntry, UnclaimedItem } from '@api/smartrotom/mine/repositories/mine.repository';

export interface PlayerHistory {
  [gameId: number]: HistoryEntry[];
}

export interface ClaimResponse {
  claimedIds: number[];
  totalClaimed: number;
  success: boolean;
}

export interface PlayerStatistics {
  totalGames: number;
  totalValue: number;
  averageValue: number;
  lastPlayed: Date | null;
  ranking: { rank: number; totalValue: number } | null;
}

@Injectable()
export class PlayerService {
  constructor(
    private readonly mineRepository: MineRepository,
  ) {}

  async getPlayerHistory(uuid: string): Promise<PlayerHistory> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    const historyEntries = await this.mineRepository.findPlayerHistory(uuid);
    
    // Group by game ID
    const groupedHistory = historyEntries.reduce((acc, entry) => {
      if (!acc[entry.id]) {
        acc[entry.id] = [];
      }
      
      if (entry.itemId) {
        acc[entry.id].push(entry);
      } else {
        // No rewards for this game
        acc[entry.id].push({
          id: entry.id,
          itemId: "nada:nada",
          itemName: "Nada",
          claimed: 0,
          value: 0,
          date: entry.date
        });
      }
      
      return acc;
    }, {} as PlayerHistory);

    return groupedHistory;
  }

  async getPlayerRanking(): Promise<RankingEntry[]> {
    return this.mineRepository.findTopPlayers(50);
  }

  async getPlayerRank(uuid: string): Promise<{ rank: number; totalValue: number } | null> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    return this.mineRepository.findPlayerRanking(uuid);
  }

  async getUnclaimedRewards(uuid: string): Promise<UnclaimedItem[]> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    const unclaimedItems = await this.mineRepository.findUnclaimedItems(uuid);
    
    // Group by item ID and count amounts
    const groupedItems = unclaimedItems.reduce((acc, item) => {
      if (!acc[item.itemId]) {
        acc[item.itemId] = {
          itemId: item.itemId,
          type: item.type,
          amount: 0
        };
      }
      acc[item.itemId].amount += 1;
      return acc;
    }, {} as { [key: string]: UnclaimedItem });

    return Object.values(groupedItems);
  }

  async claimRewards(uuid: string): Promise<ClaimResponse> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    const unclaimedItems = await this.mineRepository.findUnclaimedItems(uuid);
    const claimedIds = unclaimedItems.map(item => item.id);

    if (claimedIds.length > 0) {
      await this.mineRepository.claimInventoryItems(claimedIds);
    }

    return {
      claimedIds,
      totalClaimed: claimedIds.length,
      success: true
    };
  }

  async getPlayerStatistics(uuid: string): Promise<PlayerStatistics> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    const [stats, ranking] = await Promise.all([
      this.mineRepository.getPlayerStats(uuid),
      this.mineRepository.findPlayerRanking(uuid)
    ]);

    return {
      ...stats,
      ranking
    };
  }

  async validatePlayerExists(uuid: string): Promise<boolean> {
    try {
      const energy = await this.mineRepository.findPlayerEnergy(uuid);
      return energy !== null;
    } catch {
      return false;
    }
  }
}