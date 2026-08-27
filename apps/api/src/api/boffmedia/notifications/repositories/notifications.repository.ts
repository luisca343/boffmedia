import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaNotifications } from '@/_db/schema/BoffMediaNotifications';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

export type NotificationRow = typeof boffMediaNotifications.$inferSelect;
export type NewNotification = typeof boffMediaNotifications.$inferInsert;

const BROADCAST_CHUNK_SIZE = 500;

@Injectable()
export class NotificationsRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /** Newest first. The caller is responsible for capping `limit`. */
  async findByUser(userId: number, limit: number): Promise<NotificationRow[]> {
    return this.db
      .select()
      .from(boffMediaNotifications)
      .where(eq(boffMediaNotifications.userId, userId))
      .orderBy(desc(boffMediaNotifications.createdAt))
      .limit(limit);
  }

  async countUnread(userId: number): Promise<number> {
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

  /**
   * Every write below is scoped by `userId` as well as by id. That pairing is
   * the authorization check, not a convenience: without it a caller could pass
   * any notification id and act on somebody else's row.
   */
  async markRead(userId: number, id: number): Promise<void> {
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
  }

  async markAllRead(userId: number): Promise<void> {
    await this.db
      .update(boffMediaNotifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(boffMediaNotifications.userId, userId),
          isNull(boffMediaNotifications.readAt),
        ),
      );
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.db
      .delete(boffMediaNotifications)
      .where(
        and(
          eq(boffMediaNotifications.id, id),
          eq(boffMediaNotifications.userId, userId),
        ),
      );
  }

  async clear(userId: number): Promise<void> {
    await this.db
      .delete(boffMediaNotifications)
      .where(eq(boffMediaNotifications.userId, userId));
  }

  async insert(row: NewNotification): Promise<void> {
    await this.db.insert(boffMediaNotifications).values(row);
  }

  /**
   * Insert, or refresh the existing row carrying the same dedupeKey.
   *
   * `readAt` is deliberately absent from the update set: a redelivered producer
   * must not mark something the user has already read as unread again.
   */
  async upsertByDedupeKey(row: NewNotification): Promise<void> {
    await this.db
      .insert(boffMediaNotifications)
      .values(row)
      .onDuplicateKeyUpdate({
        set: { title: row.title, body: row.body ?? null, link: row.link ?? null },
      });
  }

  async findAllUserIds(): Promise<number[]> {
    const users = await this.db
      .select({ id: boffMediaUsers.id })
      .from(boffMediaUsers);
    return users.map((u) => u.id);
  }

  /** One row per user, chunked so a large user base does not blow the statement size. */
  async insertBroadcast(
    userIds: number[],
    base: Omit<NewNotification, 'userId'>,
  ): Promise<void> {
    for (let i = 0; i < userIds.length; i += BROADCAST_CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + BROADCAST_CHUNK_SIZE);
      await this.db
        .insert(boffMediaNotifications)
        .values(chunk.map((id) => ({ ...base, userId: id })));
    }
  }
}
