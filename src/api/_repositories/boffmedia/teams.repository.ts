import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  boffMediaEventTeams, 
  boffMediaEventTeamMembers,
  boffMediaEvents,
  boffMediaParticipants,
  boffMediaParticipantProgress,
  boffMediaAchievements,
  EventTeam,
  EventTeamMember
} from '@/_db/schema/Events';

@Injectable()
export class TeamsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<EventTeam[]> {
    return this.db.select({
      id: boffMediaEventTeams.id,
      eventId: boffMediaEventTeams.eventId,
      eventName: boffMediaEvents.title,
      name: boffMediaEventTeams.name,
      tag: boffMediaEventTeams.tag,
      icon: boffMediaEventTeams.icon,
      totalScore: boffMediaEventTeams.totalScore,
      status: boffMediaEventTeams.status,
      createdAt: boffMediaEventTeams.createdAt,
      updatedAt: boffMediaEventTeams.updatedAt,
      deletedAt: boffMediaEventTeams.deletedAt,
    })
    .from(boffMediaEventTeams)
    .leftJoin(boffMediaEvents, eq(boffMediaEvents.id, boffMediaEventTeams.eventId))
    .where(and(
      isNull(boffMediaEventTeams.deletedAt),
      isNull(boffMediaEvents.deletedAt)
    ));
  }

  async findByEventId(eventId: number): Promise<EventTeam[]> {
    return this.db.select()
      .from(boffMediaEventTeams)
      .where(and(
        eq(boffMediaEventTeams.eventId, eventId),
        isNull(boffMediaEventTeams.deletedAt)
      ))
      .orderBy(desc(boffMediaEventTeams.totalScore));
  }

  async findById(teamId: number): Promise<EventTeam> {
    const result = await this.db.select({
      id: boffMediaEventTeams.id,
      eventId: boffMediaEventTeams.eventId,
      name: boffMediaEventTeams.name,
      tag: boffMediaEventTeams.tag,
      icon: boffMediaEventTeams.icon,
      totalScore: boffMediaEventTeams.totalScore,
      status: boffMediaEventTeams.status,
      createdAt: boffMediaEventTeams.createdAt,
      updatedAt: boffMediaEventTeams.updatedAt,
      deletedAt: boffMediaEventTeams.deletedAt,
    })
    .from(boffMediaEventTeams)
    .leftJoin(boffMediaEvents, eq(boffMediaEvents.id, boffMediaEventTeams.eventId))
    .where(and(
      eq(boffMediaEventTeams.id, teamId),
      isNull(boffMediaEventTeams.deletedAt),
      isNull(boffMediaEvents.deletedAt) 
    ));
    return result[0];
  }

  async create(teamData: Partial<EventTeam>): Promise<{ insertId: number }> {
    const result = await this.db.insert(boffMediaEventTeams)
      .values({
        ...teamData,
        totalScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as EventTeam);

    return { insertId: result[0].insertId };
  }

  async update(id: number, teamData: Partial<EventTeam>): Promise<void> {
    await this.db.update(boffMediaEventTeams)
      .set({
        ...teamData,
        updatedAt: new Date()
      } as EventTeam)
      .where(eq(boffMediaEventTeams.id, id));
  }

  async updateScore(teamId: number, totalScore: number): Promise<void> {
    await this.db.update(boffMediaEventTeams)
      .set({ 
        totalScore,
        updatedAt: new Date()
      } as EventTeam)
      .where(eq(boffMediaEventTeams.id, teamId));
  }

  async calculateTeamScore(teamId: number): Promise<number> {
    const result = await this.db
      .select({
        score: sql<number>`SUM(${boffMediaAchievements.points})`
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaEventTeamMembers,
        eq(boffMediaEventTeamMembers.participantId, boffMediaParticipantProgress.participantId)
      )
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaParticipantProgress.isCompleted, 1)
      ));

    return result[0]?.score || 0;
  }

  // Team Members
  async addMember(memberData: Partial<EventTeamMember>): Promise<void> {
    await this.db.insert(boffMediaEventTeamMembers)
      .values({
        ...memberData,
        joinedAt: new Date(),
        updatedAt: new Date()
      } as EventTeamMember);
  }

  async removeMember(teamId: number, participantId: number): Promise<void> {
    await this.db.delete(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.participantId, participantId)
      ));
  }

  async findMember(teamId: number, participantId: number): Promise<EventTeamMember> {
    const result = await this.db.select()
      .from(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.participantId, participantId)
      ));
    return result[0];
  }

  async findTeamMembers(teamId: number): Promise<any[]> {
    const result = await this.db.select({
      teamId: boffMediaEventTeamMembers.teamId,
      participantId: boffMediaEventTeamMembers.participantId,
      userId: boffMediaParticipants.userId,
      username: boffMediaParticipants.nickname,
      displayName: boffMediaParticipants.nickname,
      avatar: boffMediaParticipants.avatar,
      role: boffMediaEventTeamMembers.role,
      joinedAt: boffMediaEventTeamMembers.joinedAt,
      updatedAt: boffMediaEventTeamMembers.updatedAt
    })
    .from(boffMediaEventTeamMembers)
    .leftJoin(
      boffMediaParticipants, 
      eq(boffMediaParticipants.id, boffMediaEventTeamMembers.participantId)
    )
    .where(eq(boffMediaEventTeamMembers.teamId, teamId));

    // Ensure all required fields are present
    return result.map(member => ({
      teamId: member.teamId,
      participantId: member.participantId,
      userId: member.userId || 0,
      username: member.username || '',
      displayName: member.displayName || '',
      avatar: member.avatar,
      role: member.role,
      joinedAt: member.joinedAt,
      updatedAt: member.updatedAt
    }));
  }

  async findParticipantTeamInEvent(participantId: number, eventId: number): Promise<EventTeamMember[]> {
    return this.db.select({
      teamId: boffMediaEventTeamMembers.teamId,
      participantId: boffMediaEventTeamMembers.participantId,
      role: boffMediaEventTeamMembers.role,
      joinedAt: boffMediaEventTeamMembers.joinedAt,
      updatedAt: boffMediaEventTeamMembers.updatedAt
    })
      .from(boffMediaEventTeamMembers)
      .innerJoin(
        boffMediaEventTeams,
        eq(boffMediaEventTeams.id, boffMediaEventTeamMembers.teamId)
      )
      .where(and(
        eq(boffMediaEventTeams.eventId, eventId),
        eq(boffMediaEventTeamMembers.participantId, participantId)
      ));
  }
}