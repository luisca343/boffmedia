import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, sql } from 'drizzle-orm';
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

type Db = MySql2Database<Record<string, never>>;

@Injectable()
export class ProgressRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  /**
   * Run `work` against a copy of this repository bound to a transaction.
   *
   * The copy is the point: awarding an achievement writes progress and then
   * recomputes a team score, and those two have to commit together. Handing the
   * caller a transaction-scoped repository lets the service compose them without
   * ever seeing the connection itself.
   */
  async runInTransaction<T>(
    work: (repo: ProgressRepository) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction((tx) =>
      work(new ProgressRepository(tx as unknown as Db)),
    );
  }

  /**
   * Eligibility lives in the schema module and needs a connection handle, so it
   * belongs on this side of the boundary rather than in the service.
   */
  async canReceiveAchievement(
    participantId: number,
    achievementId: number,
  ): Promise<boolean> {
    return validateParticipantCanReceiveAchievement(
      participantId,
      achievementId,
      this.db,
    );
  }

  /** Whether the pair is already completed — used to notify only on the transition. */
  async isCompleted(
    participantId: number,
    achievementId: number,
  ): Promise<boolean> {
    const [existing] = await this.db
      .select({ isCompleted: boffMediaParticipantProgress.isCompleted })
      .from(boffMediaParticipantProgress)
      .where(
        and(
          eq(boffMediaParticipantProgress.participantId, participantId),
          eq(boffMediaParticipantProgress.achievementId, achievementId),
        ),
      );
    return existing?.isCompleted === true;
  }

  async upsertProgress(values: {
    participantId: number;
    achievementId: number;
    currentProgress: number;
    isCompleted: boolean;
    completedAt: Date | null;
  }): Promise<void> {
    const now = new Date();
    await this.db
      .insert(boffMediaParticipantProgress)
      .values({
        ...values,
        lastUpdated: now,
        createdAt: now,
      } as ParticipantProgress)
      .onDuplicateKeyUpdate({
        currentProgress: values.currentProgress,
        isCompleted: values.isCompleted,
        completedAt: values.completedAt,
        lastUpdated: now,
      } as any);
  }

  /**
   * Recompute a team's total score in ONE statement.
   *
   * The correlated subquery is what makes this safe: reading the score, summing
   * in JavaScript and writing it back would let two concurrent unlocks on the
   * same team each overwrite the other's result. The sum matches
   * TeamsRepository.calculateTeamScore exactly — completed achievements from
   * this event only.
   */
  async recomputeTeamScore(teamId: number): Promise<void> {
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

  /** Null for an anonymous participant — there is nobody to notify. */
  async findParticipantUserId(participantId: number): Promise<number | null> {
    const [participant] = await this.db
      .select({ userId: boffMediaParticipants.userId })
      .from(boffMediaParticipants)
      .where(eq(boffMediaParticipants.id, participantId));
    return participant?.userId ?? null;
  }

  async findProgress(
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

  async findAllProgress(
    participantId: number,
  ): Promise<ParticipantProgress[]> {
    return this.db
      .select()
      .from(boffMediaParticipantProgress)
      .where(eq(boffMediaParticipantProgress.participantId, participantId));
  }
}
