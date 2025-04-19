import { rotomGET, ApiResponse, rotomPOST } from '@/services/boffAPI';

export type ArcadeInfoResponse = any; // Replace 'any' with the actual type when available
export type WordleResponse = any; // Replace 'any' with the actual type when available


export interface DailyReward {
  day: number
  type: string
  amount: number
  description?: string
}

export interface ArcadeStreak {
  lastClaimed: string
  streak: number
  totalClaims: number
  currentDay?: number
  totalDays?: number
  nextReward?: DailyReward
}

export interface ClaimRewardResponse {
  success: boolean
  rewardGiven: DailyReward
  newStreak: number
  currentDay?: number
  totalDays?: number
  nextReward?: DailyReward
  message?: string
}

export interface DailyRewardsConfig {
  totalDays: number;
  rewards: DailyReward[];
}

// New interfaces for inventory management
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
    image: string;
    rarity: string;
    description: string;
    serverId?: number;
  };
}
export interface LootBoxConfigResponse {
  boxes: Array<{
    id: string;
    name: string;
    image: string;
    description: string;
    items: Array<{
      id: string;
      image: string;
      rarity: string;
    }>;
    theme: string;
  }>;
}


export const arcadeService = {
  getInfo: () => rotomGET<ArcadeInfoResponse>('/arcade'),
  getWordle: (uuid: string) => rotomGET<WordleResponse>(`/arcade/wordle/${uuid}`),

    openLootBox: (data: OpenLootBoxRequest) => rotomPOST<OpenLootBoxResponse>("/arcade/lootbox/open", data),
    getRewardsBanner: () => rotomGET<DailyRewardsConfig>("/arcade/banner"),
    getArcadeStreak: () => rotomGET<ArcadeStreak>("/arcade/streak"),
    claimDailyReward: (uuid: string) => rotomPOST<ClaimRewardResponse>("/arcade/streak/claim", {uuid}),
    getInventory: (uuid: string, sourceType?: string) => rotomGET<GetInventoryResponse>(`/arcade/inventory/${uuid}${sourceType ? `?sourceType=${sourceType}` : ''}`),
    claimInventoryItems: (uuid: string, itemIds: number[]) => rotomPOST<ClaimItemsResponse>("/arcade/inventory/claim", { uuid, itemIds }),
    addInventoryItem: (data: AddInventoryItemRequest) => rotomPOST<AddInventoryItemResponse>("/arcade/inventory/add", data),
    consumeInventoryItem: (uuid: string, itemId: string) => rotomPOST<ApiResponse>("/arcade/inventory/consume", { uuid, itemId }),
    getLootboxConfig: () => rotomGET<LootBoxConfigResponse>("/arcade/lootbox/config"),
  
};

