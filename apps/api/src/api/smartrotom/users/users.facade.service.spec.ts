import { Test, TestingModule } from '@nestjs/testing';
import { UsersFacadeService } from './users.facade.service';
import { UsersService } from './services/users.service';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';
import { ChatappFacadeService } from '../chatapp/chatapp.facade.service';
import { Logger } from 'nestjs-pino';

const mockUser = {
  id: 1,
  uuid: 'test-uuid-1234',
  username: 'Ash',
  world: 'PixelWorld',
  createdAt: new Date(),
};

const mockAccount = {
  id: 1,
  uuid: 'test-uuid-1234',
  type: 'MAIN',
  balance: 1000,
};

describe('UsersFacadeService (SmartRotom)', () => {
  let service: UsersFacadeService;
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      | 'getAllUsers'
      | 'getUserById'
      | 'getUserByUuid'
      | 'createUser'
      | 'findOrCreateUser'
      | 'updateUser'
      | 'deleteUser'
      | 'getMultipleUsers'
      | 'getUserCount'
      | 'validateUserExists'
    >
  >;
  let starbankService: jest.Mocked<
    Pick<
      StarbankFacadeService,
      | 'getAccounts'
      | 'createMainAccount'
      | 'getMainAccount'
      | 'transferFromSystem'
    >
  >;
  let chatAppService: jest.Mocked<Pick<ChatappFacadeService, 'createChat'>>;
  let logger: jest.Mocked<Pick<Logger, 'log' | 'warn' | 'error'>>;

  beforeEach(async () => {
    const mockUsersService = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      getUserByUuid: jest.fn(),
      createUser: jest.fn(),
      findOrCreateUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getMultipleUsers: jest.fn(),
      getUserCount: jest.fn(),
      validateUserExists: jest.fn(),
    };

    const mockStarbankService = {
      getAccounts: jest.fn(),
      createMainAccount: jest.fn(),
      getMainAccount: jest.fn(),
      transferFromSystem: jest.fn(),
    };

    const mockChatAppService = { createChat: jest.fn() };

    const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersFacadeService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: StarbankFacadeService, useValue: mockStarbankService },
        { provide: ChatappFacadeService, useValue: mockChatAppService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersFacadeService>(UsersFacadeService);
    usersService = module.get(UsersService);
    starbankService = module.get(StarbankFacadeService);
    chatAppService = module.get(ChatappFacadeService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      usersService.getAllUsers.mockResolvedValue([mockUser] as any);

      const result = await service.getAllUsers();

      expect(usersService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      usersService.getUserById.mockResolvedValue(mockUser as any);

      const result = await service.getUserById(1);

      expect(usersService.getUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserByUuid', () => {
    it('should return user by uuid', async () => {
      usersService.getUserByUuid.mockResolvedValue(mockUser as any);

      const result = await service.getUserByUuid('test-uuid-1234');

      expect(usersService.getUserByUuid).toHaveBeenCalledWith('test-uuid-1234');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      usersService.getUserByUuid.mockResolvedValue(null);

      const result = await service.getUserByUuid('unknown-uuid');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      usersService.createUser.mockResolvedValue(mockUser as any);

      const result = await service.createUser({
        uuid: 'test-uuid-1234',
        username: 'Ash',
      } as any);

      expect(result).toEqual(mockUser);
    });
  });

  describe('findOrCreateUser', () => {
    it('should return user creation result', async () => {
      usersService.findOrCreateUser.mockResolvedValue({
        user: mockUser,
        isNew: false,
      } as any);

      const result = await service.findOrCreateUser({
        uuid: 'test-uuid-1234',
        username: 'Ash',
      } as any);

      expect(result.user).toEqual(mockUser);
      expect(result.isNew).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updated = { ...mockUser, username: 'Pikachu' };
      usersService.updateUser.mockResolvedValue(updated as any);

      const result = await service.updateUser(1, {
        username: 'Pikachu',
      } as any);

      expect(usersService.updateUser).toHaveBeenCalledWith(1, {
        username: 'Pikachu',
      });
      expect(result.username).toBe('Pikachu');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      usersService.deleteUser.mockResolvedValue({
        success: true,
        message: 'Deleted',
      });

      const result = await service.deleteUser(1);

      expect(usersService.deleteUser).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });
  });

  describe('initializeUserAndAccounts', () => {
    it('should create main account and welcome bonus for new users with no accounts', async () => {
      usersService.findOrCreateUser.mockResolvedValue({
        user: mockUser,
        isNew: true,
      } as any);
      starbankService.getAccounts.mockResolvedValue([]);
      starbankService.createMainAccount.mockResolvedValue(mockAccount as any);
      starbankService.getMainAccount.mockResolvedValue({ id: 1, balance: 0 });
      starbankService.transferFromSystem.mockResolvedValue(undefined);
      chatAppService.createChat.mockResolvedValue(undefined as any);

      const result = await service.initializeUserAndAccounts({
        uuid: 'test-uuid-1234',
        username: 'Ash',
      });

      expect(starbankService.createMainAccount).toHaveBeenCalledWith(
        'test-uuid-1234',
        'Ash',
      );
      expect(starbankService.transferFromSystem).toHaveBeenCalledWith(
        1,
        1000,
        'Ingreso de Bienvenida',
      );
      expect(result.isNewAccount).toBe(true);
      expect(result.isNewUser).toBe(true);
    });

    it('should not create account if accounts already exist', async () => {
      usersService.findOrCreateUser.mockResolvedValue({
        user: mockUser,
        isNew: false,
      } as any);
      starbankService.getAccounts.mockResolvedValue([mockAccount] as any);
      chatAppService.createChat.mockResolvedValue(undefined as any);

      const result = await service.initializeUserAndAccounts({
        uuid: 'test-uuid-1234',
        username: 'Ash',
      });

      expect(starbankService.createMainAccount).not.toHaveBeenCalled();
      expect(result.isNewAccount).toBe(false);
    });

    it('should not throw if chat creation fails', async () => {
      usersService.findOrCreateUser.mockResolvedValue({
        user: mockUser,
        isNew: false,
      } as any);
      starbankService.getAccounts.mockResolvedValue([mockAccount] as any);
      chatAppService.createChat.mockRejectedValue(new Error('chat error'));

      await expect(
        service.initializeUserAndAccounts({
          uuid: 'test-uuid-1234',
          username: 'Ash',
        }),
      ).resolves.not.toThrow();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('getUserWithAccounts', () => {
    it('should return user with accounts', async () => {
      usersService.getUserByUuid.mockResolvedValue(mockUser as any);
      starbankService.getAccounts.mockResolvedValue([mockAccount] as any);

      const result = await service.getUserWithAccounts('test-uuid-1234');

      expect(result).toEqual({ user: mockUser, accounts: [mockAccount] });
    });

    it('should return null when user not found', async () => {
      usersService.getUserByUuid.mockResolvedValue(null);

      const result = await service.getUserWithAccounts('unknown');

      expect(result).toBeNull();
      expect(starbankService.getAccounts).not.toHaveBeenCalled();
    });
  });

  describe('getMultipleUsers', () => {
    it('should delegate to usersService', async () => {
      usersService.getMultipleUsers.mockResolvedValue({
        'test-uuid-1234': mockUser,
      } as any);

      const result = await service.getMultipleUsers(['test-uuid-1234']);

      expect(usersService.getMultipleUsers).toHaveBeenCalledWith([
        'test-uuid-1234',
      ]);
      expect(result['test-uuid-1234']).toEqual(mockUser);
    });
  });

  describe('getUserStatistics', () => {
    it('should return total user count', async () => {
      usersService.getUserCount.mockResolvedValue(42);

      const result = await service.getUserStatistics();

      expect(result.totalUsers).toBe(42);
    });
  });

  describe('validateUserExists', () => {
    it('should return true when user exists', async () => {
      usersService.validateUserExists.mockResolvedValue(true);

      const result = await service.validateUserExists('test-uuid-1234');

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      usersService.validateUserExists.mockResolvedValue(false);

      const result = await service.validateUserExists('unknown');

      expect(result).toBe(false);
    });
  });
});
