import { Injectable } from '@nestjs/common';
import { EnergyService, EnergyStatus } from './services/energy.service';
import { GameService, GameStartResponse, GameEndResponse } from './services/game.service';
import { RewardService, RewardsByType } from './services/reward.service';
import { PlayerService, PlayerHistory, ClaimResponse } from './services/player.service';
import { MineRewardItem, RankingEntry } from '@api/smartrotom/mine/repositories/mine.repository';
import { PlayerStatistics, UnclaimedItem } from './repositories/interfaces/mine.repository.interface';

export interface PlayGameRequest {
  uuid: string;
}

export interface EndGameRequest {
  uuid: string;
  rewards: { value: number; id: number }[];
}

export interface ClaimRequest {
  uuid: string;
}

@Injectable()
export class MineFacadeService {
  constructor(
    private readonly energyService: EnergyService,
    private readonly gameService: GameService,
    private readonly rewardService: RewardService,
    private readonly playerService: PlayerService,
  ) {}

  // ==================== ENERGY MANAGEMENT ====================

  async getPlayerEnergy(uuid: string): Promise<EnergyStatus> {
    try {
      return await this.energyService.getPlayerEnergy(uuid);
    } catch (error) {
      console.error(`Error getting energy for player ${uuid}:`, error);
      throw new Error(`Failed to retrieve energy: ${error.message}`);
    }
  }

  // ==================== GAME MANAGEMENT ====================

  async playGame(request: PlayGameRequest): Promise<GameStartResponse | { error: string }> {
    try {
      const { uuid } = request;

      // Check if player has enough energy
      const hasEnergy = await this.energyService.validateEnergyForPlay(uuid);
      if (!hasEnergy) {
        return { error: "No tienes suficiente energía para jugar." };
      }

      // Consume energy
      await this.energyService.consumeEnergy(uuid, 1);

      // Start game
      return await this.gameService.startGame(uuid);
    } catch (error) {
      console.error(`Error starting game for player ${request.uuid}:`, error);
      throw new Error(`Failed to start game: ${error.message}`);
    }
  }

  async endGame(request: EndGameRequest): Promise<GameEndResponse> {
    try {
      const { uuid, rewards } = request;

      // Validate rewards exist
      const rewardIds = rewards.map(r => r.id);
      const rewardsExist = await this.rewardService.validateRewardsExist(rewardIds);
      if (!rewardsExist) {
        throw new Error('Some rewards do not exist');
      }

      return await this.gameService.endGame(uuid, rewards);
    } catch (error) {
      console.error(`Error ending game for player ${request.uuid}:`, error);
      throw new Error(`Failed to end game: ${error.message}`);
    }
  }

  // ==================== REWARD MANAGEMENT ====================

  async getAllRewards(): Promise<MineRewardItem[]> {
    try {
      return await this.rewardService.getAllRewards();
    } catch (error) {
      console.error('Error getting all rewards:', error);
      throw new Error(`Failed to retrieve rewards: ${error.message}`);
    }
  }

  async getRewardsByType(): Promise<RewardsByType> {
    try {
      return await this.rewardService.getRewardsByType();
    } catch (error) {
      console.error('Error getting rewards by type:', error);
      throw new Error(`Failed to retrieve rewards by type: ${error.message}`);
    }
  }

  async getRewardDropRates(): Promise<{ [rewardId: number]: { name: string; dropRate: number } }> {
    try {
      return await this.rewardService.getRewardDropRates();
    } catch (error) {
      console.error('Error getting reward drop rates:', error);
      throw new Error(`Failed to retrieve drop rates: ${error.message}`);
    }
  }

  // ==================== PLAYER MANAGEMENT ====================

  async getPlayerHistory(uuid: string): Promise<PlayerHistory> {
    try {
      return await this.playerService.getPlayerHistory(uuid);
    } catch (error) {
      console.error(`Error getting history for player ${uuid}:`, error);
      throw new Error(`Failed to retrieve player history: ${error.message}`);
    }
  }

  async getPlayerRanking(): Promise<RankingEntry[]> {
    try {
      return await this.playerService.getPlayerRanking();
    } catch (error) {
      console.error('Error getting player ranking:', error);
      throw new Error(`Failed to retrieve ranking: ${error.message}`);
    }
  }

  async getPlayerRank(uuid: string): Promise<{ rank: number; totalValue: number } | null> {
    try {
      return await this.playerService.getPlayerRank(uuid);
    } catch (error) {
      console.error(`Error getting rank for player ${uuid}:`, error);
      throw new Error(`Failed to retrieve player rank: ${error.message}`);
    }
  }

  async getUnclaimedRewards(uuid: string): Promise<UnclaimedItem[]> {
    try {
      return await this.playerService.getUnclaimedRewards(uuid);
    } catch (error) {
      console.error(`Error getting unclaimed rewards for player ${uuid}:`, error);
      throw new Error(`Failed to retrieve unclaimed rewards: ${error.message}`);
    }
  }

  async claimRewards(request: ClaimRequest): Promise<ClaimResponse> {
    try {
      return await this.playerService.claimRewards(request.uuid);
    } catch (error) {
      console.error(`Error claiming rewards for player ${request.uuid}:`, error);
      throw new Error(`Failed to claim rewards: ${error.message}`);
    }
  }

  async getPlayerStatistics(uuid: string): Promise<PlayerStatistics> {
    try {
      return await this.playerService.getPlayerStatistics(uuid);
    } catch (error) {
      console.error(`Error getting statistics for player ${uuid}:`, error);
      throw new Error(`Failed to retrieve player statistics: ${error.message}`);
    }
  }

  // ==================== VALIDATION METHODS ====================

  async validatePlayerExists(uuid: string): Promise<boolean> {
    try {
      return await this.playerService.validatePlayerExists(uuid);
    } catch (error) {
      console.error(`Error validating player ${uuid}:`, error);
      return false;
    }
  }

  async validateRewardsExist(rewardIds: number[]): Promise<boolean> {
    try {
      return await this.rewardService.validateRewardsExist(rewardIds);
    } catch (error) {
      console.error('Error validating rewards:', error);
      return false;
    }
  }
}