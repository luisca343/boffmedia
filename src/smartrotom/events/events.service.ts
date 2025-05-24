import { Injectable } from '@nestjs/common';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  boffMediaEvents,
  boffMediaAchievements,
  boffMediaParticipantProgress,
  Event,
  Achievement,
  ParticipantProgress,
  boffMediaEventTeams,
  EventTeam,
  boffMediaEventTeamMembers,
  EventTeamMember,
  boffMediaEventParticipants,
  EventParticipant,
  Game,
  boffMediaGames,
  validateParticipantCanReceiveAchievement,
  boffMediaParticipants,
  Participant,
  PARTICIPANT_STATUS
} from '@/_db/schema/Events';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { JoinEventDto } from './dto/join-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async getEvents(): Promise<Event[]> {
    return this.db.select({
      id: boffMediaEvents.id,
      parentId: boffMediaEvents.parentId,
      title: boffMediaEvents.title,
      description: boffMediaEvents.description,
      gameId: boffMediaEvents.game,
      gameName: boffMediaGames.title,
      icon: boffMediaEvents.icon,
      banner: boffMediaEvents.banner,
      startDate: boffMediaEvents.startDate,
      endDate: boffMediaEvents.endDate,
      status: boffMediaEvents.status,
      visibility: boffMediaEvents.visibility,
      type: boffMediaEvents.type,
      createdAt: boffMediaEvents.createdAt,
      updatedAt: boffMediaEvents.updatedAt,
    })
    .from(boffMediaEvents)
    .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.game))
  }

  async getEvent(id: number): Promise<Event & { childEvents?: Event[] }> {
    // First, get the main event
    const result = await this.db.select()
      .from(boffMediaEvents)
      .where(eq(boffMediaEvents.id, id));
      
    if (!result.length) {
      return null;
    }
    
    const event = result[0];
    
    // Then get child events that have this event as a parent
    const childEvents = await this.db.select({
      id: boffMediaEvents.id,
      parentId: boffMediaEvents.parentId,
      title: boffMediaEvents.title,
      description: boffMediaEvents.description,
      gameId: boffMediaEvents.game,
      gameName: boffMediaGames.title,
      icon: boffMediaEvents.icon,
      banner: boffMediaEvents.banner,
      startDate: boffMediaEvents.startDate,
      endDate: boffMediaEvents.endDate,
      status: boffMediaEvents.status,
      visibility: boffMediaEvents.visibility,
      type: boffMediaEvents.type,
      createdAt: boffMediaEvents.createdAt,
      updatedAt: boffMediaEvents.updatedAt
    })
    .from(boffMediaEvents)
    .leftJoin(boffMediaGames, eq(boffMediaGames.id, boffMediaEvents.game))
    .where(eq(boffMediaEvents.parentId, id));
    
    // Return the event with its children
    return {
      id: event.id,
      parentId: event.parentId,
      title: event.title,
      description: event.description,
      game: event.game,
      icon: event.icon,
      banner: event.banner,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      visibility: event.visibility,
      type: event.type,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      childEvents: childEvents.length > 0 ? childEvents : []
    };
  }
  
  async createEvent(createEventDto: CreateEventDto): Promise<Event> {


    const result = await this.db.insert(boffMediaEvents)
      .values({
        parentId: createEventDto.parentId || null,
        title: createEventDto.title,
        description: createEventDto.description,
        game: createEventDto.gameId,
        startDate: new Date(createEventDto.startDate),
        endDate: createEventDto.endDate ? new Date(createEventDto.endDate) : null,
        visibility: createEventDto.visibility,
        icon: createEventDto.icon,
        banner: createEventDto.banner,
        type: createEventDto.type,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Event);
    
      console.log('Event created', result);
    return this.getEvent(result[0].insertId);
  }

  async updateEvent(id: number, createEventDto: CreateEventDto): Promise<Event> {

    await this.db.update(boffMediaEvents)
      .set({
        parentId: createEventDto.parentId || null,
        title: createEventDto.title,
        description: createEventDto.description,
        game: createEventDto.gameId,
        startDate: new Date(createEventDto.startDate),
        endDate: createEventDto.endDate ? new Date(createEventDto.endDate) : null,
        visibility: createEventDto.visibility,
        icon: createEventDto.icon,
        banner: createEventDto.banner,
        type: createEventDto.type,
        updatedAt: new Date()
      } as Event)
      .where(eq(boffMediaEvents.id, id));
    
    return this.getEvent(id);
  }

  async getGames(): Promise<Game[]> {
    return await this.db.select().from(boffMediaGames);
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

  async getAchievements(): Promise<Achievement[]> {
    return this.db.select({
      id: boffMediaAchievements.id,
      description: boffMediaAchievements.description,
      name: boffMediaAchievements.name,
      icon: boffMediaAchievements.icon,
      createdAt: boffMediaAchievements.createdAt,
      updatedAt: boffMediaAchievements.updatedAt,
      itemType: boffMediaAchievements.itemType,
      maxProgress: boffMediaAchievements.maxProgress,
      points: boffMediaAchievements.points,
      eventId: boffMediaAchievements.eventId,
      eventName: boffMediaEvents.title,
      category: boffMediaAchievements.category,
      rarity: boffMediaAchievements.rarity,
      hidden: boffMediaAchievements.hidden,
      order: boffMediaAchievements.order
    })
      .from(boffMediaAchievements)
      .leftJoin(boffMediaEvents, eq(boffMediaEvents.id, boffMediaAchievements.eventId))
  }

  async getAchievement(id: number): Promise<Achievement> {
    const result = await this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.id, id));
    return result[0];
  }

  async updateAchievement(eventId: number, id: number, createAchievementDto: CreateAchievementDto): Promise<Achievement> {
    await this.db.update(boffMediaAchievements)
      .set({
        name: createAchievementDto.name,
        description: createAchievementDto.description,
        icon: createAchievementDto.icon,
        maxProgress: createAchievementDto.maxProgress || 1,
        points: createAchievementDto.points,
        category: createAchievementDto.category,
        rarity: createAchievementDto.rarity,
        order: createAchievementDto.order || 0,
        updatedAt: new Date()
      } as Achievement)
      .where(eq(boffMediaAchievements.id, id));
    
    return this.getAchievement(id);
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

  // Get or create participant by userId
  async getOrCreateParticipantByUserId(userId: number): Promise<Participant> {
    // Try to find existing participant
    const existingParticipant = await this.db.select()
      .from(boffMediaParticipants)
      .where(eq(boffMediaParticipants.userId, userId));
      
    if (existingParticipant.length > 0) {
      return existingParticipant[0];
    }
    
    // If not found, get user info and create participant
    const user = await this.db.select({
      id: boffMediaUsers.id,
      username: boffMediaUsers.username
    })
    .from(boffMediaUsers)
    .where(eq(boffMediaUsers.id, userId));
    
    if (user.length === 0) {
      throw new Error('User not found');
    }
    
    // Create new participant
    const result = await this.db.insert(boffMediaParticipants)
      .values({
        userId,
        nickname: user[0].username,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Participant);
    
    return {
      id: result[0].insertId,
      userId,
      nickname: user[0].username,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Participant;
  }

  async getParticipantAchievements(participantId: number): Promise<(Achievement & { progress: number })[]> {
    return this.db.select({
      achievement: boffMediaAchievements,
      progress: boffMediaParticipantProgress.currentProgress
    })
    .from(boffMediaAchievements)
    .leftJoin(
      boffMediaParticipantProgress,
      and(
        eq(boffMediaParticipantProgress.achievementId, boffMediaAchievements.id),
        eq(boffMediaParticipantProgress.participantId, participantId)
      )
    ) as any;
  }

  async updateProgress(
    eventId: number,
    participantId: number, 
    achievementId: number,
    progress: number,
    teamId?: number
  ): Promise<ParticipantProgress> {
    // 1. Validate participant can receive this achievement
    const canReceive = await validateParticipantCanReceiveAchievement(participantId, achievementId, this.db);
    if (!canReceive) {
      throw new Error('Participant is not eligible to receive this achievement');
    }
  
    // 2. Get achievement details
    const achievement = await this.db.select()
      .from(boffMediaAchievements)
      .where(eq(boffMediaAchievements.id, achievementId));
  
    if (!achievement[0]) throw new Error('Achievement not found');
  
    // 3. Update progress
    const isCompleted = progress >= achievement[0].maxProgress ? 1 : 0;
    const completedAt = isCompleted ? new Date() : null;
  
    await this.db.insert(boffMediaParticipantProgress).values({
      participantId,
      achievementId,
      currentProgress: progress,
      isCompleted,
      completedAt,
      lastUpdated: new Date(),
      createdAt: new Date()
    } as ParticipantProgress)
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
      .from(boffMediaParticipantProgress)
      .where(and(
        eq(boffMediaParticipantProgress.participantId, participantId),
        eq(boffMediaParticipantProgress.achievementId, achievementId)
      ))
      .then(results => results[0]);
  }
  
  async createTeam(eventId: number, createTeamDto: CreateTeamDto): Promise<EventTeam> {
    // 1. Get or create participant for leader
    const leaderParticipant = await this.getOrCreateParticipantByUserId(createTeamDto.leaderId);
    
    // 2. Create the team
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
    
    // 3. Add leader as team member with leader role
    await this.db.insert(boffMediaEventTeamMembers).values({
      teamId,
      participantId: leaderParticipant.id,
      role: 'leader',
      joinedAt: new Date(),
      updatedAt: new Date()
    } as EventTeamMember);
  
    // 4. Add leader to event participants
    await this.db.insert(boffMediaEventParticipants).values({
      participantId: leaderParticipant.id,
      eventId,
      comment: `Created team ${createTeamDto.name}`,
      createdAt: new Date(),
      updatedAt: new Date()
    } as EventParticipant);
  
    return this.getTeam(teamId);
  }

  async updateTeam(eventId: number, teamId: number, createTeamDto: CreateTeamDto): Promise<EventTeam> {
    await this.db.update(boffMediaEventTeams)
      .set({
        name: createTeamDto.name,
        tag: createTeamDto.tag,
        icon: createTeamDto.icon,
        updatedAt: new Date()
      } as EventTeam)
      .where(eq(boffMediaEventTeams.id, teamId));
    
    return this.getTeam(teamId);
  }

  async getTeams(): Promise<EventTeam[]> {
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
      updatedAt: boffMediaEventTeams.updatedAt
    })
    .from(boffMediaEventTeams)
    .leftJoin(boffMediaEvents, eq(boffMediaEvents.id, boffMediaEventTeams.eventId));
  }

  async getEventTeams(eventId: number): Promise<EventTeam[]> {
    return this.db.select()
      .from(boffMediaEventTeams)
      .where(eq(boffMediaEventTeams.eventId, eventId))
      .orderBy(desc(boffMediaEventTeams.totalScore));
  }
  
  async joinTeam(eventId: number, teamId: number, userId: number): Promise<EventTeamMember> {
    // 1. Get or create participant
    const participant = await this.getOrCreateParticipantByUserId(userId);
    
    // 2. Check if participant is already in a team for this event
    const existingTeam = await this.db.select()
      .from(boffMediaEventTeamMembers)
      .innerJoin(
        boffMediaEventTeams,
        eq(boffMediaEventTeams.id, boffMediaEventTeamMembers.teamId)
      )
      .where(and(
        eq(boffMediaEventTeams.eventId, eventId),
        eq(boffMediaEventTeamMembers.participantId, participant.id)
      ));
  
    if (existingTeam.length > 0) {
      throw new Error('Participant is already in a team for this event');
    }
  
    // 3. Add participant to team members
    await this.db.insert(boffMediaEventTeamMembers).values({
      teamId,
      participantId: participant.id,
      role: 'member',
      joinedAt: new Date(),
      updatedAt: new Date()
    } as EventTeamMember);
  
    // 4. Add to event participants
    await this.db.insert(boffMediaEventParticipants).values({
      participantId: participant.id,
      eventId,
      comment: `Joined team ${teamId}`,
      createdAt: new Date(),
      updatedAt: new Date()
    } as EventParticipant);
  
    const members = await this.db.select()
      .from(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.participantId, participant.id)
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
    return this.db.select({
      teamId: boffMediaEventTeamMembers.teamId,
      participantId: boffMediaEventTeamMembers.participantId,
      participantName: boffMediaParticipants.nickname,
      participantAvatar: boffMediaParticipants.avatar,
      userId: boffMediaParticipants.userId,
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
  }

  async leaveTeam(eventId: number, teamId: number, userId: number): Promise<{ success: boolean }> {
    // 1. Get participant
    const participant = await this.getOrCreateParticipantByUserId(userId);
    
    // 2. Check if participant is the team leader
    const member = await this.db.select()
      .from(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.participantId, participant.id)
      ));
    
    if (member[0]?.role === 'leader') {
      throw new Error('Team leader cannot leave the team');
    }
  
    // 3. Remove from team members
    await this.db.delete(boffMediaEventTeamMembers)
      .where(and(
        eq(boffMediaEventTeamMembers.teamId, teamId),
        eq(boffMediaEventTeamMembers.participantId, participant.id)
      ));
  
    // 4. Remove from event participants
    await this.db.delete(boffMediaEventParticipants)
      .where(and(
        eq(boffMediaEventParticipants.eventId, eventId),
        eq(boffMediaEventParticipants.participantId, participant.id)
      ));
  
    return { success: true };
  }

  async getLeaderboards() {
    const baseQuery = this.db
      .select({
        participantId: boffMediaParticipantProgress.participantId,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        userId: boffMediaParticipants.userId,
        achievementPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('achievement_points'),
        medalPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('medal_points'),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('total_points'),
        achievementCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaParticipantProgress.achievementId} END)`.as('achievement_count'),
        medalCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaParticipantProgress.achievementId} END)`.as('medal_count')
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .leftJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaParticipantProgress.participantId)
      )
      .where(eq(boffMediaParticipantProgress.isCompleted, 1))
      .groupBy(boffMediaParticipantProgress.participantId, boffMediaParticipants.nickname, boffMediaParticipants.avatar, boffMediaParticipants.userId)
      .orderBy(desc(sql<number>`total_points`));
  
    return baseQuery;
  }

  async getLeaderboard(eventId: number) {
    return this.db
      .select({
        participantId: boffMediaParticipantProgress.participantId,
        nickname: boffMediaParticipants.nickname,
        avatar: boffMediaParticipants.avatar,
        userId: boffMediaParticipants.userId,
        achievementPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('achievement_points'),
        medalPoints: sql<number>`SUM(CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaAchievements.points} ELSE 0 END)`.as('medal_points'),
        totalPoints: sql<number>`SUM(${boffMediaAchievements.points})`.as('total_points'),
        achievementCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'achievement' THEN ${boffMediaParticipantProgress.achievementId} END)`.as('achievement_count'),
        medalCount: sql<number>`COUNT(DISTINCT CASE WHEN ${boffMediaAchievements.itemType} = 'medal' THEN ${boffMediaParticipantProgress.achievementId} END)`.as('medal_count')
      })
      .from(boffMediaParticipantProgress)
      .innerJoin(
        boffMediaAchievements,
        eq(boffMediaAchievements.id, boffMediaParticipantProgress.achievementId)
      )
      .leftJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaParticipantProgress.participantId)
      )
      .where(and(
        eq(boffMediaAchievements.eventId, eventId),
        eq(boffMediaParticipantProgress.isCompleted, 1)
      ))
      .groupBy(boffMediaParticipantProgress.participantId, boffMediaParticipants.nickname, boffMediaParticipants.avatar, boffMediaParticipants.userId)
      .orderBy(desc(sql<number>`total_points`));
  }

  async getTeamLeaderboard(eventId: number) {
    return this.db
      .select({
        teamId: boffMediaEventTeams.id,
        teamName: boffMediaEventTeams.name,
        teamTag: boffMediaEventTeams.tag,
        score: boffMediaEventTeams.totalScore,
        memberCount: sql<number>`COUNT(DISTINCT ${boffMediaEventTeamMembers.participantId})`.as('member_count')
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

  async joinEvent(eventId: number, joinEventDto: JoinEventDto): Promise<EventParticipant> {
    // First, verify the event exists
    const event = await this.db.select()
      .from(boffMediaEvents)
      .where(eq(boffMediaEvents.id, eventId));

    if (!event.length) {
      throw new Error(`Event with ID ${eventId} not found`);
    }

    // Get or create a participant for this user
    const participant = await this.getOrCreateParticipantByUserId(joinEventDto.userId);

    // Check if the user is already a participant in this event
    const existingParticipation = await this.db.select()
      .from(boffMediaEventParticipants)
      .where(and(
        eq(boffMediaEventParticipants.participantId, participant.id),
        eq(boffMediaEventParticipants.eventId, eventId)
      ));

    if (existingParticipation.length > 0) {
      // Update participant status if they're rejoining
      if (existingParticipation[0].status === PARTICIPANT_STATUS.DECLINED ||
          existingParticipation[0].status === PARTICIPANT_STATUS.REMOVED) {
        
        await this.db.update(boffMediaEventParticipants)
          .set({
            status: PARTICIPANT_STATUS.REGISTERED,
            comment: joinEventDto.comment || `Re-joined event`,
            updatedAt: new Date()
          } as EventParticipant)
          .where(eq(boffMediaEventParticipants.id, existingParticipation[0].id));

        return this.db.select()
          .from(boffMediaEventParticipants)
          .where(eq(boffMediaEventParticipants.id, existingParticipation[0].id))
          .then(results => results[0]);
      }

      // Return existing participation record
      return existingParticipation[0];
    }
    
    // If nickname was provided, update the participant record
    if (joinEventDto.nickname || joinEventDto.avatar) {
      await this.db.update(boffMediaParticipants)
        .set({
          nickname: joinEventDto.nickname || participant.nickname,
          avatar: joinEventDto.avatar || participant.avatar,
          updatedAt: new Date()
        } as Participant)
        .where(eq(boffMediaParticipants.id, participant.id));
    }

    // Create a new participant record for this event
    const result = await this.db.insert(boffMediaEventParticipants).values({
      participantId: participant.id,
      eventId: eventId,
      status: PARTICIPANT_STATUS.REGISTERED,
      comment: joinEventDto.comment || 'Joined event',
      createdAt: new Date(),
      updatedAt: new Date()
    } as EventParticipant);

    // Return the created participation record
    return this.db.select()
      .from(boffMediaEventParticipants)
      .where(eq(boffMediaEventParticipants.id, result[0].insertId))
      .then(results => results[0]);
  }

  // Helper method to get event participants
  async getEventParticipants(eventId: number): Promise<(EventParticipant & { 
    nickname: string, 
    avatar: string,
    userId: number 
  })[]> {
    
    return this.db.select({
      id: boffMediaEventParticipants.id,
      participantId: boffMediaEventParticipants.participantId,
      eventId: boffMediaEventParticipants.eventId,
      status: boffMediaEventParticipants.status,
      comment: boffMediaEventParticipants.comment,
      nickname: boffMediaParticipants.nickname,
      avatar: boffMediaParticipants.avatar,
      userId: boffMediaParticipants.userId,
      createdAt: boffMediaEventParticipants.createdAt,
      updatedAt: boffMediaEventParticipants.updatedAt
    })
    .from(boffMediaEventParticipants)
    .leftJoin(
      boffMediaParticipants,
      eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId)
    )
    .where(eq(boffMediaEventParticipants.eventId, eventId));
  }
  

}