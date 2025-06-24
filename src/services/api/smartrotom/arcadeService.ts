import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import type {
  ArcadeStreak,
  ArcadeInventoryItem,
  ArcadeStreakClaim,
  ArcadeInventoryResponse,
  ClaimRewardDto,
  OpenLootBoxDto,
  OpenLootBoxResponseDto,
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
  GiveLootboxDto,
  LootboxConfigEntity
} from '@/generated/api';

export class ArcadeService {
  /**
   * Get arcade information
   */
  static getArcade(): Promise<ApiResponse<string>> {
    return rotomGET<string>('/arcade');
  }

  // ==================== STREAK ENDPOINTS ====================
  /**
   * Get daily rewards banner configuration
   */
  static getRewardsBanner(): Promise<ApiResponse<any>> {
    return rotomGET<any>('/arcade/banner');
  }

  /**
   * Get user's arcade streak status
   */
  static getUserStreak(uuid: string): Promise<ApiResponse<ArcadeStreak>> {
    return rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}`);
  }

  /**
   * Claim daily arcade reward
   */
  static claimDailyReward(claimRewardDto: ClaimRewardDto): Promise<ApiResponse<ArcadeStreakClaim>> {
    return rotomPOST<ArcadeStreakClaim>('/arcade/streak/claim', claimRewardDto);
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
  static resetUserStreak(uuid: string): Promise<ApiResponse<void>> {
    return rotomPOST<void>(`/arcade/streak/${uuid}/reset`, {});
  }

  // ==================== INVENTORY ENDPOINTS ====================
  /**
   * Get player inventory items
   */
  static getUserInventory(
    uuid: string,
    itemType?: string,
    rarity?: string
  ): Promise<ApiResponse<ArcadeInventoryResponse>> {
    let url = `/arcade/inventory/${uuid}`;
    const params = new URLSearchParams();
    
    if (itemType) params.append('itemType', itemType);
    if (rarity) params.append('rarity', rarity);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
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
    return rotomGET(`/arcade/inventory/${uuid}/stats`);
  }

  /**
   * Get specific inventory item
   */
  static getUserItem(uuid: string, itemId: string): Promise<ApiResponse<ArcadeInventoryItem | null>> {
    return rotomGET<ArcadeInventoryItem | null>(`/arcade/inventory/${uuid}/item/${itemId}`);
  }

  /**
   * Add item to player inventory
   */
  static addInventoryItem(addInventoryItemDto: AddInventoryItemDto): Promise<ApiResponse<ArcadeInventoryItem>> {
    return rotomPOST<ArcadeInventoryItem>('/arcade/inventory/add', addInventoryItemDto);
  }

  /**
   * Consume an inventory item
   */
  static consumeInventoryItem(consumeInventoryItemDto: ConsumeInventoryItemDto): Promise<ApiResponse<{
    item: ArcadeInventoryItem | null;
    consumed: number;
  }>> {
    return rotomPOST('/arcade/inventory/consume', consumeInventoryItemDto);
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
  static giveLootbox(giveLootboxDto: GiveLootboxDto): Promise<ApiResponse<void>> {
    return rotomPOST<void>('/arcade/lootbox/give', giveLootboxDto);
  }

  /**
   * Get lootbox configuration
   */
  static getLootboxConfig(): Promise<ApiResponse<LootboxConfigEntity>> {
    return rotomGET<any>('/arcade/lootbox/config');
  }

  // ==================== COMBINED ENDPOINTS ====================
  /**
   * Get complete user arcade data
   */
  static getCompleteUserData(uuid: string): Promise<ApiResponse<{
    streak: ArcadeStreak;
    inventory: ArcadeInventoryResponse;
    inventoryStats: {
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    };
  }>> {
    return rotomGET(`/arcade/user/${uuid}/complete-data`);
  }

  // ==================== CONVENIENCE METHODS ====================
  /**
   * Quick method to open a lootbox
   */
  static quickOpenLootbox(uuid: string, boxId: string): Promise<ApiResponse<OpenLootBoxResponseDto>> {
    return ArcadeService.openLootbox({ uuid, boxId });
  }

  /**
   * Quick method to get user inventory
   */
  static getInventory(uuid: string): Promise<ApiResponse<ArcadeInventoryResponse>> {
    return ArcadeService.getUserInventory(uuid);
  }

  /**
   * Quick method to claim daily reward
   */
  static claimDaily(uuid: string): Promise<ApiResponse<ArcadeStreakClaim>> {
    return ArcadeService.claimDailyReward({ uuid });
  }

  /**
   * Quick method to consume an inventory item
   */
  static consumeItem(uuid: string, itemId: string, amount: number = 1): Promise<ApiResponse<{
    item: ArcadeInventoryItem | null;
    consumed: number;
  }>> {
    return ArcadeService.consumeInventoryItem({ uuid, itemId, amount });
  }


  /**
   * Get user streak and check if can claim reward
   */
  static getStreakStatus(uuid: string): Promise<ApiResponse<{
    streak: ArcadeStreak;
    canClaim: boolean;
  }>> {
    return new Promise(async (resolve) => {
      const streakResponse = await ArcadeService.getUserStreak(uuid);
      
      if (!streakResponse.success) {
        resolve(streakResponse as any);
        return;
      }

      const streak = streakResponse.data!;
      const canClaimBasic = !streak.lastClaimed || 
        new Date(streak.lastClaimed).toDateString() !== new Date().toDateString();

      resolve({
        success: true,
        statusCode: 200,
        message: 'Success',
        data: {
          streak: streak,
          canClaim: canClaimBasic
        }
      });
    });
  }

}

// Export types for convenience
export type {
  ArcadeStreak,
  ArcadeInventoryItem,
  ArcadeStreakClaim,
  ArcadeInventoryResponse,
  ClaimRewardDto,
  OpenLootBoxDto,
  OpenLootBoxResponseDto,
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
  GiveLootboxDto,
  ApiResponse
};