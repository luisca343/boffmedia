import { Injectable } from '@nestjs/common';
import { ReplayService } from './services/replay.service';
import { ConfigService } from './services/config.service';
import {
  BattleReplayResponse,
  CreateReplayRequest,
  UpdateReplayRequest,
  DeleteReplayResponse,
  ShareReplayResponse,
  BattleConfigResponse,
  CreateBattleConfigResponse,
  UpdateBattleConfigResponse,
  DeleteBattleConfigResponse,
  GetAllBattleConfigsResponse,
  ValidateBattleConfigResponse,
  BattleConfig,
  CreateReplayDto,
  UpdateReplayDto,
  ShareReplayDto
} from './types/battle.types';

@Injectable()
export class BattleFacadeService {
  constructor(
    private readonly replayService: ReplayService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== REPLAY MANAGEMENT ====================

  async getUserReplays(uuid: string): Promise<BattleReplayResponse[]> {
    try {
      return await this.replayService.getUserReplays(uuid);
    } catch (error) {
      console.error(`Error getting replays for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve replays: ${error.message}`);
    }
  }

  async getReplayById(replayId: number, uuid?: string): Promise<BattleReplayResponse> {
    try {
      const replay = await this.replayService.getReplayById(replayId);

      // If UUID is provided, validate access
      if (uuid) {
        const hasAccess = await this.replayService.validateReplayAccess(uuid, replayId);
        if (!hasAccess) {
          throw new Error('User does not have access to this replay');
        }
      }

      return replay;
    } catch (error) {
      console.error(`Error getting replay ${replayId}:`, error);
      throw new Error(`Failed to retrieve replay: ${error.message}`);
    }
  }

  async createReplay(createReplayDto: CreateReplayDto): Promise<BattleReplayResponse> {
    try {
      // Create the replay
      const replay = await this.replayService.createReplay({
        team1: createReplayDto.team1,
        team2: createReplayDto.team2,
        replay: createReplayDto.replay,
        winner: createReplayDto.winner,
        side1: createReplayDto.side1,
        side2: createReplayDto.side2,
      });

      // Associate with user
      await this.replayService.associateReplayWithUser(createReplayDto.userUuid, replay.id);

      return replay;
    } catch (error) {
      console.error('Error creating replay:', error);
      throw new Error(`Failed to create replay: ${error.message}`);
    }
  }

  async updateReplay(replayId: number, updateReplayDto: UpdateReplayDto, uuid?: string): Promise<BattleReplayResponse> {
    try {
      // If UUID is provided, validate access
      if (uuid) {
        const hasAccess = await this.replayService.validateReplayAccess(uuid, replayId);
        if (!hasAccess) {
          throw new Error('User does not have access to this replay');
        }
      }

      return await this.replayService.updateReplay(replayId, updateReplayDto);
    } catch (error) {
      console.error(`Error updating replay ${replayId}:`, error);
      throw new Error(`Failed to update replay: ${error.message}`);
    }
  }

  async deleteReplay(replayId: number, uuid?: string): Promise<DeleteReplayResponse> {
    try {
      // If UUID is provided, validate access
      if (uuid) {
        const hasAccess = await this.replayService.validateReplayAccess(uuid, replayId);
        if (!hasAccess) {
          throw new Error('User does not have access to this replay');
        }
      }

      await this.replayService.deleteReplay(replayId);

      return {
        success: true,
        message: 'Replay deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting replay ${replayId}:`, error);
      throw new Error(`Failed to delete replay: ${error.message}`);
    }
  }

  async shareReplayWithUser(replayId: number, targetUuid: string, sourceUuid?: string): Promise<ShareReplayResponse> {
    try {
      // If source UUID is provided, validate they have access to share
      if (sourceUuid) {
        const hasAccess = await this.replayService.validateReplayAccess(sourceUuid, replayId);
        if (!hasAccess) {
          throw new Error('Source user does not have access to this replay');
        }
      }

      await this.replayService.associateReplayWithUser(targetUuid, replayId);

      return {
        success: true,
        message: 'Replay shared successfully'
      };
    } catch (error) {
      console.error(`Error sharing replay ${replayId} with user ${targetUuid}:`, error);
      throw new Error(`Failed to share replay: ${error.message}`);
    }
  }

  // ==================== CONFIG MANAGEMENT ====================

  async getBattleConfig(npcConfigName: string): Promise<BattleConfigResponse> {
    try {
      return await this.configService.getBattleConfig(npcConfigName);
    } catch (error) {
      console.error(`Error getting battle config for ${npcConfigName}:`, error);
      throw new Error(`Failed to retrieve battle config: ${error.message}`);
    }
  }

  async getAllBattleConfigs(): Promise<GetAllBattleConfigsResponse> {
    try {
      const configs = await this.configService.getAllAvailableConfigs();
      return { configs };
    } catch (error) {
      console.error('Error getting all battle configs:', error);
      throw new Error(`Failed to retrieve battle configs: ${error.message}`);
    }
  }

  async createBattleConfig(npcConfigName: string, config: BattleConfig): Promise<CreateBattleConfigResponse> {
    try {
      await this.configService.createConfig(npcConfigName, config);

      return {
        success: true,
        message: 'Battle config created successfully'
      };
    } catch (error) {
      console.error(`Error creating battle config for ${npcConfigName}:`, error);
      throw new Error(`Failed to create battle config: ${error.message}`);
    }
  }

  async updateBattleConfig(npcConfigName: string, config: Partial<BattleConfig>): Promise<UpdateBattleConfigResponse> {
    try {
      return await this.configService.updateConfig(npcConfigName, config);
    } catch (error) {
      console.error(`Error updating battle config for ${npcConfigName}:`, error);
      throw new Error(`Failed to update battle config: ${error.message}`);
    }
  }

  async deleteBattleConfig(npcConfigName: string): Promise<DeleteBattleConfigResponse> {
    try {
      await this.configService.deleteConfig(npcConfigName);

      return {
        success: true,
        message: 'Battle config deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting battle config for ${npcConfigName}:`, error);
      throw new Error(`Failed to delete battle config: ${error.message}`);
    }
  }

  async validateBattleConfig(npcConfigName: string): Promise<ValidateBattleConfigResponse> {
    try {
      const exists = await this.configService.validateConfigExists(npcConfigName);
      return {
        exists,
        valid: exists
      };
    } catch (error) {
      console.error(`Error validating battle config for ${npcConfigName}:`, error);
      return {
        exists: false,
        valid: false
      };
    }
  }
}