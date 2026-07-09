import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { BoffMediaUsersController } from './users.controller';
import { BoffMediaUsersFacadeService } from './users.facade.service';
import { PasswordService } from '@api/auth/password.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { OwnerOrAdminGuard } from '@api/_utils/guards/owner-or-admin.guard';
import { AuthThrottlerGuard } from '@api/_utils/guards/auth-throttler.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  createUser: jest.fn(),
  findOrCreateUser: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  getUserByUsername: jest.fn(),
  getUserWithIntegrations: jest.fn(),
  getFullUserByUsername: jest.fn(),
  findByEmail: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  validateUser: jest.fn(),
  createFromGoogle: jest.fn(),
  createMinecraftUser: jest.fn(),
  linkMinecraftAccount: jest.fn(),
  getUserRoles: jest.fn(),
  getMultipleUsersWithIntegrations: jest.fn(),
  getUserStatistics: jest.fn(),
  validateUserExists: jest.fn(),
};

// Plain (non-jest.fn) so jest.resetAllMocks() can't wipe the return value —
// these specs cover routing/validation, not the password policy itself.
const mockPasswordService = {
  validatePassword: () => ({ isValid: true, errors: [], strength: 'strong' }),
};

const mockUser = { id: 1, username: 'TrainerAsh', email: 'ash@pokemon.com' };

describe('BoffMediaUsersController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BoffMediaUsersController],
      providers: [
        { provide: BoffMediaUsersFacadeService, useValue: mockFacade },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: Logger, useValue: mockLogger },
        ResponseInterceptor,
        Reflector,
      ],
    })
      // These specs cover ValidationPipe + routing + facade delegation, not auth.
      // Pass-through the controller guards so the test module needn't wire up
      // passport/throttler infrastructure (auth is exercised in live-verify).
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OwnerOrAdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthThrottlerGuard)
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

  // ── POST /users — CreateUserDto validation ───────────────────────────────

  describe('POST /users — CreateUserDto validation', () => {
    const validBody = { username: 'TrainerAsh', password: 'secure123' };

    it('returns 201 and calls facade.createUser when body is valid', async () => {
      mockFacade.createUser.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/users')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(mockFacade.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'TrainerAsh' }),
      );
    });

    it('returns 400 when username is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ password: 'secure123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when username is shorter than 3 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ ...validBody, username: 'ab' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when username exceeds 32 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ ...validBody, username: 'a'.repeat(33) });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ username: 'TrainerAsh' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is shorter than 6 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ ...validBody, password: '123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when email is present but invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ ...validBody, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ ...validBody, hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('accepts optional email when valid', async () => {
      mockFacade.createUser.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ ...validBody, email: 'ash@pokemon.com' });

      expect(res.status).toBe(201);
    });
  });

  // ── GET /users ──────────────────────────────────────────────────────────

  describe('GET /users', () => {
    it('returns 200 and delegates to facade.getAllUsers', async () => {
      mockFacade.getAllUsers.mockResolvedValue([mockUser]);

      const res = await request(app.getHttpServer()).get('/users');

      expect(res.status).toBe(200);
      expect(mockFacade.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('returns paginated response shape', async () => {
      mockFacade.getAllUsers.mockResolvedValue([mockUser, mockUser]);

      const res = await request(app.getHttpServer()).get(
        '/users?limit=1&offset=0',
      );

      expect(res.status).toBe(200);
    });
  });

  // ── GET /users/statistics ────────────────────────────────────────────────

  describe('GET /users/statistics', () => {
    it('returns 200 and delegates to facade.getUserStatistics', async () => {
      mockFacade.getUserStatistics.mockResolvedValue({
        total: 5,
        withSmartRotom: 3,
      });

      const res = await request(app.getHttpServer()).get('/users/statistics');

      expect(res.status).toBe(200);
      expect(mockFacade.getUserStatistics).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /users/:id ───────────────────────────────────────────────────────

  describe('GET /users/:id', () => {
    it('returns 200 and passes id to facade.getUserById', async () => {
      mockFacade.getUserById.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer()).get('/users/1');

      expect(res.status).toBe(200);
      expect(mockFacade.getUserById).toHaveBeenCalledWith(1);
    });

    it('returns 400 when id is not numeric (ParseIntPipe)', async () => {
      const res = await request(app.getHttpServer()).get('/users/abc');

      expect(res.status).toBe(400);
    });

    it('returns 404 when user is not found', async () => {
      mockFacade.getUserById.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get('/users/999');

      expect(res.status).toBe(404);
    });
  });

  // ── GET /users/:id/integrations ──────────────────────────────────────────

  describe('GET /users/:id/integrations', () => {
    it('returns 200 and delegates to facade.getUserWithIntegrations', async () => {
      mockFacade.getUserWithIntegrations.mockResolvedValue({
        ...mockUser,
        smartRotom: null,
      });

      const res = await request(app.getHttpServer()).get(
        '/users/1/integrations',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserWithIntegrations).toHaveBeenCalledWith(
        '1',
        'id',
      );
    });

    it('returns 400 when id is not numeric', async () => {
      const res = await request(app.getHttpServer()).get(
        '/users/abc/integrations',
      );

      expect(res.status).toBe(400);
    });
  });

  // ── GET /users/username/:username ────────────────────────────────────────

  describe('GET /users/username/:username', () => {
    it('returns 200 and delegates to facade.getUserByUsername', async () => {
      mockFacade.getUserByUsername.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer()).get(
        '/users/username/TrainerAsh',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserByUsername).toHaveBeenCalledWith('TrainerAsh');
    });

    it('returns 404 when user is not found', async () => {
      mockFacade.getUserByUsername.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        '/users/username/nobody',
      );

      expect(res.status).toBe(404);
    });
  });

  // ── GET /users/email/:email ──────────────────────────────────────────────

  describe('GET /users/email/:email', () => {
    it('returns 200 and delegates to facade.findByEmail', async () => {
      mockFacade.findByEmail.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer()).get(
        '/users/email/ash@pokemon.com',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.findByEmail).toHaveBeenCalledWith('ash@pokemon.com');
    });

    it('returns 404 when email not found', async () => {
      mockFacade.findByEmail.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        '/users/email/nobody@test.com',
      );

      expect(res.status).toBe(404);
    });
  });

  // ── GET /users/:id/roles ─────────────────────────────────────────────────

  describe('GET /users/:id/roles', () => {
    it('returns 200 and delegates to facade.getUserRoles', async () => {
      mockFacade.getUserRoles.mockResolvedValue(['admin', 'user']);

      const res = await request(app.getHttpServer()).get('/users/1/roles');

      expect(res.status).toBe(200);
      expect(mockFacade.getUserRoles).toHaveBeenCalledWith(1);
    });
  });

  // ── PATCH /users/:id — UpdateUserDto ─────────────────────────────────────

  describe('PATCH /users/:id — UpdateUserDto validation', () => {
    it('returns 200 and calls facade.updateUser', async () => {
      mockFacade.updateUser.mockResolvedValue({
        ...mockUser,
        username: 'NewName',
      });

      const res = await request(app.getHttpServer())
        .patch('/users/1')
        .send({ username: 'NewName' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ username: 'NewName' }),
      );
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/1')
        .send({ hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when id is not numeric', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/abc')
        .send({ username: 'ValidName' });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /users/:id ────────────────────────────────────────────────────

  describe('DELETE /users/:id', () => {
    it('returns 200 on successful delete', async () => {
      mockFacade.deleteUser.mockResolvedValue({
        success: true,
        message: 'Deleted',
      });

      const res = await request(app.getHttpServer()).delete('/users/1');

      expect(res.status).toBe(200);
      expect(mockFacade.deleteUser).toHaveBeenCalledWith(1);
    });

    it('returns 400 when id is not numeric', async () => {
      const res = await request(app.getHttpServer()).delete('/users/abc');

      expect(res.status).toBe(400);
    });
  });

  // ── POST /users/batch — BatchUsersDto validation ─────────────────────────

  describe('POST /users/batch — BatchUsersDto validation', () => {
    it('returns 200 and delegates to facade when userIds is valid', async () => {
      mockFacade.getMultipleUsersWithIntegrations.mockResolvedValue([mockUser]);

      const res = await request(app.getHttpServer())
        .post('/users/batch')
        .send({ userIds: [1, 2, 3] });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getMultipleUsersWithIntegrations).toHaveBeenCalledWith([
        1, 2, 3,
      ]);
    });

    it('returns 400 when userIds is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/batch')
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when userIds contains non-numeric values', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/batch')
        .send({ userIds: ['a', 'b'] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/batch')
        .send({ userIds: [1], hackerField: 'x' });

      expect(res.status).toBe(400);
    });
  });

  // ── GET /users/validate/:type/:identifier ────────────────────────────────

  describe('GET /users/validate/:type/:identifier', () => {
    it('returns 200 and delegates to facade.validateUserExists', async () => {
      mockFacade.validateUserExists.mockResolvedValue(true);

      const res = await request(app.getHttpServer()).get(
        '/users/validate/username/TrainerAsh',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.validateUserExists).toHaveBeenCalledWith(
        'TrainerAsh',
        'username',
      );
    });

    it('returns exists:false when user does not exist', async () => {
      mockFacade.validateUserExists.mockResolvedValue(false);

      const res = await request(app.getHttpServer()).get(
        '/users/validate/email/nobody@test.com',
      );

      expect(res.status).toBe(200);
    });
  });

  // ── POST /users/minecraft/register — MinecraftRegistrationDto ───────────

  describe('POST /users/minecraft/register — MinecraftRegistrationDto validation', () => {
    const validMinecraft = {
      username: 'AshMC',
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      world: 'world1',
    };
    const validBody = {
      username: 'TrainerAsh',
      email: 'ash@pokemon.com',
      password: 'securepw1',
      minecraft: validMinecraft,
    };

    it('returns 400 when username is missing', async () => {
      const { username: _u, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/users/minecraft/register')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/minecraft/register')
        .send({ ...validBody, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/minecraft/register')
        .send({ ...validBody, password: 'short' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when minecraft object is missing', async () => {
      const { minecraft: _mc, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/users/minecraft/register')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when minecraft.uuid is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/minecraft/register')
        .send({
          ...validBody,
          minecraft: { ...validMinecraft, uuid: 'not-a-uuid' },
        });

      expect(res.status).toBe(400);
    });

    it('calls facade.createMinecraftUser when body is valid', async () => {
      mockFacade.createMinecraftUser.mockResolvedValue({
        boffMediaUser: mockUser,
        smartRotomUser: null,
        starbankAccounts: [],
        isNewBoffMediaUser: true,
        isNewSmartRotomUser: false,
      });

      const res = await request(app.getHttpServer())
        .post('/users/minecraft/register')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.createMinecraftUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'TrainerAsh',
          email: 'ash@pokemon.com',
        }),
      );
    });
  });

  // ── POST /users/minecraft/link — MinecraftLinkDto ────────────────────────

  describe('POST /users/minecraft/link — MinecraftLinkDto validation', () => {
    const validMinecraft = {
      username: 'AshMC',
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      world: 'world1',
    };
    const validBody = {
      username: 'TrainerAsh',
      email: 'ash@pokemon.com',
      password: 'securepw1',
      minecraft: validMinecraft,
    };

    it('returns 400 when minecraft object is missing', async () => {
      const { minecraft: _mc, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/users/minecraft/link')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('calls facade.linkMinecraftAccount when body is valid', async () => {
      mockFacade.linkMinecraftAccount.mockResolvedValue({
        boffMediaUser: mockUser,
        smartRotomUser: null,
        starbankAccounts: [],
      });

      const res = await request(app.getHttpServer())
        .post('/users/minecraft/link')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.linkMinecraftAccount).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'TrainerAsh' }),
      );
    });
  });

  // ── POST /users/google/auth — GoogleAuthDto ───────────────────────────────

  describe('POST /users/google/auth — GoogleAuthDto validation', () => {
    const validBody = {
      email: 'ash@gmail.com',
      name: 'Ash Ketchum',
      googleId: '1234567890',
    };

    it('returns 400 when email is missing', async () => {
      const { email: _e, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/users/google/auth')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/google/auth')
        .send({ ...validBody, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when googleId is missing', async () => {
      const { googleId: _g, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/users/google/auth')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/google/auth')
        .send({ ...validBody, hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('calls facade.createFromGoogle when body is valid', async () => {
      mockFacade.createFromGoogle.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/users/google/auth')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.createFromGoogle).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ash@gmail.com',
          googleId: '1234567890',
        }),
      );
    });

    it('accepts optional profilePicture', async () => {
      mockFacade.createFromGoogle.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/users/google/auth')
        .send({ ...validBody, profilePicture: 'https://example.com/pic.jpg' });

      expect(res.status).toBeLessThan(300);
    });
  });

  // ── POST /users/auth/login — UserLoginDto ────────────────────────────────

  describe('POST /users/auth/login — UserLoginDto validation', () => {
    const validBody = { username: 'TrainerAsh', password: 'secure123' };

    it('returns 400 when username is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/auth/login')
        .send({ password: 'secure123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is shorter than 6 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/auth/login')
        .send({ ...validBody, password: '123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/auth/login')
        .send({ ...validBody, hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('calls facade.validateUser when body is valid', async () => {
      mockFacade.validateUser.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/users/auth/login')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.validateUser).toHaveBeenCalledWith(
        'TrainerAsh',
        'secure123',
      );
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer()).post('/users').send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
