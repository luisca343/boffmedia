import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderboardsRepository } from '../repositories/leaderboards.repository';

const makeParticipant = (
  id: number,
  totalPoints: number,
  achievementCount = 1,
  medalCount = 0,
) => ({
  participantId: id,
  nickname: `Player${id}`,
  avatar: null,
  userId: id * 10,
  achievementPoints: totalPoints,
  medalPoints: 0,
  totalPoints,
  achievementCount,
  medalCount,
  lastUpdated: new Date(),
});

/**
 * The SQL now lives in LeaderboardsRepository, so these tests cover what is
 * left in the service: ranking, rank derivation and pagination arithmetic. The
 * ordering itself is the repository's contract and is asserted by trusting the
 * order rows come back in — the service must never re-sort them.
 */
describe('LeaderboardsService', () => {
  let service: LeaderboardsService;

  const repo = {
    findGlobalTotals: jest.fn(),
    findEventTotals: jest.fn(),
    findTeamTotals: jest.fn(),
    findOwnAggregate: jest.fn(),
    countRankedAbove: jest.fn(),
    findTopAchievers: jest.fn(),
    countGlobalBoard: jest.fn(),
    countEventBoard: jest.fn(),
    findRecentAchievements: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardsService,
        { provide: LeaderboardsRepository, useValue: repo },
      ],
    }).compile();
    service = module.get<LeaderboardsService>(LeaderboardsService);
  });

  describe('getGlobalLeaderboard()', () => {
    beforeEach(() => {
      repo.findGlobalTotals.mockResolvedValue([
        makeParticipant(3, 300),
        makeParticipant(1, 200),
        makeParticipant(2, 100),
      ]);
    });

    it('should add 1-based rank to results in order', async () => {
      const result = await service.getGlobalLeaderboard();

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('should preserve the query-provided ordering', async () => {
      const result = await service.getGlobalLeaderboard();

      expect(result[0].participantId).toBe(3);
    });
  });

  describe('getEventLeaderboard()', () => {
    beforeEach(() => {
      repo.findEventTotals.mockResolvedValue([
        makeParticipant(1, 150),
        makeParticipant(2, 75),
      ]);
    });

    it('should return ranked results for a specific event', async () => {
      const result = await service.getEventLeaderboard(42);

      expect(repo.findEventTotals).toHaveBeenCalledWith(42);
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].participantId).toBe(1);
    });
  });

  describe('getTeamLeaderboard()', () => {
    it('ranks teams in the order the repository returned them', async () => {
      repo.findTeamTotals.mockResolvedValue([
        { teamId: 2, teamName: 'B', teamTag: 'b', score: 90, memberCount: 3 },
        { teamId: 1, teamName: 'A', teamTag: 'a', score: 40, memberCount: 2 },
      ]);

      const result = await service.getTeamLeaderboard(42);

      expect(result[0].teamId).toBe(2);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
    });
  });

  describe('getParticipantRanking()', () => {
    it('should derive globalRank from the count of participants above', async () => {
      repo.findOwnAggregate.mockResolvedValue({
        totalPoints: 500,
        achievementCount: 3,
        medalCount: 1,
        lastUpdated: new Date(),
      });
      repo.countRankedAbove.mockResolvedValue(0);

      const result = await service.getParticipantRanking(5);

      expect(result.participantId).toBe(5);
      expect(result.globalRank).toBe(1);
      expect(result.totalPoints).toBe(500);
      expect(result.achievementCount).toBe(3);
      expect(result.medalCount).toBe(1);
    });

    it('should rank a participant below others (above count + 1)', async () => {
      repo.findOwnAggregate.mockResolvedValue({
        totalPoints: 120,
        achievementCount: 2,
        medalCount: 0,
        lastUpdated: new Date(),
      });
      repo.countRankedAbove.mockResolvedValue(2);

      const result = await service.getParticipantRanking(7);

      expect(result.globalRank).toBe(3);
    });

    it('should return globalRank 0 for a non-scoring participant', async () => {
      repo.findOwnAggregate.mockResolvedValue({
        totalPoints: 0,
        achievementCount: 0,
        medalCount: 0,
        lastUpdated: null,
      });

      const result = await service.getParticipantRanking(999);

      expect(result.globalRank).toBe(0);
      expect(result.totalPoints).toBe(0);
      // Not on the board at all — no need to ask how many are above them.
      expect(repo.countRankedAbove).not.toHaveBeenCalled();
    });
  });

  describe('getTopAchievers()', () => {
    it('should return achievers up to the requested limit with rank', async () => {
      repo.findTopAchievers.mockResolvedValue([
        makeParticipant(1, 100, 5),
        makeParticipant(2, 80, 3),
      ]);

      const result = await service.getTopAchievers(5);

      expect(repo.findTopAchievers).toHaveBeenCalledWith(5, undefined);
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
    });
  });

  describe('getLeaderboardWithPagination()', () => {
    it('pages the global board and reports the global total', async () => {
      repo.findGlobalTotals.mockResolvedValue([
        makeParticipant(1, 300),
        makeParticipant(2, 200),
        makeParticipant(3, 100),
      ]);
      repo.countGlobalBoard.mockResolvedValue(3);

      const result = await service.getLeaderboardWithPagination(2, 2);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].participantId).toBe(3);
      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });
      expect(repo.countEventBoard).not.toHaveBeenCalled();
    });

    it('counts against the EVENT board when scoped to an event', async () => {
      repo.findEventTotals.mockResolvedValue([makeParticipant(1, 10)]);
      repo.countEventBoard.mockResolvedValue(1);

      const result = await service.getLeaderboardWithPagination(1, 20, 42);

      expect(repo.countEventBoard).toHaveBeenCalledWith(42);
      expect(repo.countGlobalBoard).not.toHaveBeenCalled();
      expect(result.pagination.total).toBe(1);
    });
  });
});
