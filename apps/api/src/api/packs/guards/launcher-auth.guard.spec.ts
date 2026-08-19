import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { LauncherAuthGuard, LauncherRequest } from './launcher-auth.guard';
import { PacksAuthService } from '../packs-auth.service';
import { PacksRepository } from '../packs.repository';

const ctx = (headers: Record<string, string>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }) as unknown as LauncherRequest,
    }),
  }) as unknown as ExecutionContext;

const principal = (over: Record<string, unknown> = {}) => ({
  userId: 7,
  username: 'TrainerAsh',
  mcUuid: null,
  tokenVersion: 2,
  ...over,
});

describe('LauncherAuthGuard', () => {
  let auth: jest.Mocked<PacksAuthService>;
  let repo: jest.Mocked<PacksRepository>;
  let guard: LauncherAuthGuard;

  beforeEach(() => {
    auth = {
      verifySession: jest.fn().mockReturnValue(principal()),
    } as unknown as jest.Mocked<PacksAuthService>;
    repo = {
      getLauncherTokenVersion: jest.fn().mockResolvedValue(2),
    } as unknown as jest.Mocked<PacksRepository>;
    guard = new LauncherAuthGuard(auth, repo);
  });

  it('rejects a request with no Bearer', async () => {
    await expect(guard.canActivate(ctx({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(auth.verifySession).not.toHaveBeenCalled();
  });

  it('accepts a matching token version and populates req.launcher', async () => {
    const req = {
      headers: { authorization: 'Bearer tok' },
    } as unknown as LauncherRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.launcher).toEqual(principal());
  });

  it('rejects a token whose embedded version is behind the account (revoke-all)', async () => {
    repo.getLauncherTokenVersion.mockResolvedValue(3);
    try {
      await guard.canActivate(ctx({ authorization: 'Bearer tok' }));
      throw new Error('should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.getResponse()).toMatchObject({
        error: 'needs_newer_launcher',
      });
    }
  });

  it('rejects a token for an account that no longer exists', async () => {
    repo.getLauncherTokenVersion.mockResolvedValue(null);
    await expect(
      guard.canActivate(ctx({ authorization: 'Bearer tok' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('treats a versionless principal as 0', async () => {
    auth.verifySession.mockReturnValue(
      principal({ tokenVersion: undefined }) as never,
    );
    repo.getLauncherTokenVersion.mockResolvedValue(0);
    await expect(
      guard.canActivate(ctx({ authorization: 'Bearer tok' })),
    ).resolves.toBe(true);
  });

  it('does not swallow a verifySession rejection', async () => {
    auth.verifySession.mockImplementation(() => {
      throw new UnauthorizedException('Token de tipo incorrecto');
    });
    await expect(
      guard.canActivate(ctx({ authorization: 'Bearer tok' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repo.getLauncherTokenVersion).not.toHaveBeenCalled();
  });
});
