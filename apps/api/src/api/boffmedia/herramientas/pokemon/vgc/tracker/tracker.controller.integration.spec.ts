import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { TrackerController } from './tracker.controller';
import { TrackerService } from './tracker.service';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const MOCK_USER_ID = 42;

/** Guard stub that always passes and injects a mock user onto the request. */
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { userId: MOCK_USER_ID, roles: [] };
    return true;
  }
}

const mockService = {
  syncAll: jest.fn(),
  getPresets: jest.fn(),
  upsertPreset: jest.fn(),
  deletePreset: jest.fn(),
  getSessions: jest.fn(),
  upsertSession: jest.fn(),
  deleteSession: jest.fn(),
  getMatchesForSession: jest.fn(),
  upsertMatch: jest.fn(),
  deleteMatch: jest.fn(),
  getSeriesForSession: jest.fn(),
  upsertSeries: jest.fn(),
  deleteSeries: jest.fn(),
};

const VALID_PRESET = {
  name: 'My Preset',
  regulationId: 'reg-h',
  exportString: 'Pikachu @ ...',
  slots: [],
};

const VALID_SESSION = {
  id: 'sess-1',
  label: 'Ladder grind',
  format: 'BO3',
  regulationId: 'reg-h',
};

const VALID_MATCH = {
  id: 'match-1',
  sessionId: 'sess-1',
  format: 'BO3',
  myTeam: {},
  opponentTeam: {},
};

const VALID_SERIES = {
  id: 'series-1',
  sessionId: 'sess-1',
  createdAt: 1700000000,
  myTeam: {},
  opponentTeam: {},
  games: [],
  notes: [],
};

describe('TrackerController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TrackerController],
      providers: [
        { provide: TrackerService, useValue: mockService },
        ResponseInterceptor,
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
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

  // ── GET /tools/vgc/tracker/sync ──────────────────────────────────────────

  describe('GET /tools/vgc/tracker/sync', () => {
    it('returns 200 and delegates to service.syncAll with userId', async () => {
      mockService.syncAll.mockResolvedValue({ sessions: [], matches: [] });

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/tracker/sync',
      );

      expect(res.status).toBe(200);
      expect(mockService.syncAll).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  // ── GET /tools/vgc/tracker/presets ──────────────────────────────────────

  describe('GET /tools/vgc/tracker/presets', () => {
    it('returns 200 and delegates to service.getPresets with userId', async () => {
      mockService.getPresets.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/tracker/presets',
      );

      expect(res.status).toBe(200);
      expect(mockService.getPresets).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  // ── PUT /tools/vgc/tracker/presets/:id ──────────────────────────────────

  describe('PUT /tools/vgc/tracker/presets/:id', () => {
    it('returns 200 and delegates to service.upsertPreset', async () => {
      mockService.upsertPreset.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/presets/preset-uuid')
        .send(VALID_PRESET);

      expect(res.status).toBe(200);
      expect(mockService.upsertPreset).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'preset-uuid',
        expect.objectContaining({ name: 'My Preset' }),
      );
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/presets/preset-uuid')
        .send({ regulationId: 'reg-h', exportString: 'x', slots: [] });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /tools/vgc/tracker/presets/:id ───────────────────────────────

  describe('DELETE /tools/vgc/tracker/presets/:id', () => {
    it('returns 200 and delegates to service.deletePreset', async () => {
      mockService.deletePreset.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).delete(
        '/tools/vgc/tracker/presets/preset-uuid',
      );

      expect(res.status).toBe(200);
      expect(mockService.deletePreset).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'preset-uuid',
      );
    });
  });

  // ── GET /tools/vgc/tracker/sessions ─────────────────────────────────────

  describe('GET /tools/vgc/tracker/sessions', () => {
    it('returns 200 and delegates to service.getSessions', async () => {
      mockService.getSessions.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/tracker/sessions',
      );

      expect(res.status).toBe(200);
      expect(mockService.getSessions).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  // ── PUT /tools/vgc/tracker/sessions/:id ─────────────────────────────────

  describe('PUT /tools/vgc/tracker/sessions/:id', () => {
    it('returns 200 and delegates to service.upsertSession', async () => {
      mockService.upsertSession.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/sessions/sess-1')
        .send(VALID_SESSION);

      expect(res.status).toBe(200);
      expect(mockService.upsertSession).toHaveBeenCalledWith(
        MOCK_USER_ID,
        expect.objectContaining({ id: 'sess-1', label: 'Ladder grind' }),
      );
    });

    it('returns 400 when format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/sessions/sess-1')
        .send({ ...VALID_SESSION, format: 'BO5' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when label is missing', async () => {
      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/sessions/sess-1')
        .send({ id: 'sess-1', format: 'BO3', regulationId: 'reg-h' });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /tools/vgc/tracker/sessions/:id ──────────────────────────────

  describe('DELETE /tools/vgc/tracker/sessions/:id', () => {
    it('returns 200 and delegates to service.deleteSession', async () => {
      mockService.deleteSession.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).delete(
        '/tools/vgc/tracker/sessions/sess-1',
      );

      expect(res.status).toBe(200);
      expect(mockService.deleteSession).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'sess-1',
      );
    });
  });

  // ── GET /tools/vgc/tracker/sessions/:sessionId/matches ──────────────────

  describe('GET /tools/vgc/tracker/sessions/:sessionId/matches', () => {
    it('returns 200 and delegates to service.getMatchesForSession', async () => {
      mockService.getMatchesForSession.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/tracker/sessions/sess-1/matches',
      );

      expect(res.status).toBe(200);
      expect(mockService.getMatchesForSession).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'sess-1',
      );
    });
  });

  // ── POST /tools/vgc/tracker/matches ─────────────────────────────────────

  describe('POST /tools/vgc/tracker/matches', () => {
    it('returns 201 and delegates to service.upsertMatch', async () => {
      mockService.upsertMatch.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/tools/vgc/tracker/matches')
        .send(VALID_MATCH);

      expect(res.status).toBe(201);
      expect(mockService.upsertMatch).toHaveBeenCalledWith(
        MOCK_USER_ID,
        expect.objectContaining({ id: 'match-1', sessionId: 'sess-1' }),
      );
    });

    it('returns 400 when format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/tracker/matches')
        .send({ ...VALID_MATCH, format: 'BO5' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when myTeam is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/vgc/tracker/matches')
        .send({
          id: 'match-1',
          sessionId: 'sess-1',
          format: 'BO3',
          opponentTeam: {},
        });

      expect(res.status).toBe(400);
    });
  });

  // ── PUT /tools/vgc/tracker/matches/:id ──────────────────────────────────

  describe('PUT /tools/vgc/tracker/matches/:id', () => {
    it('returns 200 and delegates to service.upsertMatch with id merged', async () => {
      mockService.upsertMatch.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/matches/match-uuid')
        .send(VALID_MATCH);

      expect(res.status).toBe(200);
      expect(mockService.upsertMatch).toHaveBeenCalledWith(
        MOCK_USER_ID,
        expect.objectContaining({ id: 'match-uuid' }),
      );
    });
  });

  // ── DELETE /tools/vgc/tracker/matches/:id ───────────────────────────────

  describe('DELETE /tools/vgc/tracker/matches/:id', () => {
    it('returns 200 and delegates to service.deleteMatch', async () => {
      mockService.deleteMatch.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).delete(
        '/tools/vgc/tracker/matches/match-uuid',
      );

      expect(res.status).toBe(200);
      expect(mockService.deleteMatch).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'match-uuid',
      );
    });
  });

  // ── GET /tools/vgc/tracker/sessions/:sessionId/series ───────────────────

  describe('GET /tools/vgc/tracker/sessions/:sessionId/series', () => {
    it('returns 200 and delegates to service.getSeriesForSession', async () => {
      mockService.getSeriesForSession.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/tracker/sessions/sess-1/series',
      );

      expect(res.status).toBe(200);
      expect(mockService.getSeriesForSession).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'sess-1',
      );
    });
  });

  // ── PUT /tools/vgc/tracker/series/:id ───────────────────────────────────

  describe('PUT /tools/vgc/tracker/series/:id', () => {
    it('returns 200 and delegates to service.upsertSeries', async () => {
      mockService.upsertSeries.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/series/series-uuid')
        .send(VALID_SERIES);

      expect(res.status).toBe(200);
      expect(mockService.upsertSeries).toHaveBeenCalledWith(
        MOCK_USER_ID,
        expect.objectContaining({ id: 'series-uuid', sessionId: 'sess-1' }),
      );
    });

    it('returns 400 when games is missing', async () => {
      const { games: _g, ...noGames } = VALID_SERIES;
      const res = await request(app.getHttpServer())
        .put('/tools/vgc/tracker/series/series-uuid')
        .send(noGames);

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /tools/vgc/tracker/series/:id ────────────────────────────────

  describe('DELETE /tools/vgc/tracker/series/:id', () => {
    it('returns 200 and delegates to service.deleteSeries', async () => {
      mockService.deleteSeries.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).delete(
        '/tools/vgc/tracker/series/series-uuid',
      );

      expect(res.status).toBe(200);
      expect(mockService.deleteSeries).toHaveBeenCalledWith(
        MOCK_USER_ID,
        'series-uuid',
      );
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('500 errors include statusCode, error, message, timestamp, path', async () => {
      mockService.syncAll.mockRejectedValue(new Error('DB down'));

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/tracker/sync',
      );

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('statusCode', 500);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
