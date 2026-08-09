import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { EventsService } from './services/events.service';
import { FindEventsFilters } from './repositories/events.repository';
import { GamesService } from './services/games.service';
import { AchievementsService } from './services/achievements.service';
import { TeamsService } from './services/teams.service';
import { ParticipantsService } from './services/participants.service';
import { EventInvitesService } from './services/event-invites.service';
import { ProgressService } from './services/progress.service';
import { LeaderboardsService } from './services/leaderboards.service';
import {
  ProfileService,
  UserActivityItem,
  UserTrophies,
} from './services/profile.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Event } from './entities/event.entity';
import { Game } from './entities/game.entity';
import { Achievement } from './entities/achievement.entity';
import { AchievementWithProgress } from './entities/achievement-with-progress.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Participant } from './entities/participant.entity';
import {
  EventInvite,
  EventParticipant,
  PARTICIPANT_STATUS,
} from '@/_db/schema/BoffMediaEvents';
import {
  LeaderboardEntry,
  TeamLeaderboardEntry,
} from './entities/leaderboard.entity';

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class EventsFacadeService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private readonly eventsService: EventsService,
    private readonly gamesService: GamesService,
    private readonly achievementsService: AchievementsService,
    private readonly participantsService: ParticipantsService,
    private readonly eventInvitesService: EventInvitesService,
    private readonly teamsService: TeamsService,
    private readonly progressService: ProgressService,
    private readonly leaderboardsService: LeaderboardsService,
    private readonly profileService: ProfileService,
  ) {}

  // ==================== EVENT MANAGEMENT ====================
  async getEvents(filters?: FindEventsFilters): Promise<Event[]> {
    return this.eventsService.getAllEvents(filters) as unknown as Event[];
  }

  async getEvent(
    id: number,
    includePrivate = false,
  ): Promise<Event & { childEvents?: Event[] }> {
    return this.eventsService.getEventById(
      id,
      includePrivate,
    ) as unknown as Event & {
      childEvents?: Event[];
    };
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

    return this.eventsService.createEvent(
      processedDto as CreateEventDto,
    ) as unknown as Event;
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

    return this.eventsService.updateEvent(
      id,
      processedDto as UpdateEventDto,
    ) as unknown as Event;
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
    return this.gamesService.getAllGames() as unknown as Game[];
  }

  async getGame(id: number): Promise<Game> {
    return this.gamesService.getGameById(id) as unknown as Game;
  }

  async createGame(createGameDto: CreateGameDto): Promise<Game> {
    return this.gamesService.createGame(createGameDto) as unknown as Game;
  }

  async updateGame(id: number, updateGameDto: UpdateGameDto): Promise<Game> {
    const gameExists = await this.gamesService.validateGameExists(id);
    if (!gameExists) {
      throw new Error('Game not found');
    }

    return this.gamesService.updateGame(id, updateGameDto) as unknown as Game;
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
    return this.achievementsService.getAllAchievements() as unknown as Achievement[];
  }

  async getAchievement(id: number): Promise<Achievement> {
    return this.achievementsService.getAchievementById(
      id,
    ) as unknown as Achievement;
  }

  async getEventAchievements(
    eventId: number,
    includePrivate = false,
  ): Promise<Achievement[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
    }

    return this.achievementsService.getAchievementsByEventId(
      eventId,
    ) as unknown as Achievement[];
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
    ) as unknown as Achievement;
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

    return this.achievementsService.updateAchievement(
      id,
      updateAchievementDto,
    ) as unknown as Achievement;
  }

  async getParticipantProgress(
    participantId: number,
  ): Promise<AchievementWithProgress[]> {
    return this.achievementsService.getParticipantProgress(participantId);
  }

  async getParticipantProgressByEvent(
    participantId: number,
    eventId: number,
    includePrivate = false,
  ): Promise<AchievementWithProgress[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
    }

    return this.achievementsService.getParticipantProgressByEvent(
      participantId,
      eventId,
    );
  }

  // ==================== TEAM MANAGEMENT ====================
  async getTeams(): Promise<Team[]> {
    return this.teamsService.getAllTeams() as unknown as Team[];
  }

  async getEventTeams(
    eventId: number,
    includePrivate = false,
  ): Promise<Team[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
    }

    return this.teamsService.getTeamsByEventId(eventId) as unknown as Team[];
  }

  async getTeam(teamId: number): Promise<Team> {
    return this.teamsService.getTeamById(teamId) as unknown as Team;
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

    return this.teamsService.createTeam(
      eventId,
      createTeamDto,
    ) as unknown as Team;
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

    return this.teamsService.updateTeam(
      teamId,
      updateTeamDto,
    ) as unknown as Team;
  }

  async joinTeam(
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

    await this.teamsService.joinTeam(eventId, teamId, userId);
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
    options: { bypassVisibility?: boolean } = {},
  ): Promise<{ success: boolean }> {
    const event = await this.eventsService.getEventById(eventId, true);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // A private event is joinable, but only through an invitation (or by an
    // admin adding the player). It used to fail as "Event not found" because
    // the existence check itself filtered private events out.
    if (event.visibility === 'private' && !options.bypassVisibility) {
      throw new ForbiddenException({
        message: 'Event is private',
        userMessage: 'Este evento es privado. Necesitas una invitación.',
      });
    }

    // userId is injected from the JWT by the controller; guard narrows the
    // now-optional DTO field and fails loudly if identity is ever missing.
    if (joinEventDto.userId == null) {
      throw new Error('Missing authenticated user');
    }

    // Get or create participant
    const participant =
      await this.participantsService.getOrCreateParticipantByUserId(
        joinEventDto.userId,
      );

    // joinEvent itself resolves the already-a-member cases (re-joining after
    // declining, refusing after an admin removal) — duplicating the check here
    // only made "already registered" and "previously declined" indistinguishable.
    await this.participantsService.joinEvent(
      eventId,
      participant.id,
      joinEventDto,
    );
    return { success: true };
  }

  /** Self-service. Deletes the row outright, so re-joining later is clean. */
  async leaveEvent(
    eventId: number,
    userId: number,
  ): Promise<{ success: boolean }> {
    const participation = await this.participantsService.getParticipationForUser(
      userId,
      eventId,
    );
    if (!participation) {
      throw new NotFoundException('You are not a participant of this event');
    }

    await this.participantsService.leaveEvent(
      eventId,
      participation.participantId,
    );
    return { success: true };
  }

  /** Admin. Keeps the row as `removed` so the player cannot simply re-join. */
  async removeParticipant(
    eventId: number,
    participantId: number,
  ): Promise<{ success: boolean }> {
    await this.participantsService.setParticipationStatus(
      eventId,
      participantId,
      PARTICIPANT_STATUS.REMOVED,
    );
    return { success: true };
  }

  async setParticipantStatus(
    eventId: number,
    participantId: number,
    status: (typeof PARTICIPANT_STATUS)[keyof typeof PARTICIPANT_STATUS],
  ): Promise<EventParticipant> {
    return this.participantsService.setParticipationStatus(
      eventId,
      participantId,
      status,
    );
  }

  // ==================== EVENT LIFECYCLE ====================

  async setEventStatus(
    eventId: number,
    status: 'upcoming' | 'active' | 'completed',
  ): Promise<Event> {
    return this.eventsService.setStatus(eventId, status) as unknown as Event;
  }

  // ==================== EVENT INVITATIONS ====================

  async createEventInvite(
    eventId: number,
    createdBy: number | null,
    options: { expiresAt?: string; maxUses?: number },
  ): Promise<EventInvite> {
    const exists = await this.eventsService.validateEventExists(eventId);
    if (!exists) throw new NotFoundException('Event not found');
    return this.eventInvitesService.create(eventId, createdBy, options);
  }

  async listEventInvites(eventId: number): Promise<EventInvite[]> {
    return this.eventInvitesService.listForEvent(eventId);
  }

  async revokeEventInvite(code: string): Promise<{ success: boolean }> {
    await this.eventInvitesService.revoke(code);
    return { success: true };
  }

  async redeemEventInvite(
    code: string,
    userId: number,
  ): Promise<{ eventId: number }> {
    const invite = await this.eventInvitesService.consume(code);
    // bypassVisibility: the invitation IS the authorisation to join a private
    // event — that is the entire point of the code.
    await this.joinEvent(
      invite.eventId,
      { userId, comment: `Invitación ${code}` },
      { bypassVisibility: true },
    );
    return { eventId: invite.eventId };
  }

  async getEventParticipants(
    eventId: number,
    includePrivate = false,
  ): Promise<Participant[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
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
    })) as unknown as Participant[];
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

  async getLeaderboard(
    eventId: number,
    includePrivate = false,
  ): Promise<LeaderboardEntry[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
    }

    return this.leaderboardsService.getEventLeaderboard(eventId);
  }

  async getTeamLeaderboard(
    eventId: number,
    includePrivate = false,
  ): Promise<TeamLeaderboardEntry[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
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

  // ==================== USER PROFILE ====================

  async getUserTrophies(userId: number): Promise<UserTrophies> {
    return this.profileService.getUserTrophies(userId);
  }

  async getUserActivity(
    userId: number,
    limit?: number,
  ): Promise<UserActivityItem[]> {
    return this.profileService.getUserActivity(userId, limit);
  }
}
