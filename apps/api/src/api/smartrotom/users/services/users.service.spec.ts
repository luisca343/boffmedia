import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { USERS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { Logger } from 'nestjs-pino';
import { RookerService } from '../../rooker/rooker.service';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUuid: jest.fn(),
  findByUsername: jest.fn(),
  findByUuids: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  getUserCount: jest.fn(),
};

const mockRooker = { ensureProfile: jest.fn() };
const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const mockUser = {
  id: 1,
  username: 'TrainerAsh',
  uuid: VALID_UUID,
  world: 'main',
} as any;

describe('UsersService (SmartRotom)', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRooker.ensureProfile.mockResolvedValue('trainerash');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USERS_REPOSITORY_TOKEN, useValue: mockRepo },
        { provide: RookerService, useValue: mockRooker },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllUsers ───────────────────────────────────────────────────────────────

  describe('getAllUsers()', () => {
    it('returns all users from repo', async () => {
      mockRepo.findAll.mockResolvedValue([mockUser]);

      await expect(service.getAllUsers()).resolves.toEqual([mockUser]);
    });
  });

  // ─── getUserById ──────────────────────────────────────────────────────────────

  describe('getUserById()', () => {
    it('returns user when found', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);

      await expect(service.getUserById(1)).resolves.toEqual(mockUser);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getUserById(99)).rejects.toThrow('not found');
    });
  });

  // ─── getUserByUuid ────────────────────────────────────────────────────────────

  describe('getUserByUuid()', () => {
    it('returns user when found', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockUser);

      await expect(service.getUserByUuid(VALID_UUID)).resolves.toEqual(
        mockUser,
      );
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getUserByUuid('')).rejects.toThrow(
        'UUID is required',
      );
    });

    it('throws BadRequestException when uuid format is invalid', async () => {
      await expect(service.getUserByUuid('not-a-valid-uuid')).rejects.toThrow(
        'Invalid UUID format',
      );
    });
  });

  // ─── createUser ───────────────────────────────────────────────────────────────

  describe('createUser()', () => {
    const dto = {
      uuid: VALID_UUID,
      username: 'TrainerAsh',
      world: 'main',
    } as any;

    it('creates user when uuid and username are unique', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockUser);

      await expect(service.createUser(dto)).resolves.toEqual(mockUser);
    });

    it('throws ConflictException when UUID already exists', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockUser);

      await expect(service.createUser(dto)).rejects.toThrow('already exists');
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when username is already taken', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(mockUser);

      await expect(service.createUser(dto)).rejects.toThrow('already exists');
    });
  });

  // ─── findOrCreateUser ─────────────────────────────────────────────────────────

  describe('findOrCreateUser()', () => {
    const dto = {
      uuid: VALID_UUID,
      username: 'TrainerAsh',
      world: 'main',
    } as any;

    it('returns existing user with isNew=false', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockUser);

      const result = await service.findOrCreateUser(dto);

      expect(result.isNew).toBe(false);
      expect(result.user).toEqual(mockUser);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('creates new user and returns isNew=true', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreateUser(dto);

      expect(result.isNew).toBe(true);
    });

    it('throws ConflictException when username is taken by another uuid', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue({
        ...mockUser,
        uuid: 'different-uuid',
      });

      await expect(service.findOrCreateUser(dto)).rejects.toThrow(
        'already taken',
      );
    });
  });

  // ─── updateUser ───────────────────────────────────────────────────────────────

  // ─── Rooker provisioning ──────────────────────────────────────────────────────
  // A player without a Rooker profile is in a dead end, not merely incomplete: the
  // composer is hidden and the only route to the "create profile" form is their own
  // profile page, which does not exist. So creation has to mint one.

  describe('Rooker profile provisioning', () => {
    const dto = { uuid: VALID_UUID, username: 'TrainerAsh' } as any;

    beforeEach(() => {
      mockRepo.findByUuid.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockUser);
    });

    it('mints a handle when createUser() makes a user', async () => {
      await service.createUser(dto);

      expect(mockRooker.ensureProfile).toHaveBeenCalledWith(
        VALID_UUID,
        'TrainerAsh',
      );
    });

    it('mints a handle when findOrCreateUser() makes a user', async () => {
      await service.findOrCreateUser(dto);

      expect(mockRooker.ensureProfile).toHaveBeenCalledWith(
        VALID_UUID,
        'TrainerAsh',
      );
    });

    it('does not touch Rooker when the user already existed', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockUser);

      await expect(service.findOrCreateUser(dto)).resolves.toEqual({
        user: mockUser,
        isNew: false,
      });
      expect(mockRooker.ensureProfile).not.toHaveBeenCalled();
    });

    it('still returns the user when Rooker throws', async () => {
      mockRooker.ensureProfile.mockRejectedValue(new Error('rooker is down'));

      await expect(service.findOrCreateUser(dto)).resolves.toEqual({
        user: mockUser,
        isNew: true,
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('warns, but still returns the user, when no handle was free', async () => {
      mockRooker.ensureProfile.mockResolvedValue(null);

      await expect(service.createUser(dto)).resolves.toEqual(mockUser);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('updateUser()', () => {
    it('updates user when no conflicts', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      mockRepo.findByUsername.mockResolvedValue(null);
      mockRepo.update.mockResolvedValue({ ...mockUser, username: 'NewName' });

      const result = await service.updateUser(1, {
        username: 'NewName',
      } as any);

      expect(result.username).toBe('NewName');
    });

    it('throws ConflictException when new username is taken by a different user', async () => {
      mockRepo.findById.mockResolvedValue(mockUser);
      mockRepo.findByUsername.mockResolvedValue({ ...mockUser, id: 999 }); // different user has that name

      await expect(
        service.updateUser(1, { username: 'TakenName' } as any),
      ).rejects.toThrow('already taken');
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────────────────────

  describe('deleteUser()', () => {
    it('deletes existing user and returns success', async () => {
      mockRepo.exists.mockResolvedValue(true);
      mockRepo.delete.mockResolvedValue(true);

      const result = await service.deleteUser(1);

      expect(result.success).toBe(true);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockRepo.exists.mockResolvedValue(false);

      await expect(service.deleteUser(99)).rejects.toThrow('not found');
    });
  });

  // ─── getMultipleUsers ─────────────────────────────────────────────────────────

  describe('getMultipleUsers()', () => {
    it('returns empty object when given empty array', async () => {
      await expect(service.getMultipleUsers([])).resolves.toEqual({});
      expect(mockRepo.findByUuids).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when any uuid is invalid', async () => {
      await expect(service.getMultipleUsers(['bad-uuid'])).rejects.toThrow(
        'Invalid UUID format',
      );
    });

    it('fetches multiple users by uuid array', async () => {
      const map = { [VALID_UUID]: mockUser };
      mockRepo.findByUuids.mockResolvedValue(map);

      const result = await service.getMultipleUsers([VALID_UUID]);

      expect(result[VALID_UUID]).toEqual(mockUser);
    });
  });

  // ─── validateUserExists ───────────────────────────────────────────────────────

  describe('validateUserExists()', () => {
    it('returns true when user exists', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockUser);

      await expect(service.validateUserExists(VALID_UUID)).resolves.toBe(true);
    });

    it('returns false when user not found', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);

      await expect(service.validateUserExists(VALID_UUID)).resolves.toBe(false);
    });
  });
});
