import { rotomGET, rotomPOST, rotomPATCH, rotomDELETE, ApiResponse } from '@/services/boffAPI';
import type { 
  ArcadeStreak, 
  ClaimRewardResponse,
  ClaimRewardDto,
  OpenLootBoxDto,
  OpenLootBoxResponseDto,
  InventoryResponse,
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
  ClaimInventoryItemsDto,
  GiveLootboxDto,
  LootboxConfigResponse,
  SuccessResponse 
} from '@/generated/api';

export const arcadeService = {
  /**
   * Get arcade information
   */
  getArcade: (): Promise<ApiResponse<string>> => 
    rotomGET<string>('/arcade'),

  /**
   * Get Wordle game for a player
   */
  getWordle: (uuid: string): Promise<ApiResponse<string>> => 
    rotomGET<string>(`/arcade/wordle/${uuid}`),

  // ==================== STREAK MANAGEMENT ====================

  /**
   * Get user's arcade streak status
   */
  getStreak: (uuid: string): Promise<ApiResponse<ArcadeStreak>> => 
    rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}`),

  /**
   * Claim daily arcade reward
   */
  claimDailyReward: (claimRewardDto: ClaimRewardDto): Promise<ApiResponse<ClaimRewardResponse>> => 
    rotomPOST<ClaimRewardResponse>('/arcade/streak/claim', claimRewardDto),

  /**
   * Get daily rewards banner configuration
   */
  getRewardsBanner: (): Promise<ApiResponse<any>> => 
    rotomGET<any>('/arcade/banner'),

  // ==================== INVENTORY MANAGEMENT ====================

  /**
   * Get player inventory items
   */
  getInventory: (uuid: string, sourceType?: string): Promise<ApiResponse<InventoryResponse>> => {
    const params = sourceType ? `?sourceType=${encodeURIComponent(sourceType)}` : '';
    return rotomGET<InventoryResponse>(`/arcade/inventory/${uuid}${params}`);
  },

  /**
   * Add item to player inventory
   */
  addInventoryItem: (addInventoryItemDto: AddInventoryItemDto): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/arcade/inventory/add', addInventoryItemDto),

  /**
   * Consume an inventory item
   */
  consumeInventoryItem: (consumeInventoryItemDto: ConsumeInventoryItemDto): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/arcade/inventory/consume', consumeInventoryItemDto),

  /**
   * Claim items from player inventory
   */
  claimInventoryItems: (claimInventoryItemsDto: ClaimInventoryItemsDto): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/arcade/inventory/claim', claimInventoryItemsDto),

  // ==================== LOOTBOX MANAGEMENT ====================

  /**
   * Open a loot box and get a random item
   */
  openLootBox: (openLootBoxDto: OpenLootBoxDto): Promise<ApiResponse<OpenLootBoxResponseDto>> => 
    rotomPOST<OpenLootBoxResponseDto>('/arcade/lootbox/open', openLootBoxDto),

  /**
   * Get lootbox configuration
   */
  getLootboxConfig: (): Promise<ApiResponse<LootboxConfigResponse>> => 
    rotomGET<LootboxConfigResponse>('/arcade/lootbox/config'),

  /**
   * Give lootbox to player (Admin function)
   */
  giveLootbox: (giveLootboxDto: GiveLootboxDto): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/arcade/lootbox/give', giveLootboxDto),

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get streak and claim reward in one call (for UI convenience)
   */
  getStreakAndClaim: async (uuid: string): Promise<{
    streak: ApiResponse<ArcadeStreak>;
    claimResult?: ApiResponse<ClaimRewardResponse>;
  }> => {
    const streak = await arcadeService.getStreak(uuid);
    
    // Only attempt to claim if the streak indicates it's possible
    if (streak.success && streak.data && !streak.data.claimedToday) {
      try {
        const claimResult = await arcadeService.claimDailyReward({ uuid });
        return { streak, claimResult };
      } catch (error) {
        console.warn('Failed to auto-claim reward:', error);
        return { streak };
      }
    }
    
    return { streak };
  },

  /**
   * Get inventory filtered by lootboxes only
   */
  getLootboxInventory: (uuid: string): Promise<ApiResponse<InventoryResponse>> => 
    arcadeService.getInventory(uuid, 'arcade'),

  /**
   * Quick method to claim daily reward by UUID
   */
  quickClaimReward: (uuid: string): Promise<ApiResponse<ClaimRewardResponse>> => 
    arcadeService.claimDailyReward({ uuid }),

  /**
   * Quick method to consume lootbox by item ID
   */
  quickConsumeLootbox: (uuid: string, itemId: string): Promise<ApiResponse<SuccessResponse>> => 
    arcadeService.consumeInventoryItem({ uuid, itemId }),
};

// Export types for convenience
export type { 
  ArcadeStreak, 
  ClaimRewardResponse,
  ClaimRewardDto,
  OpenLootBoxDto,
  OpenLootBoxResponseDto,
  InventoryResponse,
  AddInventoryItemDto,
  ConsumeInventoryItemDto,
  ClaimInventoryItemsDto,
  GiveLootboxDto,
  LootboxConfigResponse,
  SuccessResponse,
  ApiResponse 
};