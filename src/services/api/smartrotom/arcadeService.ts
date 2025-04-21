import { rotomGET, ApiResponse, rotomPOST } from '@/services/boffAPI';

export type ArcadeInfoResponse = any; // Replace 'any' with the actual type when available
export type WordleResponse = any; // Replace 'any' with the actual type when available


export interface DailyReward {
  day: number
  type: string
  amount: number
  description: string
}

// Update the ArcadeStreak interface to include banner information
export interface ArcadeStreak {
  lastClaimed: Date
  streak: number
  totalClaims: number
  currentDay?: number
  totalDays?: number
  nextReward?: DailyReward
  lastBanner?: string | null
  currentBanner?: string
  claimedToday?: boolean
  nextResetTime?: Date
  bannerChanged?: boolean
  
}

export interface ClaimRewardResponse {
  success: boolean
  rewardGiven: DailyReward
  newStreak: number
  currentDay?: number
  totalDays?: number
  nextReward?: DailyReward
  message?: string
  bannerName?: string
  nextResetTime: Date
  claimedToday?: boolean
  bannerChanged?: boolean
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
  getInfo: () => rotomGET<ArcadeInfoResponse>('/arcade'),
  getWordle: (uuid: string) => rotomGET<WordleResponse>(`/arcade/wordle/${uuid}`),

    openLootBox: (data: OpenLootBoxRequest) => rotomPOST<OpenLootBoxResponse>("/arcade/lootbox/open", data),
    getRewardsBanner: () => rotomGET<DailyRewardsConfig>("/arcade/banner"),
    getArcadeStreak: (uuid: string) => rotomGET<ArcadeStreak>(`/arcade/streak/${uuid}`),
    claimDailyReward: (uuid: string) => rotomPOST<ClaimRewardResponse>("/arcade/streak/claim", {uuid}),
    getInventory: (uuid: string, sourceType?: string) => rotomGET<GetInventoryResponse>(`/arcade/inventory/${uuid}${sourceType ? `?sourceType=${sourceType}` : ''}`),
    claimInventoryItems: (uuid: string, items: ClaimItemData[]) => rotomPOST<ClaimItemsResponse>("/arcade/inventory/claim", { uuid, items }),
    addInventoryItem: (data: AddInventoryItemRequest) => rotomPOST<AddInventoryItemResponse>("/arcade/inventory/add", data),
    consumeInventoryItem: (uuid: string, itemId: string) => rotomPOST<ApiResponse>("/arcade/inventory/consume", { uuid, itemId }),
    getLootboxConfig: () => rotomGET<LootBoxConfigResponse>("/arcade/lootbox/config"),
  
};

