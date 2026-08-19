import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { SharexController } from './sharex.controller';
import { SharexService } from './sharex.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const mockService: jest.Mocked<Partial<SharexService>> = {
  createImage: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('SharexController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharexController],
      providers: [{ provide: SharexService, useValue: mockService }],
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
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ── POST /sharex ──────────────────────────────────────────────────────────

  describe('POST /sharex', () => {
    it('returns 400 when no file is uploaded', async () => {
      const res = await request(app.getHttpServer())
        .post('/sharex')
        .field('key', 'secret-key');

      expect(res.status).toBe(400);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    it('returns 400 when key is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/sharex')
        .attach('file', Buffer.from('fake image'), 'screenshot-1234567890.png');

      expect(res.status).toBe(400);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    it('returns 200 when file and key are provided', async () => {
      (mockService.createImage! as jest.Mock).mockImplementation(() => {});

      const res = await request(app.getHttpServer())
        .post('/sharex')
        .attach('file', Buffer.from('fake image'), 'myapp-1234567890.png')
        .field('key', 'valid-api-key');

      expect(res.status).toBe(201);
      expect(mockService.createImage).toHaveBeenCalled();
      expect(res.body.file).toBeDefined();
    });
  });
});
