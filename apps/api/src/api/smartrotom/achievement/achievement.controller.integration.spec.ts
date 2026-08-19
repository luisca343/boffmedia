import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AchievementController } from './achievement.controller';
import { AchievementFacadeService } from './achievement.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const MOCK_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

const mockFacade: jest.Mocked<Partial<AchievementFacadeService>> = {
  getUserAchievements: jest.fn(),
  getUserAchievementById: jest.fn(),
  checkUserHasAchievement: jest.fn(),
  processBattleAchievement: jest.fn(),
  createReplay: jest.fn(),
  createUserReplay: jest.fn(),
  getUserReplay: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const MOCK_TEAM = [
  {
    dex: 777,
    nature: 'Serious',
    species: 'Togedemaru',
    form: '',
    palette: 'none',
    name: 'Togedemaru',
    level: 100,
    item: 'item.minecraft.air',
    ability: 'Lightning Rod',
    moves: ['Fake Out', 'Nuzzle', 'Thunderbolt', 'Spiky Shield'],
    ivs: [17, 10, 19, 30, 9, 23],
    evs: [252, 0, 3, 252, 3, 0],
    stats: [320, 211, 150, 178, 160, 220],
  },
];

const MOCK_REPLAY = '|player|p1|player:abc\n|win|Luisca343\n';

describe('AchievementController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementController],
      providers: [
        { provide: AchievementFacadeService, useValue: mockFacade },
        { provide: Reflector, useValue: new Reflector() },
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

    app = module.createNestApplication();

    // These routes are no longer public: the identity that used to come from

    // the URL or the body is now taken from the authenticated principal.

    // This suite covers the ValidationPipe and the exception filter, so it

    // runs as a signed-in caller.

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
    app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ==================== POST /smartrotom/achievement/get-achievements ====================

  // ── POST /smartrotom/achievement/get-achievements ──────────────────────
  describe('POST /smartrotom/achievement/get-achievements', () => {
    it('returns 201 and delegates to facade.getUserAchievements', async () => {
      (mockFacade.getUserAchievements! as jest.Mock).mockResolvedValue(
        [] as any,
      );

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/get-achievements')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getUserAchievements).toHaveBeenCalledWith(MOCK_UUID);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/get-achievements')
        .send({ uuid: 'bad-uuid' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/get-achievements')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/achievement/get-achievement-by-id ====================

  // ── POST /smartrotom/achievement/get-achievement-by-id ─────────────────
  describe('POST /smartrotom/achievement/get-achievement-by-id', () => {
    it('returns 201 and delegates to facade', async () => {
      (mockFacade.getUserAchievementById! as jest.Mock).mockResolvedValue({
        id: 1,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/get-achievement-by-id')
        .send({ uuid: MOCK_UUID, achievementId: 'medalla_denki' });

      expect(res.status).toBe(201);
      expect(mockFacade.getUserAchievementById).toHaveBeenCalledWith(
        MOCK_UUID,
        'medalla_denki',
      );
    });

    it('returns 400 when achievementId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/get-achievement-by-id')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/achievement/check-achievement ====================

  // ── POST /smartrotom/achievement/check-achievement ─────────────────────
  describe('POST /smartrotom/achievement/check-achievement', () => {
    it('returns 201 and delegates to facade', async () => {
      (mockFacade.checkUserHasAchievement! as jest.Mock).mockResolvedValue({
        completed: 1,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/check-achievement')
        .send({ uuid: MOCK_UUID, achievementId: 'medalla_denki' });

      expect(res.status).toBe(201);
      expect(mockFacade.checkUserHasAchievement).toHaveBeenCalledWith(
        MOCK_UUID,
        'medalla_denki',
      );
    });
  });

  // ==================== POST /smartrotom/achievement/battle-achievement ====================

  // ── POST /smartrotom/achievement/battle-achievement ────────────────────
  describe('POST /smartrotom/achievement/battle-achievement', () => {
    it('returns 201 when battle achievement is processed', async () => {
      (mockFacade.processBattleAchievement! as jest.Mock).mockResolvedValue({
        success: true,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/battle-achievement')
        .send({
          uuid: MOCK_UUID,
          logro: 'medalla_denki',
          name1: 'Luisca343',
          name2: 'Aquiles',
          team1: MOCK_TEAM,
          team2: MOCK_TEAM,
          replay: MOCK_REPLAY,
          victoria: true,
        });

      expect(res.status).toBe(201);
      expect(mockFacade.processBattleAchievement).toHaveBeenCalled();
    });

    it('returns 400 when uuid is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/battle-achievement')
        .send({
          uuid: 'not-a-uuid',
          logro: 'medalla_denki',
          name1: 'Luisca343',
          name2: 'Aquiles',
          team1: MOCK_TEAM,
          team2: MOCK_TEAM,
          replay: MOCK_REPLAY,
          victoria: true,
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when victoria is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/battle-achievement')
        .send({
          uuid: MOCK_UUID,
          logro: 'medalla_denki',
          name1: 'Luisca343',
          name2: 'Aquiles',
          team1: MOCK_TEAM,
          team2: MOCK_TEAM,
          replay: MOCK_REPLAY,
        });

      expect(res.status).toBe(400);
    });

    it('returns 201 with success:false when facade throws', async () => {
      (mockFacade.processBattleAchievement! as jest.Mock).mockRejectedValue(
        new Error('battle failed'),
      );

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/battle-achievement')
        .send({
          uuid: MOCK_UUID,
          logro: 'medalla_denki',
          name1: 'Luisca343',
          name2: 'Aquiles',
          team1: MOCK_TEAM,
          team2: MOCK_TEAM,
          replay: MOCK_REPLAY,
          victoria: false,
        });

      // Controller catches error internally and returns success:false
      expect(res.status).toBe(201);
      expect(mockFacade.processBattleAchievement).toHaveBeenCalled();
    });
  });

  // ==================== POST /smartrotom/achievement/create-replay ====================

  // ── POST /smartrotom/achievement/create-replay ─────────────────────────
  describe('POST /smartrotom/achievement/create-replay', () => {
    it('returns 201 and delegates to facade.createReplay', async () => {
      (mockFacade.createReplay! as jest.Mock).mockResolvedValue({
        insertId: 42,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/create-replay')
        .send({
          side1: 'Luisca343',
          side2: 'Aquiles',
          team1: '[{"species":"Togedemaru"}]',
          team2: '[{"species":"Ludicolo"}]',
          replay: MOCK_REPLAY,
          winner: 'Luisca343',
        });

      expect(res.status).toBe(201);
      expect(mockFacade.createReplay).toHaveBeenCalled();
    });

    it('returns 400 when side1 is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/create-replay')
        .send({
          side2: 'Aquiles',
          team1: '[{}]',
          team2: '[{}]',
          replay: MOCK_REPLAY,
          winner: 'Luisca343',
        });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/achievement/create-user-replay ====================

  // ── POST /smartrotom/achievement/create-user-replay ────────────────────
  describe('POST /smartrotom/achievement/create-user-replay', () => {
    it('returns 201 and delegates to facade.createUserReplay', async () => {
      (mockFacade.createUserReplay! as jest.Mock).mockResolvedValue({
        insertId: 99,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/create-user-replay')
        .send({ uuid: MOCK_UUID, replayId: 42, side: 1 });

      expect(res.status).toBe(201);
      expect(mockFacade.createUserReplay).toHaveBeenCalledWith(MOCK_UUID, 42);
    });

    it('returns 400 when replayId is below Min(1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/create-user-replay')
        .send({ uuid: MOCK_UUID, replayId: 0, side: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/create-user-replay')
        .send({ uuid: 'bad', replayId: 1, side: 1 });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/achievement/get-replay ====================

  // ── POST /smartrotom/achievement/get-replay ────────────────────────────
  describe('POST /smartrotom/achievement/get-replay', () => {
    it('returns 201 and delegates to facade.getUserReplay', async () => {
      (mockFacade.getUserReplay! as jest.Mock).mockResolvedValue({
        id: 42,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/get-replay')
        .send({ uuid: MOCK_UUID, replayId: 42 });

      expect(res.status).toBe(201);
      expect(mockFacade.getUserReplay).toHaveBeenCalledWith(MOCK_UUID, 42);
    });

    it('returns 400 when replayId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/achievement/get-replay')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });
});
