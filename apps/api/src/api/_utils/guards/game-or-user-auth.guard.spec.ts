import { UnauthorizedException } from '@nestjs/common';

// Mutable mock of the validated env the guard reads.
const mockEnv: {
  TERAS_API_TOKEN?: string;
  ENFORCE_MONEY_AUTH: boolean;
  MC_WORLD: string;
} = {
  TERAS_API_TOKEN: 'super-secret',
  ENFORCE_MONEY_AUTH: false,
  MC_WORLD: 'world-uuid',
};

jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

/* eslint-disable @typescript-eslint/no-require-imports */
const { GameOrUserAuthGuard } =
  require('./game-or-user-auth.guard') as typeof import('./game-or-user-auth.guard');
/* eslint-enable @typescript-eslint/no-require-imports */

const ctxFor = (req: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as any;

describe('GameOrUserAuthGuard', () => {
  let guard: InstanceType<typeof GameOrUserAuthGuard>;

  beforeEach(() => {
    mockEnv.TERAS_API_TOKEN = 'super-secret';
    mockEnv.ENFORCE_MONEY_AUTH = false;
    guard = new GameOrUserAuthGuard();
  });

  it("accepts the mod's opaque Bearer token and flags it serverAuthed", async () => {
    const req: any = {
      headers: { authorization: 'Bearer super-secret' },
      body: {},
    };
    await expect(guard.canActivate(ctxFor(req))).resolves.toBe(true);
    expect(req.serverAuthed).toBe(true);
  });

  it('is case-insensitive on the Bearer scheme', async () => {
    const req: any = {
      headers: { authorization: 'bearer super-secret' },
      body: {},
    };
    await expect(guard.canActivate(ctxFor(req))).resolves.toBe(true);
    expect(req.serverAuthed).toBe(true);
  });

  it('falls through to JWT verification for a non-matching Bearer', async () => {
    // Not the server token, so it must be treated as a (here invalid) JWT and
    // rejected — never silently accepted.
    const req: any = {
      headers: { authorization: 'Bearer not-the-token' },
      body: {},
    };
    await expect(guard.canActivate(ctxFor(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(req.serverAuthed).toBeUndefined();
  });

  it('does not accept the server token when TERAS_API_TOKEN is unset', async () => {
    // Guards against an empty/undefined env turning every Bearer into a server.
    mockEnv.TERAS_API_TOKEN = undefined;
    const req: any = { headers: { authorization: 'Bearer ' }, body: {} };
    await expect(guard.canActivate(ctxFor(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(req.serverAuthed).toBeUndefined();
  });

  it('rejects a token that merely shares a prefix with the server token', async () => {
    const req: any = {
      headers: { authorization: 'Bearer super-secret-extra' },
      body: {},
    };
    await expect(guard.canActivate(ctxFor(req))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(req.serverAuthed).toBeUndefined();
  });

  it('ignores a legacy X-Server-Key header — the mod no longer sends one', async () => {
    const req: any = { headers: { 'x-server-key': 'super-secret' }, body: {} };
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
