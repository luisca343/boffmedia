import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaParticipantProgress,
  boffMediaParticipants,
  ParticipantProgress,
  validateParticipantCanReceiveAchievement,
} from '@/_db/schema/Events';
import { AchievementsService } from './achievements.service';
import { TeamsService } from './teams.service';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class ProgressService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly achievementsService: AchievementsService,
    private readonly teamsService: TeamsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async updateProgress(
    participantId: number,
    achievementId: number,
    progress: number,
    teamId?: number,
  ): Promise<ParticipantProgress> {
    // 1. Validate participant can receive this achievement
    const canReceive = await validateParticipantCanReceiveAchievement(
      participantId,
      achievementId,
      this.db,
    );
    if (!canReceive) {
      throw new Error(
        'Participant is not eligible to receive this achievement',
      );
    }

    // 2. Get achievement details
    const achievement =
      await this.achievementsService.getAchievementById(achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Was it already completed? (so we only notify on the transition)
    const [existing] = await this.db
      .select({ isCompleted: boffMediaParticipantProgress.isCompleted })
      .from(boffMediaParticipantProgress)
      .where(
        and(
          eq(boffMediaParticipantProgress.participantId, participantId),
          eq(boffMediaParticipantProgress.achievementId, achievementId),
        ),
      );
    const wasCompleted = existing?.isCompleted === true;

    // 3. Update progress
    const isCompleted = progress >= achievement.maxProgress;
    const completedAt = isCompleted ? new Date() : null;

    await this.db
      .insert(boffMediaParticipantProgress)
      .values({
        participantId,
        achievementId,
        currentProgress: progress,
        isCompleted,
        completedAt,
        lastUpdated: new Date(),
        createdAt: new Date(),
      } as ParticipantProgress)
      .onDuplicateKeyUpdate({
        currentProgress: progress,
        isCompleted,
        completedAt,
        lastUpdated: new Date(),
      } as any);

    // 4. If completed and team exists, update team score
    if (isCompleted && teamId) {
      await this.teamsService.updateTeamScore(teamId);
    }

    // 4b. Notify the participant's user on a fresh unlock (best-effort).
    if (isCompleted && !wasCompleted) {
      await this.notifyAchievementUnlocked(participantId, achievement);
    }

    // 5. Return updated progress
    const result = await this.db
      .select()
      .from(boffMediaParticipantProgress)
      .where(
        and(
          eq(boffMediaParticipantProgress.participantId, participantId),
          eq(boffMediaParticipantProgress.achievementId, achievementId),
        ),
      );

    return result[0];
  }

  /**
   * Fire a notification to the participant's linked user when they unlock an
   * achievement/medal. Best-effort: never blocks or fails the award itself.
   */
  private async notifyAchievementUnlocked(
    participantId: number,
    achievement: { name: string; itemType: string; eventId: number | null },
  ): Promise<void> {
    try {
      const [participant] = await this.db
        .select({ userId: boffMediaParticipants.userId })
        .from(boffMediaParticipants)
        .where(eq(boffMediaParticipants.id, participantId));

      const userId = participant?.userId;
      if (!userId) return; // anonymous participant — nobody to notify

      await this.notificationsService.create({
        userId,
        type: 'achievement',
        title:
          achievement.itemType === 'medal'
            ? '¡Medalla conseguida!'
            : '¡Logro desbloqueado!',
        body: achievement.name,
        link: achievement.eventId
          ? `/eventos/${achievement.eventId}`
          : '/logros',
      });
    } catch {
      // swallow — a failed notification must not break awarding progress
    }
  }

  async getParticipantProgress(
    participantId: number,
    achievementId: number,
  ): Promise<ParticipantProgress> {
    const result = await this.db
      .select()
      .from(boffMediaParticipantProgress)
      .where(
        and(
          eq(boffMediaParticipantProgress.participantId, participantId),
          eq(boffMediaParticipantProgress.achievementId, achievementId),
        ),
      );

    return result[0];
  }

  async getAllParticipantProgress(
    participantId: number,
  ): Promise<ParticipantProgress[]> {
    return this.db
      .select()
      .from(boffMediaParticipantProgress)
      .where(eq(boffMediaParticipantProgress.participantId, participantId));
  }
}
