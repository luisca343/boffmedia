import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, SQL } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  smartRotomArcadeStreaks,
  smartRotomInventory,
  smartrotomUsers,
  SmartRotomInventoryItem,
} from '@/_db/schema/SmartRotom';

@Injectable()
export class ArcadeRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findStreakByUuid(uuid: string) {
    const result = await this.db
      .select({
        lastClaimed: smartRotomArcadeStreaks.lastClaimed,
        streak: smartRotomArcadeStreaks.streak,
        totalClaims: smartRotomArcadeStreaks.totalClaims,
        lastBanner: smartRotomArcadeStreaks.lastBanner,
      })
      .from(smartRotomArcadeStreaks)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid));

    return result[0] || null;
  }

  async createStreak(
    uuid: string,
    data: {
      lastClaimed: Date;
      streak: number;
      totalClaims: number;
      lastBanner: string;
    },
  ) {
    return this.db.insert(smartRotomArcadeStreaks).values({ uuid, ...data });
  }

  async updateStreak(
    uuid: string,
    data: {
      lastClaimed: Date;
      streak: number;
      totalClaims: number;
      lastBanner: string;
    },
  ) {
    return this.db
      .update(smartRotomArcadeStreaks)
      .set(data as any)
      .where(eq(smartRotomArcadeStreaks.uuid, uuid));
  }

  async findInventoryByUuid(uuid: string, sourceType?: string) {
    let condition = eq(smartRotomInventory.uuid, uuid);

    if (sourceType) {
      condition = and(
        condition,
        eq(smartRotomInventory.sourceType, sourceType),
      ) as SQL<unknown>;
    }

    return this.db
      .select({
        id: smartRotomInventory.id,
        itemId: smartRotomInventory.itemId,
        itemType: smartRotomInventory.itemType,
        amount: smartRotomInventory.amount,
        sourceType: smartRotomInventory.sourceType,
        used: smartRotomInventory.used,
        rarity: smartRotomInventory.rarity,
        createdAt: smartRotomInventory.createdAt,
      })
      .from(smartRotomInventory)
      .where(condition);
  }

  async findAvailableBoxes(uuid: string, boxId: string) {
    return this.db
      .select({
        id: smartRotomInventory.id,
        itemId: smartRotomInventory.itemId,
        amount: smartRotomInventory.amount,
        used: smartRotomInventory.used,
      })
      .from(smartRotomInventory)
      .where(
        and(
          eq(smartRotomInventory.uuid, uuid),
          eq(smartRotomInventory.itemId, boxId),
          sql`${smartRotomInventory.amount} > ${smartRotomInventory.used}`,
        ),
      )
      .orderBy(smartRotomInventory.createdAt);
  }

  async findConsumableItems(uuid: string, itemId: string) {
    return this.db
      .select({
        id: smartRotomInventory.id,
        itemId: smartRotomInventory.itemId,
        itemType: smartRotomInventory.itemType,
        amount: smartRotomInventory.amount,
        used: smartRotomInventory.used,
        createdAt: smartRotomInventory.createdAt,
      })
      .from(smartRotomInventory)
      .where(
        and(
          eq(smartRotomInventory.uuid, uuid),
          eq(smartRotomInventory.itemId, itemId),
          sql`${smartRotomInventory.amount} > ${smartRotomInventory.used}`,
        ),
      )
      .orderBy(smartRotomInventory.createdAt);
  }

  async addInventoryItem(data: Partial<SmartRotomInventoryItem>) {
    return this.db.insert(smartRotomInventory).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SmartRotomInventoryItem);
  }

  async updateInventoryItemUsage(id: number, used: number) {
    return this.db
      .update(smartRotomInventory)
      .set({ used } as SmartRotomInventoryItem)
      .where(eq(smartRotomInventory.id, id));
  }

  async findUserByUuid(uuid: string) {
    const result = await this.db
      .select({ id: smartrotomUsers.id })
      .from(smartrotomUsers)
      .where(eq(smartrotomUsers.uuid, uuid))
      .limit(1);

    return result[0] || null;
  }
}
