import { Injectable } from '@nestjs/common';
import { QuestCacheService } from './services/quest.cache.service';
import { UserQuestService, UserQuestData } from './services/user.quest.service';
import { NPCService, NPCUpdateRequest, NPCUpdateResponse } from './services/npc.service';
import { ImageService, ImageUploadRequest, ImageUploadResponse, ImageExistsResponse } from './services/image.service';
import { QuestSystemData, NPC } from './types';

@Injectable()
export class MisionesFacadeService {
  constructor(
    private readonly questCacheService: QuestCacheService,
    private readonly userQuestService: UserQuestService,
    private readonly npcService: NPCService,
    private readonly imageService: ImageService,
  ) {}

  // ==================== QUEST MANAGEMENT ====================

  async getAllQuests(force: number = 0): Promise<QuestSystemData> {
    try {
      const forceRefresh = force === 1;
      return await this.questCacheService.getQuestSystemData(forceRefresh);
    } catch (error) {
      console.error('Error getting all quests:', error);
      throw new Error(`Failed to retrieve quests: ${error.message}`);
    }
  }

  async getQuestsForUser(uuid: string): Promise<UserQuestData> {
    try {
      if (!uuid) {
        throw new Error('User UUID is required');
      }

      return await this.userQuestService.getUserQuests(uuid);
    } catch (error) {
      console.error(`Error getting quests for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve quests for user: ${error.message}`);
    }
  }

  async refreshQuestCache(): Promise<{ success: boolean; timestamp: Date }> {
    try {
      await this.questCacheService.refreshCache();
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error refreshing quest cache:', error);
      throw new Error(`Failed to refresh quest cache: ${error.message}`);
    }
  }

  async getQuestCacheStatus(): Promise<{
    cached: boolean;
    age?: number;
    nextRefresh?: number;
    healthy: boolean;
  }> {
    try {
      const cacheStatus = this.questCacheService.getCacheStatus();
      return {
        ...cacheStatus,
        healthy: true
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return {
        cached: false,
        healthy: false
      };
    }
  }

  // ==================== NPC MANAGEMENT ====================

  async updateNPCs(updateRequest: NPCUpdateRequest): Promise<NPCUpdateResponse> {
    try {
      return await this.npcService.updateNPCs(updateRequest);
    } catch (error) {
      console.error('Error updating NPCs:', error);
      throw new Error(`Failed to update NPCs: ${error.message}`);
    }
  }

  async getAllNPCs(): Promise<NPC[]> {
    try {
      return await this.npcService.getAllNPCs();
    } catch (error) {
      console.error('Error getting all NPCs:', error);
      throw new Error(`Failed to retrieve NPCs: ${error.message}`);
    }
  }

  async getNPCById(npcId: number): Promise<NPC | null> {
    try {
      return await this.npcService.getNPCById(npcId);
    } catch (error) {
      console.error(`Error getting NPC ${npcId}:`, error);
      return null;
    }
  }

  async getNPCsByQuestId(questId: number): Promise<NPC[]> {
    try {
      return await this.npcService.getNPCsByQuestId(questId);
    } catch (error) {
      console.error(`Error getting NPCs for quest ${questId}:`, error);
      return [];
    }
  }

  // ==================== IMAGE MANAGEMENT ====================

  async uploadCustomNPCImage(request: ImageUploadRequest): Promise<ImageUploadResponse> {
    try {
      return await this.imageService.uploadCustomNPCImage(request);
    } catch (error) {
      console.error(`Error uploading image for NPC ${request.npcName}:`, error);
      throw new Error(`Failed to upload NPC image: ${error.message}`);
    }
  }

  async checkCustomNPCRenderExists(npcName: string): Promise<ImageExistsResponse> {
    try {
      return await this.imageService.checkCustomNPCRenderExists(npcName);
    } catch (error) {
      console.error(`Error checking render for NPC ${npcName}:`, error);
      return { exists: false };
    }
  }

  async checkCustomNPCImageExists(npcName: string): Promise<ImageExistsResponse> {
    try {
      return await this.imageService.checkCustomNPCImageExists(npcName);
    } catch (error) {
      console.error(`Error checking image for NPC ${npcName}:`, error);
      return { exists: false };
    }
  }

  async deleteCustomNPCImage(npcName: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.imageService.deleteCustomNPCImage(npcName);
    } catch (error) {
      console.error(`Error deleting image for NPC ${npcName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ==================== VALIDATION METHODS ====================

  async validateUserExists(uuid: string): Promise<boolean> {
    try {
      return await this.userQuestService.validateUserExists(uuid);
    } catch (error) {
      console.error(`Error validating user ${uuid}:`, error);
      return false;
    }
  }

  async validateNPCName(npcName: string): Promise<boolean> {
    try {
      if (!npcName || typeof npcName !== 'string') return false;
      
      // Allow alphanumeric characters, underscores, and hyphens
      const validNameRegex = /^[a-zA-Z0-9_-]+$/;
      return validNameRegex.test(npcName) && npcName.length <= 50;
    } catch (error) {
      console.error(`Error validating NPC name ${npcName}:`, error);
      return false;
    }
  }

  // ==================== HEALTH CHECK ====================

  async getSystemHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    cache: boolean;
    externalAPI: boolean;
    fileSystem: boolean;
  }> {
    try {
      const cacheStatus = this.questCacheService.getCacheStatus();
      
      // We would need to add health check to repository
      // For now, assume healthy if cache is working
      
      return {
        overall: cacheStatus.cached ? 'healthy' : 'degraded',
        cache: cacheStatus.cached,
        externalAPI: true, // Would need actual health check
        fileSystem: true   // Would need actual health check
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        overall: 'unhealthy',
        cache: false,
        externalAPI: false,
        fileSystem: false
      };
    }
  }
}