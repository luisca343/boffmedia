import { UnauthorizedException } from '@nestjs/common';

const mockEnv: {
  TERAS_API_TOKEN?: string;
} = {
  TERAS_API_TOKEN: 'server-token',
};

jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

/* eslint-disable @typescript-eslint/no-require-imports */
const { GameServerAuthGuard } =
  require('./game-server-auth.guard') as typeof import('./game-server-auth.guard');
/* eslint-enable @typescript-eslint/no-require-imports */

const ctxFor = (req: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as any;

describe('GameServerAuthGuard', () => {
  let guard: InstanceType<typeof GameServerAuthGuard>;

  beforeEach(() => {
    mockEnv.TERAS_API_TOKEN = 'server-token';
    guard = new GameServerAuthGuard();
  });

  it('accepts the mod token and flags serverAuthed', () => {
    const req: any = {
      headers: { authorization: 'Bearer server-token' },
      body: {},
    };
    expect(guard.canActivate(ctxFor(req))).toBe(true);
    expect(req.serverAuthed).toBe(true);
  });

  it('REJECTS the MC_WORLD tripwire (never supported by this guard)', () => {
    // The whole reason this guard exists: it never accepts the tripwire. MC_WORLD
    // ships in the browser bundle; honouring it here would let any stranger
    // spend another player's rewards.
    const req: any = { headers: {}, body: { server: 'world-uuid' } };
    expect(() => guard.canActivate(ctxFor(req))).toThrow(UnauthorizedException);
    expect(req.serverAuthed).toBeUndefined();
  });

  it('rejects a user JWT — this route is not for users', () => {
    const req: any = {
      headers: { authorization: 'Bearer some.jwt.here' },
      body: {},
    };
    expect(() => guard.canActivate(ctxFor(req))).toThrow(UnauthorizedException);
  });

  it('rejects a same-length wrong token', () => {
    const req: any = {
      headers: { authorization: 'Bearer xxxxxxxxxxxx' },
      body: {},
    };
    expect(() => guard.canActivate(ctxFor(req))).toThrow(UnauthorizedException);
  });

  it('rejects everything when TERAS_API_TOKEN is unset (fail-closed)', () => {
    mockEnv.TERAS_API_TOKEN = undefined;
    const req: any = {
      headers: { authorization: 'Bearer anything' },
      body: {},
    };
    expect(() => guard.canActivate(ctxFor(req))).toThrow(UnauthorizedException);
  });

  it('rejects a blank Bearer when the token is unset', () => {
    mockEnv.TERAS_API_TOKEN = undefined;
    const req: any = { headers: { authorization: 'Bearer ' }, body: {} };
    expect(() => guard.canActivate(ctxFor(req))).toThrow(UnauthorizedException);
  });

  it('rejects a missing credential', () => {
    const req: any = { headers: {}, body: {} };
    expect(() => guard.canActivate(ctxFor(req))).toThrow(UnauthorizedException);
  });
});
