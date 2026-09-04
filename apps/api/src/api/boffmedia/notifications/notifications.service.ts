import { Injectable, Optional } from '@nestjs/common';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  NotificationRow,
  NotificationsRepository,
} from './repositories/notifications.repository';
import { NotificationPreferencesService } from './services/notification-preferences.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repo: NotificationsRepository,
    @Optional()
    private readonly preferencesService?: NotificationPreferencesService,
  ) {}

  private toEntity(row: NotificationRow): NotificationEntity {
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
    const rows = await this.repo.findByUser(userId, cappedLimit);
    return rows.map((r) => this.toEntity(r));
  }

  /** Count of the current user's unread notifications. */
  async unreadCount(userId: number): Promise<number> {
    return this.repo.countUnread(userId);
  }

  /** Mark one of the user's notifications read (scoped so users can't touch others'). */
  async markRead(userId: number, id: number): Promise<{ success: boolean }> {
    await this.repo.markRead(userId, id);
    return { success: true };
  }

  /** Mark every unread notification for the user as read. */
  async markAllRead(userId: number): Promise<{ success: boolean }> {
    await this.repo.markAllRead(userId);
    return { success: true };
  }

  /** Delete one of the user's notifications. */
  async remove(userId: number, id: number): Promise<{ success: boolean }> {
    await this.repo.remove(userId, id);
    return { success: true };
  }

  /** Clear all of the user's notifications. */
  async clear(userId: number): Promise<{ success: boolean }> {
    await this.repo.clear(userId);
    return { success: true };
  }

  /**
   * Create a notification for one user, or broadcast to every user when
   * `userId` is omitted. Reusable by other services (event/achievement
   * producers) — not just the admin endpoint.
   *
   * Respects user notification preferences: if a type is muted, the
   * notification is skipped.
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
      // Check preferences: if muted, skip creation
      if (this.preferencesService) {
        const shouldDeliver = await this.preferencesService.shouldDeliver(
          dto.userId,
          dto.type,
        );
        if (!shouldDeliver) {
          return { created: 0 };
        }
      }

      const row = { ...base, userId: dto.userId, dedupeKey: dedupeKey ?? null };
      if (dedupeKey) {
        // Idempotent: a retried producer (a re-run advance, a redelivered job)
        // refreshes the existing notification instead of stacking a duplicate
        // in the user's list.
        await this.repo.upsertByDedupeKey(row);
        return { created: 1 };
      }
      await this.repo.insert(row);
      return { created: 1 };
    }

    const userIds = await this.repo.findAllUserIds();
    if (userIds.length === 0) return { created: 0 };

    // For broadcast, filter out users who have this type muted
    if (this.preferencesService) {
      const deliveryMap = await Promise.all(
        userIds.map(async (uid) => ({
          userId: uid,
          shouldDeliver: await this.preferencesService!.shouldDeliver(
            uid,
            dto.type,
          ),
        })),
      );
      const activeUserIds = deliveryMap
        .filter((d) => d.shouldDeliver)
        .map((d) => d.userId);

      if (activeUserIds.length === 0) return { created: 0 };

      await this.repo.insertBroadcast(activeUserIds, base);
      return { created: activeUserIds.length };
    }

    await this.repo.insertBroadcast(userIds, base);
    return { created: userIds.length };
  }
}
