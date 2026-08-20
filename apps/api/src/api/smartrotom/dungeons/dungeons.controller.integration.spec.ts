import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { DungeonsController } from './dungeons.controller';
import { DungeonsService } from './dungeons.service';
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
  saveRun: jest.fn(),
  getRanking: jest.fn(),
  getPlayerStats: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const SERVER_UUID = '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365';

/** The body the mod actually sends, pinned by DungeonRunBodyTest. */
const VALID_RUN = {
  server: SERVER_UUID,
  semilla: 'abc',
  etapaInicial: 1,
  etapaFinal: 4,
  pisosSuperados: 3,
  completada: true,
  duracionMs: 725000,
  maldiciones: ['LABYRINTH'],
  monedasGanadas: 480,
  monedasGastadas: 320,
  monedasConvertidas: 1600,
  fecha: 1700000000000,
  participantes: [
    { uuid: VALID_UUID, nombre: 'Ana', muertes: 2, abandono: false },
  ],
};

describe('DungeonsController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DungeonsController],
      providers: [
        { provide: DungeonsService, useValue: mockService },
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

  // ── POST /smartrotom/dungeons/run — SaveDungeonRunDto ────────────────────

  describe('POST /smartrotom/dungeons/run', () => {
    it('returns 200 and delegates the full mod body to the service', async () => {
      mockService.saveRun.mockResolvedValue({ saved: true, id: 42 });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/dungeons/run')
        .send(VALID_RUN);

      expect(res.status).toBe(200);
      expect(mockService.saveRun).toHaveBeenCalledWith(
        expect.objectContaining({
          semilla: 'abc',
          completada: true,
          monedasConvertidas: 1600,
          participantes: [
            expect.objectContaining({ nombre: 'Ana', muertes: 2 }),
          ],
        }),
      );
    });

    it('accepts an abandoned run — an attempt is still a row', async () => {
      mockService.saveRun.mockResolvedValue({ saved: true, id: 43 });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/dungeons/run')
        .send({
          ...VALID_RUN,
          completada: false,
          participantes: [
            { uuid: VALID_UUID, nombre: 'Beto', muertes: 0, abandono: true },
          ],
        });

      expect(res.status).toBe(200);
    });

    it('returns 400 on an unknown field — the wire shape is a contract', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/dungeons/run')
        .send({ ...VALID_RUN, monedas: 100 });

      expect(res.status).toBe(400);
      expect(mockService.saveRun).not.toHaveBeenCalled();
    });

    it('returns 400 when participantes is missing', async () => {
      const { participantes: _omitted, ...withoutParticipants } = VALID_RUN;
      const res = await request(app.getHttpServer())
        .post('/smartrotom/dungeons/run')
        .send(withoutParticipants);

      expect(res.status).toBe(400);
    });

    it('returns 400 when a participant uuid is not a uuid', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/dungeons/run')
        .send({
          ...VALID_RUN,
          participantes: [
            { uuid: 'Ana', nombre: 'Ana', muertes: 0, abandono: false },
          ],
        });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /smartrotom/dungeons/ranking ─────────────────────────────────────

  describe('GET /smartrotom/dungeons/ranking', () => {
    it('returns 200 and passes no limit when the query is absent', async () => {
      mockService.getRanking.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/dungeons/ranking',
      );

      expect(res.status).toBe(200);
      expect(mockService.getRanking).toHaveBeenCalledWith(undefined);
    });

    it('parses limit as a number', async () => {
      mockService.getRanking.mockResolvedValue([]);

      await request(app.getHttpServer()).get(
        '/smartrotom/dungeons/ranking?limit=25',
      );

      expect(mockService.getRanking).toHaveBeenCalledWith(25);
    });
  });

  // ── GET /smartrotom/dungeons/stats/:uuid ─────────────────────────────────

  describe('GET /smartrotom/dungeons/stats/:uuid', () => {
    it('returns 200 and delegates to the service', async () => {
      mockService.getPlayerStats.mockResolvedValue({ rank: 1 });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/dungeons/stats/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockService.getPlayerStats).toHaveBeenCalledWith(VALID_UUID);
    });

    it('returns 400 when the path param is not a uuid', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/dungeons/stats/Ana',
      );

      expect(res.status).toBe(400);
    });
  });
});
