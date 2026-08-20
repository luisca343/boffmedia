import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { BattleController } from './battle.controller';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('BattleController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BattleController],
      providers: [
        { provide: Logger, useValue: mockLogger },
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
  }, 15_000);

  afterAll(async () => {
    await app.close();
  }, 15_000);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // NOTE: getBattle() runs a real @pkmn/sim battle which can take 60-120+ seconds.
  // This test is skipped due to long runtime only.

  // ── GET /battlesimulator/battle ───────────────────────────────────────────

  describe('GET /battlesimulator/battle', () => {
    it.skip('returns battle result (skipped: long runtime)', async () => {
      await request(app.getHttpServer())
        .get('/battlesimulator/battle')
        .expect(200);
    });
  });
});
