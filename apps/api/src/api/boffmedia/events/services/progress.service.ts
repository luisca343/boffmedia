import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaParticipantProgress,
  boffMediaParticipants,
  boffMediaEventTeams,
  boffMediaEventTeamMembers,
  boffMediaAchievements,
  ParticipantProgress,
  validateParticipantCanReceiveAchievement,
} from '@/_db/schema/BoffMediaEvents';
import { AchievementsService } from './achievements.service';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class ProgressService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
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
    return this.db.transaction((tx) =>
      fn(
        new ProgressService(
          tx as unknown as MySql2Database<Record<string, never>>,
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
    const canReceive = await validateParticipantCanReceiveAchievement(
      participantId,
      achievementId,
      this.db,
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

    // 3. Update progress. Clamped: the DTO only bounds progress at >= 0, so a
    //    mistyped 999 on a 5-step achievement would otherwise be stored as-is
    //    and read back as a nonsensical "999/5" everywhere it is displayed.
    const clamped = Math.min(progress, achievement.maxProgress);
    const isCompleted = clamped >= achievement.maxProgress;
    const completedAt = isCompleted ? new Date() : null;

    await this.db
      .insert(boffMediaParticipantProgress)
      .values({
        participantId,
        achievementId,
        currentProgress: clamped,
        isCompleted,
        completedAt,
        lastUpdated: new Date(),
        createdAt: new Date(),
      } as ParticipantProgress)
      .onDuplicateKeyUpdate({
        currentProgress: clamped,
        isCompleted,
        completedAt,
        lastUpdated: new Date(),
      } as any);

    // 4. If completed and team exists, atomically update team score with a
    // correlated subquery. This replaces the post-write call to
    // teamsService.updateTeamScore so two concurrent unlocks of the same team
    // cannot lose an update.
    if (isCompleted && teamId) {
      await this.updateTeamScoreAtomic(teamId);
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
   * Atomically recompute and update a team's total score in one statement. The
   * sum matches TeamsRepository.calculateTeamScore exactly (only counting
   * completed achievements from this event), but executes inside whatever
   * transaction context the caller provided, so concurrent award updates cannot
   * race and lose each other.
   */
  private async updateTeamScoreAtomic(teamId: number): Promise<void> {
    await this.db
      .update(boffMediaEventTeams)
      .set({
        totalScore: sql`(
          SELECT COALESCE(SUM(${boffMediaAchievements.points}), 0)
          FROM ${boffMediaParticipantProgress}
          INNER JOIN ${boffMediaEventTeamMembers}
            ON ${boffMediaEventTeamMembers.participantId} = ${boffMediaParticipantProgress.participantId}
          INNER JOIN ${boffMediaEventTeams}
            ON ${boffMediaEventTeams.id} = ${boffMediaEventTeamMembers.teamId}
          INNER JOIN ${boffMediaAchievements}
            ON ${boffMediaAchievements.id} = ${boffMediaParticipantProgress.achievementId}
            AND ${boffMediaAchievements.eventId} = ${boffMediaEventTeams.eventId}
            AND ${boffMediaAchievements.deletedAt} IS NULL
          WHERE ${boffMediaEventTeamMembers.teamId} = ${teamId}
            AND ${boffMediaParticipantProgress.isCompleted} = true
        )`,
        updatedAt: new Date(),
      } as any)
      .where(eq(boffMediaEventTeams.id, teamId));
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
