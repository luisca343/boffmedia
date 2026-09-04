import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaNotificationPreferences,
  NotificationPreference,
  NewNotificationPreference,
  NOTIFICATION_TYPE,
} from '@/_db/schema/BoffMediaNotifications';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class NotificationPreferencesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  /**
   * Get preferences for a user and notification type.
   * Returns null if no preference row exists (meaning defaults apply: not muted, email on).
   */
  async findByUserAndType(
    userId: number,
    type: string,
  ): Promise<NotificationPreference | null> {
    const result = await this.db
      .select()
      .from(boffMediaNotificationPreferences)
      .where(
        and(
          eq(boffMediaNotificationPreferences.userId, userId),
          eq(boffMediaNotificationPreferences.type, type as any),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Get all preferences for a user.
   */
  async findByUser(userId: number): Promise<NotificationPreference[]> {
    return this.db
      .select()
      .from(boffMediaNotificationPreferences)
      .where(eq(boffMediaNotificationPreferences.userId, userId));
  }

  /**
   * Upsert (update or insert) a preference row.
   */
  async upsert(
    userId: number,
    type: string,
    isMuted: boolean,
  ): Promise<NotificationPreference> {
    // Drizzle's onDuplicateKeyUpdate for MySQL
    const result = await this.db
      .insert(boffMediaNotificationPreferences)
      .values({
        userId,
        type: type as any,
        isMuted,
      })
      .onDuplicateKeyUpdate({
        set: {
          isMuted,
        },
      });

    // Re-fetch to return the full row
    return this.findByUserAndType(userId, type).then(
      (pref) =>
        pref ||
        Promise.reject(
          new Error(`Failed to upsert preference for user ${userId}, type ${type}`),
        ),
    );
  }

  /**
   * Delete a preference row (reverts to defaults).
   */
  async delete(userId: number, type: string): Promise<void> {
    await this.db
      .delete(boffMediaNotificationPreferences)
      .where(
        and(
          eq(boffMediaNotificationPreferences.userId, userId),
          eq(boffMediaNotificationPreferences.type, type as any),
        ),
      );
  }

  /**
   * Check if a notification type is muted for a user.
   * Defaults to false (not muted) if no preference row exists.
   */
  async isMuted(userId: number, type: string): Promise<boolean> {
    const pref = await this.findByUserAndType(userId, type);
    return pref?.isMuted ?? false;
  }
}
