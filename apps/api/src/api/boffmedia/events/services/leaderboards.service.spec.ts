import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardsService } from './leaderboards.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

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
 * Minimal Drizzle stub. Each awaited query consumes the next queued result set
 * (the last one repeats); chained builder methods return the builder, `.as()`
 * returns a subquery placeholder, and `.then` resolves the query.
 */
const buildMockDb = (...resultSets: unknown[]): { select: jest.Mock } => {
  const queue = [...resultSets];
  const nextResult = () => (queue.length > 1 ? queue.shift() : queue[0]);

  const makeBuilder = () => {
    const builder: Record<string, unknown> = {};
    const chained = [
      'from',
      'leftJoin',
      'innerJoin',
      'where',
      'groupBy',
      'orderBy',
      'limit',
    ];
    for (const method of chained) {
      builder[method] = jest.fn().mockReturnValue(builder);
    }
    // Subquery placeholder: real code reads column refs off it inside sql``.
    builder.as = jest.fn().mockReturnValue({});
    builder.then = (resolve: (v: unknown) => void) =>
      Promise.resolve(nextResult()).then(resolve);
    return builder;
  };

  return { select: jest.fn().mockImplementation(() => makeBuilder()) };
};

const makeService = async (select: jest.Mock) => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      LeaderboardsService,
      { provide: DRIZZLE, useValue: { select } },
    ],
  }).compile();
  return module.get<LeaderboardsService>(LeaderboardsService);
};

describe('LeaderboardsService', () => {
  let service: LeaderboardsService;

  describe('getGlobalLeaderboard()', () => {
    beforeEach(async () => {
      const rawData = [
        makeParticipant(3, 300),
        makeParticipant(1, 200),
        makeParticipant(2, 100),
      ];
      service = await makeService(buildMockDb(rawData).select);
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
    beforeEach(async () => {
      const rawData = [makeParticipant(1, 150), makeParticipant(2, 75)];
      service = await makeService(buildMockDb(rawData).select);
    });

    it('should return ranked results for a specific event', async () => {
      const result = await service.getEventLeaderboard(42);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].participantId).toBe(1);
    });
  });

  describe('getParticipantRanking()', () => {
    it('should derive globalRank from the count of participants above', async () => {
      // own aggregate, then the count of participants ranked strictly above.
      const own = [
        {
          totalPoints: 500,
          achievementCount: 3,
          medalCount: 1,
          lastUpdated: new Date(),
        },
      ];
      const above = [{ count: 0 }];
      service = await makeService(buildMockDb(own, above).select);

      const result = await service.getParticipantRanking(5);

      expect(result.participantId).toBe(5);
      expect(result.globalRank).toBe(1);
      expect(result.totalPoints).toBe(500);
      expect(result.achievementCount).toBe(3);
      expect(result.medalCount).toBe(1);
    });

    it('should rank a participant below others (above count + 1)', async () => {
      const own = [
        {
          totalPoints: 120,
          achievementCount: 2,
          medalCount: 0,
          lastUpdated: new Date(),
        },
      ];
      const above = [{ count: 2 }];
      service = await makeService(buildMockDb(own, above).select);

      const result = await service.getParticipantRanking(7);

      expect(result.globalRank).toBe(3);
    });

    it('should return globalRank 0 for a non-scoring participant', async () => {
      const own = [
        {
          totalPoints: 0,
          achievementCount: 0,
          medalCount: 0,
          lastUpdated: null,
        },
      ];
      service = await makeService(buildMockDb(own).select);

      const result = await service.getParticipantRanking(999);

      expect(result.globalRank).toBe(0);
      expect(result.totalPoints).toBe(0);
    });
  });

  describe('getTopAchievers()', () => {
    beforeEach(async () => {
      const rawData = [makeParticipant(1, 100, 5), makeParticipant(2, 80, 3)];
      service = await makeService(buildMockDb(rawData).select);
    });

    it('should return achievers up to the requested limit with rank', async () => {
      const result = await service.getTopAchievers(5);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
    });
  });
});
