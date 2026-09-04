import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { TwoFactorRepository } from './two-factor/two-factor.repository';
import { ApiErrorCode } from '@/common/errors/user-error';

jest.mock('@/config/env', () => ({
  env: {
    MC_WORLD: 'test-world',
    JWT_SECRET: 'test-secret-that-is-long-enough-32chars',
  },
}));

const mockUser = {
  id: 1,
  username: 'TrainerAsh',
  email: 'ash@pokemon.com',
  uuid: 'abc-123',
  profilePicture: null,
};

/** `login()` answers with a session OR a two-factor challenge, and the tests
 *  below that predate 2FA all want the session half. Narrowing once here keeps
 *  them readable and still fails loudly if a case accidentally gets challenged. */
const asSession = (result: any) => {
  expect(result).not.toHaveProperty('two_factor');
  return result as {
    access_token: string;
    refresh_token: string;
    user: { id: number; username: string };
  };
};

const mockUserWithIntegrations = {
  boffMediaUser: {
    id: 1,
    username: 'TrainerAsh',
    email: 'ash@pokemon.com',
    uuid: 'abc-123',
  },
  roles: ['user'],
  smartRotomUser: { level: 5 },
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<
    Pick<
      BoffMediaUsersFacadeService,
      | 'validateUser'
      | 'getUserWithIntegrations'
      | 'getUserById'
      | 'getUserRoles'
      | 'findByEmail'
      | 'createFromGoogle'
      | 'createMinecraftUser'
      | 'linkMinecraftAccount'
    >
  >;
  let usersRepository: jest.Mocked<
    Pick<BoffMediaUsersRepository, 'getSessionVersion'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign' | 'verify'>>;
  let refreshTokens: jest.Mocked<
    Pick<
      RefreshTokensRepository,
      'issue' | 'findByJti' | 'claimRotation' | 'revokeFamily'
    >
  >;
  let twoFactorRepo: jest.Mocked<Pick<TwoFactorRepository, 'isEnrolled'>>;

  beforeEach(async () => {
    const mockUsersService = {
      validateUser: jest.fn(),
      getUserWithIntegrations: jest.fn(),
      getUserById: jest.fn(),
      getUserRoles: jest.fn(),
      findByEmail: jest.fn(),
      createFromGoogle: jest.fn(),
      createMinecraftUser: jest.fn(),
      linkMinecraftAccount: jest.fn(),
    };

    const mockUsersRepository = {
      getSessionVersion: jest.fn().mockResolvedValue(0),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };

    const mockRefreshTokens = {
      issue: jest.fn().mockResolvedValue(undefined),
      findByJti: jest.fn(),
      // The default is "this call spent the token" — the honest path.
      claimRotation: jest.fn().mockResolvedValue(true),
      revokeFamily: jest.fn().mockResolvedValue(undefined),
    };

    const mockTwoFactorRepo = {
      isEnrolled: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: Logger,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
        { provide: BoffMediaUsersFacadeService, useValue: mockUsersService },
        { provide: BoffMediaUsersRepository, useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokensRepository, useValue: mockRefreshTokens },
        { provide: TwoFactorRepository, useValue: mockTwoFactorRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(BoffMediaUsersFacadeService);
    usersRepository = module.get(BoffMediaUsersRepository);
    jwtService = module.get(JwtService);
    refreshTokens = module.get(RefreshTokensRepository);
    twoFactorRepo = module.get(TwoFactorRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login()', () => {
    const fullUser = {
      id: 1,
      name: 'TrainerAsh',
      email: 'ash@pokemon.com',
      roles: ['user'],
      mcUuid: 'abc-123',
      smartRotomUser: {},
    };

    it('should return tokens and user data', async () => {
      const result = asSession(await service.login(fullUser));

      expect(result.access_token).toBe('mock-token');
      expect(result.refresh_token).toBe('mock-token');
      expect(result.user.id).toBe(1);
      expect(result.user.username).toBe('TrainerAsh');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    // `login()` takes `any`, so a claim that silently stops being produced still
    // type-checks. Assert the payload, not just the token string.
    it('signs the mcUuid claim into both tokens', async () => {
      await service.login(fullUser);

      for (const [payload] of jwtService.sign.mock.calls) {
        expect(payload).toMatchObject({ mcUuid: 'abc-123' });
      }
    });

    it('should unwrap sessionUser when present', async () => {
      const wrapped = { sessionUser: fullUser };
      const result = asSession(await service.login(wrapped));

      expect(result.user.username).toBe('TrainerAsh');
    });

    it('marks the refresh token with typ and leaves the access token untyped', async () => {
      await service.login(fullUser);

      const [access] = jwtService.sign.mock.calls[0];
      const [refresh] = jwtService.sign.mock.calls[1];
      expect(access).not.toHaveProperty('typ');
      expect(refresh).toMatchObject({ typ: 'refresh' });
      expect(refresh).not.toHaveProperty('scope');
    });

    it('carries a narrowed scope onto both tokens', async () => {
      await service.login(fullUser, 'ingame');

      const [access] = jwtService.sign.mock.calls[0];
      const [refresh] = jwtService.sign.mock.calls[1];
      expect(access).toMatchObject({ typ: 'ingame' });
      expect(refresh).toMatchObject({ typ: 'refresh', scope: 'ingame' });
    });

    it('includes the session version (sv) claim in website session tokens', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(2);

      await service.login(fullUser);

      const [access] = jwtService.sign.mock.calls[0];
      const [refresh] = jwtService.sign.mock.calls[1];
      expect(access).toMatchObject({ sv: 2 });
      expect(refresh).toMatchObject({ sv: 2 });
    });

    it('omits the session version claim from in-game session tokens', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(2);

      await service.login(fullUser, 'ingame');

      const [access] = jwtService.sign.mock.calls[0];
      const [refresh] = jwtService.sign.mock.calls[1];
      expect(access).not.toHaveProperty('sv');
      expect(refresh).not.toHaveProperty('sv');
    });

    it('defaults session version to 0 when repository returns null', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(null);

      await service.login(fullUser);

      const [access] = jwtService.sign.mock.calls[0];
      expect(access).toMatchObject({ sv: 0 });
    });
  });

  describe('refreshToken()', () => {
    it('should issue new tokens from a valid JWT string', async () => {
      const payload = { sub: 1, username: 'TrainerAsh', typ: 'refresh' };
      jwtService.verify.mockReturnValue(payload);
      usersService.getUserWithIntegrations.mockResolvedValue(
        mockUserWithIntegrations as any,
      );

      const result = await service.refreshToken('valid-token-string');

      expect(result.access_token).toBe('mock-token');
      expect(result.user.id).toBe(1);
    });

    it('should reject a token that is not a refresh token', async () => {
      // A typ-less payload is an ACCESS token. Replaying one here must not mint
      // a fresh session; `typ:'refresh'` is what closes that hole.
      jwtService.verify.mockReturnValue({ sub: 1, username: 'TrainerAsh' });
      await expect(service.refreshToken('access-token-string')).rejects.toThrow(
        UnauthorizedException,
      );

      jwtService.verify.mockReturnValue({ sub: 1, typ: 'app' });
      await expect(service.refreshToken('app-token-string')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when passed a non-string', async () => {
      await expect(service.refreshToken(null)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken({ sub: 1 })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jwtService.verify.mockReturnValue({ sub: 999 });
      usersService.getUserWithIntegrations.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject an access token presented as a refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, typ: 'ingame' });
      usersService.getUserWithIntegrations.mockResolvedValue(
        mockUserWithIntegrations as any,
      );

      await expect(service.refreshToken('an-access-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('includes the session version (sv) claim in refreshed website session tokens', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, username: 'TrainerAsh', typ: 'refresh' });
      usersService.getUserWithIntegrations.mockResolvedValue(
        mockUserWithIntegrations as any,
      );
      usersRepository.getSessionVersion.mockResolvedValue(3);

      await service.refreshToken('valid-refresh-token');

      const [access] = jwtService.sign.mock.calls[0];
      const [refresh] = jwtService.sign.mock.calls[1];
      expect(access).toMatchObject({ sv: 3 });
      expect(refresh).toMatchObject({ sv: 3 });
    });

    it('omits the session version claim from refreshed in-game session tokens', async () => {
      jwtService.verify.mockReturnValue({
        sub: 1,
        username: 'TrainerAsh',
        typ: 'refresh',
        scope: 'ingame',
      });
      usersService.getUserWithIntegrations.mockResolvedValue(
        mockUserWithIntegrations as any,
      );
      usersRepository.getSessionVersion.mockResolvedValue(3);

      await service.refreshToken('valid-ingame-refresh-token');

      const [access] = jwtService.sign.mock.calls[0];
      const [refresh] = jwtService.sign.mock.calls[1];
      expect(access).not.toHaveProperty('sv');
      expect(refresh).not.toHaveProperty('sv');
    });

    it('should keep an ingame session narrowed across a refresh', async () => {
      jwtService.verify.mockReturnValue({
        sub: 1,
        typ: 'refresh',
        scope: 'ingame',
      });
      usersService.getUserWithIntegrations.mockResolvedValue(
        mockUserWithIntegrations as any,
      );

      await service.refreshToken('valid-token-string');

      const [access] = jwtService.sign.mock.calls[0];
      const [refresh] = jwtService.sign.mock.calls[1];
      expect(access).toMatchObject({ typ: 'ingame' });
      expect(refresh).toMatchObject({ typ: 'refresh', scope: 'ingame' });
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── A2: refresh-token rotation and reuse detection ──────────────────────
  //
  // The behaviour under test is the whole point of the ledger: a refresh token
  // is spendable exactly once, and a second spend is treated as theft.
  describe('refresh-token rotation', () => {
    const validPayload = {
      sub: 1,
      username: 'TrainerAsh',
      typ: 'refresh',
      jti: 'jti-1',
      fam: 'fam-1',
    };
    const ledgerRow = (over: Record<string, unknown> = {}) => ({
      id: 10,
      jti: 'jti-1',
      familyId: 'fam-1',
      userId: 1,
      expiresAt: new Date(Date.now() + 86_400_000),
      rotatedAt: null,
      revokedAt: null,
      createdAt: new Date(),
      ...over,
    });

    beforeEach(() => {
      usersService.getUserWithIntegrations.mockResolvedValue(
        mockUserWithIntegrations as any,
      );
    });

    it('records a jti and a new family for every issued refresh token', async () => {
      await service.login({
        id: 1,
        name: 'TrainerAsh',
        email: 'ash@pokemon.com',
        roles: ['user'],
        mcUuid: 'abc-123',
        smartRotomUser: {},
      });

      expect(refreshTokens.issue).toHaveBeenCalledTimes(1);
      const [row] = refreshTokens.issue.mock.calls[0];
      expect(row.userId).toBe(1);
      expect(row.jti).toEqual(expect.any(String));
      expect(row.familyId).toEqual(expect.any(String));
      // The claims must match the row, or the ledger describes a token nobody
      // holds and the next refresh 401s for no visible reason.
      const [refreshClaims] = jwtService.sign.mock.calls[1];
      expect(refreshClaims).toMatchObject({ jti: row.jti, fam: row.familyId });
    });

    it('spends the presented token and keeps the replacement in the same family', async () => {
      jwtService.verify.mockReturnValue(validPayload);
      refreshTokens.findByJti.mockResolvedValue(ledgerRow());

      await service.refreshToken('a-refresh-token');

      expect(refreshTokens.claimRotation).toHaveBeenCalledWith(
        'jti-1',
        expect.any(Date),
      );
      const [row] = refreshTokens.issue.mock.calls[0];
      expect(row.familyId).toBe('fam-1');
      expect(row.jti).not.toBe('jti-1');
    });

    it('revokes the whole family when an already-rotated token comes back', async () => {
      jwtService.verify.mockReturnValue(validPayload);
      refreshTokens.findByJti.mockResolvedValue(
        // Rotated well outside the grace window: this is the theft signature.
        ledgerRow({ rotatedAt: new Date(Date.now() - 10 * 60_000) }),
      );
      refreshTokens.claimRotation.mockResolvedValue(false);

      await expect(
        service.refreshToken('a-stolen-token'),
      ).rejects.toMatchObject({
        response: { code: ApiErrorCode.AUTH_REFRESH_REUSE_DETECTED },
      });
      expect(refreshTokens.revokeFamily).toHaveBeenCalledWith(
        'fam-1',
        expect.any(Date),
      );
      expect(refreshTokens.issue).not.toHaveBeenCalled();
    });

    it('forgives a replay inside the grace window instead of signing the user out', async () => {
      // Two of the client's own requests racing. Treating this as theft would
      // sign honest users out constantly — see REFRESH_ROTATION_GRACE_MS.
      jwtService.verify.mockReturnValue(validPayload);
      refreshTokens.findByJti.mockResolvedValue(
        ledgerRow({ rotatedAt: new Date(Date.now() - 1_000) }),
      );
      refreshTokens.claimRotation.mockResolvedValue(false);

      const result = await service.refreshToken('a-racing-token');

      expect(result.access_token).toBe('mock-token');
      expect(refreshTokens.revokeFamily).not.toHaveBeenCalled();
      expect(refreshTokens.issue.mock.calls[0][0].familyId).toBe('fam-1');
    });

    it('refuses a token whose family has already been revoked', async () => {
      jwtService.verify.mockReturnValue(validPayload);
      refreshTokens.findByJti.mockResolvedValue(
        ledgerRow({ revokedAt: new Date() }),
      );

      await expect(service.refreshToken('a-dead-token')).rejects.toMatchObject({
        response: { code: ApiErrorCode.AUTH_REFRESH_REUSE_DETECTED },
      });
      expect(refreshTokens.claimRotation).not.toHaveBeenCalled();
    });

    it('refuses a jti that is not in the ledger', async () => {
      jwtService.verify.mockReturnValue(validPayload);
      refreshTokens.findByJti.mockResolvedValue(null);

      await expect(service.refreshToken('a-forged-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(refreshTokens.issue).not.toHaveBeenCalled();
    });

    it('refuses a jti belonging to a different account', async () => {
      // The sub is signed, so this needs a real forgery — but the check costs
      // nothing and turns a signing-key compromise into one fewer free move.
      jwtService.verify.mockReturnValue(validPayload);
      refreshTokens.findByJti.mockResolvedValue(ledgerRow({ userId: 99 }));

      await expect(service.refreshToken('someone-elses-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('upgrades a pre-rotation token (no jti) to a rotating one, once', async () => {
      jwtService.verify.mockReturnValue({
        sub: 1,
        username: 'TrainerAsh',
        typ: 'refresh',
      });

      await service.refreshToken('a-legacy-token');

      expect(refreshTokens.findByJti).not.toHaveBeenCalled();
      const [refreshClaims] = jwtService.sign.mock.calls[1];
      expect(refreshClaims).toMatchObject({
        jti: expect.any(String),
        fam: expect.any(String),
      });
    });
  });

  // ── W17: two-factor gating ──────────────────────────────────────────────
  describe('two-factor gate on login()', () => {
    const adminUser = {
      id: 1,
      name: 'TrainerAsh',
      email: 'ash@pokemon.com',
      roles: ['BOFF_ADMIN'],
      mcUuid: 'abc-123',
      smartRotomUser: {},
    };

    it('answers an admin with a challenge instead of a session', async () => {
      twoFactorRepo.isEnrolled.mockResolvedValue(true);

      const result: any = await service.login(adminUser);

      expect(result.two_factor).toMatchObject({
        required: true,
        enrolled: true,
        challenge_token: 'mock-token',
      });
      expect(result).not.toHaveProperty('access_token');
      // No refresh token was minted, so nothing was written to the ledger.
      expect(refreshTokens.issue).not.toHaveBeenCalled();
      const [claims] = jwtService.sign.mock.calls[0];
      expect(claims).toMatchObject({ typ: 'mfa', sub: 1 });
    });

    it('reports enrolled:false so the client walks the admin through enrolment', async () => {
      twoFactorRepo.isEnrolled.mockResolvedValue(false);

      const result: any = await service.login(adminUser);

      expect(result.two_factor).toMatchObject({ enrolled: false });
    });

    it('challenges an admin arriving through OAuth too', async () => {
      usersService.createFromGoogle.mockResolvedValue(adminUser as any);
      twoFactorRepo.isEnrolled.mockResolvedValue(true);

      const result: any = await service.googleLogin({
        email: 'ash@pokemon.com',
      });

      expect(result.two_factor?.required).toBe(true);
    });

    it('does not challenge an in-game session', async () => {
      // Ingame tokens carry no roles at all, and there is no way to type a code
      // inside the MCEF webview mid-handshake.
      const result = asSession(await service.login(adminUser, 'ingame'));

      expect(result.access_token).toBe('mock-token');
      expect(twoFactorRepo.isEnrolled).not.toHaveBeenCalled();
    });

    it('refuses to refresh an admin session with no second factor enrolled', async () => {
      // The path an account promoted to admin mid-session takes.
      jwtService.verify.mockReturnValue({ sub: 1, typ: 'refresh' });
      usersService.getUserWithIntegrations.mockResolvedValue({
        ...mockUserWithIntegrations,
        roles: ['BOFF_ADMIN'],
      } as any);
      twoFactorRepo.isEnrolled.mockResolvedValue(false);

      await expect(
        service.refreshToken('an-admin-refresh'),
      ).rejects.toMatchObject({
        response: { code: ApiErrorCode.AUTH_TWO_FACTOR_ENROLMENT_REQUIRED },
      });
    });
  });

  describe('validateUser()', () => {
    it('should return user when credentials are valid', async () => {
      usersService.validateUser.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('TrainerAsh', 'password');

      expect(result).toEqual(mockUser);
    });

    it('should return null when credentials are invalid', async () => {
      usersService.validateUser.mockResolvedValue(null);

      const result = await service.validateUser('TrainerAsh', 'wrong');

      expect(result).toBeNull();
    });
  });
});
