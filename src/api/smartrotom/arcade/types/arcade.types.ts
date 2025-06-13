// ==================== BASE TYPES ====================
export interface BaseArcadeStreak {
  id: number;
  uuid: string;
  lastClaimed: Date | null;
  lastBanner: string | null;
  streak: number;
  totalClaims: number;
}

export interface BaseInventoryItem {
  id: number;
  uuid: string;
  itemId: string;
  itemType: string;
  amount: number;
  sourceType: string | null;
  used: number;
  rarity: string | null;
  createdAt: Date;
}

export interface BaseLootBox {
  id: string;
  name: string;
  image: string;
  description: string;
  theme: string;
}

export interface BaseLootBoxItem {
  id: string;
  weight: number;
}

// ==================== CONFIG TYPES ====================
export interface DailyRewardItem {
  day: number;
  type: string;
  amount: number;
  description?: string;
}

export interface DailyRewardsConfig {
  totalDays: number;
  name: string;
  rewards: DailyRewardItem[];
}

// ==================== REQUEST TYPES ====================
export interface GetArcadeStreakRequest {
  uuid: string;
}

export interface ClaimDailyRewardRequest {
  uuid: string;
}

export interface OpenLootBoxRequest {
  uuid: string;
  boxId: string;
  itemId: number;
}

export interface GetInventoryRequest {
  uuid: string;
  sourceType?: string;
}

export interface AddInventoryItemRequest {
  uuid: string;
  itemId: string;
  itemType: string;
  name: string;
  amount?: number;
  sourceType?: string;
  sourceId?: number;
  rarity?: string;
}

export interface ConsumeInventoryItemRequest {
  uuid: string;
  itemId: string;
}

export interface ClaimInventoryItemsRequest {
  uuid: string;
  items: ClaimItemData[];
}

export interface GiveLootboxRequest {
  uuid: string;
  lootboxType: string;
  amount?: number;
}

// ==================== RESPONSE TYPES ====================
export interface ArcadeStreakResponse {
  lastClaimed: Date | null;
  streak: number;
  totalClaims: number;
  lastBanner: string | null;
  currentDay: number;
  totalDays: number;
  nextReward: DailyRewardItem;
  currentBanner: string;
  claimedToday: boolean;
  nextResetTime: string;
  bannerChanged: boolean;
}

export interface ClaimRewardResponse {
  success: boolean;
  rewardGiven: DailyRewardItem | null;
  newStreak: number;
  currentDay?: number;
  totalDays?: number;
  nextReward?: DailyRewardItem;
  message: string;
  bannerName?: string;
}

export interface InventoryResponse {
  items: ProcessedInventoryItem[];
  groupedItems: Record<string, ProcessedInventoryItem[]>;
  rawItems: RawInventoryItem[];
}

export interface AddInventoryItemResponse {
  success: boolean;
  message: string;
  itemId?: number;
}

export interface ConsumeInventoryItemResponse {
  success: boolean;
  message: string;
  consumed: boolean;
  itemDetails?: ConsumedItemDetails;
}

export interface ClaimInventoryItemsResponse {
  success: boolean;
  message: string;
  claimedItems?: ClaimedItemSummary[];
  regularItems?: RegularItemsResult;
  pokemonItems?: PokemonItemsResult;
}

export interface OpenLootBoxResponse {
  success: boolean;
  message?: string;
  item?: LootBoxRewardItem;
  spinnerItems?: SpinnerItem[];
  winningPosition?: number;
}

export interface GiveLootboxResponse {
  success: boolean;
  message: string;
}

export interface LootBoxConfigResponse {
  rarityRanges: Record<string, RarityRange>;
  lootboxConfig: LootBoxConfig;
}

// ==================== INTERNAL TYPES ====================
export interface ClaimItemData {
  id: string;
  type?: string;
}

export interface ProcessedInventoryItem extends BaseInventoryItem {
  totalAmount?: number;
  usedAmount?: number;
  remainingAmount?: number;
  originalIds: number[];
}

export interface RawInventoryItem extends BaseInventoryItem {}

export interface ConsumedItemDetails extends BaseInventoryItem {
  remainingAmount: number;
  totalRemaining: number;
}

export interface ClaimedItemSummary {
  id: number;
  itemId: string;
  itemType: string;
}

export interface RegularItemsResult {
  count: number;
  optimizedStackCount: number;
  giveResult: any;
}

export interface PokemonItemsResult {
  count: number;
  processedItems: PokemonProcessResult[];
}

export interface PokemonProcessResult {
  id: number;
  itemId: string;
  result?: any;
  error?: string;
}

export interface LootBoxRewardItem {
  id: string;
  rarity: string;
  serverId?: number;
}

export interface SpinnerItem {
  id: string;
  weight: number;
  isWinningItem: boolean;
}

export interface RarityRange {
  min: number;
  max: number;
}

export interface LootBoxConfig {
  boxes: LootBoxDefinition[];
}

export interface LootBoxDefinition extends BaseLootBox {
  items: BaseLootBoxItem[];
}

export interface StreakUpdateData {
  lastClaimed: Date;
  streak: number;
  totalClaims: number;
  lastBanner: string;
}

export interface OptimizedItemStack {
  id: string;
  amount: number;
}

// ==================== TYPE ALIASES ====================
export type ArcadeStreak = ArcadeStreakResponse;