import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomNotifications,
  RotomNotification,
  NewRotomNotification,
} from '@/_db/schema/SmartRotom';

export interface INotificationsRepository {
  findByUser(
    userUuid: string,
    limit: number,
    offset: number,
  ): Promise<{ items: RotomNotification[]; total: number }>;
  create(data: NewRotomNotification): Promise<RotomNotification>;
  markRead(id: number, userUuid: string): Promise<void>;
  markAllRead(userUuid: string): Promise<void>;
}

@Injectable()
export class NotificationsRepository implements INotificationsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async findByUser(
    userUuid: string,
    limit: number,
    offset: number,
  ): Promise<{ items: RotomNotification[]; total: number }> {
    const [items, countResult] = await Promise.all([
      this.db
        .select()
        .from(rotomNotifications)
        .where(eq(rotomNotifications.userUuid, userUuid))
        .orderBy(desc(rotomNotifications.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(rotomNotifications)
        .where(eq(rotomNotifications.userUuid, userUuid)),
    ]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  async create(data: NewRotomNotification): Promise<RotomNotification> {
    const [result] = await this.db
      .insert(rotomNotifications)
      .values(data)
      .$returningId();
    const row = await this.db
      .select()
      .from(rotomNotifications)
      .where(eq(rotomNotifications.id, result.id))
      .limit(1);
    return row[0];
  }

  async markRead(id: number, userUuid: string): Promise<void> {
    await this.db
      .update(rotomNotifications)
      .set({ isRead: 1 })
      .where(
        and(eq(rotomNotifications.id, id), eq(rotomNotifications.userUuid, userUuid)),
      );
  }

  async markAllRead(userUuid: string): Promise<void> {
    await this.db
      .update(rotomNotifications)
      .set({ isRead: 1 })
      .where(eq(rotomNotifications.userUuid, userUuid));
  }
}
