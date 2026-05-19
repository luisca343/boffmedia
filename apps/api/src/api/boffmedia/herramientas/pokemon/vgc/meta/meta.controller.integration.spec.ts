import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { VgcMetaController } from './meta.controller';
import { VgcMetaFacadeService } from './meta.facade.service';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const MOCK_USER_ID = 7;

/** Always-pass guard that injects a mock admin user. */
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest().user = {
      userId: MOCK_USER_ID,
      roles: ['boff_admin'],
    };
    return true;
  }
}

/** Always-pass roles guard (role checks are out of scope for controller tests). */
class MockRolesGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

const mockFacade = {
  getAvailableSmogonSnapshots: jest.fn(),
  fetchSmogonSnapshot: jest.fn(),
  deleteSmogonSnapshot: jest.fn(),
  getSmogonUsage: jest.fn(),
  getSmogonUsageList: jest.fn(),
  getSmogonDetail: jest.fn(),
  getAvailableChampionsRegulations: jest.fn(),
  getChampionsUsage: jest.fn(),
  getChampionsUsageList: jest.fn(),
  getChampionsPasteDetail: jest.fn(),
  batchFetchChampionsPastes: jest.fn(),
  refreshChampionsData: jest.fn(),
  getLimitlessTournamentsByRegulation: jest.fn(),
  listLimitlessTournaments: jest.fn(),
  getLimitlessCombinedUsage: jest.fn(),
  getLimitlessCombinedUsageList: jest.fn(),
  getLimitlessUsage: jest.fn(),
  getLimitlessUsageList: jest.fn(),
  getLimitlessTournamentStatus: jest.fn(),
  importLimitlessTournament: jest.fn(),
  getLimitlessPlayers: jest.fn(),
  getLimitlessPlayerTeam: jest.fn(),
  getRegulations: jest.fn(),
  upsertRegulation: jest.fn(),
  getSpeciesTeams: jest.fn(),
  getIngestionJobs: jest.fn(),
  comparePersonalVsMeta: jest.fn(),
  getDivergence: jest.fn(),
};

const VALID_FETCH_SMOGON = {
  format: 'gen9vgc2026regi',
  month: '2026-03',
};

const VALID_REGULATION = {
  id: 'vgc2026regma',
  formatId: 'gen9championsvgc2026regma',
  name: '[Gen 9 Champions] VGC 2026 Reg M-A',
};

const VALID_TOURNAMENT = {
  url: 'https://play.limitlesstcg.com/tournament/euic-2026/standings',
  regulationId: 'vgc2026regma',
};

describe('VgcMetaController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [VgcMetaController],
      providers: [
        { provide: VgcMetaFacadeService, useValue: mockFacade },
        ResponseInterceptor,
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleRef.createNestApplication();
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

  // ── Smogon endpoints ────────────────────────────────────────────────────

  describe('GET /tools/vgc/meta/smogon/available', () => {
    it('returns 200 and delegates to facade.getAvailableSmogonSnapshots', async () => {
      mockFacade.getAvailableSmogonSnapshots.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/smogon/available',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAvailableSmogonSnapshots).toHaveBeenCalled();
    });
  });

  describe('POST /tools/vgc/meta/smogon/fetch', () => {
    it('returns 201 and delegates to facade.fetchSmogonSnapshot', async () => {
      mockFacade.fetchSmogonSnapshot.mockResolvedValue({ count: 100 });

      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/smogon/fetch')
        .send(VALID_FETCH_SMOGON);

      expect(res.status).toBe(201);
      expect(mockFacade.fetchSmogonSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'gen9vgc2026regi',
          month: '2026-03',
        }),
      );
    });

    it('returns 400 when month format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/smogon/fetch')
        .send({ format: 'gen9vgc2026regi', month: '03-2026' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when format is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/smogon/fetch')
        .send({ month: '2026-03' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tools/vgc/meta/smogon/snapshot', () => {
    it('returns 200 and delegates to facade.deleteSmogonSnapshot', async () => {
      mockFacade.deleteSmogonSnapshot.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .delete('/tools/vgc/meta/smogon/snapshot')
        .query({ format: 'gen9vgc2026regi', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(mockFacade.deleteSmogonSnapshot).toHaveBeenCalled();
    });
  });

  describe('GET /tools/vgc/meta/smogon', () => {
    it('returns 200 and delegates to facade.getSmogonUsage', async () => {
      mockFacade.getSmogonUsage.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/smogon')
        .query({ format: 'gen9vgc2026regi', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(mockFacade.getSmogonUsage).toHaveBeenCalled();
    });
  });

  describe('GET /tools/vgc/meta/smogon/list', () => {
    it('returns 200 and delegates to facade.getSmogonUsageList', async () => {
      mockFacade.getSmogonUsageList.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/smogon/list')
        .query({ format: 'gen9vgc2026regi', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(mockFacade.getSmogonUsageList).toHaveBeenCalled();
    });
  });

  describe('GET /tools/vgc/meta/smogon/:speciesId', () => {
    it('returns 200 and delegates to facade.getSmogonDetail', async () => {
      mockFacade.getSmogonDetail.mockResolvedValue({ name: 'incineroar' });

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/smogon/incineroar')
        .query({ format: 'gen9vgc2026regi', month: '2026-03' });

      expect(res.status).toBe(200);
      expect(mockFacade.getSmogonDetail).toHaveBeenCalledWith(
        expect.objectContaining({ speciesId: 'incineroar' }),
      );
    });
  });

  // ── Champions endpoints ─────────────────────────────────────────────────

  describe('GET /tools/vgc/meta/champions/available', () => {
    it('returns 200 and delegates to facade.getAvailableChampionsRegulations', async () => {
      mockFacade.getAvailableChampionsRegulations.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/champions/available',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAvailableChampionsRegulations).toHaveBeenCalled();
    });
  });

  describe('GET /tools/vgc/meta/champions', () => {
    it('returns 200 and delegates to facade.getChampionsUsage', async () => {
      mockFacade.getChampionsUsage.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/champions')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(200);
      expect(mockFacade.getChampionsUsage).toHaveBeenCalled();
    });
  });

  describe('GET /tools/vgc/meta/champions/list', () => {
    it('returns 200 and delegates to facade.getChampionsUsageList', async () => {
      mockFacade.getChampionsUsageList.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/champions/list')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(200);
      expect(mockFacade.getChampionsUsageList).toHaveBeenCalled();
    });
  });

  describe('GET /tools/vgc/meta/champions/:speciesId/detail', () => {
    it('returns 200 and delegates to facade.getChampionsPasteDetail', async () => {
      mockFacade.getChampionsPasteDetail.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/champions/glimmoramega/detail')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(200);
      expect(mockFacade.getChampionsPasteDetail).toHaveBeenCalledWith(
        'vgc2026regma',
        'glimmoramega',
      );
    });
  });

  describe('POST /tools/vgc/meta/champions/fetch-pastes', () => {
    it('returns 201 and delegates to facade.batchFetchChampionsPastes', async () => {
      mockFacade.batchFetchChampionsPastes.mockResolvedValue({ fetched: 50 });

      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/champions/fetch-pastes')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(201);
      expect(mockFacade.batchFetchChampionsPastes).toHaveBeenCalledWith(
        'vgc2026regma',
      );
    });
  });

  describe('POST /tools/vgc/meta/champions/refresh', () => {
    it('returns 201 and delegates to facade.refreshChampionsData', async () => {
      mockFacade.refreshChampionsData.mockResolvedValue({ count: 200 });

      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/champions/refresh')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(201);
      expect(mockFacade.refreshChampionsData).toHaveBeenCalledWith(
        'vgc2026regma',
      );
    });
  });

  // ── Limitless endpoints ─────────────────────────────────────────────────

  describe('GET /tools/vgc/meta/limitless/tournaments', () => {
    it('returns 200 and delegates to facade.getLimitlessTournamentsByRegulation', async () => {
      mockFacade.getLimitlessTournamentsByRegulation.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/limitless/tournaments')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(200);
      expect(
        mockFacade.getLimitlessTournamentsByRegulation,
      ).toHaveBeenCalledWith('vgc2026regma');
    });
  });

  describe('GET /tools/vgc/meta/limitless', () => {
    it('returns 200 and delegates to facade.listLimitlessTournaments', async () => {
      mockFacade.listLimitlessTournaments.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/limitless',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.listLimitlessTournaments).toHaveBeenCalled();
    });
  });

  describe('GET /tools/vgc/meta/limitless/usage/combined', () => {
    it('returns 200 and delegates to facade.getLimitlessCombinedUsage', async () => {
      mockFacade.getLimitlessCombinedUsage.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/limitless/usage/combined')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(200);
      expect(mockFacade.getLimitlessCombinedUsage).toHaveBeenCalledWith(
        'vgc2026regma',
      );
    });
  });

  describe('GET /tools/vgc/meta/limitless/usage/combined/list', () => {
    it('returns 200 and delegates to facade.getLimitlessCombinedUsageList', async () => {
      mockFacade.getLimitlessCombinedUsageList.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/limitless/usage/combined/list')
        .query({ regulationId: 'vgc2026regma' });

      expect(res.status).toBe(200);
      expect(mockFacade.getLimitlessCombinedUsageList).toHaveBeenCalledWith(
        'vgc2026regma',
      );
    });
  });

  describe('GET /tools/vgc/meta/limitless/usage', () => {
    it('returns 200 and delegates to facade.getLimitlessUsage', async () => {
      mockFacade.getLimitlessUsage.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/limitless/usage')
        .query({ tournamentId: '5' });

      expect(res.status).toBe(200);
      expect(mockFacade.getLimitlessUsage).toHaveBeenCalledWith(5);
    });
  });

  describe('GET /tools/vgc/meta/limitless/usage/list', () => {
    it('returns 200 and delegates to facade.getLimitlessUsageList', async () => {
      mockFacade.getLimitlessUsageList.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/limitless/usage/list')
        .query({ tournamentId: '5' });

      expect(res.status).toBe(200);
      expect(mockFacade.getLimitlessUsageList).toHaveBeenCalledWith(5);
    });
  });

  describe('GET /tools/vgc/meta/limitless/tournament/:id/status', () => {
    it('returns 200 and delegates to facade.getLimitlessTournamentStatus', async () => {
      mockFacade.getLimitlessTournamentStatus.mockResolvedValue({
        status: 'done',
      });

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/limitless/tournament/3/status',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLimitlessTournamentStatus).toHaveBeenCalledWith(3);
    });
  });

  describe('POST /tools/vgc/meta/limitless/tournament', () => {
    it('returns 201 and delegates to facade.importLimitlessTournament', async () => {
      mockFacade.importLimitlessTournament.mockResolvedValue({ jobId: 'abc' });

      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/limitless/tournament')
        .send(VALID_TOURNAMENT);

      expect(res.status).toBe(201);
      expect(mockFacade.importLimitlessTournament).toHaveBeenCalledWith(
        expect.objectContaining({
          url: VALID_TOURNAMENT.url,
          regulationId: 'vgc2026regma',
        }),
      );
    });

    it('returns 400 when url is not a valid URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/limitless/tournament')
        .send({ url: 'not-a-url', regulationId: 'vgc2026regma' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when regulationId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/limitless/tournament')
        .send({
          url: 'https://play.limitlesstcg.com/tournament/euic-2026/standings',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /tools/vgc/meta/limitless/:tournamentId/players', () => {
    it('returns 200 and delegates to facade.getLimitlessPlayers', async () => {
      mockFacade.getLimitlessPlayers.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/limitless/5/players',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLimitlessPlayers).toHaveBeenCalledWith(5);
    });
  });

  describe('GET /tools/vgc/meta/limitless/:tournamentId/player/:slug', () => {
    it('returns 200 and delegates to facade.getLimitlessPlayerTeam', async () => {
      mockFacade.getLimitlessPlayerTeam.mockResolvedValue({ team: [] });

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/limitless/5/player/johndoe',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLimitlessPlayerTeam).toHaveBeenCalledWith(
        5,
        'johndoe',
      );
    });
  });

  // ── Regulations endpoints ───────────────────────────────────────────────

  describe('GET /tools/vgc/meta/regulations', () => {
    it('returns 200 and delegates to facade.getRegulations', async () => {
      mockFacade.getRegulations.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/regulations',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getRegulations).toHaveBeenCalled();
    });
  });

  describe('POST /tools/vgc/meta/regulations', () => {
    it('returns 201 and delegates to facade.upsertRegulation', async () => {
      mockFacade.upsertRegulation.mockResolvedValue(VALID_REGULATION);

      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/regulations')
        .send(VALID_REGULATION);

      expect(res.status).toBe(201);
      expect(mockFacade.upsertRegulation).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'vgc2026regma' }),
      );
    });

    it('returns 400 when id is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/regulations')
        .send({ formatId: 'gen9vgc2026regma', name: 'Test' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when gameType is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/meta/regulations')
        .send({ ...VALID_REGULATION, gameType: 'triples' });

      expect(res.status).toBe(400);
    });
  });

  // ── Species Teams ───────────────────────────────────────────────────────

  describe('GET /tools/vgc/meta/teams', () => {
    it('returns 200 and delegates to facade.getSpeciesTeams', async () => {
      mockFacade.getSpeciesTeams.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/teams')
        .query({ speciesId: 'incineroar', regulationId: 'vgc2026regma' });

      expect(res.status).toBe(200);
      expect(mockFacade.getSpeciesTeams).toHaveBeenCalledWith(
        'incineroar',
        'vgc2026regma',
      );
    });
  });

  // ── Jobs + Personal Analytics ───────────────────────────────────────────

  describe('GET /tools/vgc/meta/jobs', () => {
    it('returns 200 and delegates to facade.getIngestionJobs', async () => {
      mockFacade.getIngestionJobs.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/jobs',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getIngestionJobs).toHaveBeenCalled();
    });

    it('passes regulationId query param when provided', async () => {
      mockFacade.getIngestionJobs.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/tools/vgc/meta/jobs')
        .query({ regulationId: 'vgc2026regma' });

      expect(mockFacade.getIngestionJobs).toHaveBeenCalledWith('vgc2026regma');
    });
  });

  describe('GET /tools/vgc/meta/compare/personal', () => {
    it('returns 200 and delegates to facade.comparePersonalVsMeta', async () => {
      mockFacade.comparePersonalVsMeta.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/compare/personal')
        .query({
          source: 'smogon',
          regulationId: 'vgc2026regma',
          month: '2026-03',
        });

      expect(res.status).toBe(200);
      expect(mockFacade.comparePersonalVsMeta).toHaveBeenCalledWith(
        MOCK_USER_ID,
        expect.any(Object),
      );
    });
  });

  // ── Divergence ──────────────────────────────────────────────────────────

  describe('GET /tools/vgc/meta/divergence', () => {
    it('returns 200 and delegates to facade.getDivergence', async () => {
      mockFacade.getDivergence.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/tools/vgc/meta/divergence')
        .query({
          regulationId: 'vgc2026regma',
          tournamentId: '5',
        });

      expect(res.status).toBe(200);
      expect(mockFacade.getDivergence).toHaveBeenCalled();
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('500 errors include statusCode, error, message, timestamp, path', async () => {
      mockFacade.getAvailableSmogonSnapshots.mockRejectedValue(
        new Error('DB error'),
      );

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/meta/smogon/available',
      );

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('statusCode', 500);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
