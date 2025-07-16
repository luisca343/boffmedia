import { CacheMetadata, ResourceFetchResult } from '../mhwilds.repository';

export interface IMhwildsRepository {
  // Cache Management
  getCacheMetadata(resourceType: string, locale: string): Promise<CacheMetadata>;
  isCacheValid(cacheMetadata: CacheMetadata): Promise<boolean>;
  readCachedData(filePath: string): Promise<any>;
  saveCachedData(filePath: string, data: any): Promise<void>;
  
  // Remote Data Fetching
  fetchRemoteData(resourceType: string, locale: string): Promise<any>;
  
  // Generic Resource Operations
  getResourceData(resourceType: string, locale: string): Promise<ResourceFetchResult>;
  
  // Specific Resource Operations
  getWeapons(locale: string): Promise<ResourceFetchResult>;
  getArmor(locale: string): Promise<ResourceFetchResult>;
  getCharms(locale: string): Promise<ResourceFetchResult>;
  getDecorations(locale: string): Promise<ResourceFetchResult>;
  getSkills(locale: string): Promise<ResourceFetchResult>;
  
  // Processed Data Operations
  saveProcessedData(filename: string, locale: string, data: any): Promise<void>;
  getProcessedData(filename: string, locale: string): Promise<any | null>;
  
  // Cache Management Operations
  clearCache(resourceType?: string, locale?: string): Promise<{ success: boolean; message: string }>;
  getCacheStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    locales: string[];
    resources: string[];
  }>;
}