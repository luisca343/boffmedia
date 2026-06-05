import { Test, TestingModule } from '@nestjs/testing';
import { EventsFacadeService } from './events.facade.service';
import { EventsService } from './services/events.service';
import { GamesService } from './services/games.service';
import { AchievementsService } from './services/achievements.service';
import { TeamsService } from './services/teams.service';
import { ParticipantsService } from './services/participants.service';
import { ProgressService } from './services/progress.service';
import { LeaderboardsService } from './services/leaderboards.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

const mockEvent = { id: 1, name: 'Tournament', gameId: 1, parentId: null };
const mockGame = { id: 1, name: 'Pokémon VGC' };
const mockAchievement = { id: 1, name: 'First Win', eventId: 1 };
const mockTeam = { id: 1, name: 'Team Rocket', eventId: 1 };
const _mockParticipant = { id: 1, userId: 10, eventId: 1 };
const mockLeaderboardEntry = { participantId: 1, username: 'Ash', score: 100 };

describe('EventsFacadeService', () => {
  let service: EventsFacadeService;
  let eventsService: jest.Mocked<
    Pick<
      EventsService,
      | 'getAllEvents'
      | 'getEventById'
      | 'createEvent'
      | 'updateEvent'
      | 'deleteEvent'
      | 'validateEventExists'
    >
  >;
  let gamesService: jest.Mocked<
    Pick<
      GamesService,
      | 'getAllGames'
      | 'getGameById'
      | 'createGame'
      | 'updateGame'
      | 'deleteGame'
      | 'validateGameExists'
    >
  >;
  let achievementsService: jest.Mocked<
    Pick<
      AchievementsService,
      | 'getAllAchievements'
      | 'getAchievementById'
      | 'getAchievementsByEventId'
      | 'createAchievement'
      | 'updateAchievement'
      | 'validateAchievementExists'
      | 'getParticipantProgress'
      | 'getParticipantProgressByEvent'
    >
  >;
  let teamsService: jest.Mocked<
    Pick<
      TeamsService,
      | 'getAllTeams'
      | 'getTeamsByEventId'
      | 'getTeamById'
      | 'getTeamMembers'
      | 'createTeam'
      | 'updateTeam'
      | 'validateTeamExists'
      | 'validateTeamInEvent'
      | 'joinTeam'
      | 'leaveTeam'
    >
  >;
  let _participantsService: jest.Mocked<
    Pick<
      ParticipantsService,
      | 'getEventParticipants'
      | 'getOrCreateParticipantByUserId'
      | 'getParticipantAchievements'
      | 'joinEvent'
    >
  >;
  let _progressService: jest.Mocked<Pick<ProgressService, 'updateProgress'>>;
  let leaderboardsService: jest.Mocked<
    Pick<
      LeaderboardsService,
      | 'getGlobalLeaderboard'
      | 'getEventLeaderboard'
      | 'getTeamLeaderboard'
      | 'getParticipantRanking'
      | 'getTopAchievers'
      | 'getLeaderboardWithPagination'
      | 'getRecentAchievements'
    >
  >;

  beforeEach(async () => {
    const mockEventsService = {
      getAllEvents: jest.fn(),
      getEventById: jest.fn(),
      createEvent: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
      validateEventExists: jest.fn(),
    };
    const mockGamesService = {
      getAllGames: jest.fn(),
      getGameById: jest.fn(),
      createGame: jest.fn(),
      updateGame: jest.fn(),
      deleteGame: jest.fn(),
      validateGameExists: jest.fn(),
    };
    const mockAchievementsService = {
      getAllAchievements: jest.fn(),
      getAchievementById: jest.fn(),
      getAchievementsByEventId: jest.fn(),
      createAchievement: jest.fn(),
      updateAchievement: jest.fn(),
      validateAchievementExists: jest.fn(),
      getParticipantProgress: jest.fn(),
      getParticipantProgressByEvent: jest.fn(),
    };
    const mockTeamsService = {
      getAllTeams: jest.fn(),
      getTeamsByEventId: jest.fn(),
      getTeamById: jest.fn(),
      getTeamMembers: jest.fn(),
      createTeam: jest.fn(),
      updateTeam: jest.fn(),
      validateTeamExists: jest.fn(),
      validateTeamInEvent: jest.fn(),
      joinTeam: jest.fn(),
      leaveTeam: jest.fn(),
    };
    const mockParticipantsService = {
      getEventParticipants: jest.fn(),
      getOrCreateParticipantByUserId: jest.fn(),
      getParticipantAchievements: jest.fn(),
      joinEvent: jest.fn(),
    };
    const mockProgressService = { updateProgress: jest.fn() };
    const mockLeaderboardsService = {
      getGlobalLeaderboard: jest.fn(),
      getEventLeaderboard: jest.fn(),
      getTeamLeaderboard: jest.fn(),
      getParticipantRanking: jest.fn(),
      getTopAchievers: jest.fn(),
      getLeaderboardWithPagination: jest.fn(),
      getRecentAchievements: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsFacadeService,
        { provide: EventsService, useValue: mockEventsService },
        { provide: GamesService, useValue: mockGamesService },
        { provide: AchievementsService, useValue: mockAchievementsService },
        { provide: TeamsService, useValue: mockTeamsService },
        { provide: ParticipantsService, useValue: mockParticipantsService },
        { provide: ProgressService, useValue: mockProgressService },
        { provide: LeaderboardsService, useValue: mockLeaderboardsService },
        { provide: DRIZZLE, useValue: {} },
      ],
    }).compile();

    service = module.get<EventsFacadeService>(EventsFacadeService);
    eventsService = module.get(EventsService);
    gamesService = module.get(GamesService);
    achievementsService = module.get(AchievementsService);
    teamsService = module.get(TeamsService);
    _participantsService = module.get(ParticipantsService);
    _progressService = module.get(ProgressService);
    leaderboardsService = module.get(LeaderboardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== EVENTS ====================

  describe('getEvents', () => {
    it('should return all events', async () => {
      eventsService.getAllEvents.mockResolvedValue([mockEvent] as any);

      const result = await service.getEvents();

      expect(eventsService.getAllEvents).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockEvent]);
    });
  });

  describe('getEvent', () => {
    it('should return event by id', async () => {
      eventsService.getEventById.mockResolvedValue(mockEvent as any);

      const result = await service.getEvent(1);

      expect(eventsService.getEventById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('createEvent', () => {
    it('should create an event when game exists', async () => {
      const dto = { name: 'Tournament', gameId: 1 };
      gamesService.validateGameExists.mockResolvedValue(true);
      eventsService.createEvent.mockResolvedValue(mockEvent as any);

      const result = await service.createEvent(dto as any);

      expect(gamesService.validateGameExists).toHaveBeenCalledWith(1);
      expect(eventsService.createEvent).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw if game not found', async () => {
      gamesService.validateGameExists.mockResolvedValue(false);

      await expect(
        service.createEvent({ name: 'T', gameId: 99 } as any),
      ).rejects.toThrow('Game not found');
    });

    it('should convert parentId -1 to null', async () => {
      const dto = { name: 'Child Event', parentId: -1 };
      eventsService.createEvent.mockResolvedValue(mockEvent as any);

      await service.createEvent(dto as any);

      expect(eventsService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: null }),
      );
    });
  });

  describe('updateEvent', () => {
    it('should update an event when it exists', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      eventsService.updateEvent.mockResolvedValue(mockEvent as any);

      const result = await service.updateEvent(1, { name: 'Updated' } as any);

      expect(eventsService.validateEventExists).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEvent);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);

      await expect(service.updateEvent(99, {} as any)).rejects.toThrow(
        'Event not found',
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event when it exists', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      eventsService.deleteEvent.mockResolvedValue(undefined);

      await service.deleteEvent(1);

      expect(eventsService.deleteEvent).toHaveBeenCalledWith(1);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);

      await expect(service.deleteEvent(99)).rejects.toThrow('Event not found');
    });
  });

  // ==================== GAMES ====================

  describe('getGames', () => {
    it('should return all games', async () => {
      gamesService.getAllGames.mockResolvedValue([mockGame] as any);

      const result = await service.getGames();

      expect(result).toEqual([mockGame]);
    });
  });

  describe('getGame', () => {
    it('should return game by id', async () => {
      gamesService.getGameById.mockResolvedValue(mockGame as any);

      const result = await service.getGame(1);

      expect(gamesService.getGameById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGame);
    });
  });

  describe('createGame', () => {
    it('should create a game', async () => {
      gamesService.createGame.mockResolvedValue(mockGame as any);

      const result = await service.createGame({ name: 'VGC' } as any);

      expect(result).toEqual(mockGame);
    });
  });

  describe('updateGame', () => {
    it('should update a game when it exists', async () => {
      gamesService.validateGameExists.mockResolvedValue(true);
      gamesService.updateGame.mockResolvedValue(mockGame as any);

      const result = await service.updateGame(1, { name: 'Updated' } as any);

      expect(result).toEqual(mockGame);
    });

    it('should throw if game not found', async () => {
      gamesService.validateGameExists.mockResolvedValue(false);

      await expect(service.updateGame(99, {} as any)).rejects.toThrow(
        'Game not found',
      );
    });
  });

  describe('deleteGame', () => {
    it('should delete a game when it exists', async () => {
      gamesService.validateGameExists.mockResolvedValue(true);
      gamesService.deleteGame.mockResolvedValue(undefined);

      await service.deleteGame(1);

      expect(gamesService.deleteGame).toHaveBeenCalledWith(1);
    });

    it('should throw if game not found', async () => {
      gamesService.validateGameExists.mockResolvedValue(false);

      await expect(service.deleteGame(99)).rejects.toThrow('Game not found');
    });
  });

  // ==================== ACHIEVEMENTS ====================

  describe('getAchievements', () => {
    it('should return all achievements', async () => {
      achievementsService.getAllAchievements.mockResolvedValue([
        mockAchievement,
      ] as any);

      const result = await service.getAchievements();

      expect(result).toEqual([mockAchievement]);
    });
  });

  describe('getEventAchievements', () => {
    it('should return event achievements when event exists', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      achievementsService.getAchievementsByEventId.mockResolvedValue([
        mockAchievement,
      ] as any);

      const result = await service.getEventAchievements(1);

      expect(result).toEqual([mockAchievement]);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);

      await expect(service.getEventAchievements(99)).rejects.toThrow(
        'Event not found',
      );
    });
  });

  describe('createAchievement', () => {
    it('should create achievement when event exists', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      achievementsService.createAchievement.mockResolvedValue(
        mockAchievement as any,
      );

      const result = await service.createAchievement(1, { name: 'Win' } as any);

      expect(result).toEqual(mockAchievement);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);

      await expect(service.createAchievement(99, {} as any)).rejects.toThrow(
        'Event not found',
      );
    });
  });

  describe('updateAchievement', () => {
    it('should update achievement when both event and achievement exist', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      achievementsService.validateAchievementExists.mockResolvedValue(true);
      achievementsService.updateAchievement.mockResolvedValue(
        mockAchievement as any,
      );

      const result = await service.updateAchievement(1, 1, {
        name: 'Updated',
      } as any);

      expect(result).toEqual(mockAchievement);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);
      achievementsService.validateAchievementExists.mockResolvedValue(true);

      await expect(service.updateAchievement(99, 1, {} as any)).rejects.toThrow(
        'Event not found',
      );
    });

    it('should throw if achievement not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      achievementsService.validateAchievementExists.mockResolvedValue(false);

      await expect(service.updateAchievement(1, 99, {} as any)).rejects.toThrow(
        'Achievement not found',
      );
    });
  });

  // ==================== TEAMS ====================

  describe('getTeams', () => {
    it('should return all teams', async () => {
      teamsService.getAllTeams.mockResolvedValue([mockTeam] as any);

      const result = await service.getTeams();

      expect(result).toEqual([mockTeam]);
    });
  });

  describe('getEventTeams', () => {
    it('should return teams for event when event exists', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      teamsService.getTeamsByEventId.mockResolvedValue([mockTeam] as any);

      const result = await service.getEventTeams(1);

      expect(result).toEqual([mockTeam]);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);

      await expect(service.getEventTeams(99)).rejects.toThrow(
        'Event not found',
      );
    });
  });

  describe('getTeamMembers', () => {
    it('should return normalized team members', async () => {
      teamsService.validateTeamExists.mockResolvedValue(true);
      teamsService.getTeamMembers.mockResolvedValue([
        {
          userId: 1,
          teamId: 1,
          participantId: 1,
          username: 'Ash',
          displayName: 'Ash K',
          avatar: null,
          role: 'member',
          joinedAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const result = await service.getTeamMembers(1);

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('Ash');
    });

    it('should throw if team not found', async () => {
      teamsService.validateTeamExists.mockResolvedValue(false);

      await expect(service.getTeamMembers(99)).rejects.toThrow(
        'Team not found',
      );
    });
  });

  describe('createTeam', () => {
    it('should create a team when event exists', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      teamsService.createTeam.mockResolvedValue(mockTeam as any);

      const result = await service.createTeam(1, { name: 'Team A' } as any);

      expect(result).toEqual(mockTeam);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);

      await expect(service.createTeam(99, {} as any)).rejects.toThrow(
        'Event not found',
      );
    });
  });

  describe('updateTeam', () => {
    it('should update team when event, team, and team-in-event all valid', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      teamsService.validateTeamExists.mockResolvedValue(true);
      teamsService.validateTeamInEvent.mockResolvedValue(true);
      teamsService.updateTeam.mockResolvedValue(mockTeam as any);

      const result = await service.updateTeam(1, 1, { name: 'Updated' } as any);

      expect(result).toEqual(mockTeam);
    });

    it('should throw if team does not belong to event', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      teamsService.validateTeamExists.mockResolvedValue(true);
      teamsService.validateTeamInEvent.mockResolvedValue(false);

      await expect(service.updateTeam(1, 2, {} as any)).rejects.toThrow(
        'Team does not belong to this event',
      );
    });
  });

  // ==================== LEADERBOARDS ====================

  describe('getLeaderboards', () => {
    it('should return global leaderboard', async () => {
      leaderboardsService.getGlobalLeaderboard.mockResolvedValue([
        mockLeaderboardEntry,
      ] as any);

      const result = await service.getLeaderboards();

      expect(result).toEqual([mockLeaderboardEntry]);
    });
  });

  describe('getLeaderboard', () => {
    it('should return event leaderboard when event exists', async () => {
      eventsService.validateEventExists.mockResolvedValue(true);
      leaderboardsService.getEventLeaderboard.mockResolvedValue([
        mockLeaderboardEntry,
      ] as any);

      const result = await service.getLeaderboard(1);

      expect(result).toEqual([mockLeaderboardEntry]);
    });

    it('should throw if event not found', async () => {
      eventsService.validateEventExists.mockResolvedValue(false);

      await expect(service.getLeaderboard(99)).rejects.toThrow(
        'Event not found',
      );
    });
  });
});
