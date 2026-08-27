import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaParticipants,
  boffMediaEventParticipants,
  boffMediaParticipantProgress,
  boffMediaAchievements,
  Participant,
  EventParticipant,
} from '@/_db/schema/BoffMediaEvents';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

@Injectable()
export class ParticipantsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findByUserId(userId: number): Promise<Participant> {
    const result = await this.db
      .select()
      .from(boffMediaParticipants)
      .where(eq(boffMediaParticipants.userId, userId));
    return result[0];
  }

  async createParticipant(
    participantData: Partial<Participant>,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaParticipants).values({
      ...participantData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Participant);

    return { insertId: result[0].insertId };
  }

  async updateParticipant(
    id: number,
    participantData: Partial<Participant>,
  ): Promise<void> {
    await this.db
      .update(boffMediaParticipants)
      .set({
        ...participantData,
        updatedAt: new Date(),
      } as Participant)
      .where(eq(boffMediaParticipants.id, id));
  }

  async findUserById(
    userId: number,
  ): Promise<{ id: number; username: string }> {
    const result = await this.db
      .select({
        id: boffMediaUsers.id,
        username: boffMediaUsers.username,
      })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.id, userId));

    return result[0];
  }

  async findParticipantAchievements(participantId: number): Promise<any[]> {
    const result = await this.db
      .select({
        achievement: {
          id: boffMediaAchievements.id,
          name: boffMediaAchievements.name,
          description: boffMediaAchievements.description,
          icon: boffMediaAchievements.icon,
          maxProgress: boffMediaAchievements.maxProgress,
          points: boffMediaAchievements.points,
          itemType: boffMediaAchievements.itemType,
          category: boffMediaAchievements.category,
          rarity: boffMediaAchievements.rarity,
          order: boffMediaAchievements.order,
          eventId: boffMediaAchievements.eventId,
        },
        progress: boffMediaParticipantProgress.currentProgress,
        isCompleted: boffMediaParticipantProgress.isCompleted,
        completedAt: boffMediaParticipantProgress.completedAt,
        lastUpdated: boffMediaParticipantProgress.lastUpdated,
      })
      .from(boffMediaAchievements)
      .leftJoin(
        boffMediaParticipantProgress,
        and(
          eq(
            boffMediaParticipantProgress.achievementId,
            boffMediaAchievements.id,
          ),
          eq(boffMediaParticipantProgress.participantId, participantId),
        ),
      );

    return result;
  }

  async findEventParticipation(
    participantId: number,
    eventId: number,
  ): Promise<EventParticipant> {
    const result = await this.db
      .select()
      .from(boffMediaEventParticipants)
      .where(
        and(
          eq(boffMediaEventParticipants.participantId, participantId),
          eq(boffMediaEventParticipants.eventId, eventId),
        ),
      );
    return result[0];
  }

  async createEventParticipation(
    participationData: Partial<EventParticipant>,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaEventParticipants).values({
      ...participationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EventParticipant);

    return { insertId: result[0].insertId };
  }

  async updateEventParticipation(
    id: number,
    participationData: Partial<EventParticipant>,
  ): Promise<void> {
    await this.db
      .update(boffMediaEventParticipants)
      .set({
        ...participationData,
        updatedAt: new Date(),
      } as EventParticipant)
      .where(eq(boffMediaEventParticipants.id, id));
  }

  async findEventParticipationById(id: number): Promise<EventParticipant> {
    const result = await this.db
      .select()
      .from(boffMediaEventParticipants)
      .where(eq(boffMediaEventParticipants.id, id));
    return result[0];
  }

  async findEventParticipants(
    eventId: number,
    pagination?: { limit?: number; offset?: number },
  ): Promise<
    (EventParticipant & {
      nickname: string;
      avatar: string;
      userId: number;
    })[]
  > {
    const query = this.db
      .select({
        id: boffMediaEventParticipants.id,
        participantId: boffMediaEventParticipants.participantId,
        eventId: boffMediaEventParticipants.eventId,
        status: boffMediaEventParticipants.status,
        comment: boffMediaEventParticipants.comment,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        userId: boffMediaParticipants.userId,
        createdAt: boffMediaEventParticipants.createdAt,
        updatedAt: boffMediaEventParticipants.updatedAt,
      })
      .from(boffMediaEventParticipants)
      .leftJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId),
      )
      .where(eq(boffMediaEventParticipants.eventId, eventId));

    // Apply pagination if provided, otherwise return all (backward compatible)
    if (pagination?.limit !== undefined) {
      query.limit(pagination.limit);
    }
    if (pagination?.offset !== undefined) {
      query.offset(pagination.offset);
    }

    return (await query) as unknown as (EventParticipant & {
      nickname: string;
      avatar: string;
      userId: number;
    })[];
  }

  /** The membership row for a *user* (not a participant) in one event — the
   *  shape every entitlement check needs. */
  async findEventParticipationByUserId(
    userId: number,
    eventId: number,
  ): Promise<EventParticipant | undefined> {
    const result = await this.db
      .select({
        id: boffMediaEventParticipants.id,
        participantId: boffMediaEventParticipants.participantId,
        eventId: boffMediaEventParticipants.eventId,
        status: boffMediaEventParticipants.status,
        comment: boffMediaEventParticipants.comment,
        createdAt: boffMediaEventParticipants.createdAt,
        updatedAt: boffMediaEventParticipants.updatedAt,
      })
      .from(boffMediaEventParticipants)
      .innerJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId),
      )
      .where(
        and(
          eq(boffMediaParticipants.userId, userId),
          eq(boffMediaEventParticipants.eventId, eventId),
        ),
      );
    return result[0];
  }

  async setEventParticipationStatus(
    eventId: number,
    participantId: number,
    status: EventParticipant['status'],
  ): Promise<void> {
    await this.db
      .update(boffMediaEventParticipants)
      .set({ status, updatedAt: new Date() } as EventParticipant)
      .where(
        and(
          eq(boffMediaEventParticipants.eventId, eventId),
          eq(boffMediaEventParticipants.participantId, participantId),
        ),
      );
  }

  async deleteEventParticipation(
    eventId: number,
    participantId: number,
  ): Promise<void> {
    await this.db
      .delete(boffMediaEventParticipants)
      .where(
        and(
          eq(boffMediaEventParticipants.eventId, eventId),
          eq(boffMediaEventParticipants.participantId, participantId),
        ),
      );
  }
}
