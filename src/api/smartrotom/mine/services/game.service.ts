import { Injectable } from '@nestjs/common';
import { MineRepository, MineRewardItem, GameSession } from '@repositories/smartrotom/mine.repository';

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
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary"
}

@Injectable()
export class GameService {
  constructor(
    private readonly mineRepository: MineRepository,
  ) {}

  async startGame(uuid: string): Promise<GameStartResponse> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    // Create new game session
    const result = await this.mineRepository.createGameSession(uuid);

    return {
      idPartida: result.insertId
    };
  }

  async endGame(uuid: string, rewards: { value: number; id: number }[]): Promise<GameEndResponse> {
    if (!uuid) {
      throw new Error('Player UUID is required');
    }

    if (!Array.isArray(rewards)) {
      throw new Error('Rewards must be an array');
    }

    // Get the latest game session for this player
    const gameSession = await this.mineRepository.findLatestGameSession(uuid);
    if (!gameSession) {
      throw new Error('No active game session found');
    }

    // Validate rewards exist
    if (rewards.length > 0) {
      const rewardIds = rewards.map(r => r.id);
      const rewardDetails = await this.mineRepository.findRewardsByIds(rewardIds);
      
      if (rewardDetails.length !== rewardIds.length) {
        throw new Error('Some rewards not found');
      }
    }

    // Get max reward value for weight calculation
    const maxRewardValue = await this.mineRepository.findMaxRewardValue();

    // Process rewards and create game details
    const gameRewards = rewards.map(reward => ({
      rewardId: reward.id,
      value: maxRewardValue / reward.value
    }));

    await this.mineRepository.createGameRewards(gameSession.id, gameRewards);

    // Add rewards to inventory
    if (rewards.length > 0) {
      const rewardDetails = await this.mineRepository.findRewardsByIds(rewards.map(r => r.id));
      
      const inventoryEntries = rewardDetails.map(reward => ({
        uuid,
        itemId: reward.itemId,
        itemType: reward.type,
        name: reward.name,
        amount: 1,
        sourceType: 'mine',
        sourceId: gameSession.id,
        used: 0,
        rarity: this.calculateRarityFromWeight(reward.value)
      }));

      await this.mineRepository.createInventoryEntries(inventoryEntries);
    }

    return {
      idPartida: gameSession.id
    };
  }

  async validateGameSession(gameId: number, uuid: string): Promise<boolean> {
    const gameSession = await this.mineRepository.findGameSession(gameId);
    return gameSession !== null && gameSession.uuid === uuid;
  }

  private calculateRarityFromWeight(weight: number): string {
    if (weight <= 10) return ItemRarity.LEGENDARY;
    if (weight <= 200) return ItemRarity.EPIC;
    if (weight <= 1500) return ItemRarity.RARE;
    if (weight <= 5000) return ItemRarity.UNCOMMON;
    
    return ItemRarity.COMMON;
  }
}