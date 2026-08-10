import {
  Injectable,
  Inject,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
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
import { CreateEventAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Event } from './entities/event.entity';
import { Game } from './entities/game.entity';
import { EventAchievement } from './entities/achievement.entity';
import { AchievementWithProgress } from './entities/achievement-with-progress.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Participant } from './entities/participant.entity';
import {
  EventInvite,
  EventParticipant,
  EVENT_STATUS,
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
    userId?: number,
  ): Promise<Event & { childEvents?: Event[] }> {
    return this.eventsService.getEventById(
      id,
      includePrivate,
      userId,
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
        throw new NotFoundException('Game not found');
      }
    }

    // Validate parent event exists if provided and not -1
    if (createEventDto.parentId && createEventDto.parentId !== -1) {
      const parentExists = await this.eventsService.validateEventExists(
        createEventDto.parentId,
      );
      if (!parentExists) {
        throw new NotFoundException('Parent event not found');
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
      throw new NotFoundException('Event not found');
    }

    // Validate game exists if provided
    if (updateEventDto.gameId) {
      const gameExists = await this.gamesService.validateGameExists(
        updateEventDto.gameId,
      );
      if (!gameExists) {
        throw new NotFoundException('Game not found');
      }
    }

    // Validate parent event exists if provided and not -1
    if (updateEventDto.parentId && updateEventDto.parentId !== -1) {
      const parentExists = await this.eventsService.validateEventExists(
        updateEventDto.parentId,
      );
      if (!parentExists) {
        throw new NotFoundException('Parent event not found');
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
      throw new NotFoundException('Event not found');
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
      throw new NotFoundException('Game not found');
    }

    return this.gamesService.updateGame(id, updateGameDto) as unknown as Game;
  }

  async deleteGame(id: number): Promise<void> {
    const gameExists = await this.gamesService.validateGameExists(id);
    if (!gameExists) {
      throw new NotFoundException('Game not found');
    }

    // Deleting a game used to soft-delete every one of its events, silently
    // revoking pack access for all their participants in one click. Refuse
    // while live (non-completed) events exist — delete or complete them first.
    const events = await this.eventsService.getAllEvents({
      gameId: id,
      includePrivate: true,
    });
    const liveEvents = events.filter(
      (e) => e.status !== EVENT_STATUS.COMPLETED,
    );
    if (liveEvents.length > 0) {
      throw new ConflictException(
        `Game has ${liveEvents.length} active or upcoming event(s); delete or complete them first`,
      );
    }

    return this.gamesService.deleteGame(id);
  }

  /**
   * Drops rows that belong to a private event the viewer may not see. Rows
   * with no event (server-wide) always pass.
   */
  private async filterPrivateEventRows<T>(
    rows: T[],
    eventIdOf: (row: T) => number | null | undefined,
    includePrivate: boolean,
    userId?: number,
  ): Promise<T[]> {
    if (includePrivate || rows.length === 0) return rows;
    const hidden = await this.eventsService.hiddenPrivateEventIds(
      rows.map(eventIdOf),
      userId,
    );
    if (hidden.size === 0) return rows;
    return rows.filter((row) => {
      const eventId = eventIdOf(row);
      return !eventId || !hidden.has(eventId);
    });
  }

  // ==================== ACHIEVEMENT MANAGEMENT ====================
  async getAchievements(
    includePrivate = false,
    userId?: number,
  ): Promise<EventAchievement[]> {
    const achievements =
      (await this.achievementsService.getAllAchievements()) as unknown as EventAchievement[];
    return this.filterPrivateEventRows(
      achievements,
      (a) => a.eventId,
      includePrivate,
      userId,
    );
  }

  async getAchievement(id: number): Promise<EventAchievement> {
    return this.achievementsService.getAchievementById(
      id,
    ) as unknown as EventAchievement;
  }

  async getEventAchievements(
    eventId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<EventAchievement[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
      userId,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
    }

    return this.achievementsService.getAchievementsByEventId(
      eventId,
    ) as unknown as EventAchievement[];
  }

  async createAchievement(
    eventId: number,
    createAchievementDto: CreateEventAchievementDto,
  ): Promise<EventAchievement> {
    const eventExists = await this.eventsService.validateEventExists(eventId);
    if (!eventExists) {
      throw new NotFoundException('Event not found');
    }

    return this.achievementsService.createAchievement(
      eventId,
      createAchievementDto,
    ) as unknown as EventAchievement;
  }

  async updateAchievement(
    eventId: number,
    id: number,
    updateAchievementDto: UpdateAchievementDto,
  ): Promise<EventAchievement> {
    const [eventExists, achievementExists] = await Promise.all([
      this.eventsService.validateEventExists(eventId),
      this.achievementsService.validateAchievementExists(id),
    ]);

    if (!eventExists) {
      throw new NotFoundException('Event not found');
    }
    if (!achievementExists) {
      throw new NotFoundException('Achievement not found');
    }

    return this.achievementsService.updateAchievement(
      id,
      updateAchievementDto,
    ) as unknown as EventAchievement;
  }

  async getParticipantProgress(
    participantId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<AchievementWithProgress[]> {
    const rows =
      await this.achievementsService.getParticipantProgress(participantId);
    if (includePrivate || rows.length === 0) return rows;
    // Progress rows don't carry the event id; resolve it via the catalogue so
    // private-event achievements stay invisible to outsiders.
    const catalogue = await this.achievementsService.getAllAchievements();
    const eventByAchievement = new Map(
      catalogue.map((a) => [a.id, a.eventId]),
    );
    return this.filterPrivateEventRows(
      rows,
      (r) => eventByAchievement.get(r.id),
      includePrivate,
      userId,
    );
  }

  async getParticipantProgressByEvent(
    participantId: number,
    eventId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<AchievementWithProgress[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
      userId,
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
  async getTeams(includePrivate = false, userId?: number): Promise<Team[]> {
    const teams = (await this.teamsService.getAllTeams()) as unknown as Team[];
    return this.filterPrivateEventRows(
      teams,
      (t) => t.eventId,
      includePrivate,
      userId,
    );
  }

  async getEventTeams(
    eventId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<Team[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
      userId,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
    }

    return this.teamsService.getTeamsByEventId(eventId) as unknown as Team[];
  }

  async getTeam(
    teamId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<Team> {
    const team = (await this.teamsService.getTeamById(
      teamId,
    )) as unknown as Team;
    if (team) {
      await this.assertTeamEventVisible(team.eventId, includePrivate, userId);
    }
    return team;
  }

  /** 404 (not 403) so a private event's teams don't reveal their existence. */
  private async assertTeamEventVisible(
    eventId: number | null | undefined,
    includePrivate: boolean,
    userId?: number,
  ): Promise<void> {
    if (!eventId || includePrivate) return;
    const visible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
      userId,
    );
    if (!visible) {
      throw new NotFoundException('Team not found');
    }
  }

  async getTeamMembers(
    teamId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<TeamMember[]> {
    const team = (await this.teamsService.getTeamById(
      teamId,
    )) as unknown as Team;
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    await this.assertTeamEventVisible(team.eventId, includePrivate, userId);

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
      throw new NotFoundException('Event not found');
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
      throw new NotFoundException('Event not found');
    }
    if (!teamExists) {
      throw new NotFoundException('Team not found');
    }
    if (!teamInEvent) {
      throw new ConflictException('Team does not belong to this event');
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
    includePrivate = false,
  ): Promise<{ success: boolean }> {
    const [event, teamExists, teamInEvent] = await Promise.all([
      this.eventsService.getEventById(eventId, true),
      this.teamsService.validateTeamExists(teamId),
      this.teamsService.validateTeamInEvent(teamId, eventId),
    ]);

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (!teamExists) {
      throw new NotFoundException('Team not found');
    }
    if (!teamInEvent) {
      throw new ConflictException('Team does not belong to this event');
    }

    // Team join creates event membership, so it must pass the same gates as
    // joinEvent — it used to bypass the private-visibility guard entirely,
    // letting any authed user take a private event's pack via an enumerable
    // team id.
    if (event.status === EVENT_STATUS.COMPLETED) {
      throw new ForbiddenException({
        message: 'Event is completed',
        userMessage: 'Este evento ya ha finalizado.',
      });
    }
    if (event.visibility === 'private' && !includePrivate) {
      const canSee = await this.eventsService.validateEventVisible(
        eventId,
        false,
        userId,
      );
      if (!canSee) {
        throw new ForbiddenException({
          message: 'Event is private',
          userMessage: 'Este evento es privado. Necesitas una invitación.',
        });
      }
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
      throw new NotFoundException('Event not found');
    }
    if (!teamExists) {
      throw new NotFoundException('Team not found');
    }
    if (!teamInEvent) {
      throw new ConflictException('Team does not belong to this event');
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

    // A finished event must stop handing out memberships (and with them, pack
    // access) — leftover invite codes included.
    if (event.status === EVENT_STATUS.COMPLETED) {
      throw new ForbiddenException({
        message: 'Event is completed',
        userMessage: 'Este evento ya ha finalizado.',
      });
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
      throw new InternalServerErrorException('Missing authenticated user');
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
      throw new NotFoundException({
        message: 'You are not a participant of this event',
        userMessage: 'No participas en este evento.',
      });
    }

    // A removed player cannot self-clear their expulsion by leaving and
    // re-joining; the `removed` row must stay to keep the REMOVED guard effective.
    if (participation.status === PARTICIPANT_STATUS.REMOVED) {
      throw new ForbiddenException({
        message: 'Participant was removed by an admin',
        userMessage: 'Has sido expulsado de este evento por un administrador.',
      });
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
    // Pre-validate everything that would make the join fail BEFORE consuming:
    // a use burned on a doomed redemption is unrecoverable (there is no admin
    // "restore use"). The atomic consume stays the concurrency arbiter.
    const invite = await this.eventInvitesService.getByCode(code);

    const event = await this.eventsService.getEventById(invite.eventId, true);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.status === EVENT_STATUS.COMPLETED) {
      throw new ForbiddenException({
        message: 'Event is completed',
        userMessage: 'Este evento ya ha finalizado.',
      });
    }

    const participation = await this.participantsService.getParticipationForUser(
      userId,
      invite.eventId,
    );
    if (participation) {
      if (participation.status === PARTICIPANT_STATUS.REMOVED) {
        throw new ForbiddenException(
          'Has sido expulsado de este evento por un administrador',
        );
      }
      if (participation.status !== PARTICIPANT_STATUS.DECLINED) {
        throw new ConflictException(
          'Participant is already registered for this event',
        );
      }
    }

    await this.eventInvitesService.consume(code);
    // bypassVisibility: the invitation IS the authorisation to join a private
    // event — that is the entire point of the code. The comment is a marker,
    // never the code itself: it used to echo live invite codes to anyone who
    // could read the participants list.
    await this.joinEvent(
      invite.eventId,
      { userId, comment: 'invite' },
      { bypassVisibility: true },
    );
    return { eventId: invite.eventId };
  }

  async getEventParticipants(
    eventId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<Participant[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
      userId,
    );
    if (!eventVisible) {
      // 404 (not 500) — also hides a private event's existence from non-admins.
      throw new NotFoundException('Event not found');
    }

    // Get raw participants data
    const rawParticipants =
      await this.participantsService.getEventParticipants(eventId);

    // Transform to match Participant entity. `comment` is admin-only: old rows
    // stored the literal invite code in it, so echoing it publicly leaked live
    // codes to anyone who could read the roster.
    return rawParticipants.map((participant) => ({
      id: participant.id,
      eventId: participant.eventId,
      participantId: participant.participantId,
      userId: participant.userId,
      avatar: participant.avatar,
      nickname: participant.nickname,
      status: participant.status,
      comment: includePrivate ? participant.comment : null,
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
      throw new NotFoundException('Event not found');
    }
    if (!achievementExists) {
      throw new NotFoundException('Achievement not found');
    }

    // Validate participant is in the event
    const participantInEvent =
      await this.participantsService.validateEventParticipation(
        updateProgressDto.participantId,
        eventId,
      );
    if (!participantInEvent) {
      throw new ConflictException('Participant is not registered for this event');
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
    userId?: number,
  ): Promise<LeaderboardEntry[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
      userId,
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
    userId?: number,
  ): Promise<TeamLeaderboardEntry[]> {
    const eventVisible = await this.eventsService.validateEventVisible(
      eventId,
      includePrivate,
      userId,
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
        throw new NotFoundException('Event not found');
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
        throw new NotFoundException('Event not found');
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
        throw new NotFoundException('Event not found');
      }
    }

    return this.leaderboardsService.getRecentAchievements(limit, eventId);
  }

  // ==================== USER PROFILE ====================

  async getUserTrophies(
    userId: number,
    viewer?: { includePrivate?: boolean; userId?: number },
  ): Promise<UserTrophies> {
    return this.profileService.getUserTrophies(userId, viewer);
  }

  async getUserActivity(
    userId: number,
    limit?: number,
    viewer?: { includePrivate?: boolean; userId?: number },
  ): Promise<UserActivityItem[]> {
    return this.profileService.getUserActivity(userId, limit, viewer);
  }
}
