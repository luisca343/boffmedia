import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { InvitesController } from './invites.controller';
import { InvitesFacadeService } from './invites.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const MOCK_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

const mockFacade: jest.Mocked<Partial<InvitesFacadeService>> = {
  createInvite: jest.fn(),
  getAllInvites: jest.fn(),
  getInviteStatistics: jest.fn(),
  getInviteById: jest.fn(),
  validateInvite: jest.fn(),
  canRegisterWithInvite: jest.fn(),
  registerWithInvite: jest.fn(),
  deleteInvite: jest.fn(),
  permanentlyDeleteInvite: jest.fn(),
  getUserInvites: jest.fn(),
  getUserInvitesByUsername: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('InvitesController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitesController],
      providers: [
        { provide: InvitesFacadeService, useValue: mockFacade },
        { provide: Reflector, useValue: new Reflector() },
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

    app = module.createNestApplication();

    // These routes are no longer public: the identity that used to come from

    // the URL or the body is now taken from the authenticated principal.

    // This suite covers the ValidationPipe and the exception filter, so it

    // runs as a signed-in caller.

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

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ==================== POST /wingull/invites ====================

  // ── POST /wingull/invites ──────────────────────────────────────────────
  describe('POST /wingull/invites', () => {
    it('returns 201 and delegates to facade.createInvite', async () => {
      (mockFacade.createInvite! as jest.Mock).mockResolvedValue({
        id: 'abc-123',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/wingull/invites')
        .send({ uuid: MOCK_UUID, username: 'Luisca343' });

      expect(res.status).toBe(201);
      expect(mockFacade.createInvite).toHaveBeenCalledWith(
        MOCK_UUID,
        'Luisca343',
      );
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/invites')
        .send({ uuid: 'not-a-uuid', username: 'Luisca343' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when username is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/invites')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/invites')
        .send({ username: 'Luisca343' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is sent', async () => {
      const res = await request(app.getHttpServer())
        .post('/wingull/invites')
        .send({ uuid: MOCK_UUID, username: 'Luisca343', extra: 'field' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /wingull/invites ====================

  // ── GET /wingull/invites ───────────────────────────────────────────────
  describe('GET /wingull/invites', () => {
    it('returns 200 and delegates to facade.getAllInvites', async () => {
      (mockFacade.getAllInvites! as jest.Mock).mockResolvedValue([
        { id: 'abc' },
      ] as any);

      const res = await request(app.getHttpServer()).get('/wingull/invites');

      expect(res.status).toBe(200);
      expect(mockFacade.getAllInvites).toHaveBeenCalled();
    });
  });

  // ==================== GET /wingull/invites/statistics ====================

  // ── GET /wingull/invites/statistics ────────────────────────────────────
  describe('GET /wingull/invites/statistics', () => {
    it('returns 200 and delegates to facade.getInviteStatistics', async () => {
      (mockFacade.getInviteStatistics! as jest.Mock).mockResolvedValue({
        total: 5,
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/wingull/invites/statistics',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getInviteStatistics).toHaveBeenCalled();
    });
  });

  // ==================== GET /wingull/invites/user/:uuid ====================

  // ── GET /wingull/invites/user/:uuid ────────────────────────────────────
  describe('GET /wingull/invites/user/:uuid', () => {
    it('returns 200 and delegates to facade.getUserInvites', async () => {
      (mockFacade.getUserInvites! as jest.Mock).mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        `/wingull/invites/user/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserInvites).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== GET /wingull/invites/username/:username ====================

  // ── GET /wingull/invites/username/:username ────────────────────────────
  describe('GET /wingull/invites/username/:username', () => {
    it('returns 200 and delegates to facade.getUserInvitesByUsername', async () => {
      (mockFacade.getUserInvitesByUsername! as jest.Mock).mockResolvedValue(
        [] as any,
      );

      const res = await request(app.getHttpServer()).get(
        '/wingull/invites/username/Luisca343',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserInvitesByUsername).toHaveBeenCalledWith(
        'Luisca343',
      );
    });
  });

  // ==================== GET /wingull/invites/:id ====================

  // ── GET /wingull/invites/:id ───────────────────────────────────────────
  describe('GET /wingull/invites/:id', () => {
    it('returns 200 when invite exists', async () => {
      (mockFacade.getInviteById! as jest.Mock).mockResolvedValue({
        id: 'abc-123',
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/wingull/invites/abc-123',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getInviteById).toHaveBeenCalledWith('abc-123');
    });

    it('returns 200 with not-found body when invite does not exist', async () => {
      (mockFacade.getInviteById! as jest.Mock).mockResolvedValue(null as any);

      const res = await request(app.getHttpServer()).get(
        '/wingull/invites/nonexistent',
      );

      expect(res.status).toBe(200);
      // Controller returns not-found object wrapped by ResponseInterceptor
      expect(mockFacade.getInviteById).toHaveBeenCalledWith('nonexistent');
    });
  });

  // ==================== GET /wingull/invites/:id/validate ====================

  // ── GET /wingull/invites/:id/validate ──────────────────────────────────
  describe('GET /wingull/invites/:id/validate', () => {
    it('returns 200 and delegates to facade.validateInvite', async () => {
      (mockFacade.validateInvite! as jest.Mock).mockResolvedValue({
        valid: true,
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/wingull/invites/abc-123/validate',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.validateInvite).toHaveBeenCalledWith('abc-123');
    });
  });

  // ==================== GET /wingull/invites/:id/can-register ====================

  // ── GET /wingull/invites/:id/can-register ──────────────────────────────
  describe('GET /wingull/invites/:id/can-register', () => {
    it('returns 200 and delegates to facade.canRegisterWithInvite', async () => {
      (mockFacade.canRegisterWithInvite! as jest.Mock).mockResolvedValue({
        canRegister: true,
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/wingull/invites/abc-123/can-register',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.canRegisterWithInvite).toHaveBeenCalledWith('abc-123');
    });
  });

  // ==================== POST /wingull/invites/:id/register ====================

  // ── POST /wingull/invites/:id/register ─────────────────────────────────
  describe('POST /wingull/invites/:id/register', () => {
    it('returns 201 and delegates to facade.registerWithInvite', async () => {
      (mockFacade.registerWithInvite! as jest.Mock).mockResolvedValue({
        success: true,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/wingull/invites/abc-123/register')
        .send({
          values: {
            username: 'Luisca343',
            mc_username: 'Luisca343',
            email: 'luis@example.com',
            password: 'secret123',
          },
        });

      expect(res.status).toBe(201);
      expect(mockFacade.registerWithInvite).toHaveBeenCalledWith('abc-123', {
        username: 'Luisca343',
        mc_username: 'Luisca343',
        email: 'luis@example.com',
        password: 'secret123',
      });
    });
  });

  // ==================== DELETE /wingull/invites/:id ====================

  // ── DELETE /wingull/invites/:id ────────────────────────────────────────
  describe('DELETE /wingull/invites/:id', () => {
    it('returns 200 and delegates to facade.deleteInvite', async () => {
      (mockFacade.deleteInvite! as jest.Mock).mockResolvedValue({
        success: true,
      } as any);

      const res = await request(app.getHttpServer()).delete(
        '/wingull/invites/abc-123',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.deleteInvite).toHaveBeenCalledWith('abc-123');
    });
  });

  // ==================== DELETE /wingull/invites/:id/permanent ====================

  // ── DELETE /wingull/invites/:id/permanent ──────────────────────────────
  describe('DELETE /wingull/invites/:id/permanent', () => {
    it('returns 200 and delegates to facade.permanentlyDeleteInvite', async () => {
      (mockFacade.permanentlyDeleteInvite! as jest.Mock).mockResolvedValue({
        success: true,
      } as any);

      const res = await request(app.getHttpServer()).delete(
        '/wingull/invites/abc-123/permanent',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.permanentlyDeleteInvite).toHaveBeenCalledWith(
        'abc-123',
      );
    });
  });
});
