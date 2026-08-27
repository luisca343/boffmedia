import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaNotifications } from '@/_db/schema/BoffMediaNotifications';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  private toEntity(
    row: typeof boffMediaNotifications.$inferSelect,
  ): NotificationEntity {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body,
      link: row.link,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt
        ? row.createdAt.toISOString()
        : new Date().toISOString(),
    };
  }

  /** The current user's notifications, newest first. Default limit 50, max 100. */
  async list(userId: number, limit = 50): Promise<NotificationEntity[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 100);
    const rows = await this.db
      .select()
      .from(boffMediaNotifications)
      .where(eq(boffMediaNotifications.userId, userId))
      .orderBy(desc(boffMediaNotifications.createdAt))
      .limit(cappedLimit);
    return rows.map((r) => this.toEntity(r));
  }

  /** Count of the current user's unread notifications. */
  async unreadCount(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(boffMediaNotifications)
      .where(
        and(
          eq(boffMediaNotifications.userId, userId),
          isNull(boffMediaNotifications.readAt),
        ),
      );
    return Number(row?.count ?? 0);
  }

  /** Mark one of the user's notifications read (scoped so users can't touch others'). */
  async markRead(userId: number, id: number): Promise<{ success: boolean }> {
    await this.db
      .update(boffMediaNotifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(boffMediaNotifications.id, id),
          eq(boffMediaNotifications.userId, userId),
          isNull(boffMediaNotifications.readAt),
        ),
      );
    return { success: true };
  }

  /** Mark every unread notification for the user as read. */
  async markAllRead(userId: number): Promise<{ success: boolean }> {
    await this.db
      .update(boffMediaNotifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(boffMediaNotifications.userId, userId),
          isNull(boffMediaNotifications.readAt),
        ),
      );
    return { success: true };
  }

  /** Delete one of the user's notifications. */
  async remove(userId: number, id: number): Promise<{ success: boolean }> {
    await this.db
      .delete(boffMediaNotifications)
      .where(
        and(
          eq(boffMediaNotifications.id, id),
          eq(boffMediaNotifications.userId, userId),
        ),
      );
    return { success: true };
  }

  /** Clear all of the user's notifications. */
  async clear(userId: number): Promise<{ success: boolean }> {
    await this.db
      .delete(boffMediaNotifications)
      .where(eq(boffMediaNotifications.userId, userId));
    return { success: true };
  }

  /**
   * Create a notification for one user, or broadcast to every user when
   * `userId` is omitted. Reusable by other services (event/achievement
   * producers) — not just the admin endpoint.
   */
  async create(
    dto: CreateNotificationDto,
    dedupeKey?: string,
  ): Promise<{ created: number }> {
    const base = {
      type: dto.type,
      title: dto.title,
      body: dto.body ?? null,
      link: dto.link ?? null,
    };

    if (dto.userId != null) {
      const row = { ...base, userId: dto.userId, dedupeKey: dedupeKey ?? null };
      if (dedupeKey) {
        // Idempotent: a retried producer (a re-run advance, a redelivered job)
        // refreshes the existing notification instead of stacking a duplicate
        // in the user's list. `readAt` is deliberately untouched — re-sending
        // must not mark something the user already read as unread again.
        await this.db
          .insert(boffMediaNotifications)
          .values(row)
          .onDuplicateKeyUpdate({
            set: { title: row.title, body: row.body, link: row.link },
          });
        return { created: 1 };
      }
      await this.db.insert(boffMediaNotifications).values(row);
      return { created: 1 };
    }

    // Broadcast: one row per user, batched into chunks of 500 to avoid
    // overwhelming the insert statement for large user bases.
    const users = await this.db
      .select({ id: boffMediaUsers.id })
      .from(boffMediaUsers);
    if (users.length === 0) return { created: 0 };

    const CHUNK_SIZE = 500;
    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const chunk = users.slice(i, i + CHUNK_SIZE);
      await this.db
        .insert(boffMediaNotifications)
        .values(chunk.map((u) => ({ ...base, userId: u.id })));
    }
    return { created: users.length };
  }
}
