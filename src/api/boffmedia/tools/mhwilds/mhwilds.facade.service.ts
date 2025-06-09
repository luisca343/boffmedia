import { Injectable } from '@nestjs/common';
import { MhwildsDataService, WeaponTreeResult, CharmRankResult, CacheInfo } from './services/mhwilds-data.service';
import { MhwildsCacheService, CacheOperationResult } from './services/mhwilds-cache.service';

@Injectable()
export class MhwildsFacadeService {
  constructor(
    private readonly mhwildsDataService: MhwildsDataService,
    private readonly mhwildsCacheService: MhwildsCacheService,
  ) {}

  // ==================== BASIC DATA OPERATIONS ====================

  async getWeapons(locale: string = 'es'): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      return await this.mhwildsDataService.getWeapons(locale);
    } catch (error) {
      throw new Error(`Failed to get weapons: ${error.message}`);
    }
  }

  async getArmor(locale: string = 'es'): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      return await this.mhwildsDataService.getArmor(locale);
    } catch (error) {
      throw new Error(`Failed to get armor: ${error.message}`);
    }
  }

  async getCharms(locale: string = 'es'): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      return await this.mhwildsDataService.getCharms(locale);
    } catch (error) {
      throw new Error(`Failed to get charms: ${error.message}`);
    }
  }

  async getDecorations(locale: string = 'es'): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      return await this.mhwildsDataService.getDecorations(locale);
    } catch (error) {
      throw new Error(`Failed to get decorations: ${error.message}`);
    }
  }

  async getSkills(locale: string = 'es'): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      return await this.mhwildsDataService.getSkills(locale);
    } catch (error) {
      throw new Error(`Failed to get skills: ${error.message}`);
    }
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  async getAllCharmRanks(locale: string = 'es'): Promise<{ data: CharmRankResult[]; cacheInfo: CacheInfo }> {
    try {
      return await this.mhwildsDataService.getAllCharmRanks(locale);
    } catch (error) {
      throw new Error(`Failed to get charm ranks: ${error.message}`);
    }
  }

  async createWeaponTree(locale: string = 'es'): Promise<WeaponTreeResult> {
    try {
      return await this.mhwildsDataService.createWeaponTree(locale);
    } catch (error) {
      throw new Error(`Failed to create weapon tree: ${error.message}`);
    }
  }

  // ==================== SEARCH AND FILTER OPERATIONS ====================

  async searchWeaponsByName(locale: string, searchTerm: string): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters long');
      }
      
      return await this.mhwildsDataService.searchWeaponsByName(locale, searchTerm.trim());
    } catch (error) {
      throw new Error(`Failed to search weapons: ${error.message}`);
    }
  }

  async getWeaponsByKind(locale: string, kind: string): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      if (!kind || kind.trim().length === 0) {
        throw new Error('Weapon kind is required');
      }
      
      return await this.mhwildsDataService.getWeaponsByKind(locale, kind.trim());
    } catch (error) {
      throw new Error(`Failed to get weapons by kind: ${error.message}`);
    }
  }

  async getArmorByRarity(locale: string, rarity: number): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      if (!Number.isInteger(rarity) || rarity < 1 || rarity > 10) {
        throw new Error('Rarity must be an integer between 1 and 10');
      }
      
      return await this.mhwildsDataService.getArmorByRarity(locale, rarity);
    } catch (error) {
      throw new Error(`Failed to get armor by rarity: ${error.message}`);
    }
  }

  // ==================== STATISTICS OPERATIONS ====================

  async getDataStatistics(locale: string = 'es'): Promise<{
    weapons: { total: number; byKind: Record<string, number> };
    armor: { total: number; byRarity: Record<number, number> };
    charms: { total: number; totalRanks: number };
    decorations: { total: number; byRarity: Record<number, number> };
    skills: { total: number };
  }> {
    try {
      return await this.mhwildsDataService.getDataStatistics(locale);
    } catch (error) {
      throw new Error(`Failed to get data statistics: ${error.message}`);
    }
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  async clearCache(resourceType?: string, locale?: string): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.clearCache(resourceType, locale);
    } catch (error) {
      return {
        success: false,
        message: `Cache clearing failed: ${error.message}`
      };
    }
  }

  async getCacheStatistics(): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.getCacheStatistics();
    } catch (error) {
      return {
        success: false,
        message: `Failed to get cache statistics: ${error.message}`
      };
    }
  }

  async warmupCache(locale: string): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.warmupCache(locale);
    } catch (error) {
      return {
        success: false,
        message: `Cache warmup failed: ${error.message}`
      };
    }
  }

  async validateCache(locale: string): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.validateCache(locale);
    } catch (error) {
      return {
        success: false,
        message: `Cache validation failed: ${error.message}`
      };
    }
  }

  async optimizeCache(): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.optimizeCache();
    } catch (error) {
      return {
        success: false,
        message: `Cache optimization failed: ${error.message}`
      };
    }
  }

  // ==================== UTILITY OPERATIONS ====================

  async getSupportedLocales(): Promise<string[]> {
    try {
      const cacheStats = await this.mhwildsCacheService.getCacheStatistics();
      if (cacheStats.success && cacheStats.stats) {
        return cacheStats.stats.locales;
      }
      
      // Return default supported locales if cache stats fail
      return ['es', 'en', 'ja', 'fr', 'de', 'it', 'ko', 'zh-CN', 'zh-TW'];
    } catch (error) {
      // Fallback to default locales
      return ['es', 'en'];
    }
  }

  async getAvailableResources(): Promise<string[]> {
    try {
      const cacheStats = await this.mhwildsCacheService.getCacheStatistics();
      if (cacheStats.success && cacheStats.stats) {
        return cacheStats.stats.resources;
      }
      
      // Return default resources if cache stats fail
      return ['weapons', 'armor', 'charms', 'decorations', 'skills'];
    } catch (error) {
      // Fallback to default resources
      return ['weapons', 'armor', 'charms', 'decorations', 'skills'];
    }
  }

  formatCacheSize(bytes: number): string {
    return this.mhwildsCacheService.formatCacheSize(bytes);
  }

  formatCacheAge(milliseconds: number): string {
    return this.mhwildsCacheService.formatCacheAge(milliseconds);
  }
}