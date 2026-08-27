import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ParticipantProgress } from '@/_db/schema/BoffMediaEvents';
import { AchievementsService } from './achievements.service';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';
import { ProgressRepository } from '../repositories/progress.repository';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly achievementsService: AchievementsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Run `fn` against a transaction-scoped copy of this service, so multi-step
   * writes commit together or not at all. This allows updateProgress to update
   * team scores atomically with the progress insert.
   */
  async transaction<T>(
    fn: (service: ProgressService) => Promise<T>,
  ): Promise<T> {
    return this.progressRepository.runInTransaction((txRepository) =>
      fn(
        new ProgressService(
          txRepository,
          this.achievementsService,
          this.notificationsService,
        ),
      ),
    );
  }

  async updateProgress(
    participantId: number,
    achievementId: number,
    progress: number,
    teamId?: number,
  ): Promise<ParticipantProgress> {
    // 1. Validate participant can receive this achievement
    const canReceive = await this.progressRepository.canReceiveAchievement(
      participantId,
      achievementId,
    );
    if (!canReceive) {
      throw new ConflictException(
        'Participant is not eligible to receive this achievement',
      );
    }

    // 2. Get achievement details
    const achievement =
      await this.achievementsService.getAchievementById(achievementId);
    if (!achievement) {
      throw new NotFoundException('Achievement not found');
    }

    // Was it already completed? (so we only notify on the transition)
    const wasCompleted = await this.progressRepository.isCompleted(
      participantId,
      achievementId,
    );

    // 3. Update progress. Clamped: the DTO only bounds progress at >= 0, so a
    //    mistyped 999 on a 5-step achievement would otherwise be stored as-is
    //    and read back as a nonsensical "999/5" everywhere it is displayed.
    const clamped = Math.min(progress, achievement.maxProgress);
    const isCompleted = clamped >= achievement.maxProgress;
    const completedAt = isCompleted ? new Date() : null;

    await this.progressRepository.upsertProgress({
      participantId,
      achievementId,
      currentProgress: clamped,
      isCompleted,
      completedAt,
    });

    // 4. If completed and team exists, atomically update team score with a
    // correlated subquery. This replaces the post-write call to
    // teamsService.updateTeamScore so two concurrent unlocks of the same team
    // cannot lose an update.
    if (isCompleted && teamId) {
      await this.progressRepository.recomputeTeamScore(teamId);
    }

    // 4b. Notify the participant's user on a fresh unlock (best-effort).
    if (isCompleted && !wasCompleted) {
      await this.notifyAchievementUnlocked(participantId, achievement);
    }

    // 5. Return updated progress
    return this.progressRepository.findProgress(participantId, achievementId);
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
      const userId =
        await this.progressRepository.findParticipantUserId(participantId);
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
    return this.progressRepository.findProgress(participantId, achievementId);
  }

  async getAllParticipantProgress(
    participantId: number,
  ): Promise<ParticipantProgress[]> {
    return this.progressRepository.findAllProgress(participantId);
  }
}
