import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';

jest.mock('@/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-long-enough-32chars',
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<BoffMediaUsersFacadeService>;
  let usersRepository: jest.Mocked<
    Pick<BoffMediaUsersRepository, 'getSessionVersion'>
  >;

  beforeEach(async () => {
    const mockUsersService = {
      getUserById: jest.fn(),
    };

    const mockUsersRepository = {
      getSessionVersion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: BoffMediaUsersFacadeService, useValue: mockUsersService },
        { provide: BoffMediaUsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(BoffMediaUsersFacadeService);
    usersRepository = module.get(BoffMediaUsersRepository);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate()', () => {
    it('accepts a token with matching session version', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(2);

      const payload = {
        sub: 1,
        username: 'TrainerAsh',
        email: 'ash@pokemon.com',
        sv: 2, // matches current version
      };

      const result = await strategy.validate(payload);

      expect(result).toMatchObject({
        userId: 1,
        username: 'TrainerAsh',
        email: 'ash@pokemon.com',
      });
    });

    it('rejects a token with stale session version', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(3); // current version

      const payload = {
        sub: 1,
        username: 'TrainerAsh',
        email: 'ash@pokemon.com',
        sv: 2, // stale version
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('accepts a token without sv claim against version 0 (backward compatibility)', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(0); // initial version

      const payload = {
        sub: 1,
        username: 'TrainerAsh',
        email: 'ash@pokemon.com',
        // no sv claim — token was minted before this feature
      };

      const result = await strategy.validate(payload);

      expect(result).toMatchObject({
        userId: 1,
        username: 'TrainerAsh',
        email: 'ash@pokemon.com',
      });
    });

    it('rejects a token without sv claim against bumped version', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(1); // version bumped (password change)

      const payload = {
        sub: 1,
        username: 'TrainerAsh',
        email: 'ash@pokemon.com',
        // no sv claim — token was minted before this feature, now version is 1
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects when user does not exist (getSessionVersion returns null)', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(null);

      const payload = {
        sub: 999,
        username: 'NonExistent',
        email: 'none@example.com',
        sv: 0,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects when user is soft-deleted (getSessionVersion returns null)', async () => {
      usersRepository.getSessionVersion.mockResolvedValue(null);

      const payload = {
        sub: 1,
        username: 'TrainerAsh',
        email: 'ash@pokemon.com',
        sv: 0,
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
