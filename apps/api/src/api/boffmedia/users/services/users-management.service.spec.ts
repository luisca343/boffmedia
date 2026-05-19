import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { BoffMediaUsersManagementService } from './users-management.service';
import { BoffMediaUsersRepository } from '@api/boffmedia/users/repositories/users.repository';
import { PasswordService } from '@api/auth/password.service';

const mockRepo = {
  checkMultipleFieldsExist: jest.fn(),
  createUser: jest.fn(),
  createParticipant: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserByUuid: jest.fn(),
  findUserByGoogleId: jest.fn(),
  findUserById: jest.fn(),
  findAllUsers: jest.fn(),
  findFullUserByUsernameWithPassword: jest.fn(),
  findFullUserByUsername: jest.fn(),
  findFullUserByEmail: jest.fn(),
  findFullUserByUuid: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserRoles: jest.fn(),
  getUserCount: jest.fn(),
};

const mockPasswordService = {
  hashPassword: jest.fn().mockResolvedValue('$hashed$'),
  verifyPassword: jest.fn(),
  validatePassword: jest.fn(),
  generateOAuthPassword: jest.fn().mockReturnValue('OAuthPass123!'),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockUser = {
  id: 1,
  username: 'TrainerAsh',
  email: 'ash@pokemon.com',
  uuid: 'abc-123',
} as any;
const mockFullUser = {
  boffmedia_users: {
    id: 1,
    username: 'TrainerAsh',
    email: 'ash@pokemon.com',
    password: '$hashed$',
  },
  rotom_users: { username: 'TrainerAsh', uuid: 'abc-123', world: 'main' },
} as any;

describe('BoffMediaUsersManagementService', () => {
  let service: BoffMediaUsersManagementService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoffMediaUsersManagementService,
        { provide: Logger, useValue: mockLogger },
        { provide: BoffMediaUsersRepository, useValue: mockRepo },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<BoffMediaUsersManagementService>(
      BoffMediaUsersManagementService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createUser ───────────────────────────────────────────────────────────────

  describe('createUser()', () => {
    const validData = {
      email: 'ash@pokemon.com',
      username: 'TrainerAsh',
      password: 'Pikach00!',
    };

    it('creates user with hashed password and returns safe user', async () => {
      mockRepo.checkMultipleFieldsExist.mockResolvedValue([]);
      mockRepo.createUser.mockResolvedValue(mockUser);
      mockRepo.createParticipant.mockResolvedValue(undefined);

      const result = await service.createUser(validData);

      expect(result.username).toBe('TrainerAsh');
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(
        'Pikach00!',
      );
      expect(mockRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ password: '$hashed$' }),
      );
      expect(mockRepo.createParticipant).toHaveBeenCalled();
    });

    it('throws ConflictException when username already exists', async () => {
      mockRepo.checkMultipleFieldsExist.mockResolvedValue([
        { username: 'TrainerAsh' },
      ]);

      await expect(service.createUser(validData)).rejects.toThrow('username');
    });

    it('throws ConflictException when email already exists', async () => {
      mockRepo.checkMultipleFieldsExist.mockResolvedValue([
        { email: 'ash@pokemon.com' },
      ]);

      await expect(service.createUser(validData)).rejects.toThrow('email');
    });

    it('throws BadRequestException when email format is invalid', async () => {
      await expect(
        service.createUser({ ...validData, email: 'not-an-email' }),
      ).rejects.toThrow('Invalid user data');
    });

    it('throws BadRequestException when password is too short', async () => {
      await expect(
        service.createUser({ ...validData, password: '123' }),
      ).rejects.toThrow('Invalid user data');
    });

    it('throws BadRequestException when username is empty', async () => {
      await expect(
        service.createUser({ ...validData, username: '' }),
      ).rejects.toThrow('Invalid user data');
    });
  });

  // ─── findOrCreateUser ─────────────────────────────────────────────────────────

  describe('findOrCreateUser()', () => {
    it('returns existing user when found by username', async () => {
      mockRepo.findUserByUsername.mockResolvedValue(mockUser);

      const result = await service.findOrCreateUser({
        email: 'ash@pokemon.com',
        username: 'TrainerAsh',
        password: 'pass',
      });

      expect(result.isNew).toBe(false);
      expect(result.user.username).toBe('TrainerAsh');
      expect(mockRepo.createUser).not.toHaveBeenCalled();
    });

    it('creates new user when not found', async () => {
      mockRepo.findUserByUsername.mockResolvedValue(null);
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.checkMultipleFieldsExist.mockResolvedValue([]);
      mockRepo.createUser.mockResolvedValue(mockUser);
      mockRepo.createParticipant.mockResolvedValue(undefined);

      const result = await service.findOrCreateUser({
        email: 'ash@pokemon.com',
        username: 'TrainerAsh',
        password: 'Pikach00!',
      });

      expect(result.isNew).toBe(true);
    });
  });

  // ─── getUserByUsername ────────────────────────────────────────────────────────

  describe('getUserByUsername()', () => {
    it('returns user when found', async () => {
      mockRepo.findUserByUsername.mockResolvedValue(mockUser);

      await expect(service.getUserByUsername('TrainerAsh')).resolves.toEqual(
        mockUser,
      );
    });

    it('throws BadRequestException when username is empty', async () => {
      await expect(service.getUserByUsername('')).rejects.toThrow(
        'Username is required',
      );
    });
  });

  // ─── validateUser ─────────────────────────────────────────────────────────────

  describe('validateUser()', () => {
    it('returns session user when credentials are valid', async () => {
      mockRepo.findFullUserByUsernameWithPassword.mockResolvedValue(
        mockFullUser,
      );
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockRepo.getUserRoles.mockResolvedValue(['user']);

      const result = await service.validateUser('TrainerAsh', 'Pikach00!');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('TrainerAsh');
      expect(result!.roles).toEqual(['user']);
    });

    it('returns null when user not found', async () => {
      mockRepo.findFullUserByUsernameWithPassword.mockResolvedValue(null);

      await expect(service.validateUser('unknown', 'pass')).resolves.toBeNull();
    });

    it('returns null when password is wrong', async () => {
      mockRepo.findFullUserByUsernameWithPassword.mockResolvedValue(
        mockFullUser,
      );
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      await expect(
        service.validateUser('TrainerAsh', 'wrongpass'),
      ).resolves.toBeNull();
    });

    it('throws BadRequestException when credentials are missing', async () => {
      await expect(service.validateUser('', '')).rejects.toThrow(
        'Username and password are required',
      );
    });
  });

  // ─── updateUser ───────────────────────────────────────────────────────────────

  describe('updateUser()', () => {
    it('hashes password when updating password field', async () => {
      mockPasswordService.validatePassword.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockRepo.updateUser.mockResolvedValue(mockUser);

      await service.updateUser(1, { password: 'NewPass123!' });

      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(
        'NewPass123!',
      );
    });

    it('throws when password fails validation', async () => {
      mockPasswordService.validatePassword.mockReturnValue({
        isValid: false,
        errors: ['too short'],
      });

      await expect(service.updateUser(1, { password: '123' })).rejects.toThrow(
        'Password validation failed',
      );
    });

    it('throws BadRequestException when id is 0', async () => {
      await expect(service.updateUser(0, {})).rejects.toThrow(
        'Valid ID is required',
      );
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────────────────────

  describe('deleteUser()', () => {
    it('returns success when deleted', async () => {
      mockRepo.deleteUser.mockResolvedValue(true);

      const result = await service.deleteUser(1);

      expect(result.success).toBe(true);
    });

    it('returns failure message when deletion fails', async () => {
      mockRepo.deleteUser.mockResolvedValue(false);

      const result = await service.deleteUser(1);

      expect(result.success).toBe(false);
    });
  });

  // ─── getUserCount ─────────────────────────────────────────────────────────────

  describe('getUserCount()', () => {
    it('returns user count from repo', async () => {
      mockRepo.getUserCount.mockResolvedValue(42);

      await expect(service.getUserCount()).resolves.toBe(42);
    });

    it('returns 0 on repo error (does not throw)', async () => {
      mockRepo.getUserCount.mockRejectedValue(new Error('DB error'));

      await expect(service.getUserCount()).resolves.toBe(0);
    });
  });
});
