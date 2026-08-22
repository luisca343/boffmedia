import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { MangaController } from './manga.controller';
import { MangaFacadeService } from './manga.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  search: jest.fn(),
  getDetail: jest.fn(),
  getLocalChapters: jest.fn(),
  streamDownloadChapters: jest.fn(),
};

describe('MangaController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MangaController],
      providers: [
        { provide: MangaFacadeService, useValue: mockFacade },
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
      .overrideGuard(UserThrottlerGuard)
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
    app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── GET /boffmedia/herramientas/manga/search ──────────────────────────────

  describe('GET /boffmedia/herramientas/manga/search', () => {
    it('returns search results for query', async () => {
      mockFacade.search.mockResolvedValue({ results: [{ title: 'Manga 1' }] });
      const res = await request(app.getHttpServer())
        .get('/boffmedia/herramientas/manga/search')
        .query({ q: 'raeliana' });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.search).toHaveBeenCalledWith('raeliana');
      expect(res.body.data).toMatchObject({ results: expect.any(Array) });
    });

    it('returns empty results with no query', async () => {
      mockFacade.search.mockResolvedValue({ results: [] });
      const res = await request(app.getHttpServer()).get(
        '/boffmedia/herramientas/manga/search',
      );

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.search).toHaveBeenCalledWith('');
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.search.mockRejectedValue(new Error('scraper error'));
      await request(app.getHttpServer())
        .get('/boffmedia/herramientas/manga/search')
        .query({ q: 'naruto' })
        .expect(500);
    });
  });

  // ── GET /boffmedia/herramientas/manga/detail ──────────────────────────────

  describe('GET /boffmedia/herramientas/manga/detail', () => {
    it('returns manga detail for url', async () => {
      mockFacade.getDetail.mockResolvedValue({
        title: 'Test Manga',
        chapters: [],
      });
      const res = await request(app.getHttpServer())
        .get('/boffmedia/herramientas/manga/detail')
        .query({ url: 'https://example.com/manga/test' });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getDetail).toHaveBeenCalledWith(
        'https://example.com/manga/test',
      );
      expect(res.body.data).toMatchObject({ title: 'Test Manga' });
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getDetail.mockRejectedValue(new Error('not found'));
      await request(app.getHttpServer())
        .get('/boffmedia/herramientas/manga/detail')
        .query({ url: 'https://bad.url' })
        .expect(500);
    });
  });

  // ── GET /boffmedia/herramientas/manga/local ───────────────────────────────

  describe('GET /boffmedia/herramientas/manga/local', () => {
    it('returns local chapters for series', async () => {
      mockFacade.getLocalChapters.mockResolvedValue({
        series: 'Test',
        chapters: ['ch1.cbz'],
      });
      const res = await request(app.getHttpServer())
        .get('/boffmedia/herramientas/manga/local')
        .query({ series: 'TestManga' });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getLocalChapters).toHaveBeenCalledWith('TestManga');
      expect(res.body.data).toMatchObject({ series: 'Test' });
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getLocalChapters.mockRejectedValue(new Error('fs error'));
      await request(app.getHttpServer())
        .get('/boffmedia/herramientas/manga/local')
        .query({ series: 'BadSeries' })
        .expect(500);
    });
  });

  // ── POST /boffmedia/herramientas/manga/download/stream ────────────────────
  // This endpoint uses @Res() SSE streaming — test that ValidationPipe rejects bad body

  describe('POST /boffmedia/herramientas/manga/download/stream', () => {
    it('rejects body missing seriesName', async () => {
      await request(app.getHttpServer())
        .post('/boffmedia/herramientas/manga/download/stream')
        .send({ chapters: [] })
        .expect(400);
    });

    it('rejects body missing chapters', async () => {
      await request(app.getHttpServer())
        .post('/boffmedia/herramientas/manga/download/stream')
        .send({ seriesName: 'TestManga' })
        .expect(400);
    });

    it('streams SSE events for valid body', async () => {
      async function* fakeGen() {
        yield 'data: {"type":"start"}\n\n';
        yield 'data: {"type":"done"}\n\n';
      }
      mockFacade.streamDownloadChapters.mockReturnValue(fakeGen());

      const res = await request(app.getHttpServer())
        .post('/boffmedia/herramientas/manga/download/stream')
        .send({ seriesName: 'TestManga', chapters: [] });

      expect(res.status).toBeLessThan(300);
      expect(res.headers['content-type']).toMatch(/text\/event-stream/);
      expect(mockFacade.streamDownloadChapters).toHaveBeenCalled();
    });
  });
});
