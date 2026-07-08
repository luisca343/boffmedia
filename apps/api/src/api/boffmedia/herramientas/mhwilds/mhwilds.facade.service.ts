import { Injectable } from '@nestjs/common';
import {
  MhwildsDataService,
  WeaponTreeResult,
  CharmRankResult,
} from './services/mhwilds-data.service';
import {
  MhwildsCacheService,
  CacheOperationResult,
} from './services/mhwilds-cache.service';

@Injectable()
export class MhwildsFacadeService {
  constructor(
    private readonly mhwildsDataService: MhwildsDataService,
    private readonly mhwildsCacheService: MhwildsCacheService,
  ) {}

  // ==================== BASIC DATA OPERATIONS ====================

  async getWeapons(locale: string = 'es'): Promise<any[]> {
    try {
      const result = await this.mhwildsDataService.getWeapons(locale);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get weapons: ${error.message}`);
    }
  }

  async getArmor(locale: string = 'es'): Promise<any[]> {
    try {
      const result = await this.mhwildsDataService.getArmor(locale);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get armor: ${error.message}`);
    }
  }

  async getCharms(locale: string = 'es'): Promise<any[]> {
    try {
      const result = await this.mhwildsDataService.getCharms(locale);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get charms: ${error.message}`);
    }
  }

  async getDecorations(locale: string = 'es'): Promise<any[]> {
    try {
      const result = await this.mhwildsDataService.getDecorations(locale);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get decorations: ${error.message}`);
    }
  }

  async getSkills(locale: string = 'es'): Promise<any[]> {
    try {
      const result = await this.mhwildsDataService.getSkills(locale);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get skills: ${error.message}`);
    }
  }

  async getMonsters(locale: string = 'es'): Promise<any[]> {
    try {
      const result = await this.mhwildsDataService.getMonsters(locale);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get monsters: ${error.message}`);
    }
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  async getAllCharmRanks(locale: string = 'es'): Promise<CharmRankResult[]> {
    try {
      const result = await this.mhwildsDataService.getAllCharmRanks(locale);
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get charm ranks: ${error.message}`);
    }
  }

  async createWeaponTree(locale: string = 'es'): Promise<WeaponTreeResult> {
    try {
      return await this.mhwildsDataService.createWeaponTree(locale);
    } catch (error: any) {
      throw new Error(`Failed to create weapon tree: ${error.message}`);
    }
  }

  // ==================== SEARCH AND FILTER OPERATIONS ====================

  async searchWeaponsByName(
    locale: string,
    searchTerm: string,
  ): Promise<any[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters long');
      }

      const result = await this.mhwildsDataService.searchWeaponsByName(
        locale,
        searchTerm.trim(),
      );
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to search weapons: ${error.message}`);
    }
  }

  async getWeaponsByKind(locale: string, kind: string): Promise<any[]> {
    try {
      if (!kind || kind.trim().length === 0) {
        throw new Error('Weapon kind is required');
      }

      const result = await this.mhwildsDataService.getWeaponsByKind(
        locale,
        kind.trim(),
      );
      return result.data;
    } catch (error: any) {
      throw new Error(`Failed to get weapons by kind: ${error.message}`);
    }
  }

  async getArmorByRarity(locale: string, rarity: number): Promise<any[]> {
    try {
      if (!Number.isInteger(rarity) || rarity < 1 || rarity > 10) {
        throw new Error('Rarity must be an integer between 1 and 10');
      }

      const result = await this.mhwildsDataService.getArmorByRarity(
        locale,
        rarity,
      );
      return result.data;
    } catch (error: any) {
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
    } catch (error: any) {
      throw new Error(`Failed to get data statistics: ${error.message}`);
    }
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  async clearCache(
    resourceType?: string,
    locale?: string,
  ): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.clearCache(resourceType, locale);
    } catch (error: any) {
      return {
        success: false,
        message: `Cache clearing failed: ${error.message}`,
      };
    }
  }

  async getCacheStatistics(): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.getCacheStatistics();
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get cache statistics: ${error.message}`,
      };
    }
  }

  async warmupCache(locale: string): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.warmupCache(locale);
    } catch (error: any) {
      return {
        success: false,
        message: `Cache warmup failed: ${error.message}`,
      };
    }
  }

  async validateCache(locale: string): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.validateCache(locale);
    } catch (error: any) {
      return {
        success: false,
        message: `Cache validation failed: ${error.message}`,
      };
    }
  }

  async optimizeCache(): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsCacheService.optimizeCache();
    } catch (error: any) {
      return {
        success: false,
        message: `Cache optimization failed: ${error.message}`,
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
    } catch (_error: any) {
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
    } catch (_error: any) {
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
