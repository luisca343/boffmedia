import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { IS_PUBLIC_KEY } from '@api/_utils/decorators/public.decorator';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- supertest is CJS; a static import types as a namespace and is not callable.
const request = require('supertest') as typeof import('supertest');

import { StarbankController } from './starbank.controller';
import { StarbankFacadeService } from './starbank.facade.service';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';

/**
 * A15 — "user A cannot read user B's rows", as behaviour rather than as a
 * comment.
 *
 * WHY STARBANK. `scripts/check-ownership-routes.mjs` gives the BREADTH: it
 * walks every controller and refuses a per-user route that carries neither an
 * ownership guard nor a written justification. What a static gate cannot tell
 * you is whether the mechanism it is checking for actually works. This suite is
 * the DEPTH, aimed at the controller where being wrong costs the most: until
 * this pass StarbankController carried a class-level `@Public()`, so
 * `GET /smartrotom/starbank/balance/:uuid`, `accounts/:uuid`,
 * `transactions/user/:uuid` and `transfers/user/:uuid` handed any caller —
 * signed in or not — another player's balance and full transaction history,
 * and `GET accounts` listed every account in the game with no credential at
 * all.
 *
 * WHAT IS REAL AND WHAT IS NOT. The real `RolesGuard` runs, and the
 * public/session decision is resolved from the REAL `IS_PUBLIC_KEY` metadata
 * that `@Public()` and `@RequireSession()` write — read with a real
 * `Reflector`, `getAllAndOverride([handler, class])`, exactly as
 * `JwtAuthGuard` does it. What is replaced is passport: `AuthGuard('jwt')`
 * needs a registered strategy and a signed token, and neither is the subject
 * here. The question this suite answers is "who does the DECORATOR STACK let
 * through, and whose id reaches the service" — not "does passport parse a
 * JWT", which auth's own specs cover.
 *
 * That boundary matters for reading a failure: if `TestJwtGuard` below drifts
 * from `jwt-auth.guard.ts`, this suite stops meaning what it says. It is
 * deliberately six lines long for that reason.
 *
 * The facade is a fake, and its arguments are the assertion. A route that
 * reads the owner from the URL calls the facade with player B's uuid; a route
 * that reads it from the token calls it with player A's. That difference is
 * the entire finding.
 */

const PLAYER_A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const PLAYER_B = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const facade = {
  getAllAccounts: jest.fn().mockResolvedValue([]),
  getTransactions: jest.fn().mockResolvedValue([]),
  getTransfers: jest.fn().mockResolvedValue([]),
  getAccounts: jest.fn().mockResolvedValue([]),
  getBalance: jest.fn().mockResolvedValue({ balance: 0 }),
  getTransactionsByUUID: jest.fn().mockResolvedValue([]),
  getTransfersByUUID: jest.fn().mockResolvedValue([]),
};

/**
 * Who the stubbed strategy says the caller is.
 *
 * `null` means "no credential at all", which is the case the class-level
 * `@Public()` used to allow through to every route in this controller.
 */
let principal: { userId: number; mcUuid?: string; roles?: string[] } | null =
  null;

/**
 * `JwtAuthGuard` with passport taken out, and nothing else changed.
 *
 * The public/session branch is the real one: same `IS_PUBLIC_KEY`, same
 * `getAllAndOverride([handler, class])` order — which is what makes a
 * class-level `@Public()` win over a route guard, and a route-level
 * `@RequireSession()` win over a class-level `@Public()`. Where the real guard
 * would hand off to passport, this asks whether a principal exists.
 */
@Injectable()
class TestJwtGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (principal) ctx.switchToHttp().getRequest().user = principal;
    if (isPublic) return true;
    if (!principal) throw new UnauthorizedException();
    return true;
  }
}

describe('StarbankController — ownership (A15)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [StarbankController],
      providers: [
        { provide: StarbankFacadeService, useValue: facade },
        { provide: Logger, useValue: mockLogger },
        Reflector,
        // Registered as APP_GUARDs in the same order app.module.ts uses, so
        // RolesGuard sees the `req.user` the one above it populated.
        { provide: APP_GUARD, useClass: TestJwtGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    principal = { userId: 1, mcUuid: PLAYER_A };
  });

  /**
   * The four money reads. Each is exercised twice: once anonymously, and once
   * as player A asking for player B by uuid.
   */
  const OWNER_SCOPED = [
    { path: `/smartrotom/starbank/accounts/${PLAYER_B}`, fn: 'getAccounts' },
    { path: `/smartrotom/starbank/balance/${PLAYER_B}`, fn: 'getBalance' },
    {
      path: `/smartrotom/starbank/transactions/user/${PLAYER_B}`,
      fn: 'getTransactionsByUUID',
    },
    {
      path: `/smartrotom/starbank/transfers/user/${PLAYER_B}`,
      fn: 'getTransfersByUUID',
    },
  ] as const;

  describe.each(OWNER_SCOPED)('$path', ({ path, fn }) => {
    it('rejects an anonymous caller', async () => {
      principal = null;
      await request(app.getHttpServer()).get(path).expect(401);
      // Not merely a 403: the handler must never have run. A route that
      // answers 403 AFTER querying the database has already done the read.
      expect(facade[fn]).not.toHaveBeenCalled();
    });

    it("uses the CALLER's uuid, never the one in the URL", async () => {
      await request(app.getHttpServer()).get(path).expect(200);

      expect(facade[fn]).toHaveBeenCalled();
      const args = (facade[fn] as jest.Mock).mock.calls[0];
      // The assertion the whole finding reduces to: PLAYER_B is in the URL,
      // and PLAYER_B must not be what the service is asked about.
      expect(args).not.toContain(PLAYER_B);
      expect(args).toContain(PLAYER_A);
    });
  });

  /**
   * The two per-ACCOUNT reads. They take a numeric id rather than a uuid, so the
   * gate's `:uuid` patterns never saw them and the ownership question has to be
   * answered by a lookup rather than by scoping the query. A numeric id is the
   * easiest thing to enumerate, and what came back is another player's
   * financial history.
   */
  const BY_ACCOUNT_ID = [
    { path: '/smartrotom/starbank/transactions/4242', fn: 'getTransactions' },
    { path: '/smartrotom/starbank/transfers/4242', fn: 'getTransfers' },
  ] as const;

  describe.each(BY_ACCOUNT_ID)('$path', ({ path, fn }) => {
    it('rejects an anonymous caller', async () => {
      principal = null;
      await request(app.getHttpServer()).get(path).expect(401);
      expect(facade[fn]).not.toHaveBeenCalled();
    });

    it("passes the CALLER's uuid to the facade so ownership can be checked", async () => {
      await request(app.getHttpServer()).get(path).expect(200);
      expect(facade[fn]).toHaveBeenCalled();
      // The facade refuses outright when this is missing, so a handler that
      // forgets to thread it cannot silently return another player's rows.
      expect((facade[fn] as jest.Mock).mock.calls[0]).toContain(PLAYER_A);
    });
  });

  describe('GET accounts (every account in the game)', () => {
    it('is not readable anonymously', async () => {
      principal = null;
      await request(app.getHttpServer())
        .get('/smartrotom/starbank/accounts')
        .expect(401);
      expect(facade.getAllAccounts).not.toHaveBeenCalled();
    });

    it('is not readable by an ordinary signed-in player', async () => {
      principal = { userId: 1, mcUuid: PLAYER_A, roles: [] };
      await request(app.getHttpServer())
        .get('/smartrotom/starbank/accounts')
        .expect(403);
      expect(facade.getAllAccounts).not.toHaveBeenCalled();
    });

    it('is readable by ROTOM_ADMIN', async () => {
      principal = {
        userId: 1,
        mcUuid: PLAYER_A,
        roles: [USER_ROLES.ROTOM_ADMIN],
      };
      await request(app.getHttpServer())
        .get('/smartrotom/starbank/accounts')
        .expect(200);
      expect(facade.getAllAccounts).toHaveBeenCalled();
    });
  });
});
