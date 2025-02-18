import { Injectable } from '@nestjs/common';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  boffMediaEvents,
  boffMediaAchievements,
  boffMediaAchievementProgress,
  Event,
  Achievement,
  AchievementProgress,
  boffMediaEventTeams,
  EventTeam,
  boffMediaEventTeamMembers,
  EventTeamMember,
  EventMedal,
  boffMediaEventMedals,
  EventMedalProgress,
  boffMediaEventMedalProgress,
  boffMediaEventParticipants,
  EventParticipant,
  Game,
  boffMediaGames
} from '@/_db/schema/Events';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateMedalDto } from './dto/create-medal.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';

@Injectable()
export class EventsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async getEvents(): Promise<Event[]> {
    return this.db.select().from(boffMediaEvents)
      .orderBy(desc(boffMediaEvents.startDate));
  }

  async getEvent(id: number): Promise<Event> {
    const result = await this.db.select()
      .from(boffMediaEvents)
      .where(eq(boffMediaEvents.id, id));
    return result[0];
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const result = await this.db.insert(boffMediaEvents)
      .values({
        title: createEventDto.title,
        description: createEventDto.description,
        game: createEventDto.gameId,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
        icon: createEventDto.icon,
        type: createEventDto.type
      } as Event);
    
    return this.getEvent(result[0].insertId);
  }

  async getGames(): Promise<Game[]> {
    return this.db.select().from(boffMediaGames);
  }


  async getGame(id: number): Promise<Game> {
    const result = await this.db.select()
      .from(boffMediaGames)
      .where(eq(boffMediaGames.id, id));
    return result[0];
  }

  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    const result = await this.db.insert(boffMediaGames)
      .values({
        title: createGameDto.title,
        description: createGameDto.description,
        icon: createGameDto.icon
      } as Game);
    
      console.log(result);
    return this.getGame(result[0].insertId);
  }

  async updateGame(id: number, createGameDto: CreateGameDto): Promise<Game> {
    await this.db.update(boffMediaGames)
      .set({
        title: createGameDto.title,
        description: createGameDto.description,
        icon: createGameDto.icon
      } as Game)
      .where(eq(boffMediaGames.id, id));
    
    return this.getGame(id);
  }

  async getEventAchievements(eventId: number): Promise<Achievement[]> {
    return this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.eventId, eventId));
  }

  async createAchievement(eventId: number, createAchievementDto: CreateAchievementDto): Promise<Achievement> {
    const result = await this.db.insert(boffMediaAchievements)
      .values({
        eventId,
        title: createAchievementDto.title,
        description: createAchievementDto.description,
        icon: createAchievementDto.icon,
        target: createAchievementDto.target,
        rarity: createAchievementDto.rarity,
        points: createAchievementDto.points
      } as Achievement);

    const achievements = await this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.id, result[0].insertId));
    
    return achievements[0];
  }

  async getUserAchievements(userId: number): Promise<(Achievement & { progress: number })[]> {
    return this.db.select({
      achievement: boffMediaAchievements,
      progress: boffMediaAchievementProgress.progress
    })
    .from(boffMediaAchievements)
    .leftJoin(
      boffMediaAchievementProgress,
      and(
        eq(boffMediaAchievementProgress.achievementId, boffMediaAchievements.id),
        eq(boffMediaAchievementProgress.userId, userId)
      )
    ) as any;
  }

  async updateAchievementProgress(
    userId: number,
    achievementId: number,
    progressIncrement: number
  ): Promise<AchievementProgress> {
    const achievement = await this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.id, achievementId));

    if (!achievement[0]) throw new Error('Achievement not found');

    const result = await this.db.insert(boffMediaAchievementProgress)
      .values({
        userId,
        achievementId,
        progress: progressIncrement,
        completed: progressIncrement >= achievement[0].target ? 1 : 0,
        completedAt: progressIncrement >= achievement[0].target ? new Date() : null,
        lastUpdated: new Date()
      } as AchievementProgress)
      .onDuplicateKeyUpdate({
        progress: progressIncrement,
        completed: progressIncrement >= achievement[0].target ? 1 : 0,
        completedAt: progressIncrement >= achievement[0].target ? new Date() : null,
        lastUpdated: new Date()
      } as any);

    const progress = await this.db.select()
      .from(boffMediaAchievementProgress)
      .where(and(
        eq(boffMediaAchievementProgress.userId, userId),
        eq(boffMediaAchievementProgress.achievementId, achievementId)
      ));

    return progress[0];
  }

  async createTeam(eventId: number, createTeamDto: CreateTeamDto): Promise<EventTeam> {
    const result = await this.db.insert(boffMediaEventTeams).values({
      eventId,
      name: createTeamDto.name,
      tag: createTeamDto.tag,
      icon: createTeamDto.icon,
      leaderId: createTeamDto.leaderId,
      createdAt: new Date()
    } as EventTeam);
  
    // Add leader as team member
    await this.db.insert(boffMediaEventTeamMembers).values({
      teamId: result[0].insertId,
      userId: createTeamDto.leaderId,
      role: 'leader',
      joinedAt: new Date()
    } as EventTeamMember);
  
    return this.getTeam(result[0].insertId);
  }

  async getEventTeams(eventId: number): Promise<EventTeam[]> {
    return this.db.select()
      .from(boffMediaEventTeams)
      .where(eq(boffMediaEventTeams.eventId, eventId))
      .orderBy(desc(boffMediaEventTeams.totalScore));
  }
  
  async joinTeam(eventId: number, teamId: number, userId: number): Promise<EventTeamMember> {
    // Check if user is already in a team for this event
    const existingTeam = await this.db.select()
      .from(boffMediaEventParticipants)
      .where(and(
        eq(boffMediaEventParticipants.eventId, eventId),
        eq(boffMediaEventParticipants.userId, userId)
      ));
  
    if (existingTeam[0]) {
      throw new Error('User is already in a team for this event');
    }
  
    await this.db.insert(boffMediaEventTeamMembers).values({
      teamId,
      userId,
      role: 'member',
      joinedAt: new Date()
    } as EventTeamMember);
  
    // Add to event participants
    await this.db.insert(boffMediaEventParticipants).values({
      userId,
      eventId,
      comment: `Joined team ${teamId}`
    } as EventParticipant);
  
    const members = await this.db.select()
      .from(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.userId, userId)
      ));
    return members[0];
  }

  async getTeam(teamId: number): Promise<EventTeam> {
    const teams = await this.db.select()
      .from(boffMediaEventTeams)
      .where(eq(boffMediaEventTeams.id, teamId));
    return teams[0];
  }
  
  async getTeamMembers(teamId: number): Promise<EventTeamMember[]> {
    return this.db.select()
      .from(boffMediaEventTeamMembers)
      .where(eq(boffMediaEventTeamMembers.teamId, teamId));
  }


  async leaveTeam(eventId: number, teamId: number, userId: number): Promise<{ success: boolean }> {
    const team = await this.getTeam(teamId);
    
    if (team.leaderId === userId) {
      throw new Error('Team leader cannot leave the team');
    }
  
    await this.db.delete(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.userId, userId)
      ));
  
    await this.db.delete(boffMediaEventParticipants)
      .where(and(
        eq(boffMediaEventParticipants.eventId, eventId),
        eq(boffMediaEventParticipants.userId, userId)
      ));
  
    return { success: true };
  }
  
  async createMedal(eventId: number, createMedalDto: CreateMedalDto): Promise<EventMedal> {
    const result = await this.db.insert(boffMediaEventMedals).values({
      eventId,
      name: createMedalDto.name,
      description: createMedalDto.description,
      icon: createMedalDto.icon,
      points: createMedalDto.points,
      category: createMedalDto.category,
      placement: createMedalDto.placement,
      maxProgress: createMedalDto.maxProgress,
      order: createMedalDto.order,
      createdAt: new Date()
    } as EventMedal);
  
    const medals = await this.db.select()
      .from(boffMediaEventMedals)
      .where(eq(boffMediaEventMedals.id, result[0].insertId));
    return medals[0];
  }

  async getEventMedals(eventId: number): Promise<EventMedal[]> {
    return this.db.select()
      .from(boffMediaEventMedals)
      .where(eq(boffMediaEventMedals.eventId, eventId))
      .orderBy(boffMediaEventMedals.order);
  }

  async updateProgress(
    eventId: number,
    userId: number,
    medalId: number,
    progress: number,
    teamId?: number
  ): Promise<EventMedalProgress> {
    const medal = await this.db.select()
      .from(boffMediaEventMedals)
      .where(eq(boffMediaEventMedals.id, medalId));
  
    if (!medal[0]) throw new Error('Medal not found');
  
    await this.db.insert(boffMediaEventMedalProgress).values({
      userId,
      medalId,
      currentProgress: progress,
      earned: progress >= medal[0].maxProgress ? 1 : 0,
      earnedAt: progress >= medal[0].maxProgress ? new Date() : null,
      lastUpdated: new Date()
    } as EventMedalProgress)
    .onDuplicateKeyUpdate({
      currentProgress: progress,
      earned: progress >= medal[0].maxProgress ? 1 : 0,
      earnedAt: progress >= medal[0].maxProgress ? new Date() : null,
      lastUpdated: new Date()
    } as any);
  
    if (progress >= medal[0].maxProgress && teamId) {
      await this.updateTeamScore(teamId);
    }
  
    const progressRecords = await this.db.select()
      .from(boffMediaEventMedalProgress)
      .where(and(
        eq(boffMediaEventMedalProgress.userId, userId),
        eq(boffMediaEventMedalProgress.medalId, medalId)
      ));
  
    return progressRecords[0];
  }

  async getLeaderboards() {
    return this.db
      .select({
        userId: boffMediaEventParticipants.userId,
        username: boffMediaUsers.username, // Add the user name
        medals: sql<number>`COUNT(DISTINCT ${boffMediaEventMedalProgress.medalId})`.as('medal_count'),
        medalPoints: sql<number>`SUM(${boffMediaEventMedals.points})`.as('total_score'),
        achievements: sql<number>`COUNT(DISTINCT ${boffMediaAchievementProgress.achievementId})`.as('achievement_count'),
        achievementPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('achievement_points')
      })
      .from(boffMediaEventParticipants)
      .leftJoin(
        boffMediaEventMedalProgress,
        eq(boffMediaEventMedalProgress.userId, boffMediaEventParticipants.userId)
      )
      .leftJoin(
        boffMediaEventMedals,
        eq(boffMediaEventMedals.id, boffMediaEventMedalProgress.medalId)
      )
      .leftJoin(
        boffMediaAchievementProgress,
        eq(boffMediaAchievementProgress.userId, boffMediaEventParticipants.userId)
      )
      .leftJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaAchievementProgress.achievementId)
      )
      .leftJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaEventParticipants.userId) // Join with boffMediaUsers to get the user name
      )
      .groupBy(boffMediaEventParticipants.userId, boffMediaUsers.username) // Group by userId and userName
      .orderBy(desc(sql<number>`total_score`));
  }

  async getLeaderboard(eventId: number) {
    return this.db
      .select({
        userId: boffMediaEventParticipants.userId,
        score: sql<number>`SUM(${boffMediaEventMedals.points})`.as('total_score'),
        medals: sql<number>`COUNT(DISTINCT ${boffMediaEventMedalProgress.medalId})`.as('medal_count')
      })
      .from(boffMediaEventParticipants)
      .leftJoin(
        boffMediaEventMedalProgress,
        eq(boffMediaEventMedalProgress.userId, boffMediaEventParticipants.userId)
      )
      .leftJoin(
        boffMediaEventMedals,
        and(
          eq(boffMediaEventMedals.id, boffMediaEventMedalProgress.medalId),
          eq(boffMediaEventMedals.eventId, eventId)
        )
      )
      .where(and(
        eq(boffMediaEventParticipants.eventId, eventId),
        eq(boffMediaEventMedalProgress.earned, 1)
      ))
      .groupBy(boffMediaEventParticipants.userId)
      .orderBy(desc(sql<number>`total_score`));
  }

  async getTeamLeaderboard(eventId: number) {
    return this.db
      .select({
        teamId: boffMediaEventTeams.id,
        teamName: boffMediaEventTeams.name,
        teamTag: boffMediaEventTeams.tag,
        score: boffMediaEventTeams.totalScore,
        memberCount: sql<number>`COUNT(DISTINCT ${boffMediaEventTeamMembers.userId})`.as('member_count')
      })
      .from(boffMediaEventTeams)
      .leftJoin(
        boffMediaEventTeamMembers,
        eq(boffMediaEventTeamMembers.teamId, boffMediaEventTeams.id)
      )
      .where(eq(boffMediaEventTeams.eventId, eventId))
      .groupBy(boffMediaEventTeams.id)
      .orderBy(desc(boffMediaEventTeams.totalScore));
  }


  private async updateTeamScore(teamId: number): Promise<void> {
    const totalScore = await this.calculateTeamScore(teamId);
    await this.db.update(boffMediaEventTeams)
      .set({ totalScore } as EventTeam)
      .where(eq(boffMediaEventTeams.id, teamId));
  }

  private async calculateTeamScore(teamId: number): Promise<number> {
    const result = await this.db
      .select({
        score: sql<number>`SUM(${boffMediaEventMedals.points})`
      })
      .from(boffMediaEventMedalProgress)
      .innerJoin(
        boffMediaEventMedals,
        eq(boffMediaEventMedals.id, boffMediaEventMedalProgress.medalId)
      )
      .innerJoin(
        boffMediaEventTeamMembers,
        eq(boffMediaEventTeamMembers.userId, boffMediaEventMedalProgress.userId)
      )
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventMedalProgress.earned, 1)
      ));
  
    return result[0]?.score || 0;
  }

}
