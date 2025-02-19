import { Injectable } from '@nestjs/common';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  boffMediaEvents,
  boffMediaAchievements,
  boffMediaUserProgress,
  Event,
  Achievement,
  UserProgress,
  boffMediaEventTeams,
  EventTeam,
  boffMediaEventTeamMembers,
  EventTeamMember,
  boffMediaEventParticipants,
  EventParticipant,
  Game,
  boffMediaGames,
  validateUserCanReceiveAchievement,
} from '@/_db/schema/Events';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
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
        type: createEventDto.type,
        createdAt: new Date(),
        updatedAt: new Date()
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
        icon: createGameDto.icon,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Game);
    
    return this.getGame(result[0].insertId);
  }

  async updateGame(id: number, createGameDto: CreateGameDto): Promise<Game> {
    await this.db.update(boffMediaGames)
      .set({
        title: createGameDto.title,
        description: createGameDto.description,
        icon: createGameDto.icon,
        updatedAt: new Date()
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
        name: createAchievementDto.name,
        description: createAchievementDto.description,
        icon: createAchievementDto.icon,
        maxProgress: createAchievementDto.maxProgress || 1,
        points: createAchievementDto.points,
        itemType: 'achievement',
        category: createAchievementDto.category,
        rarity: createAchievementDto.rarity,
        order: createAchievementDto.order || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Achievement);

    const achievements = await this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.id, result[0].insertId));
    
    return achievements[0];
  }

  async getUserAchievements(userId: number): Promise<(Achievement & { progress: number })[]> {
    return this.db.select({
      achievement: boffMediaAchievements,
      progress: boffMediaUserProgress.currentProgress
    })
    .from(boffMediaAchievements)
    .leftJoin(
      boffMediaUserProgress,
      and(
        eq(boffMediaUserProgress.achievementId, boffMediaAchievements.id),
        eq(boffMediaUserProgress.userId, userId)
      )
    ) as any;
  }

  async updateProgress(
    eventId: number,
    userId: number, 
    achievementId: number,
    progress: number,
    teamId?: number
  ): Promise<UserProgress> {
    // 1. Validate user can receive this achievement
    const canReceive = await validateUserCanReceiveAchievement(userId, achievementId, this.db);
    if (!canReceive) {
      throw new Error('User is not eligible to receive this achievement');
    }
  
    // 2. Get achievement details
    const achievement = await this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.id, achievementId));
  
    if (!achievement[0]) throw new Error('Achievement not found');
  
    // 3. Update progress
    const isCompleted = progress >= achievement[0].maxProgress ? 1 : 0;
    const completedAt = isCompleted ? new Date() : null;
  
    await this.db.insert(boffMediaUserProgress).values({
      userId,
      achievementId,
      currentProgress: progress,
      isCompleted,
      completedAt,
      lastUpdated: new Date(),
      createdAt: new Date()
    } as UserProgress)
    .onDuplicateKeyUpdate({
      currentProgress: progress,
      isCompleted,
      completedAt,
      lastUpdated: new Date()
    } as any);
  
    // 4. If completed and team exists, update team score
    if (isCompleted && teamId) {
      await this.updateTeamScore(teamId);
    }
  
    return this.db.select()
      .from(boffMediaUserProgress)
      .where(and(
        eq(boffMediaUserProgress.userId, userId),
        eq(boffMediaUserProgress.achievementId, achievementId)
      ))
      .then(results => results[0]);
  }
  
  async createTeam(eventId: number, createTeamDto: CreateTeamDto): Promise<EventTeam> {
    // 1. Create the team
    const result = await this.db.insert(boffMediaEventTeams).values({
      eventId,
      name: createTeamDto.name,
      tag: createTeamDto.tag,
      icon: createTeamDto.icon,
      totalScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as EventTeam);
  
    const teamId = result[0].insertId;
    
    // 2. Add leader as team member with leader role
    await this.db.insert(boffMediaEventTeamMembers).values({
      teamId,
      userId: createTeamDto.leaderId,
      role: 'leader',
      joinedAt: new Date(),
      updatedAt: new Date()
    } as EventTeamMember);
  
    // 3. Add leader to event participants
    await this.db.insert(boffMediaEventParticipants).values({
      userId: createTeamDto.leaderId,
      eventId,
      comment: `Created team ${createTeamDto.name}`,
      createdAt: new Date(),
      updatedAt: new Date()
    } as EventParticipant);
  
    return this.getTeam(teamId);
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
      .from(boffMediaEventTeamMembers)
      .innerJoin(
        boffMediaEventTeams,
        eq(boffMediaEventTeams.id, boffMediaEventTeamMembers.teamId)
      )
      .where(and(
        eq(boffMediaEventTeams.eventId, eventId),
        eq(boffMediaEventTeamMembers.userId, userId)
      ));
  
    if (existingTeam.length > 0) {
      throw new Error('User is already in a team for this event');
    }
  
    // Add user to team members
    await this.db.insert(boffMediaEventTeamMembers).values({
      teamId,
      userId,
      role: 'member',
      joinedAt: new Date(),
      updatedAt: new Date()
    } as EventTeamMember);
  
    // Add to event participants
    await this.db.insert(boffMediaEventParticipants).values({
      userId,
      eventId,
      comment: `Joined team ${teamId}`,
      createdAt: new Date(),
      updatedAt: new Date()
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
    // Check if user is the team leader
    const member = await this.db.select()
      .from(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.userId, userId)
      ));
    
    if (member[0]?.role === 'leader') {
      throw new Error('Team leader cannot leave the team');
    }
  
    // Remove from team members
    await this.db.delete(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.userId, userId)
      ));
  
    // Remove from event participants
    await this.db.delete(boffMediaEventParticipants)
      .where(and(
        eq(boffMediaEventParticipants.eventId, eventId),
        eq(boffMediaEventParticipants.userId, userId)
      ));
  
    return { success: true };
  }

  async getLeaderboards() {
    const baseQuery = this.db
      .select({
        userId: boffMediaUserProgress.userId,
        username: boffMediaUsers.username,
        achievementPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('achievement_points'),
        medalPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('medal_points'),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('total_points'),
        achievementCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaUserProgress.achievementId} END)`.as('achievement_count'),
        medalCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaUserProgress.achievementId} END)`.as('medal_count')
      })
      .from(boffMediaUserProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaUserProgress.achievementId)
      )
      .leftJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaUserProgress.userId)
      )
      .where(eq(boffMediaUserProgress.isCompleted, 1))
      .groupBy(boffMediaUserProgress.userId, boffMediaUsers.username)
      .orderBy(desc(sql<number>`total_points`));
  
    return baseQuery;
  }

  async getLeaderboard(eventId: number) {
    return this.db
      .select({
        userId: boffMediaUserProgress.userId,
        username: boffMediaUsers.username,
        achievementPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('achievement_points'),
        medalPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('medal_points'),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('total_points'),
        achievementCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaUserProgress.achievementId} END)`.as('achievement_count'),
        medalCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaUserProgress.achievementId} END)`.as('medal_count')
      })
      .from(boffMediaUserProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaUserProgress.achievementId)
      )
      .leftJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaUserProgress.userId)
      )
      .where(and(
        eq(boffMediaAchievements.eventId, eventId),
        eq(boffMediaUserProgress.isCompleted, 1)
      ))
      .groupBy(boffMediaUserProgress.userId, boffMediaUsers.username)
      .orderBy(desc(sql<number>`total_points`));
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
      .groupBy(boffMediaEventTeams.id, boffMediaEventTeams.name, boffMediaEventTeams.tag, boffMediaEventTeams.totalScore)
      .orderBy(desc(boffMediaEventTeams.totalScore));
  }

  private async updateTeamScore(teamId: number): Promise<void> {
    const totalScore = await this.calculateTeamScore(teamId);
    await this.db.update(boffMediaEventTeams)
      .set({ 
        totalScore,
        updatedAt: new Date()
      } as EventTeam)
      .where(eq(boffMediaEventTeams.id, teamId));
  }

  private async calculateTeamScore(teamId: number): Promise<number> {
    // Calculate team score by summing points from completed achievements
    const result = await this.db
      .select({
        score: sql<number>`SUM(${boffMediaAchievements.points})`
      })
      .from(boffMediaUserProgress)
      .innerJoin(
        boffMediaEventTeamMembers,
        eq(boffMediaEventTeamMembers.userId, boffMediaUserProgress.userId)
      )
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaUserProgress.achievementId)
      )
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaUserProgress.isCompleted, 1)
      ));
  
    return result[0]?.score || 0;
  }
}