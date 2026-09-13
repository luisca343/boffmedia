import { HttpException, Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import { IMhwildsRepository } from './interface/mhwilds.repository.interface';

import { publicPath, uploadsPath } from '@/config/paths';

export interface CacheMetadata {
  /** Best source to read from: the writable cache, or the seeded copy. */
  filePath: string;
  /** Where a refreshed copy is written. Always the writable cache. */
  writePath: string;
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
  gameId?: number;
  pathKey?: string;
  assetKey?: string;
  name: string;
  description?: string;
  rarity: number;
  kind: string;
  damage: any;
  specials: any[];
  slots?: number[];
  affinity?: number;
  skills?: any[];
  series?: any;
  previous?: { id: number; name?: string } | null;
  branchIds?: { id: number; name?: string }[];
  craftingMaterials: any[];
  craftingZennyCost: number;
  upgradeMaterials: any[];
  upgradeZennyCost: number;
  children: WeaponTreeNode[];
}

type ResourceRecord = Record<string, any>;

/**
 * Return the fields that identify a record independently of array order.  The
 * MHDB payloads can gain new rows, but an existing id must never silently
 * acquire another armor set, weapon kind, or localized name. Armor needs the
 * nested set identity as well because that is what the asset URL is keyed by.
 */
export function mhwildsResourceIdentity(
  resourceType: string,
  record: ResourceRecord,
): string | null {
  if (record?.id == null) return null;
  // The armor-set crosswalk is deliberately a minimal identity resource.
  // Names are localized and therefore cannot be used to validate an English
  // seed against a Spanish remote response.
  if (resourceType === 'armor-sets') {
    return JSON.stringify({
      id: String(record.id),
      gameId: record.gameId == null ? null : String(record.gameId),
    });
  }
  const identity: Record<string, unknown> = {
    id: String(record.id),
    name: record.name == null ? null : String(record.name),
    kind:
      record.kind == null
        ? record.type == null
          ? null
          : String(record.type)
        : String(record.kind),
    gameId: record.gameId == null ? null : String(record.gameId),
  };
  if (resourceType === 'armor') {
    const armorSet = record.armorSet;
    identity.armorSet =
      armorSet && typeof armorSet === 'object'
        ? {
            id: armorSet.id == null ? null : String(armorSet.id),
            gameId: armorSet.gameId == null ? null : String(armorSet.gameId),
            name: armorSet.name == null ? null : String(armorSet.name),
          }
        : null;
  }
  return JSON.stringify(identity);
}

/**
 * Check a candidate payload against the seeded catalog without requiring the
 * candidate to have the same number of rows. Every seeded id must be present,
 * unique, and retain its stable identity; additional remote rows are allowed.
 */
export function isMhwildsResourceIdentityCompatible(
  resourceType: string,
  seed: unknown,
  candidate: unknown,
): boolean {
  if (!Array.isArray(seed) || !Array.isArray(candidate)) return false;
  const seedById = new Map<string, string>();
  for (const record of seed) {
    if (!record || typeof record !== 'object') continue;
    const identity = mhwildsResourceIdentity(
      resourceType,
      record as ResourceRecord,
    );
    if (identity == null) continue;
    const id = String((record as ResourceRecord).id);
    if (seedById.has(id)) return false;
    seedById.set(id, identity);
  }
  if (seedById.size === 0) return candidate.length >= seed.length;

  const candidateById = new Map<string, string>();
  for (const record of candidate) {
    if (!record || typeof record !== 'object') continue;
    const identity = mhwildsResourceIdentity(
      resourceType,
      record as ResourceRecord,
    );
    if (identity == null) continue;
    const id = String((record as ResourceRecord).id);
    if (candidateById.has(id)) return false;
    candidateById.set(id, identity);
  }
  if (seedById.size > candidateById.size) return false;
  return [...seedById].every(
    ([id, identity]) => candidateById.get(id) === identity,
  );
}

/**
 * Enrich armor endpoint stubs with the stable game ID from /armor/sets.
 * Keeping this as a pure join makes the database-id versus game-id boundary
 * testable without requiring a live MHDB request.
 */
export function attachMhwildsArmorSetGameIds(
  armor: unknown,
  sets: unknown,
): ResourceRecord[] {
  if (!Array.isArray(armor) || !Array.isArray(sets)) return [];
  const gameIdBySetId = new Map<string, number | string>();
  const ambiguousSetIds = new Set<string>();
  for (const set of sets) {
    if (!set || typeof set !== 'object') continue;
    const record = set as ResourceRecord;
    if (record.id == null || record.gameId == null) continue;
    const setId = String(record.id);
    const previousGameId = gameIdBySetId.get(setId);
    if (
      previousGameId != null &&
      String(previousGameId) !== String(record.gameId)
    ) {
      gameIdBySetId.delete(setId);
      ambiguousSetIds.add(setId);
      continue;
    }
    if (!ambiguousSetIds.has(setId)) {
      gameIdBySetId.set(setId, record.gameId);
    }
  }
  return armor.map((piece) => {
    if (!piece || typeof piece !== 'object') return piece as ResourceRecord;
    const record = piece as ResourceRecord;
    const armorSet = record.armorSet;
    if (!armorSet || typeof armorSet !== 'object' || armorSet.id == null)
      return record;
    const setId = String(armorSet.id);
    if (ambiguousSetIds.has(setId)) return record;
    const gameId = gameIdBySetId.get(setId);
    return gameId == null
      ? record
      : { ...record, armorSet: { ...armorSet, gameId } };
  });
}

@Injectable()
export class MhwildsRepository implements IMhwildsRepository {
  private readonly API_BASE_URL = 'https://wilds.mhdb.io';
  private readonly CACHE_DURATION_MS = 86400000; // 1 day in milliseconds

  // Remote resources are re-fetched and rewritten as they go stale, so the
  // cache lives in the laboon store; the asset tree only carries the seeded
  // copy, which is read when nothing has been cached yet and never written.
  private cacheRoot(): string {
    return uploadsPath('mhwilds');
  }

  private cachePath(locale: string, filename: string): string {
    return uploadsPath('mhwilds', locale, filename);
  }

  private seedPath(locale: string, filename: string): string {
    return publicPath('boffmedia', 'tools', 'mhwilds', locale, filename);
  }

  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}
  // ==================== CACHE MANAGEMENT ====================

  async getCacheMetadata(
    resourceType: string,
    locale: string,
  ): Promise<CacheMetadata> {
    try {
      const writePath = this.cachePath(locale, `${resourceType}.json`);

      try {
        const stats = await fs.stat(writePath);
        return {
          filePath: writePath,
          writePath,
          lastModified: stats.mtime,
          exists: true,
        };
      } catch {
        // Nothing cached yet: fall back to the seeded copy so a cold start
        // still serves data, while a refresh is still written to the cache.
        const seedPath = this.seedPath(locale, `${resourceType}.json`);
        try {
          const stats = await fs.stat(seedPath);
          return {
            filePath: seedPath,
            writePath,
            lastModified: stats.mtime,
            exists: true,
          };
        } catch {
          return {
            filePath: writePath,
            writePath,
            lastModified: new Date(0),
            exists: false,
          };
        }
      }
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(
        `Failed to get cache metadata for ${resourceType}: ${error.message}`,
      );
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(
        `Failed to read cached data from ${filePath}: ${error.message}`,
      );
    }
  }

  /**
   * A cache can be fresh and still be from an older MHDB snapshot. Compare it
   * with the checked-in seed before serving it so a partial armor/weapon
   * response cannot hide catalog rows until the next day. New remote rows are
   * allowed; every seeded identity must remain present.
   */
  private async isCompleteResource(
    resourceType: string,
    locale: string,
    data: any,
  ): Promise<boolean> {
    if (!Array.isArray(data) || data.length === 0) return false;

    const seedPath = this.seedPath(locale, `${resourceType}.json`);
    let seed: any;
    try {
      seed = JSON.parse(await fs.readFile(seedPath, 'utf8'));
    } catch {
      return true;
    }
    if (!Array.isArray(seed) || seed.length === 0) return true;

    return isMhwildsResourceIdentityCompatible(resourceType, seed, data);
  }

  async saveCachedData(filePath: string, data: any): Promise<void> {
    try {
      const dirPath = path.dirname(filePath);
      await this.ensureDirectoryExists(dirPath);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to save data to ${filePath}: ${error.message}`);
    }
  }

  // ==================== REMOTE DATA FETCHING ====================

  async fetchRemoteData(resourceType: string, locale: string): Promise<any> {
    try {
      const endpoint =
        resourceType === 'armor-sets' ? 'armor/sets' : resourceType;
      const apiUrl = `${this.API_BASE_URL}/${locale}/${endpoint}`;
      const response = await axios.get(apiUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'BoffMedia-MHWilds-Tool/1.0',
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // A typed HTTP error (404/403/409…) has to reach the client as itself;
        // wrapping it in a bare Error turned all of them into 500s.
        if (error instanceof HttpException) throw error;
        throw new Error(
          `API request failed: ${error.response.status} - ${error.response.statusText}`,
        );
      } else if (error.request) {
        // A typed HTTP error (404/403/409…) has to reach the client as itself;
        // wrapping it in a bare Error turned all of them into 500s.
        if (error instanceof HttpException) throw error;
        throw new Error(`Network error: Unable to reach the API`);
      } else {
        // A typed HTTP error (404/403/409…) has to reach the client as itself;
        // wrapping it in a bare Error turned all of them into 500s.
        if (error instanceof HttpException) throw error;
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  // ==================== GENERIC RESOURCE OPERATIONS ====================

  async getResourceData(
    resourceType: string,
    locale: string,
  ): Promise<ResourceFetchResult> {
    try {
      const cacheMetadata = await this.getCacheMetadata(resourceType, locale);
      const isCacheValid = await this.isCacheValid(cacheMetadata);

      if (isCacheValid) {
        const cachedData = await this.readCachedData(cacheMetadata.filePath);
        if (await this.isCompleteResource(resourceType, locale, cachedData)) {
          return {
            data: cachedData,
            fromCache: true,
            fetchTime: cacheMetadata.lastModified,
          };
        }
      }

      // Cache is invalid or doesn't exist, fetch from remote
      const remoteData = await this.fetchRemoteData(resourceType, locale);
      if (!(await this.isCompleteResource(resourceType, locale, remoteData))) {
        throw new Error(
          `Remote ${resourceType} data is older or incomplete compared with the seeded catalog`,
        );
      }
      await this.saveCachedData(cacheMetadata.writePath, remoteData);

      return {
        data: remoteData,
        fromCache: false,
        fetchTime: new Date(),
      };
    } catch (error: any) {
      // Prefer the checked-in complete seed over an incomplete/stale cache.
      try {
        const seedPath = this.seedPath(locale, `${resourceType}.json`);
        const seededData = JSON.parse(await fs.readFile(seedPath, 'utf8'));
        if (await this.isCompleteResource(resourceType, locale, seededData)) {
          return {
            data: seededData,
            fromCache: true,
            fetchTime: new Date(0),
          };
        }
      } catch (_fallbackError) {
        // Ignore fallback errors
      }

      // A complete writable cache is still a valid offline fallback when the
      // seed is unavailable (for example in a minimal production image).
      try {
        const cacheMetadata = await this.getCacheMetadata(resourceType, locale);
        if (cacheMetadata.exists) {
          const cachedData = await this.readCachedData(cacheMetadata.filePath);
          if (await this.isCompleteResource(resourceType, locale, cachedData)) {
            return {
              data: cachedData,
              fromCache: true,
              fetchTime: cacheMetadata.lastModified,
            };
          }
        }
      } catch (_cacheFallbackError) {
        // Ignore fallback errors
      }

      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get ${resourceType} data: ${error.message}`);
    }
  }

  // ==================== SPECIFIC RESOURCE OPERATIONS ====================

  async getWeapons(locale: string): Promise<ResourceFetchResult> {
    return await this.getResourceData('weapons', locale);
  }

  private async readArmorAssetCrosswalk(): Promise<ResourceRecord[]> {
    try {
      const manifestPath = publicPath(
        'boffmedia',
        'tools',
        'mhwilds',
        'bestiary',
        'gear',
        'manifest.json',
      );
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      return Object.values(manifest?.armor ?? {})
        .filter((entry): entry is ResourceRecord => {
          if (!entry || typeof entry !== 'object') return false;
          const record = entry as ResourceRecord;
          return record.apiSetId != null && record.gameId != null;
        })
        .map((entry) => ({
          id: entry.apiSetId,
          gameId: entry.gameId,
        }));
    } catch {
      return [];
    }
  }

  async getArmor(locale: string): Promise<ResourceFetchResult> {
    const result = await this.getResourceData('armor', locale);
    if (!Array.isArray(result.data)) return result;

    // The armor endpoint intentionally returns a stub armorSet containing its
    // mutable database id and name. The documented /armor/sets endpoint is
    // the source that carries the stable gameId used by asset joins. Keep the
    // join server-side so every client receives the same canonical identity.
    let data = result.data;
    try {
      const setResult = await this.getResourceData('armor-sets', locale);
      data = attachMhwildsArmorSetGameIds(data, setResult.data);
    } catch {
      // Try the generated asset manifest below. It carries the same mapping
      // and is available in deployments that ship the runtime asset tree but
      // omit the optional armor-sets API seed.
    }

    if (
      data.some(
        (piece) =>
          piece?.armorSet &&
          typeof piece.armorSet === 'object' &&
          piece.armorSet.gameId == null,
      )
    ) {
      data = attachMhwildsArmorSetGameIds(
        data,
        await this.readArmorAssetCrosswalk(),
      );
    }

    if (data.length === 0) return result;
    return { ...result, data };
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

  async getMonsters(locale: string): Promise<ResourceFetchResult> {
    return await this.getResourceData('monsters', locale);
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  async saveProcessedData(
    filename: string,
    locale: string,
    data: any,
  ): Promise<void> {
    try {
      await this.saveCachedData(this.cachePath(locale, filename), data);
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(
        `Failed to save processed data to ${filename}: ${error.message}`,
      );
    }
  }

  async getProcessedData(
    filename: string,
    locale: string,
  ): Promise<any | null> {
    try {
      const cacheMetadata = await this.getCacheMetadata(
        filename.replace('.json', ''),
        locale,
      );

      if (cacheMetadata.exists) {
        return await this.readCachedData(cacheMetadata.filePath);
      }

      return null;
    } catch (_error: any) {
      return null;
    }
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  async clearCache(
    resourceType?: string,
    locale?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const basePath = this.cacheRoot();

      if (resourceType && locale) {
        // Clear specific resource for specific locale
        const filePath = path.join(basePath, locale, `${resourceType}.json`);
        try {
          await fs.unlink(filePath);
          return {
            success: true,
            message: `Cleared cache for ${resourceType} in ${locale}`,
          };
        } catch {
          return {
            success: false,
            message: `Cache file not found for ${resourceType} in ${locale}`,
          };
        }
      } else if (locale) {
        // Clear all resources for specific locale
        const localePath = path.join(basePath, locale);
        try {
          await fs.rm(localePath, { recursive: true, force: true });
          return {
            success: true,
            message: `Cleared all cache for locale ${locale}`,
          };
        } catch {
          return {
            success: false,
            message: `Failed to clear cache for locale ${locale}`,
          };
        }
      } else {
        // Clear all cache
        try {
          await fs.rm(basePath, { recursive: true, force: true });
          return {
            success: true,
            message: 'Cleared all MHWilds cache',
          };
        } catch {
          return {
            success: false,
            message: 'Failed to clear all cache',
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Cache clearing failed: ${error.message}`,
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
      const basePath = this.cacheRoot();
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
        resources: Array.from(resources),
      };
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get cache stats: ${error.message}`);
    }
  }
}
