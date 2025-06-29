import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IMineRepository, PlayerStatistics, RankingEntry, UnclaimedItem } from '../repositories/interfaces/mine.repository.interface';
import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

export interface PlayerHistory {
  [gameId: number]: HistoryEntry[];
}

export interface ClaimResponse {
  claimedIds: number[];
  totalClaimed: number;
  success: boolean;
}

export interface PlayerStatisticsResponse extends PlayerStatistics {
  ranking: { rank: number; totalValue: number } | null;
}

@Injectable()
export class PlayerService {
  constructor(
    @Inject(MINE_REPOSITORY_TOKEN)
    private readonly mineRepository: IMineRepository,
  ) {}

  async getPlayerHistory(uuid: string): Promise<PlayerHistory> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    const historyEntries = await this.mineRepository.findPlayerHistory(uuid);
    
    // Group by game ID
    const groupedHistory = historyEntries.reduce((acc, entry) => {
      if (!acc[entry.id]) {
        acc[entry.id] = [];
      }
      acc[entry.id].push(entry);
      return acc;
    }, {} as PlayerHistory);

    return groupedHistory;
  }

  async getPlayerRanking(): Promise<RankingEntry[]> {
    return this.mineRepository.findTopPlayers(50);
  }

  async getPlayerRank(uuid: string): Promise<{ rank: number; totalValue: number } | null> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    return this.mineRepository.findPlayerRanking(uuid);
  }

  async getUnclaimedRewards(uuid: string): Promise<UnclaimedItem[]> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    return this.mineRepository.findUnclaimedItems(uuid);
  }

  async claimRewards(uuid: string): Promise<ClaimResponse> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    const unclaimedItems = await this.mineRepository.findUnclaimedItems(uuid);
    
    if (unclaimedItems.length === 0) {
      return {
        claimedIds: [],
        totalClaimed: 0,
        success: true
      };
    }

    const itemIds = unclaimedItems.map(item => item.id);
    await this.mineRepository.claimInventoryItems(itemIds);

    return {
      claimedIds: itemIds,
      totalClaimed: unclaimedItems.length,
      success: true
    };
  }

  async getPlayerStatistics(uuid: string): Promise<PlayerStatisticsResponse> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
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
    const energy = await this.mineRepository.findPlayerEnergy(uuid);
    return energy !== null;
  }
}