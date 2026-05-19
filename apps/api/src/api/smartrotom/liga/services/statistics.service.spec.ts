import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { LigaRepository } from '@api/smartrotom/liga/repositories/liga.repository';

const mockRepo = {
  getPlayerStats: jest.fn(),
  findReplaysByPlayer: jest.fn(),
  getLeaderboard: jest.fn(),
  findReplaysByPlayers: jest.fn(),
};

const PLAYER1 = 'uuid-player-one';
const PLAYER2 = 'uuid-player-two';

const makeStats = (wins: number, losses: number) => ({
  totalMatches: wins + losses,
  wins,
  losses,
  winRate: wins / (wins + losses),
});

const makeReplay = (winner: string) => ({ winner }) as any;

describe('StatisticsService', () => {
  let service: StatisticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: LigaRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getPlayerStatistics ──────────────────────────────────────────────────────

  describe('getPlayerStatistics()', () => {
    beforeEach(() => {
      mockRepo.getPlayerStats.mockResolvedValue(makeStats(7, 3));
      mockRepo.findReplaysByPlayer.mockResolvedValue([]);
    });

    it('returns full stats object with uuid and points', async () => {
      const result = await service.getPlayerStatistics(PLAYER1);

      expect(result.uuid).toBe(PLAYER1);
      expect(result.wins).toBe(7);
      expect(result.losses).toBe(3);
      expect(result.totalMatches).toBe(10);
    });

    it('calculates points as wins*3 + losses*1', async () => {
      mockRepo.getPlayerStats.mockResolvedValue(makeStats(7, 3));

      const result = await service.getPlayerStatistics(PLAYER1);

      expect(result.points).toBe(7 * 3 + 3 * 1);
    });

    it('builds recentForm from last 10 replays with W/L based on winner field', async () => {
      const replays = [
        makeReplay(PLAYER1),
        makeReplay(PLAYER2),
        makeReplay(PLAYER1),
      ];
      mockRepo.findReplaysByPlayer.mockResolvedValue(replays);

      const result = await service.getPlayerStatistics(PLAYER1);

      expect(result.recentForm).toEqual(['W', 'L', 'W']);
    });

    it('limits recentForm to at most 10 entries', async () => {
      const replays = Array.from({ length: 15 }, (_, i) =>
        makeReplay(i % 2 === 0 ? PLAYER1 : PLAYER2),
      );
      mockRepo.findReplaysByPlayer.mockResolvedValue(replays);

      const result = await service.getPlayerStatistics(PLAYER1);

      expect(result.recentForm).toHaveLength(10);
    });

    it('returns empty recentForm when player has no replays', async () => {
      mockRepo.findReplaysByPlayer.mockResolvedValue([]);

      const result = await service.getPlayerStatistics(PLAYER1);

      expect(result.recentForm).toEqual([]);
    });

    it('throws when playerUuid is empty', async () => {
      await expect(service.getPlayerStatistics('')).rejects.toThrow(
        'Player UUID is required',
      );
      expect(mockRepo.getPlayerStats).not.toHaveBeenCalled();
    });
  });

  // ─── getLeaderboard ───────────────────────────────────────────────────────────

  describe('getLeaderboard()', () => {
    const standings = [
      { player: PLAYER1, rank: 1, wins: 10 },
      { player: PLAYER2, rank: 2, wins: 7 },
    ] as any;

    it('returns leaderboard response with rankings and count', async () => {
      mockRepo.getLeaderboard.mockResolvedValue(standings);

      const result = await service.getLeaderboard();

      expect(result.rankings).toEqual(standings);
      expect(result.totalPlayers).toBe(2);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('uses default limit of 20', async () => {
      mockRepo.getLeaderboard.mockResolvedValue([]);

      await service.getLeaderboard();

      expect(mockRepo.getLeaderboard).toHaveBeenCalledWith(20);
    });

    it('passes custom limit to repo', async () => {
      mockRepo.getLeaderboard.mockResolvedValue([]);

      await service.getLeaderboard(50);

      expect(mockRepo.getLeaderboard).toHaveBeenCalledWith(50);
    });

    it('throws when limit is 0', async () => {
      await expect(service.getLeaderboard(0)).rejects.toThrow(
        'Limit must be between 1 and 100',
      );
    });

    it('throws when limit exceeds 100', async () => {
      await expect(service.getLeaderboard(101)).rejects.toThrow(
        'Limit must be between 1 and 100',
      );
    });
  });

  // ─── getPlayerRanking ─────────────────────────────────────────────────────────

  describe('getPlayerRanking()', () => {
    const fullLeaderboard = [
      { player: 'uuid-a', rank: 1 },
      { player: PLAYER1, rank: 2 },
      { player: 'uuid-c', rank: 3 },
    ] as any;

    it('returns rank and total player count when player is found', async () => {
      mockRepo.getLeaderboard.mockResolvedValue(fullLeaderboard);

      const result = await service.getPlayerRanking(PLAYER1);

      expect(result).toEqual({ rank: 2, totalPlayers: 3 });
    });

    it('fetches full leaderboard (limit 1000) to find the player', async () => {
      mockRepo.getLeaderboard.mockResolvedValue([]);

      await service.getPlayerRanking(PLAYER1);

      expect(mockRepo.getLeaderboard).toHaveBeenCalledWith(1000);
    });

    it('returns null when player is not in the leaderboard', async () => {
      mockRepo.getLeaderboard.mockResolvedValue(fullLeaderboard);

      const result = await service.getPlayerRanking('unknown-uuid');

      expect(result).toBeNull();
    });

    it('throws when playerUuid is empty', async () => {
      await expect(service.getPlayerRanking('')).rejects.toThrow(
        'Player UUID is required',
      );
    });
  });

  // ─── comparePlayers ───────────────────────────────────────────────────────────

  describe('comparePlayers()', () => {
    beforeEach(() => {
      mockRepo.getPlayerStats.mockImplementation((uuid) =>
        Promise.resolve(uuid === PLAYER1 ? makeStats(10, 2) : makeStats(6, 4)),
      );
      mockRepo.findReplaysByPlayer.mockResolvedValue([]);
      mockRepo.findReplaysByPlayers.mockResolvedValue([
        makeReplay(PLAYER1),
        makeReplay(PLAYER2),
        makeReplay(PLAYER1),
      ]);
    });

    it('returns stats for both players and head-to-head record', async () => {
      const result = await service.comparePlayers(PLAYER1, PLAYER2);

      expect(result.player1Stats.uuid).toBe(PLAYER1);
      expect(result.player2Stats.uuid).toBe(PLAYER2);
      expect(result.headToHead).toEqual({
        player1Wins: 2,
        player2Wins: 1,
        totalMatches: 3,
      });
    });

    it('correctly counts wins per player from head-to-head replays', async () => {
      mockRepo.findReplaysByPlayers.mockResolvedValue([
        makeReplay(PLAYER2),
        makeReplay(PLAYER2),
        makeReplay(PLAYER1),
      ]);

      const result = await service.comparePlayers(PLAYER1, PLAYER2);

      expect(result.headToHead.player1Wins).toBe(1);
      expect(result.headToHead.player2Wins).toBe(2);
    });

    it('returns zero head-to-head counts when players have never met', async () => {
      mockRepo.findReplaysByPlayers.mockResolvedValue([]);

      const result = await service.comparePlayers(PLAYER1, PLAYER2);

      expect(result.headToHead).toEqual({
        player1Wins: 0,
        player2Wins: 0,
        totalMatches: 0,
      });
    });

    it('throws when player1 is empty', async () => {
      await expect(service.comparePlayers('', PLAYER2)).rejects.toThrow(
        'Both player UUIDs are required',
      );
    });

    it('throws when player2 is empty', async () => {
      await expect(service.comparePlayers(PLAYER1, '')).rejects.toThrow(
        'Both player UUIDs are required',
      );
    });

    it('throws when both players are the same', async () => {
      await expect(service.comparePlayers(PLAYER1, PLAYER1)).rejects.toThrow(
        'Players must be different',
      );
    });
  });
});
