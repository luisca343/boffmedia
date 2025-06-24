import { Injectable, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { StreakService } from './services/streak.service';
import { InventoryService, ClaimItemData } from './services/inventory.service';
import { LootboxService } from './services/lootbox.service';
import { ArcadeStreak } from './entities/arcade-streak.entity';
import { ArcadeInventoryItem } from './entities/arcade-inventory.entity';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './dto/lottbox.dto';
import { loadRewardsConfig } from '../_main/_config/daily-rewards.config';
import { ArcadeInventoryResponse } from './entities/inventory-response.entity';
import { LootboxConfigEntity } from './entities/lootbox-config.entity';
import { DailyRewardsConfig } from './entities/daily-rewards.entity';

@Injectable()
export class ArcadeFacadeService implements OnModuleInit {
  constructor(
    private readonly streakService: StreakService,
    private readonly inventoryService: InventoryService,
    private readonly lootboxService: LootboxService,
  ) {}

  async onModuleInit() {
    // Initialize any required data or configurations
    console.log('ArcadeFacadeService initialized');
  }

  // ==================== STREAK MANAGEMENT ====================
  async getRewardsBanner(): Promise<DailyRewardsConfig> {
    return loadRewardsConfig();
  }
  
  async getUserStreak(uuid: string): Promise<ArcadeStreak> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    return this.streakService.getUserStreak(uuid);
  }

  async canClaimDailyReward(uuid: string): Promise<{ canClaim: boolean; streak: ArcadeStreak }> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    return this.streakService.canClaimReward(uuid);
  }

  async claimDailyReward(uuid: string): Promise<{
    streak: ArcadeStreak;
    reward: any;
    inventoryItems?: ArcadeInventoryItem[];
  }> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    const result = await this.streakService.claimDailyReward(uuid);

    // Add reward items to inventory if any
    if (result.reward.items && result.reward.items.length > 0) {
      const inventoryItems: ArcadeInventoryItem[] = [];
      
      for (const rewardItem of result.reward.items) {
        const claimData: ClaimItemData = {
          uuid,
          itemId: rewardItem.itemId,
          itemType: rewardItem.itemType,
          amount: rewardItem.amount,
          rarity: rewardItem.rarity,
          sourceType: 'daily_reward'
        };

        const inventoryResult = await this.inventoryService.addItemToInventory(claimData);
        inventoryItems.push(inventoryResult.item);
      }

      return {
        streak: result.streak,
        reward: result.reward,
        inventoryItems
      };
    }

    return {
      streak: result.streak,
      reward: result.reward
    };
  }

  async resetUserStreak(uuid: string): Promise<void> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    const result = await this.streakService.resetUserStreak(uuid);
    
    if (!result.success) {
      throw new NotFoundException('Streak not found or could not be reset');
    }
  }

  async getStreakStats(uuid: string): Promise<ArcadeStreak> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    return this.streakService.getStreakStats(uuid);
  }

  async updateLastBanner(uuid: string, banner: string): Promise<ArcadeStreak> {
    if (!uuid || !banner) {
      throw new BadRequestException('UUID and banner are required');
    }

    return this.streakService.updateLastBanner(uuid, banner);
  }

  // ==================== INVENTORY MANAGEMENT ====================

  async getUserInventory(uuid: string): Promise<ArcadeInventoryResponse> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    return this.inventoryService.getUserInventory(uuid);
  }

  async getUserItem(uuid: string, itemId: string): Promise<ArcadeInventoryItem | null> {
    if (!uuid || !itemId) {
      throw new BadRequestException('UUID and item ID are required');
    }

    return this.inventoryService.getUserItem(uuid, itemId);
  }

  async addItemToInventory(itemData: {
    uuid: string;
    itemId: string;
    itemType: string;
    amount: number;
    rarity?: string;
    sourceType?: string;
  }): Promise<ArcadeInventoryItem> {
    if (!itemData.uuid || !itemData.itemId || !itemData.itemType) {
      throw new BadRequestException('UUID, item ID, and item type are required');
    }

    const claimData: ClaimItemData = {
      uuid: itemData.uuid,
      itemId: itemData.itemId,
      itemType: itemData.itemType,
      amount: itemData.amount || 1,
      rarity: itemData.rarity || 'common',
      sourceType: itemData.sourceType || 'manual'
    };

    const result = await this.inventoryService.addItemToInventory(claimData);
    return result.item;
  }

  async consumeInventoryItem(uuid: string, itemId: string, amount: number = 1): Promise<{
    item: ArcadeInventoryItem | null;
    consumed: number;
  }> {
    if (!uuid || !itemId) {
      throw new BadRequestException('UUID and item ID are required');
    }

    if (amount < 1) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const result = await this.inventoryService.consumeItem(uuid, itemId, amount);
    
    if (!result.success) {
      throw new BadRequestException('Failed to consume item');
    }

    return {
      item: result.item,
      consumed: result.consumed
    };
  }

  async removeInventoryItem(uuid: string, itemId: string): Promise<void> {
    if (!uuid || !itemId) {
      throw new BadRequestException('UUID and item ID are required');
    }

    const result = await this.inventoryService.removeItem(uuid, itemId);
    
    if (!result.success) {
      throw new BadRequestException('Failed to remove item');
    }
  }

  async getInventoryStats(uuid: string): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    itemsByRarity: Record<string, number>;
  }> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    return this.inventoryService.getInventoryStats(uuid);
  }

  async getInventoryItemsByType(uuid: string, itemType: string): Promise<ArcadeInventoryItem[]> {
    if (!uuid || !itemType) {
      throw new BadRequestException('UUID and item type are required');
    }

    return this.inventoryService.getItemsByType(uuid, itemType);
  }

  async getInventoryItemsByRarity(uuid: string, rarity: string): Promise<ArcadeInventoryItem[]> {
    if (!uuid || !rarity) {
      throw new BadRequestException('UUID and rarity are required');
    }

    return this.inventoryService.getItemsByRarity(uuid, rarity);
  }

  async markItemAsUsed(uuid: string, itemId: string): Promise<ArcadeInventoryItem> {
    if (!uuid || !itemId) {
      throw new BadRequestException('UUID and item ID are required');
    }

    return this.inventoryService.markItemAsUsed(uuid, itemId);
  }

// ==================== LOOTBOX MANAGEMENT ====================

  async getLootboxConfig(): Promise<LootboxConfigEntity> {
    return this.lootboxService.getLootboxConfig();
  }


  async openLootbox(uuid: string, lootboxType: string): Promise<OpenLootBoxResponseDto> {
    if (!uuid || !lootboxType) {
      throw new BadRequestException('UUID and lootbox type are required');
    }

    const openLootBoxDto: OpenLootBoxDto = {
      uuid,
      boxId: lootboxType,
    };

    const lootboxResult = await this.lootboxService.openLootBox(openLootBoxDto);
    
    return {
      item: lootboxResult.item,
      spinnerItems: lootboxResult.spinnerItems || [],
      winningPosition: lootboxResult.winningPosition || 0
    };
  }

  async giveLootbox(uuid: string, lootboxType: string, amount: number = 1): Promise<void> {
    if (!uuid || !lootboxType) {
      throw new BadRequestException('UUID and lootbox type are required');
    }

    if (amount < 1) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const result = await this.lootboxService.giveLootbox(uuid, lootboxType, amount);
    
    if (!result.success) {
      throw new BadRequestException(result.message || 'Failed to give lootbox');
    }
  }

  // ==================== COMBINED OPERATIONS ====================

  async claimMultipleItems(uuid: string, items: ClaimItemData[]): Promise<ArcadeInventoryItem[]> {
    if (!uuid || !items || items.length === 0) {
      throw new BadRequestException('UUID and items array are required');
    }

    const claimedItems: ArcadeInventoryItem[] = [];

    for (const itemData of items) {
      const claimData: ClaimItemData = {
        ...itemData,
        uuid // Ensure UUID is set
      };

      const result = await this.inventoryService.addItemToInventory(claimData);
      claimedItems.push(result.item);
    }

    return claimedItems;
  }

  async getCompleteUserData(uuid: string): Promise<{
    streak: ArcadeStreak;
    inventory: ArcadeInventoryResponse;
    inventoryStats: {
      totalItems: number;
      itemsByType: Record<string, number>;
      itemsByRarity: Record<string, number>;
    };
  }> {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    const [streak, inventory, inventoryStats] = await Promise.all([
      this.streakService.getUserStreak(uuid),
      this.inventoryService.getUserInventory(uuid),
      this.inventoryService.getInventoryStats(uuid)
    ]);

    return {
      streak,
      inventory,
      inventoryStats
    };
  }
}