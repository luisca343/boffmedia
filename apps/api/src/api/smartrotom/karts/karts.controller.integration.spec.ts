import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { KartsController } from './karts.controller';
import { KartsService } from './karts.service';
import { GameServerAuthGuard } from '@api/_utils/guards/game-server-auth.guard';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockService = {
  saveRace: jest.fn(),
  getRanking: jest.fn(),
  getPlayerStats: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const SERVER_UUID = '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365';

/** The body the mod actually sends. */
const VALID_RACE = {
  server: SERVER_UUID,
  circuito: 'Rainbow Road',
  modo: 'clasica',
  vueltas: 3,
  fecha: 1737200000000,
  participantes: [
    {
      uuid: VALID_UUID,
      nombre: 'Ana',
      posicion: 1,
      tiempoMs: 90500,
      mejorVueltaMs: 29800,
      vueltasCompletadas: 3,
      dnf: false,
    },
  ],
};

describe('KartsController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [KartsController],
      providers: [
        { provide: KartsService, useValue: mockService },
        ResponseInterceptor,
        Reflector,
      ],
    })
      .overrideGuard(GameServerAuthGuard)
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

  // ── POST /smartrotom/karts/carrera — SaveRaceDto ─────────────────────────

  describe('POST /smartrotom/karts/carrera', () => {
    it('returns 200 and delegates the full mod body to the service', async () => {
      mockService.saveRace.mockResolvedValue({ saved: true, id: 42 });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/karts/carrera')
        .send(VALID_RACE);

      expect(res.status).toBe(200);
      expect(mockService.saveRace).toHaveBeenCalledWith(
        expect.objectContaining({
          circuito: 'Rainbow Road',
          modo: 'clasica',
          vueltas: 3,
          participantes: [
            expect.objectContaining({ nombre: 'Ana', tiempoMs: 90500 }),
          ],
        }),
      );
    });

    // The one the validators are most likely to get wrong: -1 is a sentinel, so
    // @Min(-1) / a signed column, never @IsPositive.
    it('accepts a DNF participant with tiempoMs and mejorVueltaMs of -1', async () => {
      mockService.saveRace.mockResolvedValue({ saved: true, id: 43 });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/karts/carrera')
        .send({
          ...VALID_RACE,
          participantes: [
            {
              uuid: VALID_UUID,
              nombre: 'Beto',
              posicion: 4,
              tiempoMs: -1,
              mejorVueltaMs: -1,
              vueltasCompletadas: 0,
              dnf: true,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(mockService.saveRace).toHaveBeenCalled();
    });

    it('returns 400 on an empty body before reaching the service', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/karts/carrera')
        .send({});

      expect(res.status).toBe(400);
      expect(mockService.saveRace).not.toHaveBeenCalled();
    });

    it('returns 400 on an unknown field — the wire shape is a contract', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/karts/carrera')
        .send({ ...VALID_RACE, resultados: [] });

      expect(res.status).toBe(400);
      expect(mockService.saveRace).not.toHaveBeenCalled();
    });

    it('returns 400 when a time is below the -1 sentinel', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/karts/carrera')
        .send({
          ...VALID_RACE,
          participantes: [{ ...VALID_RACE.participantes[0], tiempoMs: -2 }],
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when a participant uuid is not a uuid', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/karts/carrera')
        .send({
          ...VALID_RACE,
          participantes: [{ ...VALID_RACE.participantes[0], uuid: 'Ana' }],
        });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /smartrotom/karts/ranking ────────────────────────────────────────

  describe('GET /smartrotom/karts/ranking', () => {
    it('returns 200 and passes no filters when the query is absent', async () => {
      mockService.getRanking.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/karts/ranking',
      );

      expect(res.status).toBe(200);
      expect(mockService.getRanking).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });

    it('passes circuito and parses limit as a number', async () => {
      mockService.getRanking.mockResolvedValue([]);

      await request(app.getHttpServer()).get(
        '/smartrotom/karts/ranking?circuito=Rainbow%20Road&limit=25',
      );

      expect(mockService.getRanking).toHaveBeenCalledWith(
        'Rainbow Road',
        undefined,
        25,
      );
    });
  });

  // ── GET /smartrotom/karts/stats/:uuid ────────────────────────────────────

  describe('GET /smartrotom/karts/stats/:uuid', () => {
    it('returns 200 and delegates to the service', async () => {
      mockService.getPlayerStats.mockResolvedValue({ uuid: VALID_UUID });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/karts/stats/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockService.getPlayerStats).toHaveBeenCalledWith(VALID_UUID);
    });

    it('returns 400 when the path param is not a uuid', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/karts/stats/Ana',
      );

      expect(res.status).toBe(400);
    });
  });
});
