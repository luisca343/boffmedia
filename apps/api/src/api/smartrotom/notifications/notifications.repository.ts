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
  // S10: Unread count with simple in-memory cache
  getUnreadCount(userUuid: string): Promise<number>;
}

@Injectable()
export class NotificationsRepository implements INotificationsRepository {
  // S10: Simple in-memory cache for unread counts. TTL 30 seconds per user.
  private readonly unreadCache = new Map<
    string,
    { count: number; expiresAt: number }
  >();

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
      .set({ isRead: true })
      .where(
        and(
          eq(rotomNotifications.id, id),
          eq(rotomNotifications.userUuid, userUuid),
        ),
      );
    // S10: Invalidate cache for this user
    this.unreadCache.delete(userUuid);
  }

  async markAllRead(userUuid: string): Promise<void> {
    await this.db
      .update(rotomNotifications)
      .set({ isRead: true })
      .where(eq(rotomNotifications.userUuid, userUuid));
    // S10: Invalidate cache for this user
    this.unreadCache.delete(userUuid);
  }

  // ─── S10: Unread count with simple cache ────────────────────────────────────

  /**
   * Gets unread notification count for a user with simple 30-second cache.
   * Cache is invalidated when notifications are marked as read.
   */
  async getUnreadCount(userUuid: string): Promise<number> {
    const now = Date.now();

    // Check cache
    const cached = this.unreadCache.get(userUuid);
    if (cached && cached.expiresAt > now) {
      return cached.count;
    }

    // Query database if cache miss or expired
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(rotomNotifications)
      .where(
        and(
          eq(rotomNotifications.userUuid, userUuid),
          eq(rotomNotifications.isRead, false),
        ),
      );

    const count = Number(rows[0]?.count ?? 0);

    // Update cache with 30-second TTL
    this.unreadCache.set(userUuid, {
      count,
      expiresAt: now + 30_000,
    });

    return count;
  }
}
