import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaParticipantProgress,
  ParticipantProgress,
  validateParticipantCanReceiveAchievement,
} from '@/_db/schema/Events';
import { AchievementsService } from './achievements.service';
import { TeamsService } from './teams.service';

@Injectable()
export class ProgressService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly achievementsService: AchievementsService,
    private readonly teamsService: TeamsService,
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

    // 3. Update progress
    const isCompleted = progress >= achievement.maxProgress ? 1 : 0;
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
