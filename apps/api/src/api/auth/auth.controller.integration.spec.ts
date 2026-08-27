import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthThrottlerGuard } from '@api/_utils/guards/auth-throttler.guard';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
  loginProvenMinecraft: jest.fn(),
  refreshToken: jest.fn(),
  googleLogin: jest.fn(),
};

const mockPasswordResetService = {
  requestReset: jest.fn(),
  resetPassword: jest.fn(),
};

const mockEmailVerificationService = {
  sendVerification: jest.fn(),
  verify: jest.fn(),
};

const mockUsersRepository = {
  bumpSessionVersion: jest.fn().mockResolvedValue(undefined),
  getSessionVersion: jest.fn().mockResolvedValue(0),
};

describe('AuthController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: PasswordResetService,
          useValue: mockPasswordResetService,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        { provide: Logger, useValue: mockLogger },
        // Injected for /auth/signout-everywhere, which bumps the caller's
        // session version. Stubbed here: this suite covers validation and the
        // exception filter, not revocation behaviour.
        {
          provide: BoffMediaUsersRepository,
          useValue: mockUsersRepository,
        },
        ResponseInterceptor,
        Reflector,
      ],
    })
      // Pass-through the throttler guard — the test module doesn't wire up the
      // throttler infrastructure and these specs cover validation, not limits.
      .overrideGuard(AuthThrottlerGuard)
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

    it('returns 401 when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'validuser', password: 'validpass' });

      expect(res.status).toBe(401);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'validuser',
        'validpass',
      );
    });

    it('calls AuthService and returns a token when credentials are valid', async () => {
      mockAuthService.validateUser.mockResolvedValue({ id: 1, name: 'ash' });
      mockAuthService.login.mockResolvedValue({ access_token: 'tok' });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'validuser', password: 'validpass' });

      expect(res.status).toBeLessThan(300);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        'validuser',
        'validpass',
      );
      expect(mockAuthService.login).toHaveBeenCalled();
    });
  });

  // ── POST /auth/loginmc — removed ───────────────────────────────────────
  // The world-string login is gone, not deprecated. Asserted here because a
  // reintroduced route would be a silent downgrade: it minted real ingame
  // sessions from a public UUID plus a value that ships in the browser bundle.
  describe('POST /auth/loginmc — removed', () => {
    it('no longer exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/loginmc')
        .send({
          username: 'ash',
          uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
          world: 'world1',
        });

      expect(res.status).toBe(404);
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

  // ── POST /auth/forgot — ForgotPasswordDto validation ───────────────────
  describe('POST /auth/forgot — ForgotPasswordDto validation', () => {
    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/forgot')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns a generic success and delegates when email is valid', async () => {
      mockPasswordResetService.requestReset.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/auth/forgot')
        .send({ email: 'ash@pokemon.com' });

      expect(res.status).toBeLessThan(300);
      expect(mockPasswordResetService.requestReset).toHaveBeenCalledWith(
        'ash@pokemon.com',
      );
    });
  });

  // ── POST /auth/reset — ResetPasswordDto validation ─────────────────────
  describe('POST /auth/reset — ResetPasswordDto validation', () => {
    it('returns 400 when token is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset')
        .send({ newPassword: 'securepw1' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when newPassword is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/reset')
        .send({ token: 'abc', newPassword: 'short' });

      expect(res.status).toBe(400);
    });

    it('delegates to PasswordResetService when body is valid', async () => {
      mockPasswordResetService.resetPassword.mockResolvedValue({
        success: true,
      });

      const res = await request(app.getHttpServer())
        .post('/auth/reset')
        .send({ token: 'reset-token', newPassword: 'securepw1' });

      expect(res.status).toBeLessThan(300);
      expect(mockPasswordResetService.resetPassword).toHaveBeenCalledWith(
        'reset-token',
        'securepw1',
      );
    });
  });

  // ── POST /auth/verify-email — VerifyEmailDto validation ────────────────
  describe('POST /auth/verify-email — VerifyEmailDto validation', () => {
    it('returns 400 when token is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({});

      expect(res.status).toBe(400);
    });

    it('delegates to EmailVerificationService when token is present', async () => {
      mockEmailVerificationService.verify.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'verify-token' });

      expect(res.status).toBeLessThan(300);
      expect(mockEmailVerificationService.verify).toHaveBeenCalledWith(
        'verify-token',
      );
    });
  });

  // ── POST /auth/resend-verification — ResendVerificationDto validation ──
  describe('POST /auth/resend-verification — ResendVerificationDto validation', () => {
    it('returns 400 when email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('returns a generic success and delegates when email is valid', async () => {
      mockEmailVerificationService.sendVerification.mockResolvedValue(
        undefined,
      );

      const res = await request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email: 'ash@pokemon.com' });

      expect(res.status).toBeLessThan(300);
      expect(
        mockEmailVerificationService.sendVerification,
      ).toHaveBeenCalledWith('ash@pokemon.com');
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
