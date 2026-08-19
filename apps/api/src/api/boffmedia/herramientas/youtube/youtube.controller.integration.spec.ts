import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { YoutubeController } from './youtube.controller';
import { YoutubeFacadeService } from './youtube.facade.service';
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
  getTranscription: jest.fn(),
  getVideoInfo: jest.fn(),
};

describe('YoutubeController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [YoutubeController],
      providers: [
        { provide: YoutubeFacadeService, useValue: mockFacade },
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

  // ── GET /boffmedia/herramientas/youtube/transcription/:videoId ────────────

  describe('GET /boffmedia/herramientas/youtube/transcription/:videoId', () => {
    it('returns transcription for valid video id', async () => {
      mockFacade.getTranscription.mockResolvedValue({ text: 'Hello world' });
      const res = await request(app.getHttpServer()).get(
        '/boffmedia/herramientas/youtube/transcription/dQw4w9WgXcQ',
      );

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getTranscription).toHaveBeenCalledWith('dQw4w9WgXcQ');
      expect(res.body.data).toMatchObject({ text: 'Hello world' });
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getTranscription.mockRejectedValue(new Error('not available'));
      await request(app.getHttpServer())
        .get('/boffmedia/herramientas/youtube/transcription/badId')
        .expect(500);
    });
  });

  // ── GET /boffmedia/herramientas/youtube/video-info/:videoId ──────────────

  describe('GET /boffmedia/herramientas/youtube/video-info/:videoId', () => {
    it('returns video info for valid video id', async () => {
      mockFacade.getVideoInfo.mockResolvedValue({
        title: 'Test Video',
        duration: 300,
      });
      const res = await request(app.getHttpServer()).get(
        '/boffmedia/herramientas/youtube/video-info/dQw4w9WgXcQ',
      );

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getVideoInfo).toHaveBeenCalledWith('dQw4w9WgXcQ');
      expect(res.body.data).toMatchObject({ title: 'Test Video' });
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getVideoInfo.mockRejectedValue(new Error('fetch failed'));
      await request(app.getHttpServer())
        .get('/boffmedia/herramientas/youtube/video-info/badId')
        .expect(500);
    });
  });
});
