import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardsService } from './leaderboards.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

const makeParticipant = (id: number, totalPoints: number, achievementCount = 1, medalCount = 0) => ({
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

type DrizzleQueryBuilder = Record<string, jest.Mock> & {
  then: (resolve: (v: unknown) => void) => Promise<unknown>;
};

const buildMockDb = (resolveWith: unknown): { select: jest.Mock; _builder: DrizzleQueryBuilder } => {
  const builder = {} as DrizzleQueryBuilder;
  const chainedMethods = ['select', 'from', 'leftJoin', 'innerJoin', 'where', 'groupBy', 'orderBy', 'limit'];
  for (const method of chainedMethods) {
    builder[method] = jest.fn().mockReturnValue(builder);
  }
  builder.then = (resolve) => Promise.resolve(resolveWith).then(resolve);
  return { select: jest.fn().mockReturnValue(builder), _builder: builder };
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
      const { select } = buildMockDb(rawData);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LeaderboardsService,
          { provide: DRIZZLE, useValue: { select } },
        ],
      }).compile();

      service = module.get<LeaderboardsService>(LeaderboardsService);
    });

    it('should add 1-based rank to results in order', async () => {
      const result = await service.getGlobalLeaderboard();

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('should preserve the facade-provided ordering', async () => {
      const result = await service.getGlobalLeaderboard();

      expect(result[0].participantId).toBe(3);
    });
  });

  describe('getEventLeaderboard()', () => {
    beforeEach(async () => {
      const rawData = [makeParticipant(1, 150), makeParticipant(2, 75)];
      const { select } = buildMockDb(rawData);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LeaderboardsService,
          { provide: DRIZZLE, useValue: { select } },
        ],
      }).compile();

      service = module.get<LeaderboardsService>(LeaderboardsService);
    });

    it('should return ranked results for a specific event', async () => {
      const result = await service.getEventLeaderboard(42);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].participantId).toBe(1);
    });
  });

  describe('getParticipantRanking()', () => {
    beforeEach(async () => {
      const rawGlobal = [makeParticipant(5, 500), makeParticipant(10, 300)];
      const { select } = buildMockDb(rawGlobal);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LeaderboardsService,
          { provide: DRIZZLE, useValue: { select } },
        ],
      }).compile();

      service = module.get<LeaderboardsService>(LeaderboardsService);
    });

    it('should return globalRank for a known participant', async () => {
      const result = await service.getParticipantRanking(5);

      expect(result.participantId).toBe(5);
      expect(result.globalRank).toBe(1);
      expect(result.totalPoints).toBe(500);
    });

    it('should return globalRank 0 for an unknown participant', async () => {
      const result = await service.getParticipantRanking(999);

      expect(result.globalRank).toBe(0);
      expect(result.totalPoints).toBe(0);
    });
  });

  describe('getTopAchievers()', () => {
    beforeEach(async () => {
      const rawData = [makeParticipant(1, 100, 5), makeParticipant(2, 80, 3)];
      const { select } = buildMockDb(rawData);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LeaderboardsService,
          { provide: DRIZZLE, useValue: { select } },
        ],
      }).compile();

      service = module.get<LeaderboardsService>(LeaderboardsService);
    });

    it('should return achievers up to the requested limit with rank', async () => {
      const result = await service.getTopAchievers(5);

      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
    });
  });
});
