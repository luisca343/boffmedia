import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, asc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IArcadeInventoryRepository } from './interfaces/arcade-inventory.repository.interface';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { ArcadeInventoryItem, ItemRarity } from '../entities/arcade-inventory.entity';
import {
  SmartRotomInventoryItem,
  smartRotomInventory
} from '@/_db/schema/SmartRotom';

@Injectable()
export class ArcadeInventoryRepository 
  extends BaseRepositoryImpl<ArcadeInventoryItem, CreateInventoryItemDto, UpdateInventoryItemDto> 
  implements IArcadeInventoryRepository {

  constructor(
    @Inject(DRIZZLE) db: MySql2Database<Record<string, never>>,
  ) {
    super(db, smartRotomInventory);
  }

    async create(data: CreateInventoryItemDto): Promise<ArcadeInventoryItem> {
    const result = await this.db.insert(smartRotomInventory).values({
        uuid: data.uuid,
        itemId: data.itemId,
        itemType: data.itemType,
        amount: data.amount || 1,
        rarity: data.rarity || 'common',
        sourceType: data.sourceType,
        used: data.used || 0
    } as SmartRotomInventoryItem);
    return this.findById(result[0].insertId) as Promise<ArcadeInventoryItem>;
    }


async update(id: number, data: UpdateInventoryItemDto): Promise<ArcadeInventoryItem> {
    const updateData: Partial<SmartRotomInventoryItem> = {};
    if (data.itemId) updateData.itemId = data.itemId;
    if (data.itemType) updateData.itemType = data.itemType;
    if (data.amount) updateData.amount = data.amount;
    if (data.rarity) updateData.rarity = data.rarity;
    if (data.sourceType) updateData.sourceType = data.sourceType;
    if (typeof data.used !== 'undefined') updateData.used = data.used;

    await this.db.update(smartRotomInventory).set(updateData).where(eq(smartRotomInventory.id, id));
    return this.findById(id) as Promise<ArcadeInventoryItem>;
    }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(smartRotomInventory).where(eq(smartRotomInventory.id, id));
    return result[0].affectedRows > 0;
  }

  async findUserInventory(uuid: string): Promise<ArcadeInventoryItem[]> {
    return this.db.select()
      .from(smartRotomInventory)
      .where(eq(smartRotomInventory.uuid, uuid));
  }

  async findUserItem(uuid: string, itemId: string): Promise<ArcadeInventoryItem | null> {
    const result = await this.db.select()
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId)
      ))
      .limit(1);
    return result[0] || null;
  }

    async addItem(inventoryData: CreateInventoryItemDto): Promise<{ insertId: number }> {
    const result = await this.db
        .insert(smartRotomInventory)
        .values({
        uuid: inventoryData.uuid,
        itemId: inventoryData.itemId,
        itemType: inventoryData.itemType,
        amount: inventoryData.amount || 1,
        rarity: inventoryData.rarity || 'common',
        sourceType: inventoryData.sourceType,
        used: inventoryData.used || 0
        } as SmartRotomInventoryItem);
    return { insertId: result[0].insertId };
    }

    async updateItemQuantity(uuid: string, itemId: string, amount: number): Promise<ArcadeInventoryItem> {
    await this.db.update(smartRotomInventory)
        .set({ amount } as SmartRotomInventoryItem)
        .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId)
        ));
    return this.findUserItem(uuid, itemId) as Promise<ArcadeInventoryItem>;
    }

  async removeItem(uuid: string, itemId: string): Promise<boolean> {
    const result = await this.db.delete(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId)
      ));
    return result[0].affectedRows > 0;
  }

  async consumeItem(uuid: string, itemId: string, amount: number): Promise<ArcadeInventoryItem> {
    // Get all items matching this itemId for the user
    const items = await this.db.select()
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId)
      ))
      .orderBy(asc(smartRotomInventory.used));
    
    if (!items.length) {
      throw new Error('Item not found');
    }
    
    const currentItem = items[0];
    const consumableTypes = ['box'];
    const isConsumable = consumableTypes.includes(currentItem.itemType);
    
    if (isConsumable) {
      // For consumables, we update the "used" count
      const newUsedCount = (currentItem.used || 0) + amount;
      
      if (newUsedCount > currentItem.amount) {
        throw new Error('Insufficient quantity');
      }
      
      // Update the used count
      await this.db.update(smartRotomInventory)
        .set({ used: newUsedCount } as SmartRotomInventoryItem)
        .where(eq(smartRotomInventory.id, currentItem.id));
      
      // Fetch the updated item
      const updatedItem = await this.findById(currentItem.id) as ArcadeInventoryItem;
      
      // Add remaining amount information
      return {
        ...updatedItem,
        remainingAmount: updatedItem.amount - newUsedCount
      } as ArcadeInventoryItem;
    }
  }

  async getTotalItems(uuid: string): Promise<number> {
    const items = await this.findUserInventory(uuid);
    return items.reduce((total, item) => total + ((item as ArcadeInventoryItem).amount || 0), 0);
  }

  async getItemsByType(uuid: string, type: string): Promise<ArcadeInventoryItem[]> {
    return this.db.select()
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemType, type)
      ));
  }

  async getItemsByRarity(uuid: string, rarity: ItemRarity): Promise<ArcadeInventoryItem[]> {
    return this.db.select()
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.rarity, rarity)
      ));
  }
}