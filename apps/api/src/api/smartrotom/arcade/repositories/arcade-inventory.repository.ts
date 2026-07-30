import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, asc, gt } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { IArcadeInventoryRepository } from './interfaces/arcade-inventory.repository.interface';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import {
  ArcadeInventoryItem,
  ItemRarity,
} from '../entities/arcade-inventory.entity';
import { Logger } from 'nestjs-pino';
import { RotomInventoryItem, rotomInventory } from '@/_db/schema/SmartRotom';

@Injectable()
export class ArcadeInventoryRepository
  extends BaseRepositoryImpl<
    ArcadeInventoryItem,
    CreateInventoryItemDto,
    UpdateInventoryItemDto
  >
  implements IArcadeInventoryRepository
{
  constructor(
    private readonly logger: Logger,
    @Inject(DRIZZLE) db: MySql2Database<Record<string, never>>,
  ) {
    super(db, rotomInventory);
  }

  async create(data: CreateInventoryItemDto): Promise<ArcadeInventoryItem> {
    const result = await this.db.insert(rotomInventory).values({
      uuid: data.uuid,
      itemId: data.itemId,
      itemData: data.itemData,
      itemType: data.itemType,
      amount: data.amount || 1,
      rarity: data.rarity || 'common',
      sourceType: data.sourceType,
      used: data.used || 0,
    } as RotomInventoryItem);
    return this.findById(result[0].insertId) as Promise<ArcadeInventoryItem>;
  }

  async update(
    id: number,
    data: UpdateInventoryItemDto,
  ): Promise<ArcadeInventoryItem> {
    const updateData: Partial<RotomInventoryItem> = {};
    if (data.itemId) updateData.itemId = data.itemId;
    if (data.itemData !== undefined) updateData.itemData = data.itemData;
    if (data.itemType) updateData.itemType = data.itemType;
    if (data.amount) updateData.amount = data.amount;
    if (data.rarity) updateData.rarity = data.rarity;
    if (data.sourceType) updateData.sourceType = data.sourceType;
    if (typeof data.used !== 'undefined') updateData.used = data.used;

    await this.db
      .update(rotomInventory)
      .set(updateData)
      .where(eq(rotomInventory.id, id));
    return this.findById(id) as Promise<ArcadeInventoryItem>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(rotomInventory)
      .where(eq(rotomInventory.id, id));
    return result[0].affectedRows > 0;
  }

  async findUserInventory(uuid: string): Promise<ArcadeInventoryItem[]> {
    return this.db
      .select()
      .from(rotomInventory)
      .where(eq(rotomInventory.uuid, uuid)) as unknown as ArcadeInventoryItem[];
  }

  async findUserItem(
    uuid: string,
    itemId: string,
  ): Promise<ArcadeInventoryItem | null> {
    const result = await this.db
      .select()
      .from(rotomInventory)
      .where(
        and(eq(rotomInventory.uuid, uuid), eq(rotomInventory.itemId, itemId)),
      )
      .limit(1);
    return (result[0] || null) as unknown as ArcadeInventoryItem | null;
  }

  async addItem(
    inventoryData: CreateInventoryItemDto,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomInventory).values({
      uuid: inventoryData.uuid,
      itemId: inventoryData.itemId,
      itemData: inventoryData.itemData,
      itemType: inventoryData.itemType,
      amount: inventoryData.amount || 1,
      rarity: inventoryData.rarity || 'common',
      sourceType: inventoryData.sourceType,
      used: inventoryData.used || 0,
    } as RotomInventoryItem);
    return { insertId: result[0].insertId };
  }

  async updateItemQuantity(
    uuid: string,
    itemId: string,
    amount: number,
  ): Promise<ArcadeInventoryItem> {
    await this.db
      .update(rotomInventory)
      .set({ amount } as RotomInventoryItem)
      .where(
        and(eq(rotomInventory.uuid, uuid), eq(rotomInventory.itemId, itemId)),
      );
    return this.findUserItem(uuid, itemId) as Promise<ArcadeInventoryItem>;
  }

  async removeItem(uuid: string, itemId: string): Promise<boolean> {
    const result = await this.db
      .delete(rotomInventory)
      .where(
        and(eq(rotomInventory.uuid, uuid), eq(rotomInventory.itemId, itemId)),
      );
    return result[0].affectedRows > 0;
  }

  async consumeItem(
    uuid: string,
    itemId: string,
    amount: number,
  ): Promise<ArcadeInventoryItem> {
    this.logger.log(`Consuming ${amount} of ${itemId} for ${uuid}`);

    return await this.db.transaction(async (tx) => {
      // FOR UPDATE holds the rows for the whole spend: without it two concurrent
      // claims both read used=0, both write the same total, and both deliver.
      const items = await tx
        .select()
        .from(rotomInventory)
        .where(
          and(
            eq(rotomInventory.uuid, uuid),
            eq(rotomInventory.itemId, itemId),
            gt(rotomInventory.amount, rotomInventory.used),
          ),
        )
        .orderBy(asc(rotomInventory.used), asc(rotomInventory.id))
        .for('update');

      this.logger.log(`Found items for consumption:`, items);

      if (!items.length) {
        throw new NotFoundException('Item not found or no available quantity');
      }

      const totalAvailable = items.reduce(
        (total, item) => total + ((item.amount ?? 0) - (item.used ?? 0)),
        0,
      );

      if (totalAvailable < amount) {
        throw new ConflictException(
          `Insufficient quantity. Available: ${totalAvailable}, Requested: ${amount}`,
        );
      }

      let remainingToConsume = amount;
      let lastUpdatedId: number | null = null;

      for (const item of items) {
        if (remainingToConsume <= 0) break;

        const availableInThisItem = (item.amount ?? 0) - (item.used ?? 0);
        const toConsumeFromThisItem = Math.min(
          remainingToConsume,
          availableInThisItem,
        );

        if (toConsumeFromThisItem > 0) {
          const newUsedCount = (item.used ?? 0) + toConsumeFromThisItem;

          this.logger.log(
            `Updating item ${item.id}: used from ${item.used ?? 0} to ${newUsedCount}`,
          );

          const [res] = await tx
            .update(rotomInventory)
            .set({ used: newUsedCount } as RotomInventoryItem)
            .where(
              and(
                eq(rotomInventory.id, item.id),
                eq(rotomInventory.used, item.used ?? 0),
              ),
            );

          if (res.affectedRows !== 1) {
            throw new ConflictException(
              'Inventory changed during the claim, please retry',
            );
          }

          lastUpdatedId = item.id;
          remainingToConsume -= toConsumeFromThisItem;
        }
      }

      if (lastUpdatedId === null) {
        throw new ConflictException('Failed to update any items');
      }

      const updatedItems = await tx
        .select()
        .from(rotomInventory)
        .where(
          and(eq(rotomInventory.uuid, uuid), eq(rotomInventory.itemId, itemId)),
        );

      const totalRemaining = updatedItems.reduce(
        (total, item) => total + ((item.amount ?? 0) - (item.used ?? 0)),
        0,
      );

      this.logger.log(
        `Consumption complete. Total remaining: ${totalRemaining}`,
      );

      return {
        ...updatedItems.find((i) => i.id === lastUpdatedId),
        remainingAmount: totalRemaining,
      } as unknown as ArcadeInventoryItem;
    });
  }

  async getTotalItems(uuid: string): Promise<number> {
    const items = await this.findUserInventory(uuid);
    return items.reduce(
      (total, item) => total + ((item as ArcadeInventoryItem).amount || 0),
      0,
    );
  }

  async getItemsByType(
    uuid: string,
    type: string,
  ): Promise<ArcadeInventoryItem[]> {
    return this.db
      .select()
      .from(rotomInventory)
      .where(
        and(eq(rotomInventory.uuid, uuid), eq(rotomInventory.itemType, type)),
      ) as unknown as ArcadeInventoryItem[];
  }

  async getItemsByRarity(
    uuid: string,
    rarity: ItemRarity,
  ): Promise<ArcadeInventoryItem[]> {
    return this.db
      .select()
      .from(rotomInventory)
      .where(
        and(eq(rotomInventory.uuid, uuid), eq(rotomInventory.rarity, rarity)),
      ) as unknown as ArcadeInventoryItem[];
  }
}
