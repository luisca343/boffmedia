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
  ArcadeInventoryResponse
} from '@/generated/api';


  export interface DailyReward {
    day: number
    type: string
    amount: number
    description: string
  }

  export interface DailyRewardsConfig {
    totalDays: number;
    bannerName: string;
    rewards: DailyReward[];
  }

  export interface InventoryItem {
    id: number;
    itemId: string;
    itemType: string;
    amount: number;
    sourceType: string;
    used: number;
    rarity: string;
    createdAt: string;
  }

  export interface GetInventoryResponse {
    items: InventoryItem[];
    groupedItems: Record<string, InventoryItem[]>;
  }

  export interface ClaimItemsResponse {
    success: boolean;
    message: string;
    claimedIds: number[];
  }

  export interface AddInventoryItemRequest {
    uuid: string;
    itemId: string;
    itemType: string;
    amount?: number;
    sourceType?: string;
    sourceId?: number;
  }

  export interface AddInventoryItemResponse {
    success: boolean;
    message: string;
    itemId?: number;
  }

  export interface OpenLootBoxRequest {
    uuid: string;
    boxId: string;
  }

  export interface OpenLootBoxResponse {
    success: boolean;
    message?: string;
    item?: {
      id: string;
      name: string;
      weight: number;
      rarity: string;
      description: string;
      serverId?: number;
    };
  }

  export interface RarityRanges {
    [key: string]: {
      min: number;
      max: number;
    };
  }

  export interface LootBoxConfigResponse {
    rarityRanges: {
      [key: string]: {
        min: number;
        max: number;
      };
    }
    lootboxConfig: {
      boxes: Array<{
        id: string;
        name: string;
        image: string;
        description: string;
        items: Array<{
          id: string;
          rarity: string;
          weight: number;
        }>;
        theme: string;
      }>;
    }
  }
  export interface ClaimItemData {
    id: string;
    type: string;
  }

  export interface ClaimItemsWithTypesRequest {
    uuid: string;
    items: ClaimItemData[];
  }


export const arcadeService = {
  // ==================== STREAK ENDPOINTS ====================
  getRewardsBanner: (): Promise<ApiResponse<any>> => 
    rotomGET<any>('/arcade/banner'),

  /**
   * Get user's arcade streak status
   */
  getStreak: (uuid: string): Promise<ApiResponse<ArcadeStreak>> => 
    rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}`),

  /**
   * Claim daily arcade reward
   */
  claimDailyReward: (claimRewardDto: ClaimRewardDto): Promise<ApiResponse<{
    streak: ArcadeStreak;
    reward: any;
    inventoryItems?: ArcadeInventoryItem[];
  }>> => 
    rotomPOST<{
      streak: ArcadeStreak;
      reward: any;
      inventoryItems?: ArcadeInventoryItem[];
    }>('/arcade/streak/claim', claimRewardDto),

  /**
   * Get detailed streak statistics
   */
  getStreakStats: (uuid: string): Promise<ApiResponse<ArcadeStreak>> => 
    rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}/stats`),

  /**
   * Reset user streak (admin only)
   */
  resetStreak: (uuid: string): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>(`/arcade/streak/${uuid}/reset`, {}),

  // ==================== INVENTORY ENDPOINTS ====================
  
  /**
   * Get player inventory items
   */
  getInventory: (uuid: string, filters?: { 
    itemType?: string; 
    rarity?: string; 
  }): Promise<ApiResponse<ArcadeInventoryResponse>> => {
    const params = new URLSearchParams();
    if (filters?.itemType) params.append('itemType', filters.itemType);
    if (filters?.rarity) params.append('rarity', filters.rarity);
    
    const queryString = params.toString();
    const url = `/arcade/inventory/${uuid}${queryString ? `?${queryString}` : ''}`;
    
    return rotomGET<ArcadeInventoryResponse>(url);
  },

  /**
   * Get inventory statistics
   */
  getInventoryStats: (uuid: string): Promise<ApiResponse<{
    totalItems: number;
    itemsByType: Record<string, number>;
    itemsByRarity: Record<string, number>;
  }>> => 
    rotomGET<{
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    }>(`/arcade/inventory/${uuid}/stats`),

  /**
   * Get specific inventory item
   */
  getInventoryItem: (uuid: string, itemId: string): Promise<ApiResponse<ArcadeInventoryItem | null>> => 
    rotomGET<ArcadeInventoryItem | null>(`/arcade/inventory/${uuid}/item/${itemId}`),

  /**
   * Add item to player inventory
   */
  addInventoryItem: (addItemDto: AddInventoryItemDto): Promise<ApiResponse<ArcadeInventoryItem>> => 
    rotomPOST<ArcadeInventoryItem>('/arcade/inventory/add', addItemDto),

  /**
   * Consume an inventory item
   */
  consumeInventoryItem: (consumeItemDto: ConsumeInventoryItemDto): Promise<ApiResponse<{
    item: ArcadeInventoryItem | null;
    consumed: number;
  }>> => 
    rotomPOST<{
      item: ArcadeInventoryItem | null;
      consumed: number;
    }>('/arcade/inventory/consume', consumeItemDto),

  /**
   * Mark inventory item as used
   */
  markItemAsUsed: (uuid: string, itemId: string): Promise<ApiResponse<ArcadeInventoryItem>> => 
    rotomPOST<ArcadeInventoryItem>(`/arcade/inventory/${uuid}/item/${itemId}/use`, {}),

  // ==================== LOOTBOX ENDPOINTS ====================
  
  /**
   * Open a loot box and get a random item
   */
  openLootbox: (openLootBoxDto: OpenLootBoxDto): Promise<ApiResponse<OpenLootBoxResponseDto>> => 
    rotomPOST<OpenLootBoxResponseDto>('/arcade/lootbox/open', openLootBoxDto),

  /**
   * Give lootbox to player
   */
  giveLootbox: (giveLootboxDto: GiveLootboxDto): Promise<ApiResponse<SuccessResponse>> => 
    rotomPOST<SuccessResponse>('/arcade/lootbox/give', giveLootboxDto),

  /**
   * Get lootbox configuration
   */
  getLootboxConfig: (): Promise<ApiResponse<any>> => 
    rotomGET<any>('/arcade/lootbox/config'),

  // ==================== COMBINED ENDPOINTS ====================

  /**
   * Claim multiple items at once
   */
  /*
  claimMultipleItems: (claimItemsDto: ClaimInventoryItemsDto): Promise<ApiResponse<ArcadeInventoryItem[]>> => 
    rotomPOST<ArcadeInventoryItem[]>('/arcade/inventory/claim-multiple', claimItemsDto),
  */
  /**
   * Get complete user arcade data
   */
  getCompleteUserData: (uuid: string): Promise<ApiResponse<{
    streak: ArcadeStreak;
    inventory: ArcadeInventoryItem[];
    inventoryStats: {
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    };
  }>> => 
    rotomGET<{
      streak: ArcadeStreak;
      inventory: ArcadeInventoryItem[];
      inventoryStats: {
        totalItems: number;
        itemsByType: Record<string, number>;
        itemsByRarity: Record<string, number>;
      };
    }>(`/arcade/user/${uuid}/complete-data`),

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get user streak and check if can claim reward
   */
  getStreakStatus: async (uuid: string): Promise<ApiResponse<{
    streak: ArcadeStreak;
    canClaim: boolean;
  }>> => {
    const streakResponse = await rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}`);
    
    if (!streakResponse.success) {
      return streakResponse as any;
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
  },

  /**
   * Get inventory items by type
   */
  getInventoryByType: (uuid: string, itemType: string): Promise<ApiResponse<ArcadeInventoryResponse>> => 
    arcadeService.getInventory(uuid, { itemType }),

  /**
   * Get inventory items by rarity
   */
  getInventoryByRarity: (uuid: string, rarity: string): Promise<ApiResponse<ArcadeInventoryResponse>> => 
    arcadeService.getInventory(uuid, { rarity }),

  /**
   * Quick claim daily reward (convenience method)
   */
  quickClaimDaily: (uuid: string): Promise<ApiResponse<ArcadeStreakClaim>> => 
    arcadeService.claimDailyReward({ uuid }),

  /**
   * Quick open lootbox (convenience method)
   */
  quickOpenLootbox: (uuid: string, boxId: string): Promise<ApiResponse<OpenLootBoxResponseDto>> => 
    arcadeService.openLootbox({ uuid, boxId }),
};

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