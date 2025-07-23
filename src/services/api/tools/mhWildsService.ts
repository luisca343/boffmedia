import { ArmorPiece, Charm, Decoration, Weapon } from "@/types/tools/mhwilds";
import { apiGET, apiPOST, apiDELETE, ApiResponse } from "@/services/boffAPI";

export class MhWildsService {
  // ==================== BASIC DATA OPERATIONS ====================

  /**
   * Get all weapons
   */
  static getWeapons(locale?: string): Promise<ApiResponse<Weapon[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<Weapon[]>(`/tools/mhwilds/weapons${params}`);
  }

  /**
   * Get all armor pieces
   */
  static getArmor(locale?: string): Promise<ApiResponse<ArmorPiece[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<ArmorPiece[]>(`/tools/mhwilds/armor${params}`);
  }

  /**
   * Get all charms
   */
  static getCharms(locale?: string): Promise<ApiResponse<Charm[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<Charm[]>(`/tools/mhwilds/charms${params}`);
  }

  /**
   * Get all decorations
   */
  static getDecorations(locale?: string): Promise<ApiResponse<Decoration[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<Decoration[]>(`/tools/mhwilds/decorations${params}`);
  }

  /**
   * Get all skills
   */
  static getSkills(locale?: string): Promise<ApiResponse<any[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<any[]>(`/tools/mhwilds/skills${params}`);
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  /**
   * Get all charm ranks with crafting details
   */
  static getCharmRanks(locale?: string): Promise<ApiResponse<any[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<any[]>(`/tools/mhwilds/charms/ranks${params}`);
  }

  /**
   * Get weapon upgrade tree
   */
  static getWeaponTree(locale?: string): Promise<ApiResponse<any>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<any>(`/tools/mhwilds/weapons/tree${params}`);
  }

  // ==================== SEARCH AND FILTER OPERATIONS ====================

  /**
   * Search weapons by name
   */
  static searchWeaponsByName(searchTerm: string, locale?: string): Promise<ApiResponse<Weapon[]>> {
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    if (locale) params.append('locale', locale);
    return apiGET<Weapon[]>(`/tools/mhwilds/weapons/search?${params.toString()}`);
  }

  /**
   * Get weapons by kind/type
   */
  static getWeaponsByKind(kind: string, locale?: string): Promise<ApiResponse<Weapon[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<Weapon[]>(`/tools/mhwilds/weapons/kind/${kind}${params}`);
  }

  /**
   * Get armor by rarity
   */
  static getArmorByRarity(rarity: number, locale?: string): Promise<ApiResponse<ArmorPiece[]>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<ArmorPiece[]>(`/tools/mhwilds/armor/rarity/${rarity}${params}`);
  }

  // ==================== STATISTICS OPERATIONS ====================

  /**
   * Get MHWilds data statistics
   */
  static getStatistics(locale?: string): Promise<ApiResponse<any>> {
    const params = locale ? `?locale=${locale}` : '';
    return apiGET<any>(`/tools/mhwilds/statistics${params}`);
  }

  // ==================== CACHE MANAGEMENT OPERATIONS ====================

  /**
   * Clear cache
   */
  static clearCache(resourceType?: string, locale?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (resourceType) params.append('resourceType', resourceType);
    if (locale) params.append('locale', locale);
    const queryString = params.toString();
    return apiDELETE<any>(`/tools/mhwilds/cache${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get cache statistics
   */
  static getCacheStatistics(): Promise<ApiResponse<any>> {
    return apiGET<any>('/tools/mhwilds/cache/statistics');
  }

  /**
   * Warmup cache for a locale
   */
  static warmupCache(locale?: string): Promise<ApiResponse<any>> {
    return apiPOST<any>('/tools/mhwilds/cache/warmup', { locale });
  }

  /**
   * Validate cache for a locale
   */
  static validateCache(locale?: string): Promise<ApiResponse<any>> {
    return apiPOST<any>('/tools/mhwilds/cache/validate', { locale });
  }

  /**
   * Optimize cache storage
   */
  static optimizeCache(): Promise<ApiResponse<any>> {
    return apiPOST<any>('/tools/mhwilds/cache/optimize', {});
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Get supported locales
   */
  static getSupportedLocales(): Promise<ApiResponse<any>> {
    return apiGET<any>('/tools/mhwilds/locales');
  }

  /**
   * Get available resources
   */
  static getAvailableResources(): Promise<ApiResponse<any>> {
    return apiGET<any>('/tools/mhwilds/resources');
  }
}