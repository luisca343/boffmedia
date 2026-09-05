import { UnauthorizedException } from '@nestjs/common';
import { DesktopOrUserAuthGuard } from './desktop-or-user-auth.guard';
import { fakeExecutionContext } from '@/_testing/nest-context';

/**
 * The point of this guard is that a desktop session is NOT a website session:
 * it carries `typ: 'launcher'` and is revoked through `desktopTokenVersion`,
 * not `sessionVersion`. Accepting it by widening `WEBSITE_TOKEN_TYPES` would
 * check the wrong counter and keep honouring a revoked app session.
 */
describe('DesktopOrUserAuthGuard', () => {
  const desktopAuth = { verifySession: jest.fn() };
  const packsRepo = {
    getDesktopTokenVersion: jest.fn(),
    // The guard resolves the account's roles from the database for an app
    // session (see the long comment on `canActivate`). Leaving it off the fake
    // killed every desktop-path test with `rolesOf is not a function`.
    rolesOf: jest.fn(),
  };

  let guard: DesktopOrUserAuthGuard;
  let req: any;

  const context = () => fakeExecutionContext({ request: req });

  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks wipes implementations too, so the default lives here.
    packsRepo.rolesOf.mockResolvedValue([]);
    req = { headers: {} };
    guard = new DesktopOrUserAuthGuard(desktopAuth as any, packsRepo as any);
  });

  const withBearer = (token: string) => {
    req.headers.authorization = `Bearer ${token}`;
  };

  it('rejects a request with no credential at all', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(desktopAuth.verifySession).not.toHaveBeenCalled();
  });

  it('lets a website session through without touching the desktop path', async () => {
    withBearer('website-token');
    jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockResolvedValue(true);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(desktopAuth.verifySession).not.toHaveBeenCalled();
  });

  describe('when the website strategy refuses the token', () => {
    beforeEach(() => {
      jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          'canActivate',
        )
        .mockRejectedValue(new UnauthorizedException('not a website session'));
    });

    it('accepts a valid desktop session and populates req.user', async () => {
      withBearer('desktop-token');
      desktopAuth.verifySession.mockReturnValue({
        userId: 1,
        username: 'Luisca',
        mcUuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
        tokenVersion: 3,
      });
      packsRepo.getDesktopTokenVersion.mockResolvedValue(3);

      await expect(guard.canActivate(context())).resolves.toBe(true);
      expect(req.user).toEqual({
        userId: 1,
        username: 'Luisca',
        roles: [],
        tokenType: 'launcher',
        mcUuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      });
    });

    it('refuses a desktop session whose revocation counter is stale', async () => {
      withBearer('revoked-token');
      desktopAuth.verifySession.mockReturnValue({
        userId: 1,
        username: 'Luisca',
        mcUuid: null,
        tokenVersion: 2,
      });
      packsRepo.getDesktopTokenVersion.mockResolvedValue(3); // revoke-all bumped it

      await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(req.user).toBeUndefined();
    });

    it('refuses a desktop session for an account that no longer exists', async () => {
      withBearer('orphan-token');
      desktopAuth.verifySession.mockReturnValue({
        userId: 99,
        username: 'gone',
        mcUuid: null,
        tokenVersion: 0,
      });
      packsRepo.getDesktopTokenVersion.mockResolvedValue(null);

      await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('re-throws the website error when the token is not a desktop session either', async () => {
      withBearer('garbage');
      desktopAuth.verifySession.mockImplementation(() => {
        throw new UnauthorizedException('Token de tipo incorrecto');
      });

      await expect(guard.canActivate(context())).rejects.toThrow(
        'not a website session',
      );
      expect(req.user).toBeUndefined();
    });

    // This case used to assert the opposite ("an app session is an identity,
    // not a set of powers", roles always `[]`). The guard reversed that stance
    // deliberately: it made one whole class of route impossible — reachable
    // from both surfaces AND role-gated. The desktop token still carries no
    // roles of its own; they come from the database, for the same human who
    // already holds them on the website.
    it('resolves the account roles from the database for an app session', async () => {
      withBearer('desktop-token');
      desktopAuth.verifySession.mockReturnValue({
        userId: 1,
        username: 'Luisca',
        mcUuid: null,
        tokenVersion: 0,
      });
      packsRepo.getDesktopTokenVersion.mockResolvedValue(0);
      packsRepo.rolesOf.mockResolvedValue(['BOFF_ADMIN']);

      await guard.canActivate(context());

      expect(packsRepo.rolesOf).toHaveBeenCalledWith(1);
      expect(req.user.roles).toEqual(['BOFF_ADMIN']);
    });
  });
});
