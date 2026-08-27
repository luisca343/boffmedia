import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(BoffMediaUsersFacadeService);
    usersRepository = module.get(BoffMediaUsersRepository);
    jwtService = module.get(JwtService);
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
      const result = await service.login(fullUser);

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
      const result = await service.login(wrapped);

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
