import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ARCADE_INVENTORY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IArcadeInventoryRepository } from '../repositories/interfaces/arcade-inventory.repository.interface';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { ArcadeInventoryItem, ItemRarity } from '../entities/arcade-inventory.entity';
import { ArcadeInventoryResponse } from '../entities/inventory-response.entity';

export interface ClaimItemData {
  uuid: string;
  itemId: string;
  itemData?: string;
  itemType: string;
  amount: number;
  rarity?: ItemRarity;
  sourceType?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @Inject(ARCADE_INVENTORY_REPOSITORY_TOKEN)
    private readonly arcadeInventoryRepository: IArcadeInventoryRepository,
  ) {}

  // ==================== VALIDATION METHODS ====================

  private validateUuid(uuid: string): void {
    if (!uuid) {
      throw new BadRequestException('UUID is required');
    }
  }

  private validateItemId(itemId: string): void {
    if (!itemId) {
      throw new BadRequestException('Item ID is required');
    }
  }

  private validateAmount(amount: number): void {
    if (!amount || amount < 1) {
      throw new BadRequestException('Amount must be greater than 0');
    }
  }

  // ==================== INVENTORY MANAGEMENT ====================

  async getUserInventory(uuid: string, sourceType?: string): Promise<ArcadeInventoryResponse> {
    this.validateUuid(uuid);
    const rawItems = await this.arcadeInventoryRepository.findUserInventory(uuid);
    
    // Aggregate items with the same itemId
    const aggregatedItems = rawItems.reduce((acc, item) => {
      const consumableTypes = ['box', 'crate', 'lootbox', 'consumable'];
      const isConsumable = consumableTypes.includes(item.itemType);

      const key = isConsumable
        ? `${item.itemId}`
        : `${item.itemId}_${item.used}_${item.sourceType || 'unknown'}`;

      if (!acc[key]) {
        acc[key] = {
          ...item,
          amount: item.amount,
          used: item.used || 0,
          originalIds: [item.id]
        };
      } else {
        acc[key].amount += item.amount;
        acc[key].used += item.used || 0;
        acc[key].originalIds.push(item.id);
      }
      return acc;
    }, {} as Record<string, any>);

    // Process consumables
    for (const key in aggregatedItems) {
      const item = aggregatedItems[key];
      const consumableTypes = ['box', 'crate', 'lootbox', 'consumable'];

      if (consumableTypes.includes(item.itemType)) {
        item.amount = item.amount - item.used;
        item.used = item.amount > 0 ? 0 : 1;
      }
    }
    
    const items = Object.values(aggregatedItems);
    
    const groupedItems = items.reduce((acc, item) => {
      const key = `${item.itemType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    return {
      items,
      groupedItems,
      rawItems
    };
  }

  async getUserItem(uuid: string, itemId: string): Promise<ArcadeInventoryItem | null> {
    this.validateUuid(uuid);
    this.validateItemId(itemId);
    return this.arcadeInventoryRepository.findUserItem(uuid, itemId);
  }

  async addItemToInventory(itemData: ClaimItemData): Promise<{ success: boolean; item: ArcadeInventoryItem }> {
    this.validateUuid(itemData.uuid);
    this.validateItemId(itemData.itemId);
    this.validateAmount(itemData.amount);

      const createData: CreateInventoryItemDto = {
        uuid: itemData.uuid,
        itemId: itemData.itemId,
        itemData: itemData.itemData,
        itemType: itemData.itemType,
        amount: itemData.amount,
        rarity: itemData.rarity || 'common',
        sourceType: itemData.sourceType || 'unknown'
      };

      const result = await this.arcadeInventoryRepository.addItem(createData);

      const newItem = await this.arcadeInventoryRepository.findById(result.insertId);
      
      if (!newItem) {
        throw new NotFoundException('Failed to retrieve created item');
      }

      return { success: true, item: newItem };
  }

  async consumeItem(uuid: string, itemId: string, amount: number = 1): Promise<{ 
    success: boolean; 
    item: ArcadeInventoryItem | null;
    consumed: number;
    remainingAmount?: number;
    totalRemaining?: number;
  }> {
    this.validateUuid(uuid);
    this.validateItemId(itemId);
    this.validateAmount(amount);

    try {
      // Get all matching items to calculate total
      const allItems = await this.arcadeInventoryRepository.findUserInventory(uuid);
      console.log('All Items:', allItems);
      const targetItems = allItems.filter(item => item.itemId === itemId);
      console.log(`Target Items for ${uuid} with itemId ${itemId}:`, targetItems);
      
      if (!targetItems.length) {
        throw new NotFoundException('Item not found in inventory');
      }

      console.log(`Consuming ${amount} of ${itemId} for ${uuid}`);

      const updatedItem = await this.arcadeInventoryRepository.consumeItem(uuid, itemId, amount);

      console.log(`Updated Item for ${uuid} with itemId ${itemId}:`, updatedItem);

      // Calculate total remaining across all instances of this item
      const totalRemaining = targetItems.reduce((total, item) => {
        return total + (item.amount - (item.id === updatedItem.id ? 
          (updatedItem.used || 0) : (item.used || 0)));
      }, 0);

      console.log(`Total remaining for ${itemId} after consumption:`, totalRemaining);

      return {
        success: true,
        item: updatedItem,
        consumed: amount,
        remainingAmount: updatedItem.remainingAmount || updatedItem.amount,
        totalRemaining
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async removeItem(uuid: string, itemId: string): Promise<{ success: boolean; message: string }> {
    this.validateUuid(uuid);
    this.validateItemId(itemId);

    const existingItem = await this.arcadeInventoryRepository.findUserItem(uuid, itemId);
    
    if (!existingItem) {
      throw new NotFoundException('Item not found in inventory');
    }

    const success = await this.arcadeInventoryRepository.removeItem(uuid, itemId);
    
    if (!success) {
      throw new ConflictException('Failed to remove item from inventory');
    }

    return {
      success: true,
      message: 'Item removed successfully'
    };
  }

  async getInventoryStats(uuid: string): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    itemsByRarity: Record<string, number>;
  }> {
    this.validateUuid(uuid);

    const inventory = await this.arcadeInventoryRepository.findUserInventory(uuid);
    const totalItems = await this.arcadeInventoryRepository.getTotalItems(uuid);

    const itemsByType: Record<string, number> = {};
    const itemsByRarity: Record<string, number> = {};

    inventory.forEach(item => {
      // Count by type
      itemsByType[item.itemType] = (itemsByType[item.itemType] || 0) + item.amount;
      
      // Count by rarity
      itemsByRarity[item.rarity] = (itemsByRarity[item.rarity] || 0) + item.amount;
    });

    return {
      totalItems,
      itemsByType,
      itemsByRarity
    };
  }

  async getItemsByType(uuid: string, itemType: string): Promise<ArcadeInventoryItem[]> {
    this.validateUuid(uuid);
    
    if (!itemType) {
      throw new BadRequestException('Item type is required');
    }

    return this.arcadeInventoryRepository.getItemsByType(uuid, itemType);
  }

  async getItemsByRarity(uuid: string, rarity: string): Promise<ArcadeInventoryItem[]> {
    this.validateUuid(uuid);
    
    if (!rarity) {
      throw new BadRequestException('Rarity is required');
    }

    return this.arcadeInventoryRepository.getItemsByRarity(uuid, rarity);
  }

  async markItemAsUsed(uuid: string, itemId: string): Promise<ArcadeInventoryItem> {
    this.validateUuid(uuid);
    this.validateItemId(itemId);

    const item = await this.arcadeInventoryRepository.findUserItem(uuid, itemId);
    
    if (!item) {
      throw new NotFoundException('Item not found in inventory');
    }

    const updateData: UpdateInventoryItemDto = {
      used: 1
    };

    return this.arcadeInventoryRepository.update(item.id, updateData);
  }
}