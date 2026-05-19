import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
  loginMC: jest.fn(),
  registerMinecraft: jest.fn(),
  linkMinecraft: jest.fn(),
  refreshToken: jest.fn(),
  googleLogin: jest.fn(),
};

describe('AuthController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Logger, useValue: mockLogger },
        ResponseInterceptor,
        Reflector,
      ],
    }).compile();

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

  // ── POST /auth/login — ValidationPipe ──────────────────────────────────
  describe('POST /auth/login — ValidationPipe', () => {
    it('returns 400 when username is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'validpass' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
        path: '/auth/login',
      });
    });

    it('returns 400 when password is too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'validuser', password: 'abc' });

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.path).toBe('/auth/login');
    });

    it('returns 400 when username is too short (min 3)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'ab', password: 'validpass' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        username: 'validuser',
        password: 'validpass',
        unknownField: 'x',
      });

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('calls AuthService when body is valid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'validuser', password: 'validpass' });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'validuser',
        'validpass',
      );
    });
  });

  // ── POST /auth/loginmc — DTO validation ────────────────────────────────
  describe('POST /auth/loginmc — DTO validation', () => {
    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/loginmc')
        .send({ username: 'ash', world: 'world1' });

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/loginmc')
        .send({ username: 'ash', uuid: 'not-a-uuid', world: 'world1' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when world is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/loginmc')
        .send({
          username: 'ash',
          uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
        });

      expect(res.status).toBe(400);
    });

    it('calls AuthService when body is valid', async () => {
      mockAuthService.loginMC.mockResolvedValue({ access_token: 'tok' });

      const res = await request(app.getHttpServer())
        .post('/auth/loginmc')
        .send({
          username: 'ash',
          uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
          world: 'world1',
        });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.loginMC).toHaveBeenCalled();
    });
  });

  // ── POST /auth/register-minecraft — RegisterMinecraftDto validation ────
  describe('POST /auth/register-minecraft — RegisterMinecraftDto validation', () => {
    const validBody = {
      username: 'TrainerAsh',
      email: 'ash@pokemon.com',
      password: 'securepw1',
      minecraft: {
        username: 'AshMC',
        uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
        world: 'world1',
      },
    };

    it('returns 400 when username is missing', async () => {
      const { username: _u, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/auth/register-minecraft')
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register-minecraft')
        .send({ ...validBody, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register-minecraft')
        .send({ ...validBody, password: 'short' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when minecraft object is missing', async () => {
      const { minecraft: _mc, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/auth/register-minecraft')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when minecraft.uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register-minecraft')
        .send({
          ...validBody,
          minecraft: { ...validBody.minecraft, uuid: 'not-a-uuid' },
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 when minecraft.world is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register-minecraft')
        .send({
          ...validBody,
          minecraft: {
            username: 'AshMC',
            uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
          },
        });

      expect(res.status).toBe(400);
    });

    it('calls AuthService when body is valid', async () => {
      mockAuthService.registerMinecraft.mockResolvedValue({
        access_token: 'tok',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/register-minecraft')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.registerMinecraft).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'TrainerAsh',
          email: 'ash@pokemon.com',
        }),
      );
    });
  });

  // ── POST /auth/refresh — RefreshTokenDto validation ────────────────────
  describe('POST /auth/refresh — RefreshTokenDto validation', () => {
    it('returns 400 when refresh_token is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });

    it('calls AuthService.refreshToken when token is present', async () => {
      mockAuthService.refreshToken.mockResolvedValue({
        access_token: 'new-tok',
      });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'some-token' });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('some-token');
    });
  });

  // ── POST /auth/link-minecraft — RegisterMinecraftDto validation ────────
  describe('POST /auth/link-minecraft — RegisterMinecraftDto validation', () => {
    const validBody = {
      username: 'TrainerAsh',
      email: 'ash@pokemon.com',
      password: 'securepw1',
      minecraft: {
        username: 'AshMC',
        uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
        world: 'world1',
      },
    };

    it('returns 400 when username is missing', async () => {
      const { username: _u, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/auth/link-minecraft')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/link-minecraft')
        .send({ ...validBody, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/link-minecraft')
        .send({ ...validBody, password: 'short' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when minecraft object is missing', async () => {
      const { minecraft: _mc, ...body } = validBody;
      const res = await request(app.getHttpServer())
        .post('/auth/link-minecraft')
        .send(body);

      expect(res.status).toBe(400);
    });

    it('returns 400 when minecraft.uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/link-minecraft')
        .send({
          ...validBody,
          minecraft: { ...validBody.minecraft, uuid: 'not-a-uuid' },
        });

      expect(res.status).toBe(400);
    });

    it('calls AuthService.linkMinecraft when body is valid', async () => {
      mockAuthService.linkMinecraft.mockResolvedValue({ access_token: 'tok' });

      const res = await request(app.getHttpServer())
        .post('/auth/link-minecraft')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.linkMinecraft).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'TrainerAsh',
          email: 'ash@pokemon.com',
        }),
      );
    });
  });

  // ── POST /auth/google/callback — GoogleCallbackDto validation ──────────
  // DTO has optional email, name, picture fields — no required token field.
  describe('POST /auth/google/callback — GoogleCallbackDto validation', () => {
    it('returns 2xx with empty body (all fields optional)', async () => {
      mockAuthService.googleLogin.mockResolvedValue({ access_token: 'tok' });

      const res = await request(app.getHttpServer())
        .post('/auth/google/callback')
        .send({});

      expect(res.status).toBeLessThan(300);
    });

    it('returns 400 when email is present but invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/google/callback')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/google/callback')
        .send({ hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('calls AuthService.googleLogin with email and name', async () => {
      mockAuthService.googleLogin.mockResolvedValue({ access_token: 'tok' });

      const res = await request(app.getHttpServer())
        .post('/auth/google/callback')
        .send({ email: 'ash@pokemon.com', name: 'TrainerAsh' });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ash@pokemon.com',
          name: 'TrainerAsh',
        }),
      );
    });

    it('calls AuthService.googleLogin with optional picture', async () => {
      mockAuthService.googleLogin.mockResolvedValue({ access_token: 'tok' });

      const res = await request(app.getHttpServer())
        .post('/auth/google/callback')
        .send({
          email: 'ash@pokemon.com',
          name: 'TrainerAsh',
          picture: 'https://example.com/pic.jpg',
        });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.googleLogin).toHaveBeenCalledWith(
        expect.objectContaining({ picture: 'https://example.com/pic.jpg' }),
      );
    });
  });

  // ── GlobalExceptionFilter — error shape ────────────────────────────────
  describe('GlobalExceptionFilter — error shape', () => {
    it('error response always contains statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
