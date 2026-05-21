import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  srNotifications,
  SrNotification,
  NewSrNotification,
} from '@/_db/schema/SmartRotom';

export interface INotificationsRepository {
  findByUser(
    userUuid: string,
    limit: number,
    offset: number,
  ): Promise<{ items: SrNotification[]; total: number }>;
  create(data: NewSrNotification): Promise<SrNotification>;
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
  ): Promise<{ items: SrNotification[]; total: number }> {
    const [items, countResult] = await Promise.all([
      this.db
        .select()
        .from(srNotifications)
        .where(eq(srNotifications.userUuid, userUuid))
        .orderBy(desc(srNotifications.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(srNotifications)
        .where(eq(srNotifications.userUuid, userUuid)),
    ]);

    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  async create(data: NewSrNotification): Promise<SrNotification> {
    const [result] = await this.db
      .insert(srNotifications)
      .values(data)
      .$returningId();
    const row = await this.db
      .select()
      .from(srNotifications)
      .where(eq(srNotifications.id, result.id))
      .limit(1);
    return row[0];
  }

  async markRead(id: number, userUuid: string): Promise<void> {
    await this.db
      .update(srNotifications)
      .set({ isRead: 1 })
      .where(
        and(eq(srNotifications.id, id), eq(srNotifications.userUuid, userUuid)),
      );
  }

  async markAllRead(userUuid: string): Promise<void> {
    await this.db
      .update(srNotifications)
      .set({ isRead: 1 })
      .where(eq(srNotifications.userUuid, userUuid));
  }
}
