import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ARCADE_INVENTORY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IArcadeInventoryRepository } from '../repositories/interfaces/arcade-inventory.repository.interface';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { ArcadeInventory } from '../entities/arcade-inventory.entity';
import { ArcadeInventoryResponse } from '../entities/inventory-response.entity';

export interface ClaimItemData {
  uuid: string;
  itemId: string;
  itemType: string;
  amount: number;
  rarity?: string;
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
      const consumableTypes = ['crate', 'lootbox'];
      const isConsumable = consumableTypes.includes(item.itemType);
      
      const key = isConsumable
        ? `${item.itemId}_${item.sourceType || 'unknown'}`
        : `${item.itemId}_${item.used}_${item.sourceType || 'unknown'}`;
      
      if (!acc[key]) {
        acc[key] = {
          ...item,
          totalAmount: isConsumable ? item.amount : item.amount,
          usedAmount: isConsumable ? (item.used || 0) : 0,
          originalIds: [item.id]
        };
      } else {
        if (isConsumable) {
          acc[key].totalAmount += item.amount;
          acc[key].usedAmount += (item.used || 0);
        } else {
          acc[key].amount += item.amount;
        }
        acc[key].originalIds.push(item.id);
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Process consumables
    for (const key in aggregatedItems) {
      const item = aggregatedItems[key];
      const consumableTypes = ['crate', 'lootbox'];
      
      if (consumableTypes.includes(item.itemType)) {
        item.remainingAmount = item.totalAmount - item.usedAmount;
        item.amount = item.remainingAmount;
        item.used = item.remainingAmount > 0 ? 0 : 1;
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

  async getUserItem(uuid: string, itemId: string): Promise<ArcadeInventory | null> {
    this.validateUuid(uuid);
    this.validateItemId(itemId);
    return this.arcadeInventoryRepository.findUserItem(uuid, itemId);
  }

  async addItemToInventory(itemData: ClaimItemData): Promise<{ success: boolean; item: ArcadeInventory }> {
    this.validateUuid(itemData.uuid);
    this.validateItemId(itemData.itemId);
    this.validateAmount(itemData.amount);

    // Check if user already has this item
    const existingItem = await this.arcadeInventoryRepository.findUserItem(itemData.uuid, itemData.itemId);

    if (existingItem) {
      // Update existing item quantity
      const newAmount = existingItem.amount + itemData.amount;
      const updatedItem = await this.arcadeInventoryRepository.updateItemQuantity(
        itemData.uuid, 
        itemData.itemId, 
        newAmount
      );
      
      return { success: true, item: updatedItem };
    } else {
      // Create new item
      const createData: CreateInventoryItemDto = {
        uuid: itemData.uuid,
        itemId: itemData.itemId,
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
  }

  async consumeItem(uuid: string, itemId: string, amount: number = 1): Promise<{ 
    success: boolean; 
    item: ArcadeInventory | null;
    consumed: number;
  }> {
    this.validateUuid(uuid);
    this.validateItemId(itemId);
    this.validateAmount(amount);

    const existingItem = await this.arcadeInventoryRepository.findUserItem(uuid, itemId);
    
    if (!existingItem) {
      throw new NotFoundException('Item not found in inventory');
    }

    if (existingItem.amount < amount) {
      throw new BadRequestException(`Insufficient quantity. Available: ${existingItem.amount}, Requested: ${amount}`);
    }

    const updatedItem = await this.arcadeInventoryRepository.consumeItem(uuid, itemId, amount);

    return {
      success: true,
      item: updatedItem.amount > 0 ? updatedItem : null,
      consumed: amount
    };
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

  async getItemsByType(uuid: string, itemType: string): Promise<ArcadeInventory[]> {
    this.validateUuid(uuid);
    
    if (!itemType) {
      throw new BadRequestException('Item type is required');
    }

    return this.arcadeInventoryRepository.getItemsByType(uuid, itemType);
  }

  async getItemsByRarity(uuid: string, rarity: string): Promise<ArcadeInventory[]> {
    this.validateUuid(uuid);
    
    if (!rarity) {
      throw new BadRequestException('Rarity is required');
    }

    return this.arcadeInventoryRepository.getItemsByRarity(uuid, rarity);
  }

  async markItemAsUsed(uuid: string, itemId: string): Promise<ArcadeInventory> {
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