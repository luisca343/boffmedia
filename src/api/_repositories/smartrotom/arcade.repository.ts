import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  smartRotomArcadeStreaks, 
  smartRotomInventory, 
  smartrotomUsers,
  SmartRotomInventoryItem 
} from '@/_db/schema/SmartRotom';
import {
  BaseArcadeStreak,
  RawInventoryItem,
  StreakUpdateData
} from '@api/smartrotom/arcade/types/arcade.types';

@Injectable()
export class ArcadeRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== STREAK OPERATIONS ====================

  async findStreakByUuid(uuid: string): Promise<Partial<BaseArcadeStreak> | null> {
    const result = await this.db.select({
      lastClaimed: smartRotomArcadeStreaks.lastClaimed,
      streak: smartRotomArcadeStreaks.streak,
      totalClaims: smartRotomArcadeStreaks.totalClaims,
      lastBanner: smartRotomArcadeStreaks.lastBanner
    })
    .from(smartRotomArcadeStreaks)
    .where(eq(smartRotomArcadeStreaks.uuid, uuid));
    
    return result[0] || null;
  }

  async createStreak(uuid: string, data: StreakUpdateData): Promise<any> {
    return this.db.insert(smartRotomArcadeStreaks)
      .values({ uuid, ...data });
  }

  async updateStreak(uuid: string, data: StreakUpdateData): Promise<any> {
    return this.db.update(smartRotomArcadeStreaks)
      .set(data as any)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid));
  }

  // ==================== INVENTORY OPERATIONS ====================

  async findInventoryByUuid(uuid: string, sourceType?: string): Promise<RawInventoryItem[]> {
    let condition = eq(smartRotomInventory.uuid, uuid);
    
    if (sourceType) {
      condition = and(condition, eq(smartRotomInventory.sourceType, sourceType));
    }
    
    return this.db.select({
      id: smartRotomInventory.id,
      uuid: smartRotomInventory.uuid,
      itemId: smartRotomInventory.itemId,
      itemType: smartRotomInventory.itemType,
      amount: smartRotomInventory.amount,
      sourceType: smartRotomInventory.sourceType,
      used: smartRotomInventory.used,
      rarity: smartRotomInventory.rarity,
      createdAt: smartRotomInventory.createdAt
    })
    .from(smartRotomInventory)
    .where(condition);
  }

  async findAvailableBoxes(uuid: string, boxId: string): Promise<Partial<RawInventoryItem>[]> {
    return this.db.select({
      id: smartRotomInventory.id,
      itemId: smartRotomInventory.itemId,
      amount: smartRotomInventory.amount,
      used: smartRotomInventory.used
    })
    .from(smartRotomInventory)
    .where(and(
      eq(smartRotomInventory.uuid, uuid),
      eq(smartRotomInventory.itemId, boxId),
      sql`${smartRotomInventory.amount} > ${smartRotomInventory.used}`
    ))
    .orderBy(smartRotomInventory.createdAt);
  }

  async findConsumableItems(uuid: string, itemId: string): Promise<Partial<RawInventoryItem>[]> {
    return this.db.select({
      id: smartRotomInventory.id,
      itemId: smartRotomInventory.itemId,
      itemType: smartRotomInventory.itemType,
      amount: smartRotomInventory.amount,
      used: smartRotomInventory.used,
      createdAt: smartRotomInventory.createdAt
    })
    .from(smartRotomInventory)
    .where(and(
      eq(smartRotomInventory.uuid, uuid),
      eq(smartRotomInventory.itemId, itemId),
      sql`${smartRotomInventory.amount} > ${smartRotomInventory.used}`
    ))
    .orderBy(smartRotomInventory.createdAt);
  }

  async addInventoryItem(data: Partial<SmartRotomInventoryItem>): Promise<{ insertId: number }> {
    const result = await this.db.insert(smartRotomInventory)
      .values({
        ...data,
        createdAt: new Date(),
      } as SmartRotomInventoryItem);
    
    return { insertId: result[0].insertId };
  }

  async updateInventoryItemUsage(id: number, used: number): Promise<any> {
    return this.db.update(smartRotomInventory)
      .set({ used } as SmartRotomInventoryItem)
      .where(eq(smartRotomInventory.id, id));
  }

  // ==================== USER OPERATIONS ====================

  async findUserByUuid(uuid: string): Promise<{ id: number } | null> {
    const result = await this.db.select({ id: smartrotomUsers.id })
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid))
      .limit(1);
    
    return result[0] || null;
  }
}