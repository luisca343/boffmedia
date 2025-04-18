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
  name: string;
  amount?: number;
  sourceType?: string;
  sourceId?: number;
}

export interface AddInventoryItemResponse {
  success: boolean;
  message: string;
  itemId?: number;
}


export const arcadeService = {
  getInfo: () => rotomGET<ArcadeInfoResponse>('/arcade'),
  getWordle: (uuid: string) => rotomGET<WordleResponse>(`/arcade/wordle/${uuid}`),

    getRewardsBanner: () => rotomGET<DailyRewardsConfig>("/arcade/banner"),
    getArcadeStreak: () => rotomGET<ArcadeStreak>("/arcade/streak"),
    claimDailyReward: (uuid: string) => rotomPOST<ClaimRewardResponse>("/arcade/streak/claim", {uuid}),
    getInventory: (uuid: string, sourceType?: string) => rotomGET<GetInventoryResponse>(`/inventory/${uuid}${sourceType ? `?sourceType=${sourceType}` : ''}`),
    claimInventoryItems: (uuid: string, itemIds: number[]) => rotomPOST<ClaimItemsResponse>("/inventory/claim", { uuid, itemIds }),
    addInventoryItem: (data: AddInventoryItemRequest) => rotomPOST<AddInventoryItemResponse>("/inventory/add", data),
    consumeInventoryItem: (uuid: string, itemId: string) => rotomPOST<ApiResponse>("/inventory/consume", { uuid, itemId }),
};

