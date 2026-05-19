import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { LigaFacadeService } from './liga.facade.service';
import { ReplayService } from './services/replay.service';
import { StatisticsService } from './services/statistics.service';
import { TournamentService } from './services/tournament.service';

const mockReplayService = {
  getReplayById: jest.fn(),
  getRecentReplays: jest.fn(),
  getPlayerReplays: jest.fn(),
  getMatchHistory: jest.fn(),
  validateReplayExists: jest.fn(),
};

const mockStatisticsService = {
  getPlayerStatistics: jest.fn(),
  getLeaderboard: jest.fn(),
  getPlayerRanking: jest.fn(),
  comparePlayers: jest.fn(),
};

const mockTournamentService = {
  createTournament: jest.fn(),
  registerForTournament: jest.fn(),
  getActiveTournaments: jest.fn(),
  getTournamentById: jest.fn(),
  getTournamentMatches: jest.fn(),
  validateTournamentExists: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const UUID = 'player-uuid';
const mockReplay = { id: 1, winner: UUID } as any;
const mockStats = { wins: 10, losses: 2, points: 32 } as any;

describe('LigaFacadeService', () => {
  let service: LigaFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LigaFacadeService,
        { provide: Logger, useValue: mockLogger },
        { provide: ReplayService, useValue: mockReplayService },
        { provide: StatisticsService, useValue: mockStatisticsService },
        { provide: TournamentService, useValue: mockTournamentService },
      ],
    }).compile();

    service = module.get<LigaFacadeService>(LigaFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── replay methods ───────────────────────────────────────────────────────────

  describe('getReplayById()', () => {
    it('delegates to ReplayService', async () => {
      mockReplayService.getReplayById.mockResolvedValue(mockReplay);

      await expect(service.getReplayById(1)).resolves.toEqual(mockReplay);
      expect(mockReplayService.getReplayById).toHaveBeenCalledWith(1);
    });

    it('wraps and re-throws on error', async () => {
      mockReplayService.getReplayById.mockRejectedValue(new Error('not found'));

      await expect(service.getReplayById(99)).rejects.toThrow(
        'Failed to retrieve replay',
      );
    });
  });

  describe('getRecentReplays()', () => {
    it('returns recent replays with default limit', async () => {
      mockReplayService.getRecentReplays.mockResolvedValue([mockReplay]);

      await expect(service.getRecentReplays()).resolves.toHaveLength(1);
      expect(mockReplayService.getRecentReplays).toHaveBeenCalledWith(10);
    });
  });

  describe('getPlayerReplays()', () => {
    it('delegates to ReplayService with player uuid', async () => {
      mockReplayService.getPlayerReplays.mockResolvedValue([mockReplay]);

      await expect(service.getPlayerReplays(UUID)).resolves.toEqual([
        mockReplay,
      ]);
    });
  });

  describe('getMatchHistory()', () => {
    it('fetches H2H replays between two players', async () => {
      mockReplayService.getMatchHistory.mockResolvedValue([mockReplay]);

      await expect(service.getMatchHistory('p1', 'p2')).resolves.toEqual([
        mockReplay,
      ]);
      expect(mockReplayService.getMatchHistory).toHaveBeenCalledWith(
        'p1',
        'p2',
      );
    });
  });

  // ─── statistics methods ───────────────────────────────────────────────────────

  describe('getPlayerStatistics()', () => {
    it('delegates to StatisticsService', async () => {
      mockStatisticsService.getPlayerStatistics.mockResolvedValue(mockStats);

      await expect(service.getPlayerStatistics(UUID)).resolves.toEqual(
        mockStats,
      );
    });

    it('wraps and re-throws on error', async () => {
      mockStatisticsService.getPlayerStatistics.mockRejectedValue(
        new Error('fail'),
      );

      await expect(service.getPlayerStatistics(UUID)).rejects.toThrow(
        'Failed to retrieve player statistics',
      );
    });
  });

  describe('getLeaderboard()', () => {
    it('delegates with default limit of 20', async () => {
      mockStatisticsService.getLeaderboard.mockResolvedValue({ standings: [] });

      await service.getLeaderboard();

      expect(mockStatisticsService.getLeaderboard).toHaveBeenCalledWith(20);
    });
  });

  describe('getPlayerRanking()', () => {
    it('returns ranking data', async () => {
      mockStatisticsService.getPlayerRanking.mockResolvedValue({
        rank: 3,
        totalPlayers: 50,
      });

      const result = await service.getPlayerRanking(UUID);

      expect(result!.rank).toBe(3);
    });
  });

  describe('comparePlayerStatistics()', () => {
    it('delegates comparison to StatisticsService', async () => {
      const comparison = {
        player1Stats: mockStats,
        player2Stats: mockStats,
        headToHead: { player1Wins: 2, player2Wins: 1, totalMatches: 3 },
      };
      mockStatisticsService.comparePlayers.mockResolvedValue(comparison);

      const result = await service.comparePlayerStatistics('p1', 'p2');

      expect(result.headToHead.totalMatches).toBe(3);
    });
  });

  // ─── tournament methods ───────────────────────────────────────────────────────

  describe('getActiveTournaments()', () => {
    it('returns active tournaments', async () => {
      mockTournamentService.getActiveTournaments.mockResolvedValue([]);

      await expect(service.getActiveTournaments()).resolves.toEqual([]);
    });
  });

  describe('createTournament()', () => {
    it('delegates creation and returns result', async () => {
      mockTournamentService.createTournament.mockResolvedValue({
        success: true,
        message: 'not yet implemented',
      });

      const result = await service.createTournament({
        name: 'Cup',
        maxParticipants: 8,
      } as any);

      expect(result.success).toBe(true);
    });
  });

  describe('registerForTournament()', () => {
    it('delegates registration', async () => {
      mockTournamentService.registerForTournament.mockResolvedValue({
        success: true,
        message: 'ok',
      });

      const result = await service.registerForTournament({
        tournamentId: 1,
        playerUuid: UUID,
      } as any);

      expect(result.success).toBe(true);
    });
  });

  // ─── validation methods ───────────────────────────────────────────────────────

  describe('validateReplayExists()', () => {
    it('returns true when replay exists', async () => {
      mockReplayService.validateReplayExists.mockResolvedValue(true);

      await expect(service.validateReplayExists(1)).resolves.toBe(true);
    });

    it('returns false on error (does not throw)', async () => {
      mockReplayService.validateReplayExists.mockRejectedValue(
        new Error('fail'),
      );

      await expect(service.validateReplayExists(99)).resolves.toBe(false);
    });
  });

  describe('validateTournamentExists()', () => {
    it('returns false on error (does not throw)', async () => {
      mockTournamentService.validateTournamentExists.mockRejectedValue(
        new Error('fail'),
      );

      await expect(service.validateTournamentExists(99)).resolves.toBe(false);
    });
  });
});
