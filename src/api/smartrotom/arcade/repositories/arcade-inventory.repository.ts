import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IArcadeInventoryRepository } from './interfaces/arcade-inventory.repository.interface';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { ArcadeInventory } from '../entities/arcade-inventory.entity';
import {
  SmartRotomInventoryItem,
  smartRotomInventory
} from '@/_db/schema/SmartRotom';

@Injectable()
export class ArcadeInventoryRepository 
  extends BaseRepositoryImpl<ArcadeInventory, CreateInventoryItemDto, UpdateInventoryItemDto> 
  implements IArcadeInventoryRepository {

  constructor(
    @Inject(DRIZZLE) db: MySql2Database<Record<string, never>>,
  ) {
    super(db, smartRotomInventory);
  }

    async create(data: CreateInventoryItemDto): Promise<ArcadeInventory> {
    const result = await this.db.insert(smartRotomInventory).values({
        uuid: data.uuid,
        itemId: data.itemId,
        itemType: data.itemType,
        amount: data.amount || 1,
        rarity: data.rarity || 'common',
        sourceType: data.sourceType,
        used: data.used || 0
    } as SmartRotomInventoryItem);
    return this.findById(result[0].insertId) as Promise<ArcadeInventory>;
    }


async update(id: number, data: UpdateInventoryItemDto): Promise<ArcadeInventory> {
    const updateData: Partial<SmartRotomInventoryItem> = {};
    if (data.itemId) updateData.itemId = data.itemId;
    if (data.itemType) updateData.itemType = data.itemType;
    if (data.amount) updateData.amount = data.amount;
    if (data.rarity) updateData.rarity = data.rarity;
    if (data.sourceType) updateData.sourceType = data.sourceType;
    if (typeof data.used !== 'undefined') updateData.used = data.used;

    await this.db.update(smartRotomInventory).set(updateData).where(eq(smartRotomInventory.id, id));
    return this.findById(id) as Promise<ArcadeInventory>;
    }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(smartRotomInventory).where(eq(smartRotomInventory.id, id));
    return result[0].affectedRows > 0;
  }

  async findUserInventory(uuid: string): Promise<ArcadeInventory[]> {
    return this.db.select()
      .from(smartRotomInventory)
      .where(eq(smartRotomInventory.uuid, uuid));
  }

  async findUserItem(uuid: string, itemId: string): Promise<ArcadeInventory | null> {
    const result = await this.db.select()
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId)
      ))
      .limit(1);
    return result[0] || null;
  }

    async addItem(inventoryData: any): Promise<{ insertId: number }> {
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

    async updateItemQuantity(uuid: string, itemId: string, amount: number): Promise<ArcadeInventory> {  // ✅ Fixed parameter name
    await this.db.update(smartRotomInventory)
        .set({ amount } as SmartRotomInventoryItem)
        .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId)
        ));
    return this.findUserItem(uuid, itemId) as Promise<ArcadeInventory>;
    }

  async removeItem(uuid: string, itemId: string): Promise<boolean> {
    const result = await this.db.delete(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemId, itemId)
      ));
    return result[0].affectedRows > 0;
  }

    async consumeItem(uuid: string, itemId: string, amount: number): Promise<ArcadeInventory> {
    const item = await this.findUserItem(uuid, itemId);
    if (!item) throw new Error('Item not found');
    
    const newAmount = Math.max(0, (item as any).amount - amount);
    if (newAmount === 0) {
        await this.removeItem(uuid, itemId);
        return { ...item, amount: 0 } as ArcadeInventory;
    }
    
    return this.updateItemQuantity(uuid, itemId, newAmount);
    }

  async getTotalItems(uuid: string): Promise<number> {
    const items = await this.findUserInventory(uuid);
    return items.reduce((total, item) => total + ((item as any).amount || 0), 0);
  }

  async getItemsByType(uuid: string, type: string): Promise<ArcadeInventory[]> {
    return this.db.select()
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.itemType, type)
      ));
  }

  async getItemsByRarity(uuid: string, rarity: string): Promise<ArcadeInventory[]> {
    return this.db.select()
      .from(smartRotomInventory)
      .where(and(
        eq(smartRotomInventory.uuid, uuid),
        eq(smartRotomInventory.rarity, rarity)
      ));
  }
}