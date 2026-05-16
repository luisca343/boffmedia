import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { StreakService } from './services/streak.service';
import { InventoryService, ClaimItemData } from './services/inventory.service';
import { LootboxService } from './services/lootbox.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { ArcadeStreak } from './entities/arcade-streak.entity';
import {
  ArcadeInventoryItem,
  ItemRarity,
} from './entities/arcade-inventory.entity';
import { OpenLootBoxDto, OpenLootBoxResponseDto } from './dto/lottbox.dto';
import { loadRewardsConfig } from '../_main/_config/daily-rewards.config';
import { ArcadeInventoryResponse } from './entities/inventory-response.entity';
import { LootboxConfigEntity } from './entities/lootbox-config.entity';
import { DailyRewardsConfig } from './entities/daily-rewards.entity';
import { ClaimItemsDto, ClaimItemsResponseDto } from './dto/claim-items.dto';

@Injectable()
export class ArcadeFacadeService implements OnModuleInit {
  constructor(
    private readonly streakService: StreakService,
    private readonly inventoryService: InventoryService,
    private readonly lootboxService: LootboxService,
    private readonly wingullFacadeService: WingullFacadeService,
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

  async canClaimDailyReward(
    uuid: string,
  ): Promise<{ canClaim: boolean; streak: ArcadeStreak }> {
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

    const { streak, reward } = result;

    if (!reward) {
      return {
        streak,
        reward: null,
      };
    }

    // If the reward is a box or item, add it to the inventory
    const inventoryItems: ArcadeInventoryItem[] = [];
    if (reward.type === 'box' || reward.type === 'item') {
      const claimData: ClaimItemData = {
        uuid,
        itemId: reward.description,
        itemType: reward.type,
        amount: reward.amount,
        sourceType: 'daily_reward',
      };

      const inventoryResult =
        await this.inventoryService.addItemToInventory(claimData);
      inventoryItems.push(inventoryResult.item);
    }

    return {
      streak,
      reward,
      inventoryItems: inventoryItems.length > 0 ? inventoryItems : undefined,
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

  async getUserItem(
    uuid: string,
    itemId: string,
  ): Promise<ArcadeInventoryItem | null> {
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
    rarity?: ItemRarity;
    sourceType?: string;
  }): Promise<ArcadeInventoryItem> {
    if (!itemData.uuid || !itemData.itemId || !itemData.itemType) {
      throw new BadRequestException(
        'UUID, item ID, and item type are required',
      );
    }

    const claimData: ClaimItemData = {
      uuid: itemData.uuid,
      itemId: itemData.itemId,
      itemType: itemData.itemType,
      amount: itemData.amount || 1,
      rarity: itemData.rarity || 'common',
      sourceType: itemData.sourceType || 'manual',
    };

    const result = await this.inventoryService.addItemToInventory(claimData);
    return result.item;
  }

  async consumeInventoryItem(
    uuid: string,
    itemId: string,
    amount: number = 1,
  ): Promise<{
    item: ArcadeInventoryItem | null;
    consumed: number;
  }> {
    if (!uuid || !itemId) {
      throw new BadRequestException('UUID and item ID are required');
    }

    if (amount < 1) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const result = await this.inventoryService.consumeItem(
      uuid,
      itemId,
      amount,
    );

    if (!result.success) {
      throw new BadRequestException('Failed to consume item');
    }

    return {
      item: result.item,
      consumed: result.consumed,
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

  async getInventoryItemsByType(
    uuid: string,
    itemType: string,
  ): Promise<ArcadeInventoryItem[]> {
    if (!uuid || !itemType) {
      throw new BadRequestException('UUID and item type are required');
    }

    return this.inventoryService.getItemsByType(uuid, itemType);
  }

  async getInventoryItemsByRarity(
    uuid: string,
    rarity: string,
  ): Promise<ArcadeInventoryItem[]> {
    if (!uuid || !rarity) {
      throw new BadRequestException('UUID and rarity are required');
    }

    return this.inventoryService.getItemsByRarity(uuid, rarity);
  }

  async markItemAsUsed(
    uuid: string,
    itemId: string,
  ): Promise<ArcadeInventoryItem> {
    if (!uuid || !itemId) {
      throw new BadRequestException('UUID and item ID are required');
    }

    return this.inventoryService.markItemAsUsed(uuid, itemId);
  }

  // ==================== LOOTBOX MANAGEMENT ====================

  async getLootboxConfig(): Promise<LootboxConfigEntity> {
    return this.lootboxService.getLootboxConfig();
  }

  async openLootbox(
    uuid: string,
    lootboxType: string,
  ): Promise<OpenLootBoxResponseDto> {
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
      winningPosition: lootboxResult.winningPosition || 0,
    };
  }

  async giveLootbox(
    uuid: string,
    lootboxType: string,
    amount: number = 1,
  ): Promise<void> {
    if (!uuid || !lootboxType) {
      throw new BadRequestException('UUID and lootbox type are required');
    }

    if (amount < 1) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const result = await this.lootboxService.giveLootbox(
      uuid,
      lootboxType,
      amount,
    );

    if (!result.success) {
      throw new BadRequestException(result.message || 'Failed to give lootbox');
    }
  }

  // ==================== COMBINED OPERATIONS ====================

  async claimItems(claimData: ClaimItemsDto): Promise<ClaimItemsResponseDto> {
    console.log('Claiming items:', claimData);

    const { uuid, items } = claimData;

    // Input validation
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestException(
        'Items array is required and must not be empty',
      );
    }

    // Validate items structure
    const validItems = items.filter((item) => {
      if (!item || !item.id || !item.itemId || !item.itemType) {
        console.warn(`Invalid item detected:`, item);
        return false;
      }
      return true;
    });

    if (validItems.length === 0) {
      throw new BadRequestException('No valid items provided');
    }

    // Initialize response tracking
    const claimedItems: string[] = [];
    const failedItems: string[] = [];
    const pokemonItems: string[] = [];
    const regularItems: string[] = [];
    const errors: string[] = [];

    try {
      // Process each requested item
      for (const item of validItems) {
        try {
          // Calculate available amount for this item
          const usedAmount = item.used || 0;
          const availableAmount = Math.max(0, item.amount - usedAmount);

          // Check if there's anything to claim
          if (availableAmount === 0) {
            failedItems.push(item.itemId);
            errors.push(`No available amount for item ${item.itemId}`);
            continue;
          }

          // Mark this item as fully used (claim all available amount)
          try {
            await this.inventoryService.consumeItem(
              uuid,
              item.itemId,
              availableAmount,
            );
          } catch (consumeError) {
            console.error(
              `Error consuming item ${item.itemId} (ID: ${item.id}):`,
              consumeError,
            );
            failedItems.push(item.itemId);
            errors.push(
              `Failed to claim item ${item.itemId}: ${consumeError.message}`,
            );
            continue;
          }

          // Determine item type and distribute to player
          const isPokemon = item.itemType === 'pokemon';

          if (isPokemon) {
            try {
              const pokemonSpec = item.itemData || item.itemId;
              for (let i = 0; i < item.amount; i++) {
                await this.wingullFacadeService.givePokemon(
                  uuid,
                  pokemonSpec,
                  true,
                );
              }
              pokemonItems.push(item.itemId);
              claimedItems.push(item.itemId);
            } catch (pokemonError) {
              console.error(
                `Failed to give Pokemon ${item.itemId} to ${uuid}:`,
                pokemonError,
              );
              errors.push(
                `Failed to distribute Pokemon ${item.itemId}: ${pokemonError.message}`,
              );
              failedItems.push(item.itemId);
            }
          } else {
            try {
              // Give regular items to player
              const itemsToGive = [
                {
                  id: item.itemId,
                  amount: availableAmount,
                  display_name: this.getItemDisplayName(item.itemId),
                  lore: this.getItemLore(item.itemId),
                },
              ];

              await this.wingullFacadeService.giveItems(uuid, itemsToGive);
              regularItems.push(item.itemId);
              claimedItems.push(item.itemId);
            } catch (itemError) {
              console.error(
                `Failed to give item ${item.itemId} to ${uuid}:`,
                itemError,
              );
              errors.push(
                `Failed to distribute item ${item.itemId}: ${itemError.message}`,
              );
              failedItems.push(item.itemId);
            }
          }
        } catch (itemError) {
          console.error(
            `Error processing item ${item.itemId} for user ${uuid}:`,
            itemError,
          );
          failedItems.push(item.itemId);
          errors.push(`Error processing ${item.itemId}: ${itemError.message}`);
        }
      }

      // Build response
      const totalRequested = validItems.length;
      const totalClaimed = claimedItems.length;
      const totalFailed = failedItems.length;

      let message = `Successfully claimed ${totalClaimed} of ${totalRequested} items`;
      if (totalFailed > 0) {
        message += `, ${totalFailed} failed`;
      }

      if (errors.length > 0) {
        console.warn('Claim items errors:', errors);
      }

      return {
        claimedItems,
        failedItems,
        pokemonItems,
        regularItems,
        success: totalClaimed > 0,
        message,
      };
    } catch (error: any) {
      console.error('Critical error in claimItems:', error);
      throw new BadRequestException(`Failed to claim items: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Gets display name for an item (can be enhanced with item registry)
   */
  private getItemDisplayName(itemId: string): string {
    // Format item ID to a readable display name
    return itemId
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Gets lore for an item (can be enhanced with item registry)
   */
  private getItemLore(itemId: string): string[] {
    return ['§7Claimed from Arcade System', '§8Item ID: ' + itemId];
  }

  async claimMultipleItems(
    uuid: string,
    items: ClaimItemData[],
  ): Promise<ArcadeInventoryItem[]> {
    if (!uuid || !items || items.length === 0) {
      throw new BadRequestException('UUID and items array are required');
    }

    const claimedItems: ArcadeInventoryItem[] = [];

    for (const itemData of items) {
      const claimData: ClaimItemData = {
        ...itemData,
        uuid, // Ensure UUID is set
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
      this.inventoryService.getInventoryStats(uuid),
    ]);

    return {
      streak,
      inventory,
      inventoryStats,
    };
  }
}
