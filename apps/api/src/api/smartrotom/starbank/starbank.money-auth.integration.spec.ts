import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');

const SERVER_TOKEN = 'teras-server-token-for-tests';
const MC_WORLD = '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365';
const JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
const SESSION_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

// Mutable so a single suite can exercise the flag in both positions — the whole
// point is the DIFFERENCE the flag makes.
const mockEnv = {
  TERAS_API_TOKEN: SERVER_TOKEN as string | undefined,
  ENFORCE_MONEY_AUTH: true,
  MC_WORLD,
  JWT_SECRET,
};

jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

/* eslint-disable @typescript-eslint/no-require-imports */
const { StarbankController } =
  require('./starbank.controller') as typeof import('./starbank.controller');
const { StarbankFacadeService } =
  require('./starbank.facade.service') as typeof import('./starbank.facade.service');
const { JwtStrategy } =
  require('@api/auth/jwt.strategy') as typeof import('@api/auth/jwt.strategy');
const { BoffMediaUsersFacadeService } =
  require('@api/boffmedia/users/users.facade.service') as typeof import('@api/boffmedia/users/users.facade.service');
const { ResponseInterceptor } =
  require('@api/_utils/interceptors/response.interceptor') as typeof import('@api/_utils/interceptors/response.interceptor');
const { GlobalExceptionFilter } =
  require('@/common/filters/global-exception.filter') as typeof import('@/common/filters/global-exception.filter');
/* eslint-enable @typescript-eslint/no-require-imports */

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  transfer: jest.fn(),
  shop: jest.fn(),
};

const TRANSFER = '/smartrotom/starbank/transfer';
const SHOP = '/smartrotom/starbank/shop';

const transferBody = (extra: Record<string, unknown> = {}) => ({
  from: 1,
  to: 2,
  amount: 10,
  concept: 'integration test transfer',
  ...extra,
});

/**
 * The auth contract of the two money guards, driven over HTTP with the REAL
 * guards and a REAL passport JWT strategy.
 *
 * Every other starbank spec overrides these guards to `() => true` so it can
 * test validation; that is what let the `mcUuid` claim go missing unnoticed.
 * Here the guard, the strategy and `resolveActor` all run for real, so the
 * suite fails if the identity stops reaching the actor.
 */
describe('starbank money auth — ENFORCE_MONEY_AUTH contract', () => {
  let app: INestApplication;
  let jwt: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [StarbankController],
      providers: [
        { provide: StarbankFacadeService, useValue: mockFacade },
        { provide: Logger, useValue: mockLogger },
        {
          provide: BoffMediaUsersFacadeService,
          useValue: { getUserById: jest.fn().mockResolvedValue({ id: 1 }) },
        },
        JwtStrategy,
        ResponseInterceptor,
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    jwt = moduleRef.get(JwtService);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as never));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.ENFORCE_MONEY_AUTH = true;
    mockEnv.TERAS_API_TOKEN = SERVER_TOKEN;
  });

  // A website session: no `typ` claim (WEBSITE_TOKEN_TYPES treats its absence
  // as `access`), carrying the Minecraft uuid the actor is resolved from.
  const sessionToken = (mcUuid: string | undefined = SESSION_UUID) =>
    jwt.sign({ sub: 1, username: 'tester', roles: [], mcUuid });

  describe('the legacy body.server tripwire', () => {
    it('is refused when the flag is on', async () => {
      await request(app.getHttpServer())
        .post(TRANSFER)
        .send(transferBody({ server: MC_WORLD }))
        .expect(401);
    });

    it('is refused on the transitional guard too', async () => {
      await request(app.getHttpServer())
        .post(SHOP)
        .send({ server: MC_WORLD })
        .expect(401);
    });

    // Pins the flag as the thing that closes it: same request, flag off, admitted.
    it('is still accepted when the flag is off', async () => {
      mockEnv.ENFORCE_MONEY_AUTH = false;

      const res = await request(app.getHttpServer())
        .post(TRANSFER)
        .send(transferBody({ server: MC_WORLD }));

      expect(res.status).not.toBe(401);
      expect(mockFacade.transfer).toHaveBeenCalled();
    });
  });

  describe("the mod's server Bearer", () => {
    it('is accepted and marks the request serverAuthed', async () => {
      const res = await request(app.getHttpServer())
        .post(TRANSFER)
        .set('Authorization', `Bearer ${SERVER_TOKEN}`)
        .send(transferBody());

      expect(res.status).not.toBe(401);
      expect(mockFacade.transfer).toHaveBeenCalledWith(
        1,
        2,
        10,
        'integration test transfer',
        { serverAuthed: true },
      );
    });

    it('is refused when it does not match', async () => {
      await request(app.getHttpServer())
        .post(TRANSFER)
        .set('Authorization', 'Bearer not-the-server-token')
        .send(transferBody())
        .expect(401);
    });

    // `matchesServerToken` fails closed: an unset TERAS_API_TOKEN must match
    // nothing rather than everything.
    it('is refused when TERAS_API_TOKEN is unset', async () => {
      mockEnv.TERAS_API_TOKEN = undefined;

      await request(app.getHttpServer())
        .post(TRANSFER)
        .set('Authorization', `Bearer ${SERVER_TOKEN}`)
        .send(transferBody())
        .expect(401);
    });
  });

  describe('a website session', () => {
    // The regression guard for the missing `mcUuid` claim: the identity has to
    // survive login -> JWT -> JwtStrategy -> resolveActor. When it did not,
    // `assertActsAsSelf` silently skipped every ownership check.
    it('reaches the facade as an identified, non-server actor', async () => {
      const res = await request(app.getHttpServer())
        .post(TRANSFER)
        .set('Authorization', `Bearer ${sessionToken()}`)
        .send(transferBody());

      expect(res.status).not.toBe(401);
      expect(mockFacade.transfer).toHaveBeenCalledWith(
        1,
        2,
        10,
        'integration test transfer',
        { serverAuthed: false, mcUuid: SESSION_UUID },
      );
    });

    it('is refused when the token is not signed by us', async () => {
      const forged = jwt.sign(
        { sub: 1, mcUuid: SESSION_UUID },
        { secret: 'wrong-secret-wrong-secret-wrong!' },
      );

      await request(app.getHttpServer())
        .post(TRANSFER)
        .set('Authorization', `Bearer ${forged}`)
        .send(transferBody())
        .expect(401);
    });

    // A refresh token is signed by the same secret; only the `typ` claim keeps
    // it from being replayed as a session.
    it('is refused when the token is a refresh token', async () => {
      const refresh = jwt.sign({
        sub: 1,
        mcUuid: SESSION_UUID,
        typ: 'refresh',
      });

      await request(app.getHttpServer())
        .post(TRANSFER)
        .set('Authorization', `Bearer ${refresh}`)
        .send(transferBody())
        .expect(401);
    });

    it('cannot reach the server-only transitional route', async () => {
      await request(app.getHttpServer())
        .post(SHOP)
        .set('Authorization', `Bearer ${sessionToken()}`)
        .send({})
        .expect(401);
    });
  });

  it('refuses a request carrying no credential at all', async () => {
    await request(app.getHttpServer())
      .post(TRANSFER)
      .send(transferBody())
      .expect(401);
  });
});
