import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IMineRepository } from '../repositories/interfaces/mine.repository.interface';

export interface GameStartResponse {
  idPartida: number; // Keep legacy naming for backward compatibility
  success?: boolean;
}

export interface GameEndRequest {
  gameId: number;
  rewards: { value: number; id: number }[];
}

export interface GameEndResponse {
  idPartida: number; // Keep legacy naming
  success?: boolean;
  rewardsProcessed?: number;
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Injectable()
export class GameService {
  constructor(
    @Inject(MINE_REPOSITORY_TOKEN)
    private readonly mineRepository: IMineRepository,
  ) {}

  async startGame(uuid: string): Promise<GameStartResponse> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    // Create new game session
    const result = await this.mineRepository.createGameSession(uuid);

    return {
      idPartida: result.insertId,
    };
  }

  async endGame(
    uuid: string,
    rewards: { value: number; id: number }[],
  ): Promise<GameEndResponse> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    if (!Array.isArray(rewards)) {
      throw new BadRequestException('Rewards must be an array');
    }

    // Get the latest game session for this player
    const gameSession = await this.mineRepository.findLatestGameSession(uuid);
    if (!gameSession) {
      throw new NotFoundException('No active game session found');
    }

    // Validate rewards exist
    const rewardIds = rewards.map((r) => r.id);
    const validRewards = await this.mineRepository.findRewardsByIds(rewardIds);

    if (validRewards.length !== rewardIds.length) {
      throw new BadRequestException('Some rewards do not exist');
    }

    // Create game rewards
    await this.mineRepository.createGameRewards(
      gameSession.id,
      rewards.map((reward) => ({
        rewardId: reward.id,
        value: reward.value,
      })),
    );

    // Create inventory entries
    const inventoryEntries = rewards.map((reward) => {
      const rewardData = validRewards.find((r) => r.id === reward.id);
      return {
        uuid,
        itemId: rewardData!.itemId,
        itemType: rewardData!.type,
        name: rewardData!.name,
        amount: 1,
        sourceType: 'mine',
        sourceId: gameSession.id,
        used: 0,
        rarity: this.calculateRarityFromWeight(reward.value),
      };
    });

    await this.mineRepository.createInventoryEntries(inventoryEntries);

    return {
      idPartida: gameSession.id,
      success: true,
      rewardsProcessed: rewards.length,
    };
  }

  async validateGameSession(gameId: number, uuid: string): Promise<boolean> {
    const gameSession = await this.mineRepository.findGameSession(gameId);
    return gameSession?.uuid === uuid;
  }

  private calculateRarityFromWeight(weight: number): string {
    if (weight >= 1000) return ItemRarity.LEGENDARY;
    if (weight >= 500) return ItemRarity.EPIC;
    if (weight >= 200) return ItemRarity.RARE;
    if (weight >= 50) return ItemRarity.UNCOMMON;
    return ItemRarity.COMMON;
  }
}
