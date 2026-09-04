import { Injectable } from '@nestjs/common';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { NOTIFICATION_TYPE } from '@/_db/schema/BoffMediaNotifications';

export interface PreferenceUpdateDto {
  type: string;
  isMuted: boolean;
}

export interface PreferenceViewDto {
  type: string;
  isMuted: boolean;
}

@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly repo: NotificationPreferencesRepository,
  ) {}

  /**
   * Get all preferences for the current user, filling in defaults for types with no rows.
   */
  async listForUser(userId: number): Promise<PreferenceViewDto[]> {
    const existing = await this.repo.findByUser(userId);

    // Build a map of what exists
    const existingMap = new Map(existing.map((p) => [p.type, p]));

    // Return all types: existing rows + defaults for missing ones
    return Object.values(NOTIFICATION_TYPE).map((type) => {
      const pref = existingMap.get(type);
      return {
        type,
        isMuted: pref?.isMuted ?? false,
      };
    });
  }

  /**
   * Update a single preference (upsert).
   */
  async updatePreference(
    userId: number,
    type: string,
    update: Partial<PreferenceUpdateDto>,
  ): Promise<PreferenceViewDto> {
    // Get current state (use defaults if none exists)
    const existing = await this.repo.findByUserAndType(userId, type);
    const current = {
      isMuted: existing?.isMuted ?? false,
    };

    // Merge with update
    const newState = {
      isMuted: update.isMuted ?? current.isMuted,
    };

    // If all values are defaults, delete the row (no need to store it)
    if (!newState.isMuted) {
      await this.repo.delete(userId, type);
    } else {
      await this.repo.upsert(userId, type, newState.isMuted);
    }

    return {
      type,
      ...newState,
    };
  }

  /**
   * Check if a notification of a given type should be created for a user.
   * Returns false if the type is muted.
   */
  async shouldDeliver(userId: number, type: string): Promise<boolean> {
    const isMuted = await this.repo.isMuted(userId, type);
    return !isMuted;
  }
}
