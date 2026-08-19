import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { TwitchDebugController } from './twitch-debug.controller';
import { TwitchApiService } from './services/twitch-api.service';
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

const mockTwitchApi = {
  getStreamByUsername: jest.fn(),
};

const mockStream = {
  title: 'Playing Pixelmon Wingull 2 today!',
  game_name: 'Pixelmon Wingull 2',
  viewer_count: 42,
  tags: ['minecraft', 'wingull'],
};

describe('TwitchDebugController — integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TwitchDebugController],
      providers: [
        { provide: TwitchApiService, useValue: mockTwitchApi },
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

  describe('GET /automation/twitch/debug/check-user/:username', () => {
    it('should return live stream details when user is streaming', async () => {
      mockTwitchApi.getStreamByUsername.mockResolvedValue(mockStream);

      const res = await request(app.getHttpServer()).get(
        '/automation/twitch/debug/check-user/someuser',
      );

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('someuser');
      expect(res.body.isLive).toBe(true);
      expect(res.body.containsWingull).toBe(true);
      expect(res.body.streamDetails).toMatchObject({
        title: mockStream.title,
        game_name: mockStream.game_name,
        viewer_count: mockStream.viewer_count,
      });
      expect(res.body.wingullAnalysis.isPixelmonWingull2).toBe(true);
    });

    it('should return isLive false when user is not streaming', async () => {
      mockTwitchApi.getStreamByUsername.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        '/automation/twitch/debug/check-user/offlineuser',
      );

      expect(res.status).toBe(200);
      expect(res.body.isLive).toBe(false);
      expect(res.body.username).toBe('offlineuser');
    });

    it('should return containsWingull false when stream has no wingull content', async () => {
      mockTwitchApi.getStreamByUsername.mockResolvedValue({
        title: 'Playing Minecraft',
        game_name: 'Minecraft',
        viewer_count: 10,
        tags: ['minecraft'],
      });

      const res = await request(app.getHttpServer()).get(
        '/automation/twitch/debug/check-user/normalstreamer',
      );

      expect(res.status).toBe(200);
      expect(res.body.isLive).toBe(true);
      expect(res.body.containsWingull).toBe(false);
    });

    it('should return error object when TwitchApiService throws', async () => {
      mockTwitchApi.getStreamByUsername.mockRejectedValue(
        new Error('Twitch API unavailable'),
      );

      const res = await request(app.getHttpServer()).get(
        '/automation/twitch/debug/check-user/anyuser',
      );

      expect(res.status).toBe(200);
      expect(res.body.error).toBe('Twitch API unavailable');
      expect(res.body.username).toBe('anyuser');
    });

    it('should detect wingull in stream title', async () => {
      mockTwitchApi.getStreamByUsername.mockResolvedValue({
        title: 'wingull server stream',
        game_name: 'Minecraft',
        viewer_count: 5,
        tags: [],
      });

      const res = await request(app.getHttpServer()).get(
        '/automation/twitch/debug/check-user/titleuser',
      );

      expect(res.status).toBe(200);
      expect(res.body.containsWingull).toBe(true);
      expect(res.body.wingullAnalysis.inTitle).toBe(true);
    });
  });
});
