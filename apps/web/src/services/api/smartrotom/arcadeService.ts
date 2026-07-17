import { rotomGET, rotomPOST, rotomPATCH, rotomDELETE, ApiResponse } from '@/services/boffAPI';
import type { 
  ArcadeInventoryItem, 
  OpenLootBoxDto, 
  OpenLootBoxResponseDto,
  ClaimRewardDto,
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
  GiveLootboxDto,
  ArcadeStreakClaim,
  SuccessResponse,
  ArcadeStreak,
  ArcadeInventoryResponse,
  LootboxConfigEntity
} from '@boffmedia/shared';

export class ArcadeService {
  // ==================== STREAK ENDPOINTS ====================
  
  /**
   * Get rewards banner
   */
  static getRewardsBanner(): Promise<ApiResponse<any>> {
    return rotomGET<any>('/arcade/banner');
  }

  /**
   * Get user's arcade streak status
   */
  static getStreak(uuid: string): Promise<ApiResponse<ArcadeStreak>> {
    return rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}`);
  }

  /**
   * Claim daily arcade reward
   */
  static claimDailyReward(claimRewardDto: ClaimRewardDto): Promise<ApiResponse<{
    streak: ArcadeStreak;
    reward: any;
    inventoryItems?: ArcadeInventoryItem[];
  }>> {
    return rotomPOST<{
      streak: ArcadeStreak;
      reward: any;
      inventoryItems?: ArcadeInventoryItem[];
    }>('/arcade/streak/claim', claimRewardDto);
  }

  /**
   * Get detailed streak statistics
   */
  static getStreakStats(uuid: string): Promise<ApiResponse<ArcadeStreak>> {
    return rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}/stats`);
  }

  /**
   * Reset user streak (admin only)
   */
  static resetStreak(uuid: string): Promise<ApiResponse<SuccessResponse>> {
    return rotomPOST<SuccessResponse>(`/arcade/streak/${uuid}/reset`, {});
  }

  // ==================== INVENTORY ENDPOINTS ====================
  
  /**
   * Get player inventory items
   */
  static getInventory(uuid: string, filters?: { 
    itemType?: string; 
    rarity?: string; 
  }): Promise<ApiResponse<ArcadeInventoryResponse>> {
    const params = new URLSearchParams();
    if (filters?.itemType) params.append('itemType', filters.itemType);
    if (filters?.rarity) params.append('rarity', filters.rarity);
    
    const queryString = params.toString();
    const url = `/arcade/inventory/${uuid}${queryString ? `?${queryString}` : ''}`;
    
    return rotomGET<ArcadeInventoryResponse>(url);
  }

  /**
   * Get inventory statistics
   */
  static getInventoryStats(uuid: string): Promise<ApiResponse<{
    totalItems: number;
    itemsByType: Record<string, number>;
    itemsByRarity: Record<string, number>;
  }>> {
    return rotomGET<{
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    }>(`/arcade/inventory/${uuid}/stats`);
  }

  /**
   * Get specific inventory item
   */
  static getInventoryItem(uuid: string, itemId: string): Promise<ApiResponse<ArcadeInventoryItem | null>> {
    return rotomGET<ArcadeInventoryItem | null>(`/arcade/inventory/${uuid}/item/${itemId}`);
  }

  /**
   * Add item to player inventory
   */
  static addInventoryItem(addItemDto: AddInventoryItemDto): Promise<ApiResponse<ArcadeInventoryItem>> {
    return rotomPOST<ArcadeInventoryItem>('/arcade/inventory/add', addItemDto);
  }

  /**
   * Consume an inventory item
   */
  static consumeInventoryItem(consumeItemDto: ConsumeInventoryItemDto): Promise<ApiResponse<{
    item: ArcadeInventoryItem | null;
    consumed: number;
  }>> {
    return rotomPOST<{
      item: ArcadeInventoryItem | null;
      consumed: number;
    }>('/arcade/inventory/consume', consumeItemDto);
  }

  /**
   * Mark inventory item as used
   */
  static markItemAsUsed(uuid: string, itemId: string): Promise<ApiResponse<ArcadeInventoryItem>> {
    return rotomPOST<ArcadeInventoryItem>(`/arcade/inventory/${uuid}/item/${itemId}/use`, {});
  }

  // ==================== LOOTBOX ENDPOINTS ====================
  
  /**
   * Open a loot box and get a random item
   */
  static openLootbox(openLootBoxDto: OpenLootBoxDto): Promise<ApiResponse<OpenLootBoxResponseDto>> {
    return rotomPOST<OpenLootBoxResponseDto>('/arcade/lootbox/open', openLootBoxDto);
  }

  /**
   * Give lootbox to player
   */
  static giveLootbox(giveLootboxDto: GiveLootboxDto): Promise<ApiResponse<SuccessResponse>> {
    return rotomPOST<SuccessResponse>('/arcade/lootbox/give', giveLootboxDto);
  }

  /**
   * Get lootbox configuration
   */
  static getLootboxConfig(): Promise<ApiResponse<LootboxConfigEntity>> {
    return rotomGET<LootboxConfigEntity>('/arcade/lootbox/config');
  }

  // Claiming moved to MCEF delivery — see useClaimItems / darCaja('arcade', ids).

  /**
   * Get complete user arcade data
   */
  static getCompleteUserData(uuid: string): Promise<ApiResponse<{
    streak: ArcadeStreak;
    inventory: ArcadeInventoryItem[];
    inventoryStats: {
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    };
  }>> {
    return rotomGET<{
      streak: ArcadeStreak;
      inventory: ArcadeInventoryItem[];
      inventoryStats: {
        totalItems: number;
        itemsByType: Record<string, number>;
        itemsByRarity: Record<string, number>;
      };
    }>(`/arcade/user/${uuid}/complete-data`);
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get user streak and check if can claim reward
   */
  static async getStreakStatus(uuid: string): Promise<ApiResponse<{
    streak: ArcadeStreak;
    canClaim: boolean;
  }>> {
    const streakResponse = await rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}`);
    
    if (!streakResponse.success) {
      // Error path: `data` is absent on the wire, so the ArcadeStreak generic never
      // actually applies here — only the error/success/message fields are forwarded.
      return streakResponse as unknown as ApiResponse<{
        streak: ArcadeStreak;
        canClaim: boolean;
      }>;
    }

    // Simple client-side check (server does the real validation)
    const streak = streakResponse.data!;
    const canClaimBasic = !streak.lastClaimed || 
      new Date(streak.lastClaimed).toDateString() !== new Date().toDateString();

    return {
      success: true,
      data: {
        streak: streak,
        canClaim: canClaimBasic
      }
    } as ApiResponse<{
      streak: ArcadeStreak;
      canClaim: boolean;
    }>;
  }

  /**
   * Get inventory items by type
   */
  static getInventoryByType(uuid: string, itemType: string): Promise<ApiResponse<ArcadeInventoryResponse>> {
    return ArcadeService.getInventory(uuid, { itemType });
  }

  /**
   * Get inventory items by rarity
   */
  static getInventoryByRarity(uuid: string, rarity: string): Promise<ApiResponse<ArcadeInventoryResponse>> {
    return ArcadeService.getInventory(uuid, { rarity });
  }

  /**
   * Quick claim daily reward (convenience method)
   */
  static quickClaimDaily(uuid: string): Promise<ApiResponse<ArcadeStreakClaim>> {
    return ArcadeService.claimDailyReward({ uuid });
  }

  /**
   * Quick open lootbox (convenience method)
   */
  static quickOpenLootbox(uuid: string, boxId: string): Promise<ApiResponse<OpenLootBoxResponseDto>> {
    return ArcadeService.openLootbox({ uuid, boxId });
  }
}

// Export types for convenience
export type { 
  ArcadeStreak, 
  ArcadeInventoryItem, 
  OpenLootBoxDto, 
  OpenLootBoxResponseDto,
  ClaimRewardDto,
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
  GiveLootboxDto,
  SuccessResponse,
  ApiResponse 
};