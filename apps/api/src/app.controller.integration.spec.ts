import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
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

const mockAppService = {
  getHealth: jest.fn(),
  getDBPort: jest.fn(),
  toggleLogging: jest.fn(),
  uploadFile: jest.fn(),
  blogicons: jest.fn(),
  steamKeys: jest.fn(),
  getSteamData: jest.fn(),
};

describe('AppController — integration (smoke tests)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: Logger, useValue: mockLogger },
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
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status object', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        connections: { database: true, wingullApi: true },
        memory: {
          rss: '100MB',
          heapTotal: '50MB',
          heapUsed: '30MB',
          external: '5MB',
        },
      };
      mockAppService.getHealth.mockResolvedValue(healthResponse);

      const res = await request(app.getHttpServer()).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should still return 200 when health check reports degraded state', async () => {
      const degraded = {
        status: 'ok',
        connections: { database: false, wingullApi: false },
      };
      mockAppService.getHealth.mockResolvedValue(degraded);

      const res = await request(app.getHttpServer()).get('/health');

      expect(res.status).toBe(200);
    });
  });
});
