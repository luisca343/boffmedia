import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { SmartrotomController } from './smartrotom.controller';
import { SmartrotomService } from './smartrotom.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
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

const mockSmartrotomService = {
  getArceuspeak: jest.fn(),
  createOrUpdateArceuspeak: jest.fn(),
};

const mockWingullService = {
  getPerformance: jest.fn(),
  getTaxiStops: jest.fn(),
  teleportPlayer: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

describe('SmartrotomController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SmartrotomController],
      providers: [
        { provide: SmartrotomService, useValue: mockSmartrotomService },
        { provide: WingullFacadeService, useValue: mockWingullService },
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

    // These routes are no longer public: the identity that used to come from

    // the URL or the body is now taken from the authenticated principal.

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
    app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── GET /smartrotom/performance ───────────────────────────────────────────

  describe('GET /smartrotom/performance', () => {
    it('returns performance data', async () => {
      mockWingullService.getPerformance.mockResolvedValue({ tps: 20 });
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/performance',
      );

      expect(res.status).toBeLessThan(300);
      expect(mockWingullService.getPerformance).toHaveBeenCalled();
      expect(res.body.data).toMatchObject({ tps: 20 });
    });

    it('returns 500 when service throws', async () => {
      mockWingullService.getPerformance.mockRejectedValue(
        new Error('server error'),
      );
      await request(app.getHttpServer())
        .get('/smartrotom/performance')
        .expect(500);
    });
  });

  // ── GET /smartrotom/arceuspeak ────────────────────────────────────────────

  describe('GET /smartrotom/arceuspeak', () => {
    it('returns characters list', async () => {
      mockSmartrotomService.getArceuspeak.mockResolvedValue([
        { name: 'Arceus' },
      ]);
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/arceuspeak',
      );

      expect(res.status).toBeLessThan(300);
      expect(res.body.data).toHaveLength(1);
    });

    it('returns 500 when service throws', async () => {
      mockSmartrotomService.getArceuspeak.mockRejectedValue(
        new Error('db error'),
      );
      await request(app.getHttpServer())
        .get('/smartrotom/arceuspeak')
        .expect(500);
    });
  });

  // ── POST /smartrotom/arceuspeak ───────────────────────────────────────────

  describe('POST /smartrotom/arceuspeak', () => {
    const validBody = { name: 'Arceus', value: 'speak_value', format: 'text' };

    it('creates or updates character', async () => {
      mockSmartrotomService.createOrUpdateArceuspeak.mockResolvedValue({
        ok: true,
      });
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arceuspeak')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(
        mockSmartrotomService.createOrUpdateArceuspeak,
      ).toHaveBeenCalledWith('Arceus', 'speak_value', 'text');
    });

    it('rejects missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/arceuspeak')
        .send({ name: 'Arceus' })
        .expect(400);
    });
  });

  // ── GET /smartrotom/taxi/stops ────────────────────────────────────────────

  describe('GET /smartrotom/taxi/stops', () => {
    it('returns taxi stops', async () => {
      mockWingullService.getTaxiStops.mockResolvedValue([{ id: 'stop1' }]);
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/taxi/stops',
      );

      expect(res.status).toBeLessThan(300);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ── POST /smartrotom/taxi/teleport ────────────────────────────────────────

  describe('POST /smartrotom/taxi/teleport', () => {
    const validBody = { id: 'city_center', uuid: VALID_UUID };

    it('teleports player and returns success', async () => {
      mockWingullService.teleportPlayer.mockResolvedValue(true);
      const res = await request(app.getHttpServer())
        .post('/smartrotom/taxi/teleport')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockWingullService.teleportPlayer).toHaveBeenCalledWith(
        validBody.id,
        validBody.uuid,
      );
      expect(res.body.data).toMatchObject({ success: true });
    });

    it('rejects missing id', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/taxi/teleport')
        .send({ uuid: VALID_UUID })
        .expect(400);
    });

    it('rejects missing uuid', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/taxi/teleport')
        .send({ id: 'city_center' })
        .expect(400);
    });

    it('returns 500 when service throws', async () => {
      mockWingullService.teleportPlayer.mockRejectedValue(
        new Error('wingull error'),
      );
      await request(app.getHttpServer())
        .post('/smartrotom/taxi/teleport')
        .send(validBody)
        .expect(500);
    });
  });
});
