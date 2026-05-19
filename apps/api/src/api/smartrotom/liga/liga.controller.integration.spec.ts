import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { LigaController } from './liga.controller';
import { LigaFacadeService } from './liga.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

const MOCK_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const MOCK_UUID2 = '007d1a64-661c-4396-8844-e27856f2ddfa';

const mockFacade: jest.Mocked<Partial<LigaFacadeService>> = {
  getReplayById: jest.fn(),
  getRecentReplays: jest.fn(),
  getPlayerReplays: jest.fn(),
  getMatchHistory: jest.fn(),
  getPlayerStatistics: jest.fn(),
  getLeaderboard: jest.fn(),
  getPlayerRanking: jest.fn(),
  comparePlayerStatistics: jest.fn(),
  getActiveTournaments: jest.fn(),
  getTournamentById: jest.fn(),
  getTournamentMatches: jest.fn(),
  createTournament: jest.fn(),
  registerForTournament: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('LigaController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LigaController],
      providers: [
        { provide: LigaFacadeService, useValue: mockFacade },
        { provide: Reflector, useValue: new Reflector() },
      ],
    }).compile();

    app = module.createNestApplication();
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

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ==================== GET /smartrotom/liga/replay/:id ====================

  // ── GET /smartrotom/liga/replay/:id ────────────────────────────────────
  describe('GET /smartrotom/liga/replay/:id', () => {
    it('returns 200 and delegates to facade.getReplayById', async () => {
      mockFacade.getReplayById!.mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/replay/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getReplayById).toHaveBeenCalledWith(1);
    });

    it('returns 500 when id is not numeric', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/replay/abc',
      );

      // Controller manually throws Error('Invalid replay ID') — caught by GlobalExceptionFilter as 500
      expect(res.status).toBe(500);
    });
  });

  // ==================== GET /smartrotom/liga/replays/recent ====================

  // ── GET /smartrotom/liga/replays/recent ────────────────────────────────
  describe('GET /smartrotom/liga/replays/recent', () => {
    it('returns 200 with default limit of 10', async () => {
      mockFacade.getRecentReplays!.mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/replays/recent',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getRecentReplays).toHaveBeenCalledWith(10);
    });

    it('returns 200 with custom limit', async () => {
      mockFacade.getRecentReplays!.mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/replays/recent?limit=5',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getRecentReplays).toHaveBeenCalledWith(5);
    });

    it('returns 500 when limit is non-numeric', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/replays/recent?limit=abc',
      );

      expect(res.status).toBe(500);
    });
  });

  // ==================== GET /smartrotom/liga/replays/player/:uuid ====================

  // ── GET /smartrotom/liga/replays/player/:uuid ──────────────────────────
  describe('GET /smartrotom/liga/replays/player/:uuid', () => {
    it('returns 200 and delegates to facade.getPlayerReplays', async () => {
      mockFacade.getPlayerReplays!.mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/liga/replays/player/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerReplays).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/liga/replays/history/:player1/:player2 ====================

  // ── GET /smartrotom/liga/replays/history/:player1/:player2 ─────────────
  describe('GET /smartrotom/liga/replays/history/:player1/:player2', () => {
    it('returns 200 and delegates to facade.getMatchHistory', async () => {
      mockFacade.getMatchHistory!.mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/liga/replays/history/${MOCK_UUID}/${MOCK_UUID2}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getMatchHistory).toHaveBeenCalledWith(
        MOCK_UUID,
        MOCK_UUID2,
      );
    });
  });

  // ==================== GET /smartrotom/liga/stats/player/:uuid ====================

  // ── GET /smartrotom/liga/stats/player/:uuid ────────────────────────────
  describe('GET /smartrotom/liga/stats/player/:uuid', () => {
    it('returns 200 and delegates to facade.getPlayerStatistics', async () => {
      mockFacade.getPlayerStatistics!.mockResolvedValue({ wins: 5 } as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/liga/stats/player/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerStatistics).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/liga/leaderboard ====================

  // ── GET /smartrotom/liga/leaderboard ───────────────────────────────────
  describe('GET /smartrotom/liga/leaderboard', () => {
    it('returns 200 with default limit of 20', async () => {
      mockFacade.getLeaderboard!.mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/leaderboard',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLeaderboard).toHaveBeenCalledWith(20);
    });
  });

  // ==================== GET /smartrotom/liga/ranking/:uuid ====================

  // ── GET /smartrotom/liga/ranking/:uuid ─────────────────────────────────
  describe('GET /smartrotom/liga/ranking/:uuid', () => {
    it('returns 200 when player is ranked', async () => {
      mockFacade.getPlayerRanking!.mockResolvedValue({ rank: 1 } as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/liga/ranking/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPlayerRanking).toHaveBeenCalledWith(MOCK_UUID);
    });

    it('returns 500 when player is not ranked', async () => {
      mockFacade.getPlayerRanking!.mockResolvedValue(null as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/liga/ranking/${MOCK_UUID}`,
      );

      // Controller throws Error('Player not found in rankings') — GlobalExceptionFilter returns 500
      expect(res.status).toBe(500);
    });
  });

  // ==================== GET /smartrotom/liga/compare/:player1/:player2 ====================

  // ── GET /smartrotom/liga/compare/:player1/:player2 ─────────────────────
  describe('GET /smartrotom/liga/compare/:player1/:player2', () => {
    it('returns 200 and delegates to facade.comparePlayerStatistics', async () => {
      mockFacade.comparePlayerStatistics!.mockResolvedValue({ diff: 0 } as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/liga/compare/${MOCK_UUID}/${MOCK_UUID2}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.comparePlayerStatistics).toHaveBeenCalledWith(
        MOCK_UUID,
        MOCK_UUID2,
      );
    });
  });

  // ==================== GET /smartrotom/liga/tournaments ====================

  // ── GET /smartrotom/liga/tournaments ───────────────────────────────────
  describe('GET /smartrotom/liga/tournaments', () => {
    it('returns 200 and delegates to facade.getActiveTournaments', async () => {
      mockFacade.getActiveTournaments!.mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/tournaments',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getActiveTournaments).toHaveBeenCalled();
    });
  });

  // ==================== GET /smartrotom/liga/tournament/:id ====================

  // ── GET /smartrotom/liga/tournament/:id ────────────────────────────────
  describe('GET /smartrotom/liga/tournament/:id', () => {
    it('returns 200 and delegates to facade.getTournamentById', async () => {
      mockFacade.getTournamentById!.mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/tournament/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTournamentById).toHaveBeenCalledWith(1);
    });

    it('returns 500 when id is not numeric', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/tournament/abc',
      );

      expect(res.status).toBe(500);
    });
  });

  // ==================== GET /smartrotom/liga/tournament/:id/matches ====================

  // ── GET /smartrotom/liga/tournament/:id/matches ────────────────────────
  describe('GET /smartrotom/liga/tournament/:id/matches', () => {
    it('returns 200 and delegates to facade.getTournamentMatches', async () => {
      mockFacade.getTournamentMatches!.mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/liga/tournament/1/matches',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTournamentMatches).toHaveBeenCalledWith(1);
    });
  });

  // ==================== POST /smartrotom/liga/tournament ====================

  // ── POST /smartrotom/liga/tournament ───────────────────────────────────
  describe('POST /smartrotom/liga/tournament', () => {
    it('returns 201 and delegates to facade.createTournament', async () => {
      mockFacade.createTournament!.mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/liga/tournament')
        .send({
          name: 'Copa Sinnoh',
          maxParticipants: 16,
          startDate: '2026-06-01T10:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(mockFacade.createTournament).toHaveBeenCalled();
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/liga/tournament')
        .send({ maxParticipants: 16, startDate: '2026-06-01T10:00:00.000Z' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when maxParticipants is below Min(2)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/liga/tournament')
        .send({
          name: 'Copa',
          maxParticipants: 1,
          startDate: '2026-06-01T10:00:00.000Z',
        });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/liga/tournament/register ====================

  // ── POST /smartrotom/liga/tournament/register ──────────────────────────
  describe('POST /smartrotom/liga/tournament/register', () => {
    it('returns 201 and delegates to facade.registerForTournament', async () => {
      mockFacade.registerForTournament!.mockResolvedValue({
        success: true,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/liga/tournament/register')
        .send({ tournamentId: 1, playerUuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.registerForTournament).toHaveBeenCalled();
    });

    it('returns 400 when tournamentId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/liga/tournament/register')
        .send({ playerUuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });

    it('returns 400 when tournamentId is below Min(1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/liga/tournament/register')
        .send({ tournamentId: 0, playerUuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });
});
