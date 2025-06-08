import { Injectable } from '@nestjs/common';
import { ArcadeRepository } from '@repositories/smartrotom/arcade.repository';

export interface ClaimItemData {
  id: string;
  type?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly arcadeRepository: ArcadeRepository,
  ) {}

  async getInventory(uuid: string, sourceType?: string) {
    const rawItems = await this.arcadeRepository.findInventoryByUuid(uuid, sourceType);
    
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

  async addInventoryItem(data: {
    uuid: string;
    itemId: string;
    itemType: string;
    amount?: number;
    sourceType?: string;
    rarity?: string;
  }) {
    const userExists = await this.arcadeRepository.findUserByUuid(data.uuid);
    
    if (!userExists) {
      throw new Error('User not found');
    }
    
    const result = await this.arcadeRepository.addInventoryItem({
      uuid: data.uuid,
      itemId: data.itemId,
      itemType: data.itemType,
      amount: data.amount || 1,
      sourceType: data.sourceType || 'admin',
      used: 0,
      rarity: data.rarity
    });
    
    return { insertId: result[0].insertId };
  }

  async consumeInventoryItem(uuid: string, itemId: string) {
    const items = await this.arcadeRepository.findConsumableItems(uuid, itemId);
    
    if (!items || items.length === 0) {
      throw new Error('Item not found or already fully used');
    }
    
    const currentItem = items[0];
    
    const consumableTypes = ['crate', 'lootbox'];
    if (!consumableTypes.includes(currentItem.itemType)) {
      throw new Error('This item cannot be consumed');
    }
    
    const newUsedCount = (currentItem.used || 0) + 1;
    
    await this.arcadeRepository.updateInventoryItemUsage(currentItem.id, newUsedCount);
    
    const remainingAmount = currentItem.amount - newUsedCount;
    const totalRemaining = items.reduce((total, item) => {
      return total + (item.amount - (item.id === currentItem.id ? newUsedCount : (item.used || 0)));
    }, 0);
    
    return {
      ...currentItem,
      used: newUsedCount,
      remainingAmount,
      totalRemaining
    };
  }
}