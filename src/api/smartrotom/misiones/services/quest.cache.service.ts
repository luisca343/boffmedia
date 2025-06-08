import { Injectable } from '@nestjs/common';
import { QuestRepository, ExternalQuestResponse } from '@repositories/smartrotom/quest.repository';
import { QuestSystemData, QuestData, IDialogue, IQuestCategory, NPC } from '../types';

export interface QuestCacheEntry {
  data: QuestSystemData;
  timestamp: number;
}

@Injectable()
export class QuestCacheService {
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  private questCache: QuestCacheEntry | null = null;

  constructor(
    private readonly questRepository: QuestRepository,
  ) {}

  async getQuestSystemData(force: boolean = false): Promise<QuestSystemData> {
    // Check if we need to fetch fresh data
    if (this.shouldRefreshCache(force)) {
      await this.refreshCache();
    }

    if (!this.questCache) {
      throw new Error('Failed to load quest data from cache');
    }

    return this.questCache.data;
  }

  async refreshCache(): Promise<void> {
    try {
      const externalData = await this.questRepository.fetchAllQuestsFromAPI();
      
      if (!this.questRepository.validateQuestSystemData(externalData)) {
        throw new Error('Invalid quest data structure received from API');
      }

      const systemData = this.questRepository.transformExternalDataToSystemData(
        externalData,
        this.questCache?.data.npcs || []
      );

      this.questCache = {
        data: systemData,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to refresh quest cache:', error);
      
      // If we have cached data, use it but log the error
      if (this.questCache) {
        console.warn('Using stale quest data due to API failure');
        return;
      }
      
      throw new Error(`Quest cache refresh failed: ${error.message}`);
    }
  }

  updateNPCs(npcs: NPC[]): void {
    if (this.questCache) {
      this.questCache.data.npcs = npcs;
    }
  }

  private shouldRefreshCache(force: boolean): boolean {
    if (force) return true;
    if (!this.questCache) return true;
    
    const now = Date.now();
    const cacheAge = now - this.questCache.timestamp;
    
    return cacheAge >= this.CACHE_DURATION;
  }

  getCacheStatus(): { cached: boolean; age?: number; nextRefresh?: number } {
    if (!this.questCache) {
      return { cached: false };
    }

    const now = Date.now();
    const age = now - this.questCache.timestamp;
    const nextRefresh = this.CACHE_DURATION - age;

    return {
      cached: true,
      age,
      nextRefresh: Math.max(0, nextRefresh)
    };
  }
}