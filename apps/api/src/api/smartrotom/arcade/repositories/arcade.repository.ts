import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, SQL } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomArcadeStreaks,
  rotomInventory,
  rotomUsers,
  RotomInventoryItem,
} from '@/_db/schema/SmartRotom';

@Injectable()
export class ArcadeRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findStreakByUuid(uuid: string) {
    const result = await this.db
      .select({
        lastClaimed: rotomArcadeStreaks.lastClaimed,
        streak: rotomArcadeStreaks.streak,
        totalClaims: rotomArcadeStreaks.totalClaims,
        lastBanner: rotomArcadeStreaks.lastBanner,
      })
      .from(rotomArcadeStreaks)
      .where(eq(rotomArcadeStreaks.uuid, uuid));

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
    return this.db.insert(rotomArcadeStreaks).values({ uuid, ...data });
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
      .update(rotomArcadeStreaks)
      .set(data as any)
      .where(eq(rotomArcadeStreaks.uuid, uuid));
  }

  async findInventoryByUuid(uuid: string, sourceType?: string) {
    let condition = eq(rotomInventory.uuid, uuid);

    if (sourceType) {
      condition = and(
        condition,
        eq(rotomInventory.sourceType, sourceType),
      ) as SQL<unknown>;
    }

    return this.db
      .select({
        id: rotomInventory.id,
        itemId: rotomInventory.itemId,
        itemType: rotomInventory.itemType,
        amount: rotomInventory.amount,
        sourceType: rotomInventory.sourceType,
        used: rotomInventory.used,
        rarity: rotomInventory.rarity,
        createdAt: rotomInventory.createdAt,
      })
      .from(rotomInventory)
      .where(condition);
  }

  async findAvailableBoxes(uuid: string, boxId: string) {
    return this.db
      .select({
        id: rotomInventory.id,
        itemId: rotomInventory.itemId,
        amount: rotomInventory.amount,
        used: rotomInventory.used,
      })
      .from(rotomInventory)
      .where(
        and(
          eq(rotomInventory.uuid, uuid),
          eq(rotomInventory.itemId, boxId),
          sql`${rotomInventory.amount} > ${rotomInventory.used}`,
        ),
      )
      .orderBy(rotomInventory.createdAt);
  }

  async findConsumableItems(uuid: string, itemId: string) {
    return this.db
      .select({
        id: rotomInventory.id,
        itemId: rotomInventory.itemId,
        itemType: rotomInventory.itemType,
        amount: rotomInventory.amount,
        used: rotomInventory.used,
        createdAt: rotomInventory.createdAt,
      })
      .from(rotomInventory)
      .where(
        and(
          eq(rotomInventory.uuid, uuid),
          eq(rotomInventory.itemId, itemId),
          sql`${rotomInventory.amount} > ${rotomInventory.used}`,
        ),
      )
      .orderBy(rotomInventory.createdAt);
  }

  async addInventoryItem(data: Partial<RotomInventoryItem>) {
    return this.db.insert(rotomInventory).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RotomInventoryItem);
  }

  async updateInventoryItemUsage(id: number, used: number) {
    return this.db
      .update(rotomInventory)
      .set({ used } as RotomInventoryItem)
      .where(eq(rotomInventory.id, id));
  }

  async findUserByUuid(uuid: string) {
    const result = await this.db
      .select({ id: rotomUsers.id })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid))
      .limit(1);

    return result[0] || null;
  }
}
