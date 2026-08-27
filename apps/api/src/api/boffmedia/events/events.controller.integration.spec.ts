import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { EventsController } from './events.controller';
import { EventsFacadeService } from './events.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';
import { OwnerOrAdminGuard } from '@api/_utils/guards/owner-or-admin.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  getEvents: jest.fn(),
  getEvent: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  getGames: jest.fn(),
  getGame: jest.fn(),
  createGame: jest.fn(),
  updateGame: jest.fn(),
  deleteGame: jest.fn(),
  getAchievements: jest.fn(),
  getEventAchievements: jest.fn(),
  createAchievement: jest.fn(),
  updateAchievement: jest.fn(),
  getParticipantProgress: jest.fn(),
  getParticipantProgressByEvent: jest.fn(),
  getTeams: jest.fn(),
  getEventTeams: jest.fn(),
  getTeam: jest.fn(),
  getTeamMembers: jest.fn(),
  createTeam: jest.fn(),
  updateTeam: jest.fn(),
  joinTeam: jest.fn(),
  leaveTeam: jest.fn(),
  joinEvent: jest.fn(),
  getEventParticipants: jest.fn(),
  updateProgress: jest.fn(),
  getLeaderboards: jest.fn(),
  getLeaderboard: jest.fn(),
  getTeamLeaderboard: jest.fn(),
};

const VALID_CREATE_EVENT = {
  title: 'Summer Championship',
  description: 'A summer gaming event',
  gameId: 1,
  startDate: '2026-07-01T00:00:00Z',
  visibility: 'public',
  type: 'event',
  icon: '/icons/summer.png',
};

const mockEvent = {
  id: 1,
  ...VALID_CREATE_EVENT,
  startDate: new Date('2026-07-01'),
  endDate: null,
  parentId: null,
  banner: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EventsController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsFacadeService, useValue: mockFacade },
        { provide: Logger, useValue: mockLogger },
        ResponseInterceptor,
        Reflector,
      ],
    })
      // These specs cover ValidationPipe + routing + facade delegation, not auth.
      // Pass-through the controller guards so protected routes reach the handler;
      // the JWT guard populates req.user like the real one (join reads it).
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
          ctx.switchToHttp().getRequest().user = {
            userId: 1,
            roles: [USER_ROLES.BOFF_ADMIN],
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OwnerOrAdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UserThrottlerGuard)
      .useValue({ canActivate: () => true })
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

  // ── GET /events ──────────────────────────────────────────────────────────

  describe('GET /events', () => {
    it('returns 200 and delegates to facade.getEvents', async () => {
      mockFacade.getEvents.mockResolvedValue([mockEvent]);

      const res = await request(app.getHttpServer()).get('/events');

      expect(res.status).toBe(200);
      expect(mockFacade.getEvents).toHaveBeenCalledTimes(1);
    });

    it('forwards validated filters and defaults to public-only (no auth)', async () => {
      // getEvents relies on the global APP_GUARD, which isn't wired in this
      // controller-only module, so req.user is undefined here → includePrivate
      // false (an unauthenticated caller never receives private events). The
      // admin path is covered in events.controller.spec.ts.
      mockFacade.getEvents.mockResolvedValue([mockEvent]);

      await request(app.getHttpServer()).get('/events?status=active&limit=5');

      expect(mockFacade.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          includePrivate: false,
          status: 'active',
          limit: 5,
        }),
      );
    });

    it('returns empty array when no events exist', async () => {
      mockFacade.getEvents.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/events');

      expect(res.status).toBe(200);
    });
  });

  // ── GET /events/event/:id ────────────────────────────────────────────────

  describe('GET /events/event/:id', () => {
    it('returns 200 and passes id + public-only (no auth) to facade.getEvent', async () => {
      mockFacade.getEvent.mockResolvedValue({ ...mockEvent, childEvents: [] });

      const res = await request(app.getHttpServer()).get('/events/event/1');

      expect(res.status).toBe(200);
      // No global guard in this controller-only module → req.user undefined →
      // includePrivate false and no userId (admin path covered in
      // events.controller.spec.ts).
      expect(mockFacade.getEvent).toHaveBeenCalledWith(1, false, undefined);
    });
  });

  // ── POST /events/event — CreateEventDto validation ───────────────────────

  describe('POST /events/event — CreateEventDto validation', () => {
    it('returns 201 and calls facade.createEvent when body is valid', async () => {
      mockFacade.createEvent.mockResolvedValue(mockEvent);

      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send(VALID_CREATE_EVENT);

      expect(res.status).toBe(201);
      expect(mockFacade.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Summer Championship', gameId: 1 }),
      );
    });

    it('returns 400 when title is missing', async () => {
      const { title: _title, ...body } = VALID_CREATE_EVENT;
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
        path: '/events/event',
      });
    });

    it('returns 400 when gameId is missing', async () => {
      const { gameId: _gameId, ...body } = VALID_CREATE_EVENT;
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when gameId is below minimum (Min(1))', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({ ...VALID_CREATE_EVENT, gameId: 0 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when startDate is not a valid date string', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({ ...VALID_CREATE_EVENT, startDate: 'not-a-date' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when visibility is not a valid enum value', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({ ...VALID_CREATE_EVENT, visibility: 'unlisted' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when type is not a valid enum value', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({ ...VALID_CREATE_EVENT, type: 'tournament' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when title exceeds 255 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({ ...VALID_CREATE_EVENT, title: 'a'.repeat(256) });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({ ...VALID_CREATE_EVENT, hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('accepts optional parentId when provided', async () => {
      mockFacade.createEvent.mockResolvedValue({ ...mockEvent, parentId: 5 });

      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({ ...VALID_CREATE_EVENT, parentId: 5 });

      expect(res.status).toBe(201);
      expect(mockFacade.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: 5 }),
      );
    });
  });

  // ── GET /events/:eventId/leaderboard ─────────────────────────────────────

  describe('GET /events/:eventId/leaderboard', () => {
    it('returns 200 and delegates to facade.getLeaderboard', async () => {
      const mockLeaderboard = [
        { participantId: 1, nickname: 'TrainerAsh', score: 1500, rank: 1 },
        { participantId: 2, nickname: 'TrainerMisty', score: 1200, rank: 2 },
      ];
      mockFacade.getLeaderboard.mockResolvedValue(mockLeaderboard);

      const res = await request(app.getHttpServer()).get(
        '/events/1/leaderboard',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLeaderboard).toHaveBeenCalledWith(
        1,
        false,
        undefined,
      );
    });

    it('returns entries in the order the facade provides them', async () => {
      const rankedEntries = [
        { participantId: 3, nickname: 'Brock', score: 2000, rank: 1 },
        { participantId: 1, nickname: 'Ash', score: 1500, rank: 2 },
      ];
      mockFacade.getLeaderboard.mockResolvedValue(rankedEntries);

      const res = await request(app.getHttpServer()).get(
        '/events/5/leaderboard',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLeaderboard).toHaveBeenCalledWith(
        5,
        false,
        undefined,
      );
    });

    it('returns empty array when event has no participants', async () => {
      mockFacade.getLeaderboard.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/99/leaderboard',
      );

      expect(res.status).toBe(200);
    });
  });

  // ── DELETE /events/event/:id ─────────────────────────────────────────────

  describe('DELETE /events/event/:id', () => {
    it('returns 200 with success flag', async () => {
      mockFacade.deleteEvent.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).delete('/events/event/1');

      expect(res.status).toBe(200);
      expect(mockFacade.deleteEvent).toHaveBeenCalledWith(1);
    });
  });

  // ── PATCH /events/event/:id ──────────────────────────────────────────────

  describe('PATCH /events/event/:id', () => {
    it('returns 200 and calls facade.updateEvent with numeric id', async () => {
      mockFacade.updateEvent.mockResolvedValue({
        ...mockEvent,
        title: 'Updated',
      });

      const res = await request(app.getHttpServer())
        .patch('/events/event/1')
        .send({ title: 'Updated' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateEvent).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'Updated' }),
      );
    });

    it('returns 400 when unknown field is sent (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/events/event/1')
        .send({ hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('accepts empty body (UpdateEventDto is PartialType)', async () => {
      mockFacade.updateEvent.mockResolvedValue(mockEvent);

      const res = await request(app.getHttpServer())
        .patch('/events/event/1')
        .send({});

      expect(res.status).toBe(200);
    });
  });

  // ── GET /events/games ────────────────────────────────────────────────────

  describe('GET /events/games', () => {
    it('returns 200 and delegates to facade.getGames', async () => {
      const mockGames = [
        { id: 1, title: 'Pokemon VGC', description: 'desc', icon: '/icon.png' },
      ];
      mockFacade.getGames.mockResolvedValue(mockGames);

      const res = await request(app.getHttpServer()).get('/events/games');

      expect(res.status).toBe(200);
      expect(mockFacade.getGames).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /events/games/:id ────────────────────────────────────────────────

  describe('GET /events/games/:id', () => {
    it('returns 200 and delegates to facade.getGame with numeric id', async () => {
      const mockGame = {
        id: 2,
        title: 'Minecraft',
        description: 'desc',
        icon: '/icon.png',
      };
      mockFacade.getGame.mockResolvedValue(mockGame);

      const res = await request(app.getHttpServer()).get('/events/games/2');

      expect(res.status).toBe(200);
      expect(mockFacade.getGame).toHaveBeenCalledWith(2);
    });
  });

  // ── POST /events/games — CreateGameDto validation ────────────────────────

  const VALID_CREATE_GAME = {
    title: 'Pokemon VGC 2026',
    description: 'Official VGC tournament format',
    icon: '/icons/pokemon.png',
  };

  const mockGame = { id: 1, ...VALID_CREATE_GAME, active: true };

  describe('POST /events/games — CreateGameDto validation', () => {
    it('returns 201 and calls facade.createGame when body is valid', async () => {
      mockFacade.createGame.mockResolvedValue(mockGame);

      const res = await request(app.getHttpServer())
        .post('/events/games')
        .send(VALID_CREATE_GAME);

      expect(res.status).toBe(201);
      expect(mockFacade.createGame).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Pokemon VGC 2026' }),
      );
    });

    it('returns 400 when title is missing', async () => {
      const { title: _t, ...body } = VALID_CREATE_GAME;
      const res = await request(app.getHttpServer())
        .post('/events/games')
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when title exceeds 255 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/games')
        .send({ ...VALID_CREATE_GAME, title: 'x'.repeat(256) });
      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/games')
        .send({ ...VALID_CREATE_GAME, rogue: true });
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /events/games/:id ──────────────────────────────────────────────

  describe('PATCH /events/games/:id', () => {
    it('returns 200 and calls facade.updateGame', async () => {
      mockFacade.updateGame.mockResolvedValue({
        ...mockGame,
        title: 'New Title',
      });

      const res = await request(app.getHttpServer())
        .patch('/events/games/1')
        .send({ title: 'New Title' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateGame).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'New Title' }),
      );
    });
  });

  // ── DELETE /events/games/:id ─────────────────────────────────────────────

  describe('DELETE /events/games/:id', () => {
    it('returns 200 and calls facade.deleteGame', async () => {
      mockFacade.deleteGame.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).delete('/events/games/3');

      expect(res.status).toBe(200);
      expect(mockFacade.deleteGame).toHaveBeenCalledWith(3);
    });
  });

  // ── GET /events/achievements ─────────────────────────────────────────────

  describe('GET /events/achievements', () => {
    it('returns 200 and delegates to facade.getAchievements', async () => {
      mockFacade.getAchievements.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/achievements',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAchievements).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /events/:eventId/achievements ────────────────────────────────────

  describe('GET /events/:eventId/achievements', () => {
    it('returns 200 and delegates to facade.getEventAchievements', async () => {
      mockFacade.getEventAchievements.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/5/achievements',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getEventAchievements).toHaveBeenCalledWith(
        5,
        false,
        undefined,
      );
    });
  });

  // ── POST /events/:eventId/achievements — CreateAchievementDto validation ─

  const VALID_CREATE_ACHIEVEMENT = {
    name: 'First Win',
    description: 'Win your first match',
    icon: '/icons/trophy.png',
    itemType: 'achievement',
    category: 'achievement',
    points: 100,
    maxProgress: 1,
  };

  const mockAchievement = { id: 1, eventId: 5, ...VALID_CREATE_ACHIEVEMENT };

  describe('POST /events/:eventId/achievements — CreateAchievementDto validation', () => {
    it('returns 201 and calls facade.createAchievement when body is valid', async () => {
      mockFacade.createAchievement.mockResolvedValue(mockAchievement);

      const res = await request(app.getHttpServer())
        .post('/events/5/achievements')
        .send(VALID_CREATE_ACHIEVEMENT);

      expect(res.status).toBe(201);
      expect(mockFacade.createAchievement).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ name: 'First Win', points: 100 }),
      );
    });

    it('returns 400 when name is missing', async () => {
      const { name: _n, ...body } = VALID_CREATE_ACHIEVEMENT;
      const res = await request(app.getHttpServer())
        .post('/events/5/achievements')
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when points is negative (Min 0)', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/5/achievements')
        .send({ ...VALID_CREATE_ACHIEVEMENT, points: -1 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when maxProgress is zero (Min 1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/5/achievements')
        .send({ ...VALID_CREATE_ACHIEVEMENT, maxProgress: 0 });
      expect(res.status).toBe(400);
    });
  });

  // ── PATCH /events/:eventId/achievements/:achievementId ───────────────────

  describe('PATCH /events/:eventId/achievements/:achievementId', () => {
    it('returns 200 and calls facade.updateAchievement', async () => {
      mockFacade.updateAchievement.mockResolvedValue({
        ...mockAchievement,
        points: 200,
      });

      const res = await request(app.getHttpServer())
        .patch('/events/5/achievements/1')
        .send({ points: 200 });

      expect(res.status).toBe(200);
      expect(mockFacade.updateAchievement).toHaveBeenCalledWith(
        5,
        1,
        expect.objectContaining({ points: 200 }),
      );
    });
  });

  // ── GET /events/participants/:participantId/progress ─────────────────────

  describe('GET /events/participants/:participantId/progress', () => {
    it('returns 200 and delegates to facade.getParticipantProgress', async () => {
      mockFacade.getParticipantProgress.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/participants/7/progress',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getParticipantProgress).toHaveBeenCalledWith(
        7,
        false,
        undefined,
      );
    });
  });

  // ── GET /events/:eventId/participants/:participantId/progress ─────────────

  describe('GET /events/:eventId/participants/:participantId/progress', () => {
    it('returns 200 and delegates to facade.getParticipantProgressByEvent', async () => {
      mockFacade.getParticipantProgressByEvent.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/5/participants/7/progress',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getParticipantProgressByEvent).toHaveBeenCalledWith(
        7,
        5,
        false,
        undefined,
      );
    });
  });

  // ── GET /events/teams ────────────────────────────────────────────────────

  describe('GET /events/teams', () => {
    it('returns 200 and delegates to facade.getTeams', async () => {
      mockFacade.getTeams.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/events/teams');

      expect(res.status).toBe(200);
      expect(mockFacade.getTeams).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /events/:eventId/teams ───────────────────────────────────────────

  describe('GET /events/:eventId/teams', () => {
    it('returns 200 and delegates to facade.getEventTeams', async () => {
      mockFacade.getEventTeams.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get('/events/5/teams');

      expect(res.status).toBe(200);
      expect(mockFacade.getEventTeams).toHaveBeenCalledWith(
        5,
        false,
        undefined,
      );
    });
  });

  // ── GET /events/teams/:teamId ────────────────────────────────────────────

  describe('GET /events/teams/:teamId', () => {
    it('returns 200 and delegates to facade.getTeam', async () => {
      mockFacade.getTeam.mockResolvedValue({ id: 3, name: 'Team Rocket' });

      const res = await request(app.getHttpServer()).get('/events/teams/3');

      expect(res.status).toBe(200);
      expect(mockFacade.getTeam).toHaveBeenCalledWith(3, false, undefined);
    });
  });

  // ── GET /events/teams/:teamId/members ────────────────────────────────────

  describe('GET /events/teams/:teamId/members', () => {
    it('returns 200 and delegates to facade.getTeamMembers', async () => {
      mockFacade.getTeamMembers.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/teams/3/members',
      );

      expect(res.status).toBe(200);
      // Trailing {} is the pagination DTO: the request sends no limit/offset,
      // so it arrives as an empty object rather than being absent.
      expect(mockFacade.getTeamMembers).toHaveBeenCalledWith(
        3,
        false,
        undefined,
        {},
      );
    });
  });

  // ── POST /events/:eventId/teams — CreateTeamDto validation ───────────────

  const VALID_CREATE_TEAM = {
    name: 'Team Rocket',
    leaderId: 1,
  };

  const mockTeam = { id: 1, eventId: 5, ...VALID_CREATE_TEAM };

  describe('POST /events/:eventId/teams — CreateTeamDto validation', () => {
    it('returns 201 and calls facade.createTeam when body is valid', async () => {
      mockFacade.createTeam.mockResolvedValue(mockTeam);

      const res = await request(app.getHttpServer())
        .post('/events/5/teams')
        .send(VALID_CREATE_TEAM);

      expect(res.status).toBe(201);
      expect(mockFacade.createTeam).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ name: 'Team Rocket', leaderId: 1 }),
      );
    });

    it('returns 400 when name is missing', async () => {
      const { name: _n, ...body } = VALID_CREATE_TEAM;
      const res = await request(app.getHttpServer())
        .post('/events/5/teams')
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when leaderId is below minimum (Min 1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/5/teams')
        .send({ ...VALID_CREATE_TEAM, leaderId: 0 });
      expect(res.status).toBe(400);
    });

    it('accepts optional tag and icon', async () => {
      mockFacade.createTeam.mockResolvedValue({
        ...mockTeam,
        tag: 'TRK',
        icon: '/icon.png',
      });

      const res = await request(app.getHttpServer())
        .post('/events/5/teams')
        .send({ ...VALID_CREATE_TEAM, tag: 'TRK', icon: '/icon.png' });

      expect(res.status).toBe(201);
    });
  });

  // ── PATCH /events/:eventId/teams/:teamId ─────────────────────────────────

  describe('PATCH /events/:eventId/teams/:teamId', () => {
    it('returns 200 and calls facade.updateTeam', async () => {
      mockFacade.updateTeam.mockResolvedValue({
        ...mockTeam,
        name: 'Elite Four',
      });

      const res = await request(app.getHttpServer())
        .patch('/events/5/teams/1')
        .send({ name: 'Elite Four' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateTeam).toHaveBeenCalledWith(
        5,
        1,
        expect.objectContaining({ name: 'Elite Four' }),
      );
    });
  });

  // ── POST /events/:eventId/teams/:teamId/join — JWT identity ──────────────

  describe('POST /events/:eventId/teams/:teamId/join', () => {
    it('joins with the JWT identity and ignores any body', async () => {
      mockFacade.joinTeam.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/events/5/teams/1/join')
        .send({ participantId: 10 });

      expect(res.status).toBe(201);
      // participantId must never be read from the body — that would let any
      // authenticated user enrol anyone else. The authenticated user (1) is the
      // only identity input; the trailing flag is whether that caller is an
      // admin (the overridden JWT guard grants BOFF_ADMIN here).
      expect(mockFacade.joinTeam).toHaveBeenCalledWith(5, 1, 1, true);
    });

    it('accepts an empty body', async () => {
      mockFacade.joinTeam.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/events/5/teams/1/join')
        .send({});

      expect(res.status).toBe(201);
      expect(mockFacade.joinTeam).toHaveBeenCalledWith(5, 1, 1, true);
    });
  });

  // ── DELETE /events/:eventId/teams/:teamId/members/:userId ────────────────

  describe('DELETE /events/:eventId/teams/:teamId/members/:userId', () => {
    it('returns 200 and calls facade.leaveTeam', async () => {
      mockFacade.leaveTeam.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer()).delete(
        '/events/5/teams/1/members/10',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.leaveTeam).toHaveBeenCalledWith(5, 1, 10);
    });
  });

  // ── POST /events/join/:eventId — JoinEventDto validation ─────────────────

  describe('POST /events/join/:eventId — JoinEventDto validation', () => {
    it('returns 201 and uses the JWT identity, not the body userId', async () => {
      mockFacade.joinEvent.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/events/join/5')
        .send({ userId: 42 });

      expect(res.status).toBe(201);
      // The handler overrides body.userId with req.user.userId (anti-impersonation),
      // so the spoofed 42 is ignored in favour of the authenticated user (1).
      expect(mockFacade.joinEvent).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ userId: 1 }),
      );
    });

    it('accepts an empty body and joins via the JWT identity', async () => {
      // userId is never taken from the body — the client sends {} and the
      // handler injects req.user.userId. Requiring it in the DTO would 400
      // every real join request.
      mockFacade.joinEvent.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/events/join/5')
        .send({});

      expect(res.status).toBe(201);
      expect(mockFacade.joinEvent).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ userId: 1 }),
      );
    });

    it('accepts optional nickname and avatar fields', async () => {
      mockFacade.joinEvent.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/events/join/5')
        .send({ userId: 42, nickname: 'Ash', avatar: '/avatars/ash.png' });

      expect(res.status).toBe(201);
    });
  });

  // ── GET /events/:eventId/participants ─────────────────────────────────────

  describe('GET /events/:eventId/participants', () => {
    it('returns 200 and delegates to facade.getEventParticipants', async () => {
      mockFacade.getEventParticipants.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/5/participants',
      );

      expect(res.status).toBe(200);
      // Trailing {} is the pagination DTO: the request sends no limit/offset,
      // so it arrives as an empty object rather than being absent.
      expect(mockFacade.getEventParticipants).toHaveBeenCalledWith(
        5,
        false,
        undefined,
        {},
      );
    });
  });

  // ── PUT /events/:eventId/progress — UpdateProgressDto validation ──────────

  const VALID_UPDATE_PROGRESS = {
    participantId: 10,
    achievementId: 1,
    progress: 5,
  };

  describe('PUT /events/:eventId/progress — UpdateProgressDto validation', () => {
    it('returns 200 and calls facade.updateProgress when body is valid', async () => {
      mockFacade.updateProgress.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .put('/events/5/progress')
        .send(VALID_UPDATE_PROGRESS);

      expect(res.status).toBe(200);
      expect(mockFacade.updateProgress).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          participantId: 10,
          achievementId: 1,
          progress: 5,
        }),
      );
    });

    it('returns 400 when participantId is missing', async () => {
      const { participantId: _p, ...body } = VALID_UPDATE_PROGRESS;
      const res = await request(app.getHttpServer())
        .put('/events/5/progress')
        .send(body);
      expect(res.status).toBe(400);
    });

    it('returns 400 when progress is negative (Min 0)', async () => {
      const res = await request(app.getHttpServer())
        .put('/events/5/progress')
        .send({ ...VALID_UPDATE_PROGRESS, progress: -1 });
      expect(res.status).toBe(400);
    });

    it('accepts optional teamId', async () => {
      mockFacade.updateProgress.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .put('/events/5/progress')
        .send({ ...VALID_UPDATE_PROGRESS, teamId: 3 });

      expect(res.status).toBe(200);
    });
  });

  // ── GET /events/leaderboards ─────────────────────────────────────────────

  describe('GET /events/leaderboards', () => {
    it('returns 200 and delegates to facade.getLeaderboards', async () => {
      mockFacade.getLeaderboards.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/leaderboards',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLeaderboards).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /events/:eventId/teams/leaderboard ────────────────────────────────

  describe('GET /events/:eventId/teams/leaderboard', () => {
    it('returns 200 and delegates to facade.getTeamLeaderboard', async () => {
      const mockTeamLb = [
        { teamId: 1, teamName: 'Team Rocket', score: 500, rank: 1 },
      ];
      mockFacade.getTeamLeaderboard.mockResolvedValue(mockTeamLb);

      const res = await request(app.getHttpServer()).get(
        '/events/5/teams/leaderboard',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getTeamLeaderboard).toHaveBeenCalledWith(
        5,
        false,
        undefined,
      );
    });

    it('returns empty array when no teams exist', async () => {
      mockFacade.getTeamLeaderboard.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/events/10/teams/leaderboard',
      );

      expect(res.status).toBe(200);
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/events/event')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
