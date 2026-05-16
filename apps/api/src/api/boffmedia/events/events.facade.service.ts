import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { EventsService } from './services/events.service';
import { GamesService } from './services/games.service';
import { AchievementsService } from './services/achievements.service';
import { TeamsService } from './services/teams.service';
import { ParticipantsService } from './services/participants.service';
import { ProgressService } from './services/progress.service';
import { LeaderboardsService } from './services/leaderboards.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Event } from './entities/event.entity';
import { Game } from './entities/game.entity';
import { Achievement } from './entities/achievement.entity';
import { AchievementWithProgress } from './entities/achievement-with-progress.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Participant } from './entities/participant.entity';
import {
  LeaderboardEntry,
  TeamLeaderboardEntry,
} from './entities/leaderboard.entity';

@Injectable()
export class EventsFacadeService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly eventsService: EventsService,
    private readonly gamesService: GamesService,
    private readonly achievementsService: AchievementsService,
    private readonly participantsService: ParticipantsService,
    private readonly teamsService: TeamsService,
    private readonly progressService: ProgressService,
    private readonly leaderboardsService: LeaderboardsService,
  ) {}

  // ==================== EVENT MANAGEMENT ====================
  async getEvents(): Promise<Event[]> {
    return this.eventsService.getAllEvents();
  }

  async getEvent(id: number): Promise<Event & { childEvents?: Event[] }> {
    return this.eventsService.getEventById(id);
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    // Validate game exists if provided
    if (createEventDto.gameId) {
      const gameExists = await this.gamesService.validateGameExists(
        createEventDto.gameId,
      );
      if (!gameExists) {
        throw new Error('Game not found');
      }
    }

    // Validate parent event exists if provided and not -1
    if (createEventDto.parentId && createEventDto.parentId !== -1) {
      const parentExists = await this.eventsService.validateEventExists(
        createEventDto.parentId,
      );
      if (!parentExists) {
        throw new Error('Parent event not found');
      }
    }

    // Convert parentId -1 to null
    const processedDto = {
      ...createEventDto,
      parentId: createEventDto.parentId === -1 ? null : createEventDto.parentId,
    };

    return this.eventsService.createEvent(processedDto);
  }

  async updateEvent(
    id: number,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    // Validate event exists
    const eventExists = await this.eventsService.validateEventExists(id);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    // Validate game exists if provided
    if (updateEventDto.gameId) {
      const gameExists = await this.gamesService.validateGameExists(
        updateEventDto.gameId,
      );
      if (!gameExists) {
        throw new Error('Game not found');
      }
    }

    // Validate parent event exists if provided and not -1
    if (updateEventDto.parentId && updateEventDto.parentId !== -1) {
      const parentExists = await this.eventsService.validateEventExists(
        updateEventDto.parentId,
      );
      if (!parentExists) {
        throw new Error('Parent event not found');
      }
    }

    // Convert parentId -1 to null
    const processedDto = {
      ...updateEventDto,
      parentId: updateEventDto.parentId === -1 ? null : updateEventDto.parentId,
    };

    return this.eventsService.updateEvent(id, processedDto);
  }

  async deleteEvent(id: number): Promise<void> {
    const eventExists = await this.eventsService.validateEventExists(id);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.eventsService.deleteEvent(id);
  }

  // ==================== GAME MANAGEMENT ====================
  async getGames(): Promise<Game[]> {
    return this.gamesService.getAllGames();
  }

  async getGame(id: number): Promise<Game> {
    return this.gamesService.getGameById(id);
  }

  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    return this.gamesService.createGame(createGameDto);
  }

  async updateGame(id: number, updateGameDto: UpdateGameDto): Promise<Game> {
    const gameExists = await this.gamesService.validateGameExists(id);
    if (!gameExists) {
      throw new Error('Game not found');
    }

    return this.gamesService.updateGame(id, updateGameDto);
  }

  async deleteGame(id: number): Promise<void> {
    const gameExists = await this.gamesService.validateGameExists(id);
    if (!gameExists) {
      throw new Error('Game not found');
    }

    return this.gamesService.deleteGame(id);
  }

  // ==================== ACHIEVEMENT MANAGEMENT ====================
  async getAchievements(): Promise<Achievement[]> {
    return this.achievementsService.getAllAchievements();
  }

  async getAchievement(id: number): Promise<Achievement> {
    return this.achievementsService.getAchievementById(id);
  }

  async getEventAchievements(eventId: number): Promise<Achievement[]> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.achievementsService.getAchievementsByEventId(eventId);
  }

  async createAchievement(
    eventId: number,
    createAchievementDto: CreateAchievementDto,
  ): Promise<Achievement> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.achievementsService.createAchievement(
      eventId,
      createAchievementDto,
    );
  }

  async updateAchievement(
    eventId: number,
    id: number,
    updateAchievementDto: UpdateAchievementDto,
  ): Promise<Achievement> {
    const [eventExists, achievementExists] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.achievementsService.validateAchievementExists(id),
    ]);

    if (!eventExists) {
      throw new Error('Event not found');
    }
    if (!achievementExists) {
      throw new Error('Achievement not found');
    }

    return this.achievementsService.updateAchievement(id, updateAchievementDto);
  }

  async getParticipantProgress(
    participantId: number,
  ): Promise<AchievementWithProgress[]> {
    return this.achievementsService.getParticipantProgress(participantId);
  }

  async getParticipantProgressByEvent(
    participantId: number,
    eventId: number,
  ): Promise<AchievementWithProgress[]> {
    return this.achievementsService.getParticipantProgressByEvent(
      participantId,
      eventId,
    );
  }

  // ==================== TEAM MANAGEMENT ====================
  async getTeams(): Promise<Team[]> {
    return this.teamsService.getAllTeams();
  }

  async getEventTeams(eventId: number): Promise<Team[]> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.teamsService.getTeamsByEventId(eventId);
  }

  async getTeam(teamId: number): Promise<Team> {
    return this.teamsService.getTeamById(teamId);
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const teamExists = await this.teamsService.validateTeamExists(teamId);
    if (!teamExists) {
      throw new Error('Team not found');
    }

    // Get raw team members data
    const rawMembers = await this.teamsService.getTeamMembers(teamId);

    // Transform to match TeamMember entity
    return rawMembers.map((member) => ({
      userId: member.userId || 0,
      teamId: member.teamId,
      participantId: member.participantId,
      username: member.username || '',
      displayName: member.displayName || '',
      avatar: member.avatar,
      role: member.role,
      joinedAt: member.joinedAt,
      updatedAt: member.updatedAt,
    }));
  }

  async createTeam(
    eventId: number,
    createTeamDto: CreateTeamDto,
  ): Promise<Team> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.teamsService.createTeam(eventId, createTeamDto);
  }

  async updateTeam(
    eventId: number,
    teamId: number,
    updateTeamDto: UpdateTeamDto,
  ): Promise<Team> {
    const [eventExists, teamExists, teamInEvent] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.teamsService.validateTeamExists(teamId),
      this.teamsService.validateTeamInEvent(teamId, eventId),
    ]);

    if (!eventExists) {
      throw new Error('Event not found');
    }
    if (!teamExists) {
      throw new Error('Team not found');
    }
    if (!teamInEvent) {
      throw new Error('Team does not belong to this event');
    }

    return this.teamsService.updateTeam(teamId, updateTeamDto);
  }

  async joinTeam(
    eventId: number,
    teamId: number,
    joinTeamDto: JoinTeamDto,
  ): Promise<{ success: boolean }> {
    const [eventExists, teamExists, teamInEvent] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.teamsService.validateTeamExists(teamId),
      this.teamsService.validateTeamInEvent(teamId, eventId),
    ]);

    if (!eventExists) {
      throw new Error('Event not found');
    }
    if (!teamExists) {
      throw new Error('Team not found');
    }
    if (!teamInEvent) {
      throw new Error('Team does not belong to this event');
    }

    await this.teamsService.joinTeam(
      eventId,
      teamId,
      joinTeamDto.participantId,
    );
    return { success: true };
  }

  async leaveTeam(
    eventId: number,
    teamId: number,
    userId: number,
  ): Promise<{ success: boolean }> {
    const [eventExists, teamExists, teamInEvent] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.teamsService.validateTeamExists(teamId),
      this.teamsService.validateTeamInEvent(teamId, eventId),
    ]);

    if (!eventExists) {
      throw new Error('Event not found');
    }
    if (!teamExists) {
      throw new Error('Team not found');
    }
    if (!teamInEvent) {
      throw new Error('Team does not belong to this event');
    }

    await this.teamsService.leaveTeam(teamId, userId);
    return { success: true };
  }

  // ==================== PARTICIPANT MANAGEMENT ====================
  async joinEvent(
    eventId: number,
    joinEventDto: JoinEventDto,
  ): Promise<{ success: boolean }> {
    // First, verify the event exists
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    // Get or create participant
    const participant =
      await this.participantsService.getOrCreateParticipantByUserId(
        joinEventDto.userId,
      );

    // Check if already participating
    const existingParticipation =
      await this.participantsService.validateEventParticipation(
        participant.id,
        eventId,
      );
    if (existingParticipation) {
      throw new Error('Participant is already registered for this event');
    }

    await this.participantsService.joinEvent(
      eventId,
      participant.id,
      joinEventDto,
    );
    return { success: true };
  }

  async getEventParticipants(eventId: number): Promise<Participant[]> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    // Get raw participants data
    const rawParticipants =
      await this.participantsService.getEventParticipants(eventId);

    // Transform to match Participant entity
    return rawParticipants.map((participant) => ({
      id: participant.id,
      eventId: participant.eventId,
      participantId: participant.participantId,
      userId: participant.userId,
      avatar: participant.avatar,
      nickname: participant.nickname,
      status: participant.status,
      comment: participant.comment,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    }));
  }

  async getOrCreateParticipantByUserId(userId: number): Promise<any> {
    return this.participantsService.getOrCreateParticipantByUserId(userId);
  }

  async getParticipantAchievements(participantId: number): Promise<any[]> {
    return this.participantsService.getParticipantAchievements(participantId);
  }

  // ==================== PROGRESS MANAGEMENT ====================
  async updateProgress(
    eventId: number,
    updateProgressDto: UpdateProgressDto,
  ): Promise<{ success: boolean }> {
    const [eventExists, achievementExists] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.achievementsService.validateAchievementExists(
        updateProgressDto.achievementId,
      ),
    ]);

    if (!eventExists) {
      throw new Error('Event not found');
    }
    if (!achievementExists) {
      throw new Error('Achievement not found');
    }

    // Validate participant is in the event
    const participantInEvent =
      await this.participantsService.validateEventParticipation(
        updateProgressDto.participantId,
        eventId,
      );
    if (!participantInEvent) {
      throw new Error('Participant is not registered for this event');
    }

    await this.progressService.updateProgress(
      updateProgressDto.participantId,
      updateProgressDto.achievementId,
      updateProgressDto.progress,
      updateProgressDto.teamId,
    );

    return { success: true };
  }

  // ==================== LEADERBOARD MANAGEMENT ====================
  async getLeaderboards(): Promise<LeaderboardEntry[]> {
    return this.leaderboardsService.getGlobalLeaderboard();
  }

  async getLeaderboard(eventId: number): Promise<LeaderboardEntry[]> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.leaderboardsService.getEventLeaderboard(eventId);
  }

  async getTeamLeaderboard(eventId: number): Promise<TeamLeaderboardEntry[]> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    // Get raw leaderboard data
    const rawLeaderboard =
      await this.leaderboardsService.getTeamLeaderboard(eventId);

    // Transform to match TeamLeaderboardEntry entity
    return rawLeaderboard.map((entry) => ({
      teamId: entry.teamId,
      teamName: entry.teamName,
      teamTag: entry.teamTag,
      totalPoints: entry.score, // Map score to totalPoints
      score: entry.score,
      memberCount: entry.memberCount,
      rank: entry.rank,
    }));
  }

  // ==================== ADDITIONAL LEADERBOARD FEATURES ====================
  async getParticipantRanking(
    participantId: number,
    eventId?: number,
  ): Promise<any> {
    return this.leaderboardsService.getParticipantRanking(
      participantId,
      eventId,
    );
  }

  async getTopAchievers(limit: number = 10, eventId?: number): Promise<any[]> {
    if (eventId) {
      const eventExists = await this.eventsService.validateEventExists(eventId);
      if (!eventExists) {
        throw new Error('Event not found');
      }
    }

    return this.leaderboardsService.getTopAchievers(limit, eventId);
  }

  async getLeaderboardWithPagination(
    page: number = 1,
    pageSize: number = 20,
    eventId?: number,
  ): Promise<any> {
    if (eventId) {
      const eventExists = await this.eventsService.validateEventExists(eventId);
      if (!eventExists) {
        throw new Error('Event not found');
      }
    }

    return this.leaderboardsService.getLeaderboardWithPagination(
      page,
      pageSize,
      eventId,
    );
  }

  async getRecentAchievements(
    limit: number = 5,
    eventId?: number,
  ): Promise<any[]> {
    if (eventId) {
      const eventExists = await this.eventsService.validateEventExists(eventId);
      if (!eventExists) {
        throw new Error('Event not found');
      }
    }

    return this.leaderboardsService.getRecentAchievements(limit, eventId);
  }
}
