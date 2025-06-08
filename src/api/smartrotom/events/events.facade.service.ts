import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

import { EventsService } from './services/events.service';
import { GamesService } from './services/games.service';
import { AchievementsService } from './services/achievements.service';
import { ParticipantsService } from './services/participants.service';
import { TeamsService } from './services/teams.service';
import { ProgressService } from './services/progress.service';
import { LeaderboardsService } from './services/leaderboards.service';

import { 
  Event, 
  Game, 
  Achievement, 
  EventTeam, 
  EventTeamMember, 
  EventParticipant,
  ParticipantProgress,
  Participant
} from '@/_db/schema/Events';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinEventDto } from './dto/join-event.dto';

export interface UpdateProgressDto {
  participantId: number;
  achievementId: number;
  progress: number;
  teamId?: number;
}

export interface JoinTeamDto {
  userId: number;
}

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
      const gameExists = await this.gamesService.validateGameExists(createEventDto.gameId);
      if (!gameExists) {
        throw new Error('Game not found');
      }
    }

    // Validate parent event exists if provided
    if (createEventDto.parentId) {
      const parentExists = await this.eventsService.validateEventExists(createEventDto.parentId);
      if (!parentExists) {
        throw new Error('Parent event not found');
      }
    }

    return this.eventsService.createEvent(createEventDto);
  }

  async updateEvent(id: number, createEventDto: CreateEventDto): Promise<Event> {
    // Validate event exists
    const eventExists = await this.eventsService.validateEventExists(id);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    // Validate game exists if provided
    if (createEventDto.gameId) {
      const gameExists = await this.gamesService.validateGameExists(createEventDto.gameId);
      if (!gameExists) {
        throw new Error('Game not found');
      }
    }

    return this.eventsService.updateEvent(id, createEventDto);
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

  async updateGame(id: number, createGameDto: CreateGameDto): Promise<Game> {
    const gameExists = await this.gamesService.validateGameExists(id);
    if (!gameExists) {
      throw new Error('Game not found');
    }

    return this.gamesService.updateGame(id, createGameDto);
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

  async createAchievement(eventId: number, createAchievementDto: CreateAchievementDto): Promise<Achievement> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.achievementsService.createAchievement(eventId, createAchievementDto);
  }

  async updateAchievement(eventId: number, id: number, createAchievementDto: CreateAchievementDto): Promise<Achievement> {
    const [eventExists, achievementExists] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.achievementsService.validateAchievementExists(id)
    ]);

    if (!eventExists) {
      throw new Error('Event not found');
    }
    if (!achievementExists) {
      throw new Error('Achievement not found');
    }

    return this.achievementsService.updateAchievement(id, createAchievementDto);
  }

  async getParticipantProgress(participantId: number) {
    return this.achievementsService.getParticipantProgress(participantId);
  }

  async getParticipantProgressByEvent(participantId: number, eventId: number) {
    return this.achievementsService.getParticipantProgressByEvent(participantId, eventId);
  }

  // ==================== TEAM MANAGEMENT ====================
  async getTeams(): Promise<EventTeam[]> {
    return this.teamsService.getAllTeams();
  }

  async getEventTeams(eventId: number): Promise<EventTeam[]> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.teamsService.getTeamsByEventId(eventId);
  }

  async getTeam(teamId: number): Promise<EventTeam> {
    return this.teamsService.getTeamById(teamId);
  }

  async getTeamMembers(teamId: number): Promise<EventTeamMember[]> {
    const teamExists = await this.teamsService.validateTeamExists(teamId);
    if (!teamExists) {
      throw new Error('Team not found');
    }

    return this.teamsService.getTeamMembers(teamId);
  }

  async createTeam(eventId: number, createTeamDto: CreateTeamDto): Promise<EventTeam> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.teamsService.createTeam(eventId, createTeamDto);
  }

  async updateTeam(eventId: number, teamId: number, createTeamDto: CreateTeamDto): Promise<EventTeam> {
    const [eventExists, teamExists, teamInEvent] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.teamsService.validateTeamExists(teamId),
      this.teamsService.validateTeamInEvent(teamId, eventId)
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

    return this.teamsService.updateTeam(teamId, createTeamDto);
  }

  async joinTeam(eventId: number, teamId: number, joinTeamDto: JoinTeamDto): Promise<EventTeamMember> {
    const [eventExists, teamExists, teamInEvent] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.teamsService.validateTeamExists(teamId),
      this.teamsService.validateTeamInEvent(teamId, eventId)
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

    return this.teamsService.joinTeam(eventId, teamId, joinTeamDto.userId);
  }

  async leaveTeam(eventId: number, teamId: number, userId: number): Promise<{ success: boolean }> {
    const [eventExists, teamExists, teamInEvent] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.teamsService.validateTeamExists(teamId),
      this.teamsService.validateTeamInEvent(teamId, eventId)
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

    return this.teamsService.leaveTeam(teamId, userId);
  }

  // ==================== PARTICIPANT MANAGEMENT ====================
  async joinEvent(eventId: number, joinEventDto: JoinEventDto): Promise<EventParticipant> {
    // First, verify the event exists
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    // Get or create participant
    const participant = await this.participantsService.getOrCreateParticipantByUserId(joinEventDto.participantId);

    // Check if already participating
    const existingParticipation = await this.participantsService.validateEventParticipation(participant.id, eventId);
    if (existingParticipation) {
      throw new Error('Participant is already registered for this event');
    }

    return this.participantsService.joinEvent(eventId, participant.id, joinEventDto);
  }

  async getEventParticipants(eventId: number): Promise<(EventParticipant & { 
    nickname: string, 
    avatar: string,
    userId: number 
  })[]> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.participantsService.getEventParticipants(eventId);
  }

  async getOrCreateParticipantByUserId(userId: number): Promise<Participant> {
    return this.participantsService.getOrCreateParticipantByUserId(userId);
  }

  async getParticipantAchievements(participantId: number): Promise<(Achievement & { progress: number })[]> {
    return this.participantsService.getParticipantAchievements(participantId);
  }

  // ==================== PROGRESS MANAGEMENT ====================
  async updateProgress(eventId: number, updateProgressDto: UpdateProgressDto): Promise<ParticipantProgress> {
    const [eventExists, achievementExists] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.achievementsService.validateAchievementExists(updateProgressDto.achievementId)
    ]);

    if (!eventExists) {
      throw new Error('Event not found');
    }
    if (!achievementExists) {
      throw new Error('Achievement not found');
    }

    // Validate participant is in the event
    const participantInEvent = await this.participantsService.validateEventParticipation(
      updateProgressDto.participantId, 
      eventId
    );
    if (!participantInEvent) {
      throw new Error('Participant is not registered for this event');
    }

    return this.progressService.updateProgress(
      updateProgressDto.participantId,
      updateProgressDto.achievementId,
      updateProgressDto.progress,
      updateProgressDto.teamId
    );
  }

  // ==================== LEADERBOARD MANAGEMENT ====================
  async getLeaderboards() {
    return this.leaderboardsService.getGlobalLeaderboard();
  }

  async getLeaderboard(eventId: number) {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.leaderboardsService.getEventLeaderboard(eventId);
  }

  async getTeamLeaderboard(eventId: number) {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new Error('Event not found');
    }

    return this.leaderboardsService.getTeamLeaderboard(eventId);
  }

  // ==================== NEW LEADERBOARD FEATURES ====================
  async getParticipantRanking(participantId: number, eventId?: number) {
    return this.leaderboardsService.getParticipantRanking(participantId, eventId);
  }

  async getTopAchievers(limit: number = 10, eventId?: number) {
    if (eventId) {
      const eventExists = await this.eventsService.validateEventExists(eventId);
      if (!eventExists) {
        throw new Error('Event not found');
      }
    }

    return this.leaderboardsService.getTopAchievers(limit, eventId);
  }

  async getLeaderboardWithPagination(page: number = 1, pageSize: number = 20, eventId?: number) {
    if (eventId) {
      const eventExists = await this.eventsService.validateEventExists(eventId);
      if (!eventExists) {
        throw new Error('Event not found');
      }
    }

    return this.leaderboardsService.getLeaderboardWithPagination(page, pageSize, eventId);
  }

  async getRecentAchievements(limit: number = 5, eventId?: number) {
    if (eventId) {
      const eventExists = await this.eventsService.validateEventExists(eventId);
      if (!eventExists) {
        throw new Error('Event not found');
      }
    }

    return this.leaderboardsService.getRecentAchievements(limit, eventId);
  }
}