import { Injectable, BadRequestException } from '@nestjs/common';
import { NPCService, NPCUpdateRequest, NPCUpdateResponse } from './services/npc.service';
import { ImageService, ImageUploadRequest, ImageUploadResponse, ImageExistsResponse } from './services/image.service';
import { QuestSystemData, NPC } from './types';
import { QuestCacheService } from './services/quest.cache.service';
import { UserQuestData, UserQuestService } from './services/user.quest.service';
import { UpdateNPCsDto } from './dto/update-npcs.dto';

export interface GetQuestsRequest {
  force?: number;
}

export interface GetUserQuestsRequest {
  uuid: string;
}

export interface CheckImageRequest {
  npcName: string;
}

export interface CacheRefreshResponse {
  success: boolean;
  timestamp: Date;
}

export interface CacheStatusResponse {
  cached: boolean;
  age?: number;
  nextRefresh?: number;
  healthy: boolean;
}

export interface SystemHealthResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  cache: boolean;
  externalAPI: boolean;
  fileSystem: boolean;
}

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
    const forceRefresh = force === 1;
    return this.questCacheService.getQuestSystemData(forceRefresh);
  }

  async getQuestsForUser(uuid: string): Promise<UserQuestData> {
    if (!uuid || uuid.trim() === '') {
      throw new BadRequestException('UUID is required');
    }

    return this.userQuestService.getUserQuests(uuid);
  }

  async refreshQuestCache(): Promise<CacheRefreshResponse> {
    try {
      await this.questCacheService.refreshCache();
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      throw new BadRequestException(`Failed to refresh cache: ${error.message}`);
    }
  }

  async getCacheStatus(): Promise<CacheStatusResponse> {
    const status = this.questCacheService.getCacheStatus();
    const healthy = status.cached && (!status.age || status.age < 6 * 60 * 60 * 1000); // 6 hours

    return {
      ...status,
      healthy
    };
  }

  // ==================== NPC MANAGEMENT ====================

  async updateNPCs(request: UpdateNPCsDto): Promise<NPCUpdateResponse> {
    return this.npcService.updateNPCs(request);
  }

  async getAllNPCs(): Promise<NPC[]> {
    return this.npcService.getAllNPCs();
  }

  async getNPCById(npcId: number): Promise<NPC | null> {
    if (!npcId || npcId <= 0) {
      throw new BadRequestException('Valid NPC ID is required');
    }

    return this.npcService.getNPCById(npcId);
  }

  async getNPCsByQuestId(questId: number): Promise<NPC[]> {
    if (!questId || questId <= 0) {
      throw new BadRequestException('Valid Quest ID is required');
    }

    return this.npcService.getNPCsByQuestId(questId);
  }

  // ==================== IMAGE MANAGEMENT ====================

  async uploadNPCImage(request: ImageUploadRequest): Promise<ImageUploadResponse> {
    if (!request.npcName || !request.image) {
      throw new BadRequestException('NPC name and image are required');
    }

    return this.imageService.uploadCustomNPCImage(request);
  }

  async checkNPCRenderExists(npcName: string): Promise<ImageExistsResponse> {
    if (!npcName || npcName.trim() === '') {
      throw new BadRequestException('NPC name is required');
    }

    return this.imageService.checkCustomNPCRenderExists(npcName);
  }

  async checkNPCImageExists(npcName: string): Promise<ImageExistsResponse> {
    if (!npcName || npcName.trim() === '') {
      throw new BadRequestException('NPC name is required');
    }

    return this.imageService.checkCustomNPCImageExists(npcName);
  }

  // ==================== SYSTEM HEALTH ====================

  async getSystemHealth(): Promise<SystemHealthResponse> {
    try {
      // Check cache health
      const cacheStatus = await this.getCacheStatus();
      const cacheHealthy = cacheStatus.healthy;

      // Check external API health (try to fetch a small amount of data)
      let externalAPIHealthy = true;
      try {
        await this.questCacheService.getQuestSystemData();
      } catch {
        externalAPIHealthy = false;
      }

      // Check file system health (try to check if directories exist)
      let fileSystemHealthy = true;
      try {
        await this.imageService.checkCustomNPCRenderExists('health_check');
      } catch {
        fileSystemHealthy = false;
      }

      // Determine overall health
      let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!cacheHealthy || !externalAPIHealthy) {
        overall = 'degraded';
      }
      
      if (!cacheHealthy && !externalAPIHealthy) {
        overall = 'unhealthy';
      }

      return {
        overall,
        cache: cacheHealthy,
        externalAPI: externalAPIHealthy,
        fileSystem: fileSystemHealthy
      };

    } catch (error) {
      return {
        overall: 'unhealthy',
        cache: false,
        externalAPI: false,
        fileSystem: false
      };
    }
  }

  // ==================== VALIDATION ====================

  async validateUserExists(uuid: string): Promise<boolean> {
    if (!uuid || uuid.trim() === '') {
      return false;
    }

    return this.userQuestService.validateUserExists(uuid);
  }
}