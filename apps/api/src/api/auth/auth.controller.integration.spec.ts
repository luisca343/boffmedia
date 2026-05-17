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

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

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
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'validuser', password: 'validpass', unknownField: 'x' });

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
    });

    it('calls AuthService when body is valid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'validuser', password: 'validpass' });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('validuser', 'validpass');
    });
  });

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
        .send({ username: 'ash', uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' });

      expect(res.status).toBe(400);
    });

    it('calls AuthService when body is valid', async () => {
      mockAuthService.loginMC.mockResolvedValue({ access_token: 'tok' });

      const res = await request(app.getHttpServer())
        .post('/auth/loginmc')
        .send({ username: 'ash', uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', world: 'world1' });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.loginMC).toHaveBeenCalled();
    });
  });

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
