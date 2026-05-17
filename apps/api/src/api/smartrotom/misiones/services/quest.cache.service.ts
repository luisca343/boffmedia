import { Injectable, Inject, Logger } from '@nestjs/common';
import { QuestSystemData, NPC } from '../types';
import { QUEST_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IQuestRepository } from '../repositories/interfaces/quest.repository.interface';

export interface QuestCacheEntry {
  data: QuestSystemData;
  timestamp: number;
}

@Injectable()
export class QuestCacheService {
  private readonly logger = new Logger(QuestCacheService.name);
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  private questCache: QuestCacheEntry | null = null;

  constructor(
    @Inject(QUEST_REPOSITORY_TOKEN)
    private readonly questRepository: IQuestRepository,
  ) {}

  async getQuestSystemData(force: boolean = false): Promise<QuestSystemData> {
    if (this.shouldRefreshCache(force)) {
      await this.refreshCache();
    }

    if (!this.questCache) {
      throw new Error('Failed to load quest data');
    }

    return this.questCache.data;
  }

  async refreshCache(): Promise<void> {
    try {
      this.logger.log('Refreshing quest cache from external API');

      const externalData = await this.questRepository.fetchAllQuestsFromAPI();

      // Transform the data structure
      const questSystemData: QuestSystemData = {
        quests: Object.values(externalData.quests),
        dialogs: Object.values(externalData.dialogs),
        categories: Object.values(externalData.categories),
        npcs: externalData.npcs || [],
      };

      this.questCache = {
        data: questSystemData,
        timestamp: Date.now(),
      };

      this.logger.log('Quest cache refreshed successfully');
    } catch (error: any) {
      this.logger.error('Failed to refresh quest cache', error.stack);
      throw error;
    }
  }

  updateNPCs(npcs: NPC[]): void {
    if (!this.questCache) {
      this.logger.warn('Cannot update NPCs: cache not initialized');
      return;
    }

    this.questCache.data.npcs = npcs;
    this.logger.log(`Updated ${npcs.length} NPCs in cache`);
  }

  private shouldRefreshCache(force: boolean): boolean {
    if (force) return true;
    if (!this.questCache) return true;

    const age = Date.now() - this.questCache.timestamp;
    return age > this.CACHE_DURATION;
  }

  getCacheStatus(): { cached: boolean; age?: number; nextRefresh?: number } {
    if (!this.questCache) {
      return { cached: false };
    }

    const age = Date.now() - this.questCache.timestamp;
    const nextRefresh = Math.max(0, this.CACHE_DURATION - age);

    return {
      cached: true,
      age,
      nextRefresh,
    };
  }
}
