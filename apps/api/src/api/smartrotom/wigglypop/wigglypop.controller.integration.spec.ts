import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { JwtService } from '@nestjs/jwt';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');

/**
 * The validated env, mutable per test. Guards read `MC_WORLD` at call time and
 * `JwtStrategy` reads `JWT_SECRET` at construction, so this is the only seam
 * the suite needs: every guard, strategy, pipe and ownership check exercised
 * below is the production one.
 *
 * Deliberately NO `.overrideGuard()` anywhere in this file — the guard is the
 * subject. The sibling `*.controller.integration.spec.ts` suites stub it out
 * because they test validation; one that did so here would pass with
 * authentication removed entirely, which is the exact failure it must catch.
 */
const mockEnv: {
  JWT_SECRET: string;
  TERAS_API_TOKEN?: string;
  MC_WORLD: string;
} = {
  JWT_SECRET: 'wigglypop-integration-secret',
  TERAS_API_TOKEN: 'the-mods-opaque-token',
  MC_WORLD: '5b8d2f3c-1a4e-4c9b-9d2f-3e7a8b1c4d5e',
};

jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

/* eslint-disable @typescript-eslint/no-require-imports */
const { WigglypopController } =
  require('./wigglypop.controller') as typeof import('./wigglypop.controller');
const { WigglypopFacadeService } =
  require('./wigglypop.facade.service') as typeof import('./wigglypop.facade.service');
const { WigglypopListingsService } =
  require('./services/wigglypop-listings.service') as typeof import('./services/wigglypop-listings.service');
const { WigglypopOrdersService } =
  require('./services/wigglypop-orders.service') as typeof import('./services/wigglypop-orders.service');
const { WigglypopTradingService } =
  require('./services/wigglypop-trading.service') as typeof import('./services/wigglypop-trading.service');
const { WigglypopCustodyService } =
  require('./services/wigglypop-custody.service') as typeof import('./services/wigglypop-custody.service');
const { JwtStrategy } =
  require('@api/auth/jwt.strategy') as typeof import('@api/auth/jwt.strategy');
const { BoffMediaUsersFacadeService } =
  require('@api/boffmedia/users/users.facade.service') as typeof import('@api/boffmedia/users/users.facade.service');
const { GlobalExceptionFilter } =
  require('@/common/filters/global-exception.filter') as typeof import('@/common/filters/global-exception.filter');
/* eslint-enable @typescript-eslint/no-require-imports */

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

/** The signed-in caller. Equals the `mcUuid` claim on the JWT it is paired with. */
const OWN_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
/** Somebody else. Any actor field carrying this from a session must 403. */
const OTHER_UUID = 'a1b2c3d4-1111-4222-8333-444455556666';

/**
 * The DB-touching layer below the ownership check. Reaching one of these IS the
 * assertion for "the request got through the guard into business logic" — the
 * facade above them is real, so `assertActsAsSelf` still runs first.
 */
const listings = { create: jest.fn(), update: jest.fn(), remove: jest.fn() };
const orders = { create: jest.fn() };
const trading = { placeBid: jest.fn() };
const custody = {};

const LISTINGS_URL = '/smartrotom/wigglypop/listings';

/** Minimal body that satisfies CreateListingDto, so any 400 here is a real finding. */
const validListing = (sellerUuid: string) => ({
  sellerUuid,
  kind: 'mon',
  price: 5000,
});

describe('WigglypopController — auth integration (real guard, real JWT, real ownership check)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  /** A website session token shaped exactly as `AuthService.login` mints it. */
  const sessionBearer = (mcUuid: string) =>
    `Bearer ${jwt.sign({
      sub: 1,
      username: 'tester',
      email: 'tester@example.com',
      roles: ['USER'],
      mcUuid,
    })}`;

  type Method = 'post' | 'patch' | 'put' | 'delete';

  const send = (method: Method, url: string, body: Record<string, unknown>) => {
    const agent = request(app.getHttpServer());
    const req =
      method === 'post'
        ? agent.post(url)
        : method === 'patch'
          ? agent.patch(url)
          : method === 'put'
            ? agent.put(url)
            : agent.delete(url);
    return req.send(body);
  };

  beforeAll(async () => {
    jwt = new JwtService({
      secret: mockEnv.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [WigglypopController],
      providers: [
        // REAL — this is what carries assertActsAsSelf / actingUuid.
        WigglypopFacadeService,
        { provide: WigglypopListingsService, useValue: listings },
        { provide: WigglypopOrdersService, useValue: orders },
        { provide: WigglypopTradingService, useValue: trading },
        { provide: WigglypopCustodyService, useValue: custody },
        // REAL — GameOrUserAuthGuard delegates to it for every Bearer that is
        // not the mod's opaque token.
        JwtStrategy,
        {
          provide: BoffMediaUsersFacadeService,
          useValue: {
            getUserById: jest
              .fn()
              .mockResolvedValue({ id: 1, username: 'tester' }),
          },
        },
        {
          // JwtStrategy now reads the account's session_version on every
          // request (one query covering both "user exists" and "token not
          // revoked"). 0 matches a token minted without an `sv` claim.
          provide: BoffMediaUsersRepository,
          useValue: { getSessionVersion: jest.fn().mockResolvedValue(0) },
        },
        { provide: Logger, useValue: mockLogger },
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
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as never));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.TERAS_API_TOKEN = 'the-mods-opaque-token';
    listings.create.mockResolvedValue({ id: 1, sellerUuid: OWN_UUID });
  });

  // ─── The legacy tripwire is permanently removed ────────────────────────────

  it('rejects an anonymous request carrying the legacy body.server tripwire', async () => {
    const res = await send('post', LISTINGS_URL, {
      ...validListing(OWN_UUID),
      server: mockEnv.MC_WORLD,
    });

    expect(res.status).toBe(401);
    expect(listings.create).not.toHaveBeenCalled();
  });

  it('rejects an anonymous request with no credential at all', async () => {
    const res = await send('post', LISTINGS_URL, validListing(OWN_UUID));

    expect(res.status).toBe(401);
    expect(listings.create).not.toHaveBeenCalled();
  });

  // ─── The website session ─────────────────────────────────────────────────────

  it('a session Bearer acting on its own uuid reaches business logic', async () => {
    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set('Authorization', sessionBearer(OWN_UUID))
      .send({ ...validListing(OWN_UUID), server: mockEnv.MC_WORLD });

    expect(res.status).toBe(201);
    expect(listings.create).toHaveBeenCalledTimes(1);
  });

  it("a session Bearer acting on someone else's uuid is 403 ACTOR_NOT_SELF", async () => {
    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set('Authorization', sessionBearer(OWN_UUID))
      .send({ ...validListing(OTHER_UUID), server: mockEnv.MC_WORLD });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACTOR_NOT_SELF');
    expect(listings.create).not.toHaveBeenCalled();
  });

  it('401s a session Bearer whose signature does not verify', async () => {
    const forged = new JwtService({ secret: 'not-the-real-secret' }).sign({
      sub: 1,
      mcUuid: OWN_UUID,
    });

    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set('Authorization', `Bearer ${forged}`)
      .send({ ...validListing(OWN_UUID), server: mockEnv.MC_WORLD });

    expect(res.status).toBe(401);
    expect(listings.create).not.toHaveBeenCalled();
  });

  // A refresh token is signed with the SAME secret; only the `typ` claim stops
  // it being replayed as a session against a money route.
  it('401s a refresh token replayed as a session', async () => {
    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set(
        'Authorization',
        `Bearer ${jwt.sign({ sub: 1, mcUuid: OWN_UUID, typ: 'refresh' })}`,
      )
      .send(validListing(OWN_UUID));

    expect(res.status).toBe(401);
    expect(listings.create).not.toHaveBeenCalled();
  });

  // ─── The game server ─────────────────────────────────────────────────────────

  it("the mod's opaque Bearer passes the guard", async () => {
    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set('Authorization', `Bearer ${mockEnv.TERAS_API_TOKEN}`)
      .send(validListing(OWN_UUID));

    expect(res.status).toBe(201);
    expect(listings.create).toHaveBeenCalledTimes(1);
  });

  // serverAuthed carries no identity, so assertActsAsSelf is skipped by design:
  // the game server legitimately acts on behalf of any player.
  it("the mod's Bearer may act on any player's uuid — ownership is skipped, not bypassed", async () => {
    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set('Authorization', `Bearer ${mockEnv.TERAS_API_TOKEN}`)
      .send(validListing(OTHER_UUID));

    expect(res.status).toBe(201);
    expect(listings.create).toHaveBeenCalledWith(
      expect.objectContaining({ sellerUuid: OTHER_UUID }),
    );
  });

  it('401s a wrong server Bearer', async () => {
    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set('Authorization', 'Bearer not-the-mods-token')
      .send({ ...validListing(OWN_UUID), server: mockEnv.MC_WORLD });

    expect(res.status).toBe(401);
    expect(listings.create).not.toHaveBeenCalled();
  });

  // An unset TERAS_API_TOKEN must match nothing, not everything.
  it('401s a blank Bearer when TERAS_API_TOKEN is unset', async () => {
    mockEnv.TERAS_API_TOKEN = '';

    const res = await request(app.getHttpServer())
      .post(LISTINGS_URL)
      .set('Authorization', 'Bearer ')
      .send({ ...validListing(OWN_UUID), server: mockEnv.MC_WORLD });

    expect(res.status).toBe(401);
    expect(listings.create).not.toHaveBeenCalled();
  });

  // ─── Ordering ────────────────────────────────────────────────────────────────

  it('rejects an anonymous caller before the DTO is read', async () => {
    const res = await send('post', LISTINGS_URL, {
      garbage: true,
      server: mockEnv.MC_WORLD,
    });

    // 401 (guard), not 400 (forbidNonWhitelisted): guards run before pipes, so a
    // malformed anonymous body must never leak validation detail.
    expect(res.status).toBe(401);
  });

  // ─── All 17 mutations, not just the one probed above ────────────────────────

  // Every non-GET route on this controller. The count is asserted so a route
  // added without a guard fails here instead of shipping open.
  const MUTATIONS: Array<[Method, string, Record<string, unknown>]> = [
    ['post', LISTINGS_URL, validListing(OWN_UUID)],
    ['patch', `${LISTINGS_URL}/1`, { price: 10 }],
    ['delete', `${LISTINGS_URL}/1`, { actorUuid: OWN_UUID }],
    ['post', '/smartrotom/wigglypop/valuate', { dex: 25 }],
    [
      'put',
      '/smartrotom/wigglypop/watchlist',
      { userUuid: OWN_UUID, listingId: 1, watching: true },
    ],
    [
      'post',
      '/smartrotom/wigglypop/orders',
      { buyerUuid: OWN_UUID, lines: [{ listingId: 1, qty: 1 }] },
    ],
    [
      'post',
      '/smartrotom/wigglypop/orders/1/transferred',
      { actorUuid: OWN_UUID },
    ],
    ['post', '/smartrotom/wigglypop/orders/1/confirm', { actorUuid: OWN_UUID }],
    ['post', '/smartrotom/wigglypop/orders/1/cancel', { actorUuid: OWN_UUID }],
    [
      'post',
      '/smartrotom/wigglypop/bids',
      { listingId: 1, bidderUuid: OWN_UUID, amount: 10 },
    ],
    [
      'post',
      '/smartrotom/wigglypop/offers',
      { listingId: 1, buyerUuid: OWN_UUID, amount: 10 },
    ],
    ['post', '/smartrotom/wigglypop/offers/1/accept', { actorUuid: OWN_UUID }],
    ['post', '/smartrotom/wigglypop/offers/1/reject', { actorUuid: OWN_UUID }],
    [
      'post',
      '/smartrotom/wigglypop/trades',
      { listingId: 1, proposerUuid: OWN_UUID },
    ],
    ['post', '/smartrotom/wigglypop/trades/1/accept', { actorUuid: OWN_UUID }],
    ['post', '/smartrotom/wigglypop/trades/1/reject', { actorUuid: OWN_UUID }],
    [
      'post',
      '/smartrotom/wigglypop/reviews',
      { orderId: 1, reviewerUuid: OWN_UUID, rating: 5 },
    ],
  ];

  it('covers every mutation on the controller', () => {
    expect(MUTATIONS).toHaveLength(17);
  });

  it.each(MUTATIONS)(
    '401s %s %s for an anonymous caller carrying the tripwire',
    async (method, url, body) => {
      const res = await send(method, url, {
        ...body,
        server: mockEnv.MC_WORLD,
      });

      expect(res.status).toBe(401);
    },
  );
});
