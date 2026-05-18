import { Test, TestingModule } from '@nestjs/testing';
import { BoffMediaUsersFacadeService } from './users.facade.service';
import { BoffMediaUsersManagementService } from './services/users-management.service';
import { UsersFacadeService as SmartRotomUsersFacadeService } from '@api/smartrotom/users/users.facade.service';
import { StarbankFacadeService } from '@api/smartrotom/starbank/starbank.facade.service';
import { Logger } from 'nestjs-pino';

const mockBoffMediaUser = {
  id: 1,
  username: 'Ash',
  email: 'ash@example.com',
  uuid: null,
  createdAt: new Date(),
};

const mockSmartRotomUser = {
  id: 1,
  uuid: 'test-uuid-1234',
  username: 'Ash',
};

describe('BoffMediaUsersFacadeService', () => {
  let service: BoffMediaUsersFacadeService;
  let usersManagementService: jest.Mocked<
    Pick<
      BoffMediaUsersManagementService,
      | 'createUser'
      | 'getAllUsers'
      | 'getUserById'
      | 'getUserByUsername'
      | 'getUserByEmail'
      | 'updateUser'
      | 'deleteUser'
      | 'getUserRoles'
      | 'validateUser'
      | 'findByEmail'
      | 'createFromGoogle'
      | 'getUserCount'
      | 'validateUserExists'
    >
  >;
  let smartRotomUsersFacadeService: jest.Mocked<
    Pick<SmartRotomUsersFacadeService, 'findOrCreateUser' | 'getUserByUuid' | 'getAccounts' | 'getUserCount'>
  >;
  let starbankService: jest.Mocked<
    Pick<StarbankFacadeService, 'getAccounts' | 'createMainAccount'>
  >;
  let logger: jest.Mocked<Pick<Logger, 'log' | 'warn' | 'error'>>;

  beforeEach(async () => {
    const mockUsersManagementService = {
      createUser: jest.fn(),
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserByEmail: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserRoles: jest.fn(),
      validateUser: jest.fn(),
      findByEmail: jest.fn(),
      createFromGoogle: jest.fn(),
      getUserCount: jest.fn(),
      validateUserExists: jest.fn(),
    };

    const mockSmartRotomUsersFacadeService = {
      findOrCreateUser: jest.fn(),
      getUserByUuid: jest.fn(),
      getAccounts: jest.fn(),
      getUserCount: jest.fn(),
    };

    const mockStarbankService = {
      getAccounts: jest.fn(),
      createMainAccount: jest.fn(),
    };

    const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoffMediaUsersFacadeService,
        { provide: BoffMediaUsersManagementService, useValue: mockUsersManagementService },
        { provide: SmartRotomUsersFacadeService, useValue: mockSmartRotomUsersFacadeService },
        { provide: StarbankFacadeService, useValue: mockStarbankService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<BoffMediaUsersFacadeService>(BoffMediaUsersFacadeService);
    usersManagementService = module.get(BoffMediaUsersManagementService);
    smartRotomUsersFacadeService = module.get(SmartRotomUsersFacadeService);
    starbankService = module.get(StarbankFacadeService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a BoffMedia user', async () => {
      usersManagementService.createUser.mockResolvedValue(mockBoffMediaUser as any);

      const result = await service.createUser({ username: 'Ash', email: 'ash@example.com', password: 'pass123' });

      expect(usersManagementService.createUser).toHaveBeenCalled();
      expect(result).toEqual(mockBoffMediaUser);
    });

    it('should rethrow errors with descriptive message', async () => {
      usersManagementService.createUser.mockRejectedValue(new Error('DB error'));

      await expect(
        service.createUser({ username: 'Ash', email: 'ash@example.com', password: 'pass123' }),
      ).rejects.toThrow('BoffMedia user creation failed');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      usersManagementService.getAllUsers.mockResolvedValue([mockBoffMediaUser] as any);

      const result = await service.getAllUsers();

      expect(usersManagementService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockBoffMediaUser]);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      usersManagementService.getUserById.mockResolvedValue(mockBoffMediaUser as any);

      const result = await service.getUserById(1);

      expect(usersManagementService.getUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBoffMediaUser);
    });

    it('should return null when not found', async () => {
      usersManagementService.getUserById.mockResolvedValue(null);

      const result = await service.getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user by username', async () => {
      usersManagementService.getUserByUsername.mockResolvedValue(mockBoffMediaUser as any);

      const result = await service.getUserByUsername('Ash');

      expect(usersManagementService.getUserByUsername).toHaveBeenCalledWith('Ash');
      expect(result).toEqual(mockBoffMediaUser);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      usersManagementService.getUserByEmail.mockResolvedValue(mockBoffMediaUser as any);

      const result = await service.getUserByEmail('ash@example.com');

      expect(usersManagementService.getUserByEmail).toHaveBeenCalledWith('ash@example.com');
      expect(result).toEqual(mockBoffMediaUser);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updated = { ...mockBoffMediaUser, username: 'Misty' };
      usersManagementService.updateUser.mockResolvedValue(updated as any);

      const result = await service.updateUser(1, { username: 'Misty' } as any);

      expect(result.username).toBe('Misty');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return success', async () => {
      usersManagementService.deleteUser.mockResolvedValue({ success: true, message: 'Deleted' });

      const result = await service.deleteUser(1);

      expect(result.success).toBe(true);
    });
  });

  describe('getUserRoles', () => {
    it('should return roles for user', async () => {
      usersManagementService.getUserRoles.mockResolvedValue(['admin', 'user']);

      const result = await service.getUserRoles(1);

      expect(usersManagementService.getUserRoles).toHaveBeenCalledWith(1);
      expect(result).toEqual(['admin', 'user']);
    });
  });

  describe('validateUser', () => {
    it('should return authentication result when credentials valid', async () => {
      const authResult = { sessionUser: { id: 1, username: 'Ash' }, integrations: { hasSmartRotom: true, hasStarbank: true, rolesCount: 1 } };
      usersManagementService.validateUser.mockResolvedValue(authResult as any);

      const result = await service.validateUser('Ash', 'pass123');

      expect(usersManagementService.validateUser).toHaveBeenCalledWith('Ash', 'pass123');
      expect(result).toEqual(authResult);
    });

    it('should return null when credentials invalid', async () => {
      usersManagementService.validateUser.mockResolvedValue(null);

      const result = await service.validateUser('Ash', 'wrongpass');

      expect(result).toBeNull();
    });
  });

  describe('validateUserExists', () => {
    it('should return true when user exists', async () => {
      usersManagementService.validateUserExists.mockResolvedValue(true);

      const result = await service.validateUserExists('Ash', 'username');

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      usersManagementService.validateUserExists.mockResolvedValue(false);

      const result = await service.validateUserExists('unknown@email.com', 'email');

      expect(result).toBe(false);
    });
  });

  describe('getUserCount', () => {
    it('should return user count', async () => {
      usersManagementService.getUserCount.mockResolvedValue(100);

      const result = await service.getUserCount();

      expect(result).toBe(100);
    });
  });
});
