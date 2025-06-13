import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { StreakService } from './services/streak.service';
import { InventoryService } from './services/inventory.service';
import { LootboxService } from './services/lootbox.service';
import {
  ArcadeStreakResponse,
  ClaimRewardResponse,
  InventoryResponse,
  AddInventoryItemRequest,
  AddInventoryItemResponse,
  ConsumeInventoryItemResponse,
  ClaimInventoryItemsResponse,
  ClaimItemData,
  OpenLootBoxRequest,
  OpenLootBoxResponse,
  GiveLootboxResponse,
  LootBoxConfigResponse,
  DailyRewardItem,
  OptimizedItemStack,
  DailyRewardsConfig
} from './types/arcade.types';
import { rarityRanges } from './_config/lootboxConfig';
import { loadRewardsConfig } from '../_main/_config/daily-rewards.config';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';

@Injectable()
export class ArcadeFacadeService implements OnModuleInit {
  private rewardsConfig: DailyRewardsConfig;
  
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly streakService: StreakService,
    private readonly inventoryService: InventoryService,
    private readonly lootboxService: LootboxService,
    private readonly starbankService: StarbankFacadeService,
    private readonly wingullService: WingullFacadeService,
  ) {}
  
  onModuleInit() {
    this.rewardsConfig = loadRewardsConfig();
    console.log(`Loaded daily rewards configuration: ${this.rewardsConfig.totalDays} total days`);
  }

  // ==================== STREAK MANAGEMENT ====================
  
  async getArcadeStreak(uuid: string): Promise<ArcadeStreakResponse> {
    return this.streakService.getArcadeStreak(uuid, this.rewardsConfig);
  }

  async claimDailyReward(uuid: string): Promise<ClaimRewardResponse> {
    try {
      const currentStreak = await this.getArcadeStreak(uuid);

      if (currentStreak.claimedToday) {
        return {
          success: false,
          rewardGiven: null,
          newStreak: currentStreak.streak,
          message: "You've already claimed your daily reward today."
        };
      }

      // Calculate new streak
      const bannerChanged = currentStreak.lastBanner && 
                           currentStreak.lastBanner !== this.rewardsConfig.name;
      
      let newStreak = bannerChanged ? 1 : currentStreak.streak + 1;
      const dayInCycle = ((newStreak - 1) % this.rewardsConfig.totalDays) + 1;
      
      // Get reward from configuration
      const reward = this.getRewardForDay(dayInCycle);

      // Update streak
      await this.streakService.updateStreak(uuid, {
        lastClaimed: new Date(),
        streak: newStreak,
        totalClaims: (currentStreak.totalClaims || 0) + 1,
        lastBanner: this.rewardsConfig.name
      });
      
      // Award the reward
      await this.awardReward(uuid, reward);
      
      // Calculate next reward
      const nextDayInCycle = (dayInCycle % this.rewardsConfig.totalDays) + 1;
      const nextReward = this.getRewardForDay(nextDayInCycle);
      
      return {
        success: true,
        rewardGiven: reward,
        newStreak: newStreak,
        currentDay: dayInCycle,
        totalDays: this.rewardsConfig.totalDays,
        nextReward: nextReward,
        message: reward.description || this.getDefaultRewardMessage(dayInCycle),
        bannerName: this.rewardsConfig.name
      };
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      throw error;
    }
  }

  async getRewardsBanner(): Promise<DailyRewardsConfig> {
    return this.rewardsConfig;
  }

  // ==================== INVENTORY MANAGEMENT ====================
  
  async getInventory(uuid: string, sourceType?: string): Promise<InventoryResponse> {
    return this.inventoryService.getInventory(uuid, sourceType);
  }

  async addInventoryItem(data: AddInventoryItemRequest): Promise<AddInventoryItemResponse> {
    try {
      const result = await this.inventoryService.addInventoryItem(data);
      return {
        success: true,
        message: 'Item added to inventory successfully',
        itemId: result.insertId
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async consumeInventoryItem(uuid: string, itemId: string): Promise<ConsumeInventoryItemResponse> {
    try {
      const result = await this.inventoryService.consumeInventoryItem(uuid, itemId);
      return {
        success: true,
        message: `Successfully consumed ${itemId}`,
        consumed: true,
        itemDetails: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        consumed: false
      };
    }
  }

  async claimInventoryItems(uuid: string, items: ClaimItemData[]): Promise<ClaimInventoryItemsResponse> {
    try {
      if (!Array.isArray(items) || items.length === 0) {
        return {
          success: false,
          message: 'No items to claim'
        };
      }

      const inventory = await this.getInventory(uuid);
      const itemIds = items.map(item => item.id);
      
      const inventoryItems = inventory.rawItems.filter(item => 
        itemIds.includes(item.itemId)
      );

      if (inventoryItems.length === 0) {
        return {
          success: false,
          message: 'No items found for the provided IDs'
        };
      }

      // Separate Pokémon and regular items
      const pokemonItems = inventoryItems.filter(item => 
        item.itemType.toLowerCase() === 'pokemon'
      );
      const regularItems = inventoryItems.filter(item => 
        item.itemType.toLowerCase() !== 'pokemon'
      );

      // Process regular items
      const regularItemsToGive = this.processRegularItems(regularItems);
      
      // Process Pokémon items
      const pokemonResults = await this.processPokemonItems(uuid, pokemonItems);
      
      // Give regular items
      let regularItemsResult = null;
      if (regularItemsToGive.length > 0) {
        regularItemsResult = await this.wingullService.giveItems(uuid, regularItemsToGive);
      }

      return {
        success: true,
        message: 'Items claimed and sent to player successfully',
        claimedItems: inventoryItems.map(item => ({ 
          id: item.id, 
          itemId: item.itemId,
          itemType: item.itemType
        })),
        regularItems: {
          count: regularItems.length,
          optimizedStackCount: regularItemsToGive.length,
          giveResult: regularItemsResult
        },
        pokemonItems: {
          count: pokemonItems.length,
          processedItems: pokemonResults
        }
      };
    } catch (error) {
      console.error('Error claiming inventory items:', error);
      throw error;
    }
  }

  // ==================== LOOTBOX MANAGEMENT ====================
  
  async openLootBox(openLootBoxDto: OpenLootBoxRequest): Promise<OpenLootBoxResponse> {
    return this.lootboxService.openLootBox(openLootBoxDto);
  }

  async giveLootbox(uuid: string, lootboxType: string, amount?: number): Promise<GiveLootboxResponse> {
    return this.lootboxService.giveLootbox(uuid, lootboxType, amount || 1);
  }

  async getLootboxConfig(): Promise<LootBoxConfigResponse> {
    return { 
      rarityRanges, 
      lootboxConfig: this.lootboxService.getLootboxConfig() 
    };
  }

  // ==================== GAME FEATURES ====================
  
  getWordle(): string {
    return 'wordle';
  }

  // ==================== PRIVATE HELPER METHODS ====================
  
  private getRewardForDay(day: number): DailyRewardItem {
    const dayInCycle = ((day - 1) % this.rewardsConfig.totalDays) + 1;
    const rewardConfig = this.rewardsConfig.rewards.find(r => r.day === dayInCycle);
    
    return rewardConfig || { 
      day: dayInCycle, 
      type: "CURRENCY", 
      amount: 100,
      description: `Day ${dayInCycle} reward`
    };
  }

  private async awardReward(uuid: string, reward: DailyRewardItem): Promise<void> {
    if (reward.type === "CURRENCY" && reward.amount > 0) {
      await this.awardCurrency(uuid, reward.amount);
    } else if (reward.type === "box") {
      await this.giveLootbox(uuid, reward.description, reward.amount);
    }
  }

  private async awardCurrency(uuid: string, amount: number): Promise<void> {
    const account = await this.starbankService.getMainAccount(uuid);
    if (!account) {
      throw new Error("No account found for user");
    }
    
    await this.starbankService.transfer(
      0,
      account.id,
      amount,
      "Daily bonus reward",
    );
  }

  private getDefaultRewardMessage(day: number): string {
    const dayInCycle = ((day - 1) % this.rewardsConfig.totalDays) + 1;
    
    if (dayInCycle === this.rewardsConfig.totalDays) {
      return `Congratulations! You've completed the ${this.rewardsConfig.totalDays}-day reward cycle!`;
    } else if (dayInCycle === 1) {
      return `You've started a new reward cycle! Come back tomorrow for more rewards!`;
    } else {
      return `Day ${dayInCycle} of ${this.rewardsConfig.totalDays} complete! Keep coming back for larger rewards!`;
    }
  }

  private processRegularItems(items: any[]): OptimizedItemStack[] {
    const itemsToGive: OptimizedItemStack[] = [];
    const itemsMap = new Map<string, number>();
    
    for (const item of items) {
      const currentAmount = itemsMap.get(item.itemId) || 0;
      itemsMap.set(item.itemId, currentAmount + item.amount);
    }
    
    itemsMap.forEach((totalAmount, itemId) => {
      const fullStacks = Math.floor(totalAmount / 64);
      for (let i = 0; i < fullStacks; i++) {
        itemsToGive.push({ id: itemId, amount: 64 });
      }
      
      const remainder = totalAmount % 64;
      if (remainder > 0) {
        itemsToGive.push({ id: itemId, amount: remainder });
      }
    });
    
    return itemsToGive;
  }

  private async processPokemonItems(uuid: string, pokemonItems: any[]) {
    const results = [];
    
    for (const pokemonItem of pokemonItems) {
      try {
        const giveResult = await this.wingullService.givePokemon(uuid, pokemonItem.itemId, true);
        results.push({
          id: pokemonItem.id,
          itemId: pokemonItem.itemId,
          result: giveResult
        });
      } catch (error) {
        results.push({
          id: pokemonItem.id,
          itemId: pokemonItem.itemId,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    return results;
  }
}