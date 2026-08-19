import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { PokemonLogController } from './pokemon-log.controller';
import { PokemonLogService } from './pokemon-log.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockService = {
  processShowdownLogs: jest.fn(),
};

describe('PokemonLogController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PokemonLogController],
      providers: [{ provide: PokemonLogService, useValue: mockService }],
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── GET /pokemon-log/process/:spreadsheetId ───────────────────────────────

  describe('GET /pokemon-log/process/:spreadsheetId', () => {
    it('processes logs and returns summary', async () => {
      mockService.processShowdownLogs.mockResolvedValue({
        processed: 5,
        errors: 0,
      });
      const res = await request(app.getHttpServer()).get(
        '/pokemon-log/process/sheet123',
      );

      expect(res.status).toBeLessThan(300);
      expect(mockService.processShowdownLogs).toHaveBeenCalledWith('sheet123');
      expect(res.body).toMatchObject({ processed: 5, errors: 0 });
      expect(res.body.message).toContain('5 logs processed');
    });

    it('returns 500 when service throws', async () => {
      mockService.processShowdownLogs.mockRejectedValue(
        new Error('sheet error'),
      );
      await request(app.getHttpServer())
        .get('/pokemon-log/process/badsheet')
        .expect(500);
    });
  });
});
