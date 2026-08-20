import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { MineController } from './mine.controller';
import { MineFacadeService } from './mine.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  getPlayerEnergy: jest.fn(),
  playGame: jest.fn(),
  endGame: jest.fn(),
  getAllRewards: jest.fn(),
  getRewardsByType: jest.fn(),
  getRewardDropRates: jest.fn(),
  getPlayerHistory: jest.fn(),
  getPlayerRanking: jest.fn(),
  getPlayerRank: jest.fn(),
  getUnclaimedRewards: jest.fn(),
  claimRewards: jest.fn(),
  getPlayerStatistics: jest.fn(),
  validatePlayerExists: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

describe('MineController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MineController],
      providers: [
        { provide: MineFacadeService, useValue: mockFacade },
        ResponseInterceptor,
        Reflector,
      ],
    })
      // Guards are stubbed: this suite is about validation and error
      // shape, not about who may call the route.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GameOrUserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();

    // These routes are not public: the identity that would otherwise come from

    // the URL or the body is taken from the authenticated principal.

    // This suite covers the ValidationPipe and the exception filter, so it

    // runs as a signed-in caller; the guards themselves are unit-tested.

    app.use((req: any, _res: any, next: any) => {
      req.user = {
        userId: 1,

        username: 'tester',

        roles: ['BOFF_ADMIN', 'ROTOM_ADMIN'],

        mcUuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      };

      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── GET /smartrotom/mine/energy/:uuid ────────────────────────────────────

  describe('GET /smartrotom/mine/energy/:uuid', () => {
    it('returns 200 and delegates to facade.getPlayerEnergy', async () => {
      mockFacade.getPlayerEnergy.mockResolvedValue({
        energy: 100,
        maxEnergy: 100,
      });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/mine/energy/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerEnergy).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /smartrotom/mine/play — PlayGameDto ──────────────────────────────

  describe('POST /smartrotom/mine/play — PlayGameDto validation', () => {
    it('returns 201 and calls facade.playGame when body is valid', async () => {
      mockFacade.playGame.mockResolvedValue({ gameId: 'abc123', rewards: [] });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/play')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.playGame).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID }),
      );
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/play')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/play')
        .send({ uuid: 'invalid-uuid' });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /smartrotom/mine/endgame — EndGameDto ────────────────────────────

  describe('POST /smartrotom/mine/endgame — EndGameDto validation', () => {
    const VALID_ENDGAME = {
      uuid: VALID_UUID,
      rewards: [{ id: 1, value: 100 }],
    };

    it('returns 201 and calls facade.endGame when body is valid', async () => {
      mockFacade.endGame.mockResolvedValue({ claimed: 1, totalValue: 100 });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/endgame')
        .send(VALID_ENDGAME);

      expect(res.status).toBe(201);
      expect(mockFacade.endGame).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID }),
      );
    });

    it('returns 400 when rewards array is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/endgame')
        .send({ uuid: VALID_UUID });
      expect(res.status).toBe(400);
    });

    it('returns 400 when reward id is below minimum (Min 1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/endgame')
        .send({ ...VALID_ENDGAME, rewards: [{ id: 0, value: 100 }] });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /smartrotom/mine/rewards ─────────────────────────────────────────

  describe('GET /smartrotom/mine/rewards', () => {
    it('returns 200 and delegates to facade.getAllRewards', async () => {
      mockFacade.getAllRewards.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/mine/rewards',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAllRewards).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/mine/rewardsbytype ───────────────────────────────────

  describe('GET /smartrotom/mine/rewardsbytype', () => {
    it('returns 200 and delegates to facade.getRewardsByType', async () => {
      mockFacade.getRewardsByType.mockResolvedValue({});

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/mine/rewardsbytype',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getRewardsByType).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/mine/rewards/droprates ───────────────────────────────

  describe('GET /smartrotom/mine/rewards/droprates', () => {
    it('returns 200 and delegates to facade.getRewardDropRates', async () => {
      mockFacade.getRewardDropRates.mockResolvedValue({});

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/mine/rewards/droprates',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getRewardDropRates).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/mine/history/:uuid ───────────────────────────────────

  describe('GET /smartrotom/mine/history/:uuid', () => {
    it('returns 200 and delegates to facade.getPlayerHistory', async () => {
      mockFacade.getPlayerHistory.mockResolvedValue({});

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/mine/history/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerHistory).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── GET /smartrotom/mine/ranking ─────────────────────────────────────────

  describe('GET /smartrotom/mine/ranking', () => {
    it('returns 200 and delegates to facade.getPlayerRanking', async () => {
      mockFacade.getPlayerRanking.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/mine/ranking',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerRanking).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/mine/rank/:uuid ─────────────────────────────────────

  describe('GET /smartrotom/mine/rank/:uuid', () => {
    it('returns 200 and delegates to facade.getPlayerRank', async () => {
      mockFacade.getPlayerRank.mockResolvedValue({
        rank: 1,
        totalValue: 25100,
      });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/mine/rank/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerRank).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── GET /smartrotom/mine/unclaimed/:uuid ─────────────────────────────────

  describe('GET /smartrotom/mine/unclaimed/:uuid', () => {
    it('returns 200 and delegates to facade.getUnclaimedRewards', async () => {
      mockFacade.getUnclaimedRewards.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/mine/unclaimed/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUnclaimedRewards).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /smartrotom/mine/claim — ClaimRewardsDto ────────────────────────

  describe('POST /smartrotom/mine/claim — ClaimRewardsDto validation', () => {
    it('returns 201 and calls facade.claimRewards when body is valid', async () => {
      mockFacade.claimRewards.mockResolvedValue({ claimed: 5 });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/claim')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.claimRewards).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID }),
      );
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/claim')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── GET /smartrotom/mine/stats/:uuid ─────────────────────────────────────

  describe('GET /smartrotom/mine/stats/:uuid', () => {
    it('returns 200 and delegates to facade.getPlayerStatistics', async () => {
      mockFacade.getPlayerStatistics.mockResolvedValue({ gamesPlayed: 10 });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/mine/stats/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerStatistics).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── GET /smartrotom/mine/validate/player/:uuid ───────────────────────────

  describe('GET /smartrotom/mine/validate/player/:uuid', () => {
    it('returns 200 and returns exists flag from facade', async () => {
      mockFacade.validatePlayerExists.mockResolvedValue(true);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/mine/validate/player/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.validatePlayerExists).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/mine/play')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
