import { Injectable } from '@nestjs/common';
import { MhwildsRepository } from '@repositories/boffmedia/mhwilds.repository';

export interface CacheOperationResult {
  success: boolean;
  message: string;
  stats?: any;
}

@Injectable()
export class MhwildsCacheService {
  constructor(
    private readonly mhwildsRepository: MhwildsRepository,
  ) {}

  // ==================== CACHE MANAGEMENT ====================

  async clearCache(resourceType?: string, locale?: string): Promise<CacheOperationResult> {
    try {
      return await this.mhwildsRepository.clearCache(resourceType, locale);
    } catch (error) {
      return {
        success: false,
        message: `Cache clearing failed: ${error.message}`
      };
    }
  }

  async getCacheStatistics(): Promise<CacheOperationResult> {
    try {
      const stats = await this.mhwildsRepository.getCacheStats();
      return {
        success: true,
        message: 'Cache statistics retrieved successfully',
        stats
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get cache statistics: ${error.message}`
      };
    }
  }

  async warmupCache(locale: string): Promise<CacheOperationResult> {
    try {
      const resources = ['weapons', 'armor', 'charms', 'decorations', 'skills'];
      const results = [];

      for (const resource of resources) {
        try {
          await this.mhwildsRepository.getResourceData(resource, locale);
          results.push(`${resource}: ✓`);
        } catch (error) {
          results.push(`${resource}: ✗ (${error.message})`);
        }
      }

      return {
        success: true,
        message: `Cache warmup completed for locale ${locale}`,
        stats: {
          locale,
          results
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache warmup failed: ${error.message}`
      };
    }
  }

  async validateCache(locale: string): Promise<CacheOperationResult> {
    try {
      const resources = ['weapons', 'armor', 'charms', 'decorations', 'skills'];
      const validationResults = [];

      for (const resource of resources) {
        try {
          const metadata = await this.mhwildsRepository.getCacheMetadata(resource, locale);
          const isValid = await this.mhwildsRepository.isCacheValid(metadata);
          
          validationResults.push({
            resource,
            exists: metadata.exists,
            valid: isValid,
            lastModified: metadata.lastModified,
            age: metadata.exists ? Date.now() - metadata.lastModified.getTime() : null
          });
        } catch (error) {
          validationResults.push({
            resource,
            exists: false,
            valid: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: `Cache validation completed for locale ${locale}`,
        stats: {
          locale,
          resources: validationResults
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache validation failed: ${error.message}`
      };
    }
  }

  // ==================== CACHE OPTIMIZATION ====================

  async optimizeCache(): Promise<CacheOperationResult> {
    try {
      const stats = await this.mhwildsRepository.getCacheStats();
      const optimizations = [];

      // Check for oversized cache
      const maxCacheSize = 100 * 1024 * 1024; // 100MB
      if (stats.totalSize > maxCacheSize) {
        optimizations.push('Cache size exceeds recommended limit');
      }

      // Check for too many locales
      if (stats.locales.length > 10) {
        optimizations.push('Consider removing unused locale caches');
      }

      // Check for orphaned files
      const expectedResources = ['weapons', 'armor', 'charms', 'decorations', 'skills'];
      const unexpectedResources = stats.resources.filter(r => !expectedResources.includes(r));
      
      if (unexpectedResources.length > 0) {
        optimizations.push(`Found unexpected cached resources: ${unexpectedResources.join(', ')}`);
      }

      return {
        success: true,
        message: 'Cache optimization analysis completed',
        stats: {
          currentStats: stats,
          recommendations: optimizations,
          healthScore: this.calculateCacheHealthScore(stats, optimizations)
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache optimization failed: ${error.message}`
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  private calculateCacheHealthScore(stats: any, optimizations: string[]): number {
    let score = 100;

    // Deduct points for optimizations needed
    score -= optimizations.length * 10;

    // Deduct points for excessive cache size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (stats.totalSize > maxSize) {
      score -= Math.min(30, (stats.totalSize - maxSize) / (10 * 1024 * 1024) * 10);
    }

    // Deduct points for too many locales
    if (stats.locales.length > 10) {
      score -= (stats.locales.length - 10) * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  formatCacheSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  formatCacheAge(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}