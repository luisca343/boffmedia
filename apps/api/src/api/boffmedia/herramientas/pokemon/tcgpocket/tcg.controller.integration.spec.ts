import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { TcgController } from './tcg.controller';
import { TcgFacadeService } from './tcg.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';
import { DesktopOrUserAuthGuard } from '@api/packs/guards/desktop-or-user-auth.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  // nestjs-pino Logger interface
  assign: jest.fn(),
  fatal: jest.fn(),
  info: jest.fn(),
  trace: jest.fn(),
};

const mockFacade = {
  getAllSeries: jest.fn(),
  getSetsForSeriesFromDb: jest.fn(),
  getCardsForSetFromDb: jest.fn(),
  getCardById: jest.fn(),
  fetchAndStoreSeries: jest.fn(),
  fetchSetsForSeries: jest.fn(),
  fetchSetsForSeriesBothLanguages: jest.fn(),
  fetchAndStoreCardsForSet: jest.fn(),
  fetchAndStoreCardsForSetBothLanguages: jest.fn(),
  getUserCards: jest.fn(),
  addUserCard: jest.fn(),
  updateUserCardQuantity: jest.fn(),
  removeUserCard: jest.fn(),
  getUserCardHistory: jest.fn(),
  migrateOldUserCards: jest.fn(),
  getSyncStatus: jest.fn(),
  runSync: jest.fn(),
};

describe('TcgController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TcgController],
      providers: [
        { provide: TcgFacadeService, useValue: mockFacade },
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
      // The collection routes accept a website OR a desktop session; which one
      // is which is the guard's own suite, not this one's.
      .overrideGuard(DesktopOrUserAuthGuard)
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

  // ── GET /tools/ptcgp/series ──────────────────────────────────────────────

  describe('GET /tools/ptcgp/series', () => {
    it('returns 200 and delegates to facade.getAllSeries', async () => {
      mockFacade.getAllSeries.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/tools/ptcgp/series');

      expect(res.status).toBe(200);
      expect(mockFacade.getAllSeries).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /tools/ptcgp/series/:seriesId/sets ───────────────────────────────

  describe('GET /tools/ptcgp/series/:seriesId/sets', () => {
    it('returns 200 and passes seriesId to facade.getSetsForSeriesFromDb', async () => {
      mockFacade.getSetsForSeriesFromDb.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/series/tcgp/sets',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getSetsForSeriesFromDb).toHaveBeenCalledWith('tcgp');
    });

    it('accepts optional locale query param', async () => {
      mockFacade.getSetsForSeriesFromDb.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/series/tcgp/sets?locale=es',
      );

      expect(res.status).toBe(200);
    });
  });

  // ── GET /tools/ptcgp/sets/:setId/cards ──────────────────────────────────

  describe('GET /tools/ptcgp/sets/:setId/cards', () => {
    it('returns 200 and passes setId to facade.getCardsForSetFromDb', async () => {
      mockFacade.getCardsForSetFromDb.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/sets/A1/cards',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getCardsForSetFromDb).toHaveBeenCalledWith('A1');
    });
  });

  // ── GET /tools/ptcgp/cards/:cardId ──────────────────────────────────────

  describe('GET /tools/ptcgp/cards/:cardId', () => {
    it('returns 200 and passes cardId to facade.getCardById', async () => {
      mockFacade.getCardById.mockResolvedValue({
        id: 'tcgp-A1-001',
        name: 'Bulbasaur',
      });

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/cards/tcgp-A1-001',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getCardById).toHaveBeenCalledWith('tcgp-A1-001');
    });
  });

  // ── GET /tools/ptcgp/fetch/series ───────────────────────────────────────

  describe('GET /tools/ptcgp/fetch/series', () => {
    it('returns 200 and delegates to facade.fetchAndStoreSeries', async () => {
      mockFacade.fetchAndStoreSeries.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/fetch/series',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.fetchAndStoreSeries).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /tools/ptcgp/fetch/series/:seriesId/sets ─────────────────────────

  describe('GET /tools/ptcgp/fetch/series/:seriesId/sets', () => {
    it('returns 200 and passes seriesId and locale to facade', async () => {
      mockFacade.fetchSetsForSeries.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/fetch/series/tcgp/sets?locale=en',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.fetchSetsForSeries).toHaveBeenCalledWith('tcgp', 'en');
    });
  });

  // ── GET /tools/ptcgp/fetch/sets/:setId/cards ────────────────────────────

  describe('GET /tools/ptcgp/fetch/sets/:setId/cards', () => {
    it('returns 200 and delegates to facade.fetchAndStoreCardsForSet', async () => {
      mockFacade.fetchAndStoreCardsForSet.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/fetch/sets/A1/cards?locale=en',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.fetchAndStoreCardsForSet).toHaveBeenCalledWith(
        'A1',
        'en',
      );
    });
  });

  // ── GET /tools/ptcgp/users/:userName/cards ──────────────────────────────

  describe('GET /tools/ptcgp/users/:userName/cards', () => {
    it('returns 200 and passes userName to facade.getUserCards', async () => {
      mockFacade.getUserCards.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/users/testuser/cards',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserCards).toHaveBeenCalledWith('testuser');
    });
  });

  // ── POST /tools/ptcgp/users/cards — AddUserCardDto ──────────────────────

  describe('POST /tools/ptcgp/users/cards — AddUserCardDto validation', () => {
    const VALID_BODY = { userId: 1, cardId: 'tcgp-A1-001', quantity: 2 };

    it('returns 201 and calls facade.addUserCard when body is valid', async () => {
      mockFacade.addUserCard.mockResolvedValue({ id: 1, ...VALID_BODY });

      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/users/cards')
        .send(VALID_BODY);

      expect(res.status).toBe(201);
      expect(mockFacade.addUserCard).toHaveBeenCalledWith(
        expect.objectContaining(VALID_BODY),
      );
    });

    it('returns 400 when userId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/users/cards')
        .send({ cardId: 'tcgp-A1-001', quantity: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when userId is not a positive number', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/users/cards')
        .send({ userId: 0, cardId: 'tcgp-A1-001', quantity: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when cardId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/users/cards')
        .send({ userId: 1, quantity: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when quantity is not positive (IsPositive violated)', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/users/cards')
        .send({ userId: 1, cardId: 'tcgp-A1-001', quantity: 0 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/users/cards')
        .send({ ...VALID_BODY, extra: 'field' });

      expect(res.status).toBe(400);
    });
  });

  // ── PUT /tools/ptcgp/users/:userId/cards/:cardId — UpdateUserCardQuantityDto

  describe('PUT /tools/ptcgp/users/:userId/cards/:cardId — UpdateUserCardQuantityDto validation', () => {
    it('returns 200 and calls facade.updateUserCardQuantity when body is valid', async () => {
      mockFacade.updateUserCardQuantity.mockResolvedValue({ quantity: 3 });

      const res = await request(app.getHttpServer())
        .put('/tools/ptcgp/users/1/cards/tcgp-A1-001')
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(mockFacade.updateUserCardQuantity).toHaveBeenCalledWith(
        1,
        'tcgp-A1-001',
        expect.objectContaining({ quantity: 3 }),
      );
    });

    it('returns 400 when quantity is negative (Min 0 violated)', async () => {
      const res = await request(app.getHttpServer())
        .put('/tools/ptcgp/users/1/cards/tcgp-A1-001')
        .send({ quantity: -1 });

      expect(res.status).toBe(400);
    });

    it('accepts quantity of 0 (removes card)', async () => {
      mockFacade.updateUserCardQuantity.mockResolvedValue({ quantity: 0 });

      const res = await request(app.getHttpServer())
        .put('/tools/ptcgp/users/1/cards/tcgp-A1-001')
        .send({ quantity: 0 });

      expect(res.status).toBe(200);
    });
  });

  // ── DELETE /tools/ptcgp/users/:userId/cards/:cardId ─────────────────────

  describe('DELETE /tools/ptcgp/users/:userId/cards/:cardId', () => {
    it('returns 200 and calls facade.removeUserCard with userId and cardId', async () => {
      mockFacade.removeUserCard.mockResolvedValue({ deleted: true });

      const res = await request(app.getHttpServer()).delete(
        '/tools/ptcgp/users/1/cards/tcgp-A1-001',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.removeUserCard).toHaveBeenCalledWith(1, 'tcgp-A1-001');
    });
  });

  // ── GET /tools/ptcgp/users/:userId/cards/history ────────────────────────

  describe('GET /tools/ptcgp/users/:userId/cards/history', () => {
    it('returns 200 and uses authenticated user id, ignoring path parameter', async () => {
      mockFacade.getUserCardHistory.mockResolvedValue([]);

      // Note: path parameter is 42, but authenticated user id is 1 (from test middleware)
      // The endpoint should use the authenticated user's id, not the path parameter
      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/users/42/cards/history',
      );

      expect(res.status).toBe(200);
      // Should call with authenticated user id (1), not the path parameter (42)
      expect(mockFacade.getUserCardHistory).toHaveBeenCalledWith(1);
    });
  });

  // -- Row shape: Drizzle camelCase vs merged snake_case --------------------

  describe('row shape tolerance', () => {
    // The repository hands back Drizzle rows (schema property names) while the
    // fetch/merge services build the external API's snake_case. Reading one
    // convention silently produced `undefined`, which JSON.stringify DROPS - so
    // the field vanished from the payload rather than erroring anywhere.

    it('keeps setId and localId when the row uses Drizzle property names', async () => {
      mockFacade.getCardsForSetFromDb.mockResolvedValue([
        {
          id: 'P-A-001',
          setId: 'P-A',
          localId: '001',
          name_es: 'Poción',
          name_en: 'Potion',
          image_es: '/boffmedia/tools/tcg/cards/P-A/P-A-001_es.webp',
          set_name_es: 'Promo-A',
        },
      ]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/sets/P-A/cards?locale=es',
      );

      expect(res.status).toBe(200);
      // Without these the client builds its artwork URL as /cards/undefined/...
      expect(res.body[0].setId).toBe('P-A');
      expect(res.body[0].localId).toBe('001');
      expect(res.body[0].image).toBe(
        '/boffmedia/tools/tcg/cards/P-A/P-A-001_es.webp',
      );
    });

    it('still reads a row that uses the merged snake_case shape', async () => {
      mockFacade.getCardsForSetFromDb.mockResolvedValue([
        { id: 'A1-001', set_id: 'A1', local_id: '001', name_en: 'Bulbasaur' },
      ]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/sets/A1/cards',
      );

      expect(res.body[0].setId).toBe('A1');
      expect(res.body[0].localId).toBe('001');
    });

    it('returns a card that has no artwork instead of a null hole in the array', async () => {
      // tcgdex publishes no image for many promos; those cards must still list.
      mockFacade.getCardsForSetFromDb.mockResolvedValue([
        { id: 'P-A-074', setId: 'P-A', localId: '074', name_es: 'Horsea' },
      ]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/sets/P-A/cards?locale=es',
      );

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).not.toBeNull();
      expect(res.body[0].id).toBe('P-A-074');
    });

    it('gives a set its name and card counts from a Drizzle row', async () => {
      mockFacade.getSetsForSeriesFromDb.mockResolvedValue([
        {
          id: 'A1',
          nameEs: 'Genes Formidables',
          nameEn: 'Genetic Apex',
          logo: 'https://assets.tcgdex.net/en/tcgp/A1/logo',
          symbol: null,
          cardCountOfficial: 226,
          cardCountTotal: 286,
        },
      ]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/series/tcgp/sets?locale=es',
      );

      // This endpoint used to answer {id, logo, symbol} and nothing else.
      expect(res.body[0]).toEqual(
        expect.objectContaining({
          id: 'A1',
          name: 'Genes Formidables',
          cardCountOfficial: 226,
          cardCountTotal: 286,
        }),
      );
    });

    it('falls back to the English set name when the locale has none', async () => {
      mockFacade.getSetsForSeriesFromDb.mockResolvedValue([
        { id: 'A1', nameEn: 'Genetic Apex', nameEs: '', cardCountTotal: 286 },
      ]);

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/series/tcgp/sets?locale=es',
      );

      expect(res.body[0].name).toBe('Genetic Apex');
    });
  });

  // -- Selective sync (admin) ----------------------------------------------

  describe('GET /tools/ptcgp/admin/sync/status', () => {
    it('returns 200 and passes the series through', async () => {
      mockFacade.getSyncStatus.mockResolvedValue({ seriesId: 'tcgp', sets: [] });

      const res = await request(app.getHttpServer()).get(
        '/tools/ptcgp/admin/sync/status?seriesId=tcgp',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getSyncStatus).toHaveBeenCalledWith('tcgp');
    });
  });

  describe('POST /tools/ptcgp/admin/sync/stream', () => {
    it('streams one SSE frame per event and forwards the selection', async () => {
      mockFacade.runSync.mockImplementation(async function* () {
        yield { type: 'start', seriesId: 'tcgp', stages: ['cards'], sets: [] };
        yield {
          type: 'done',
          cancelled: false,
          durationMs: 5,
          counts: { downloaded: 1, updated: 0, skipped: 0, failed: 0 },
          failures: [],
        };
      });

      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/admin/sync/stream')
        .send({ seriesId: 'tcgp', cards: true, images: false, setIds: ['A1'] });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(res.text).toContain('data: {"type":"start"');
      expect(res.text).toContain('"type":"done"');
      expect(mockFacade.runSync).toHaveBeenCalledWith(
        expect.objectContaining({ cards: true, images: false, setIds: ['A1'] }),
        expect.any(Function),
      );
    });

    it('rejects a malformed selection before any fetching starts', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/admin/sync/stream')
        .send({ cards: 'yes', setIds: 'A1' });

      expect(res.status).toBe(400);
      expect(mockFacade.runSync).not.toHaveBeenCalled();
    });
  });

  // -- GlobalExceptionFilter - error shape contract -------------------------

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/ptcgp/users/cards')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
