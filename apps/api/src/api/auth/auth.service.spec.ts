import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

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

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockUser = {
  id: 1,
  username: 'TrainerAsh',
  email: 'ash@pokemon.com',
  uuid: 'abc-123',
  profilePicture: null,
};

const mockUserWithIntegrations = {
  boffMediaUser: { id: 1, username: 'TrainerAsh', email: 'ash@pokemon.com', uuid: 'abc-123' },
  roles: ['user'],
  smartRotomUser: { level: 5 },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: Logger, useValue: mockLogger },
        { provide: BoffMediaUsersFacadeService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login()', () => {
    const fullUser = {
      id: 1,
      name: 'TrainerAsh',
      email: 'ash@pokemon.com',
      roles: ['user'],
      mcUUid: 'abc-123',
      smartRotomUser: {},
    };

    it('should return tokens and user data', async () => {
      const result = await service.login(fullUser);

      expect(result.access_token).toBe('mock-token');
      expect(result.refresh_token).toBe('mock-token');
      expect(result.user.id).toBe(1);
      expect(result.user.username).toBe('TrainerAsh');
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should unwrap sessionUser when present', async () => {
      const wrapped = { sessionUser: fullUser };
      const result = await service.login(wrapped);

      expect(result.user.username).toBe('TrainerAsh');
    });
  });

  describe('loginMC()', () => {
    const loginData = { username: 'TrainerAsh', uuid: 'abc-123', world: 'test-world' };

    beforeEach(() => {
      process.env.MC_WORLD = 'test-world';
    });

    it('should return tokens for a valid MC login', async () => {
      mockUsersService.getUserWithIntegrations.mockResolvedValue(mockUserWithIntegrations);

      const result = await service.loginMC(loginData) as any;

      expect(result.access_token).toBe('mock-token');
    });

    it('should throw UnauthorizedException for invalid world', async () => {
      await expect(
        service.loginMC({ ...loginData, world: 'wrong-world' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return error object when user not found', async () => {
      mockUsersService.getUserWithIntegrations.mockResolvedValue(null);

      const result = await service.loginMC(loginData);

      expect(result).toEqual({ error: 'User not found in BoffMedia system' });
    });
  });

  describe('refreshToken()', () => {
    it('should issue new tokens from a valid JWT string', async () => {
      const payload = { sub: 1, username: 'TrainerAsh', smartRotomUser: {} };
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.getUserById.mockResolvedValue(mockUser);
      mockUsersService.getUserRoles.mockResolvedValue(['user']);

      const result = await service.refreshToken('valid-token-string');

      expect(result.access_token).toBe('mock-token');
      expect(result.user.id).toBe(1);
    });

    it('should issue new tokens from a token object', async () => {
      const tokenObj = { sub: 1, username: 'TrainerAsh', smartRotomUser: {} };
      mockUsersService.getUserById.mockResolvedValue(mockUser);
      mockUsersService.getUserRoles.mockResolvedValue(['user']);

      const result = await service.refreshToken(tokenObj);

      expect(result.access_token).toBe('mock-token');
      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token format', async () => {
      await expect(service.refreshToken(null)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 999 });
      mockUsersService.getUserById.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser()', () => {
    it('should return user when credentials are valid', async () => {
      mockUsersService.validateUser.mockResolvedValue(mockUser);

      const result = await service.validateUser('TrainerAsh', 'password');

      expect(result).toEqual(mockUser);
    });

    it('should return null when credentials are invalid', async () => {
      mockUsersService.validateUser.mockResolvedValue(null);

      const result = await service.validateUser('TrainerAsh', 'wrong');

      expect(result).toBeNull();
    });
  });
});
