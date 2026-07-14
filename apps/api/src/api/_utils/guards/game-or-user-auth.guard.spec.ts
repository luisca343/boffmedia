import { UnauthorizedException } from '@nestjs/common';

// Mutable mock of the validated env the guard reads.
const mockEnv: {
  GAME_SERVER_SECRET?: string;
  ENFORCE_MONEY_AUTH: boolean;
  MC_WORLD: string;
} = {
  GAME_SERVER_SECRET: 'super-secret',
  ENFORCE_MONEY_AUTH: false,
  MC_WORLD: 'world-uuid',
};

jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  GameOrUserAuthGuard,
} = require('./game-or-user-auth.guard') as typeof import('./game-or-user-auth.guard');

const ctxFor = (req: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as any;

describe('GameOrUserAuthGuard', () => {
  let guard: InstanceType<typeof GameOrUserAuthGuard>;

  beforeEach(() => {
    mockEnv.GAME_SERVER_SECRET = 'super-secret';
    mockEnv.ENFORCE_MONEY_AUTH = false;
    guard = new GameOrUserAuthGuard();
  });

  it('accepts the game server via a matching X-Server-Key and flags it serverAuthed', async () => {
    const req: any = { headers: { 'x-server-key': 'super-secret' }, body: {} };
    await expect(guard.canActivate(ctxFor(req))).resolves.toBe(true);
    expect(req.serverAuthed).toBe(true);
  });

  it('rejects a wrong X-Server-Key with no other credential', async () => {
    const req: any = { headers: { 'x-server-key': 'nope' }, body: {} };
    await expect(guard.canActivate(ctxFor(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts the legacy tripwire while enforcement is off', async () => {
    const req: any = { headers: {}, body: { server: 'world-uuid' } };
    await expect(guard.canActivate(ctxFor(req))).resolves.toBe(true);
    expect(req.serverAuthed).toBeUndefined();
  });

  it('rejects the tripwire once enforcement is on', async () => {
    mockEnv.ENFORCE_MONEY_AUTH = true;
    const req: any = { headers: {}, body: { server: 'world-uuid' } };
    await expect(guard.canActivate(ctxFor(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects when no credential is present', async () => {
    const req: any = { headers: {}, body: {} };
    await expect(guard.canActivate(ctxFor(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
