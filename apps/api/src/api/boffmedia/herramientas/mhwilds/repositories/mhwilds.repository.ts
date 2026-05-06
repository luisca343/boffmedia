import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import { IMhwildsRepository } from './interface/mhwilds.repository.interface';

export interface CacheMetadata {
  filePath: string;
  lastModified: Date;
  exists: boolean;
}

export interface ResourceFetchResult {
  data: any;
  fromCache: boolean;
  fetchTime: Date;
}

export interface WeaponTreeNode {
  id: number;
  name: string;
  rarity: number;
  kind: string;
  damage: any;
  specials: any[];
  craftingMaterials: any[];
  craftingZennyCost: number;
  upgradeMaterials: any[];
  upgradeZennyCost: number;
  children: WeaponTreeNode[];
}

@Injectable()
export class MhwildsRepository implements IMhwildsRepository {
  
  private readonly API_BASE_URL = 'https://wilds.mhdb.io';
  private readonly CACHE_DURATION_MS = 86400000; // 1 day in milliseconds
  
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>
  ) {}
  // ==================== CACHE MANAGEMENT ====================

  async getCacheMetadata(resourceType: string, locale: string): Promise<CacheMetadata> {
    try {
      const filePath = path.join(process.cwd(), `public/data/mhwilds/${locale}/${resourceType}.json`);
      
      try {
        const stats = await fs.stat(filePath);
        return {
          filePath,
          lastModified: stats.mtime,
          exists: true
        };
      } catch {
        return {
          filePath,
          lastModified: new Date(0),
          exists: false
        };
      }
    } catch (error: any) {
      throw new Error(`Failed to get cache metadata for ${resourceType}: ${error.message}`);
    }
  }

  async isCacheValid(cacheMetadata: CacheMetadata): Promise<boolean> {
    if (!cacheMetadata.exists) {
      return false;
    }

    const now = new Date();
    const cacheAge = now.getTime() - cacheMetadata.lastModified.getTime();
    return cacheAge < this.CACHE_DURATION_MS;
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async readCachedData(filePath: string): Promise<any> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error: any) {
      throw new Error(`Failed to read cached data from ${filePath}: ${error.message}`);
    }
  }

  async saveCachedData(filePath: string, data: any): Promise<void> {
    try {
      const dirPath = path.dirname(filePath);
      await this.ensureDirectoryExists(dirPath);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error: any) {
      throw new Error(`Failed to save data to ${filePath}: ${error.message}`);
    }
  }

  // ==================== REMOTE DATA FETCHING ====================

  async fetchRemoteData(resourceType: string, locale: string): Promise<any> {
    try {
      const apiUrl = `${this.API_BASE_URL}/${locale}/${resourceType}`;
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'BoffMedia-MHWilds-Tool/1.0'
        }
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API request failed: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error(`Network error: Unable to reach the API`);
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  // ==================== GENERIC RESOURCE OPERATIONS ====================

  async getResourceData(resourceType: string, locale: string): Promise<ResourceFetchResult> {
    try {
      const cacheMetadata = await this.getCacheMetadata(resourceType, locale);
      const isCacheValid = await this.isCacheValid(cacheMetadata);

      if (isCacheValid) {
        const cachedData = await this.readCachedData(cacheMetadata.filePath);
        return {
          data: cachedData,
          fromCache: true,
          fetchTime: cacheMetadata.lastModified
        };
      }

      // Cache is invalid or doesn't exist, fetch from remote
      const remoteData = await this.fetchRemoteData(resourceType, locale);
      await this.saveCachedData(cacheMetadata.filePath, remoteData);
      
      return {
        data: remoteData,
        fromCache: false,
        fetchTime: new Date()
      };
    } catch (error: any) {
      // Try to fallback to cached data if remote fetch fails
      try {
        const cacheMetadata = await this.getCacheMetadata(resourceType, locale);
        if (cacheMetadata.exists) {
          const cachedData = await this.readCachedData(cacheMetadata.filePath);
          return {
            data: cachedData,
            fromCache: true,
            fetchTime: cacheMetadata.lastModified
          };
        }
      } catch (fallbackError) {
        // Ignore fallback errors
      }

      throw new Error(`Failed to get ${resourceType} data: ${error.message}`);
    }
  }

  // ==================== SPECIFIC RESOURCE OPERATIONS ====================

  async getWeapons(locale: string): Promise<ResourceFetchResult> {
    return await this.getResourceData('weapons', locale);
  }

  async getArmor(locale: string): Promise<ResourceFetchResult> {
    return await this.getResourceData('armor', locale);
  }

  async getCharms(locale: string): Promise<ResourceFetchResult> {
    return await this.getResourceData('charms', locale);
  }

  async getDecorations(locale: string): Promise<ResourceFetchResult> {
    return await this.getResourceData('decorations', locale);
  }

  async getSkills(locale: string): Promise<ResourceFetchResult> {
    return await this.getResourceData('skills', locale);
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  async saveProcessedData(filename: string, locale: string, data: any): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), `public/data/mhwilds/${locale}/${filename}`);
      await this.saveCachedData(filePath, data);
    } catch (error: any) {
      throw new Error(`Failed to save processed data to ${filename}: ${error.message}`);
    }
  }

  async getProcessedData(filename: string, locale: string): Promise<any | null> {
    try {
      const filePath = path.join(process.cwd(), `public/data/mhwilds/${locale}/${filename}`);
      const cacheMetadata = await this.getCacheMetadata(filename.replace('.json', ''), locale);
      
      if (cacheMetadata.exists) {
        return await this.readCachedData(filePath);
      }
      
      return null;
    } catch (error: any) {
      return null;
    }
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  async clearCache(resourceType?: string, locale?: string): Promise<{ success: boolean; message: string }> {
    try {
      const basePath = path.join(process.cwd(), 'public/data/mhwilds');
      
      if (resourceType && locale) {
        // Clear specific resource for specific locale
        const filePath = path.join(basePath, locale, `${resourceType}.json`);
        try {
          await fs.unlink(filePath);
          return {
            success: true,
            message: `Cleared cache for ${resourceType} in ${locale}`
          };
        } catch {
          return {
            success: false,
            message: `Cache file not found for ${resourceType} in ${locale}`
          };
        }
      } else if (locale) {
        // Clear all resources for specific locale
        const localePath = path.join(basePath, locale);
        try {
          await fs.rm(localePath, { recursive: true, force: true });
          return {
            success: true,
            message: `Cleared all cache for locale ${locale}`
          };
        } catch {
          return {
            success: false,
            message: `Failed to clear cache for locale ${locale}`
          };
        }
      } else {
        // Clear all cache
        try {
          await fs.rm(basePath, { recursive: true, force: true });
          return {
            success: true,
            message: 'Cleared all MHWilds cache'
          };
        } catch {
          return {
            success: false,
            message: 'Failed to clear all cache'
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Cache clearing failed: ${error.message}`
      };
    }
  }

  async getCacheStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    locales: string[];
    resources: string[];
  }> {
    try {
      const basePath = path.join(process.cwd(), 'public/data/mhwilds');
      let totalFiles = 0;
      let totalSize = 0;
      const locales = new Set<string>();
      const resources = new Set<string>();

      try {
        const localesDirs = await fs.readdir(basePath);
        
        for (const localeDir of localesDirs) {
          const localePath = path.join(basePath, localeDir);
          const stat = await fs.stat(localePath);
          
          if (stat.isDirectory()) {
            locales.add(localeDir);
            
            const files = await fs.readdir(localePath);
            for (const file of files) {
              if (file.endsWith('.json')) {
                const filePath = path.join(localePath, file);
                const fileStat = await fs.stat(filePath);
                totalFiles++;
                totalSize += fileStat.size;
                resources.add(file.replace('.json', ''));
              }
            }
          }
        }
      } catch {
        // Directory doesn't exist or is empty
      }

      return {
        totalFiles,
        totalSize,
        locales: Array.from(locales),
        resources: Array.from(resources)
      };
    } catch (error: any) {
      throw new Error(`Failed to get cache stats: ${error.message}`);
    }
  }
}