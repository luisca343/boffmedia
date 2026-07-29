import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { StarbankAccountService } from './starbank-account.service';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { AccountType } from '../enums/account-type.enum';
import { CreateAccountDto } from '../dto/create-account.dto';

const mockAccount = {
  id: 1,
  uuid: 'abc-123',
  name: 'TrainerAsh',
  type: AccountType.MAIN,
  balance: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StarbankAccountService', () => {
  let service: StarbankAccountService;
  let mockLogger: { log: jest.Mock; error: jest.Mock; warn: jest.Mock };
  let accountRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByUuid: jest.Mock;
    findUserMainAccount: jest.Mock;
    findByType: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
    updateBalance: jest.Mock;
    getUserBalance: jest.Mock;
    checkAccountExists: jest.Mock;
    findAccountOwnerUuid: jest.Mock;
    updateAccountDetails: jest.Mock;
  };

  beforeEach(async () => {
    mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
    accountRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUuid: jest.fn(),
      findUserMainAccount: jest.fn(),
      findByType: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      updateBalance: jest.fn(),
      getUserBalance: jest.fn(),
      checkAccountExists: jest.fn(),
      findAccountOwnerUuid: jest.fn(),
      updateAccountDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarbankAccountService,
        { provide: Logger, useValue: mockLogger },
        {
          provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
          useValue: accountRepository,
        },
      ],
    }).compile();

    service = module.get<StarbankAccountService>(StarbankAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount()', () => {
    const dto: CreateAccountDto = {
      uuid: 'abc-123',
      name: 'TrainerAsh',
      type: AccountType.SECONDARY,
    };

    it('should create a secondary account', async () => {
      accountRepository.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount(dto);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'abc-123', name: 'TrainerAsh' }),
      );
    });

    it('should throw when uuid is empty', async () => {
      await expect(service.createAccount({ ...dto, uuid: '' })).rejects.toThrow(
        'UUID is required',
      );
      expect(accountRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when name is empty', async () => {
      await expect(service.createAccount({ ...dto, name: '' })).rejects.toThrow(
        'Account name is required',
      );
    });

    it('should throw when main account already exists', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue({
        id: 5,
        balance: 0,
      });

      await expect(
        service.createAccount({ ...dto, type: AccountType.MAIN }),
      ).rejects.toThrow('User already has a main account');
      expect(accountRepository.create).not.toHaveBeenCalled();
    });

    it('should allow creating a main account when none exists', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue(null);
      accountRepository.create.mockResolvedValue({
        ...mockAccount,
        type: AccountType.MAIN,
      });

      const result = await service.createAccount({
        ...dto,
        type: AccountType.MAIN,
      });

      expect(result.type).toBe(AccountType.MAIN);
    });
  });

  describe('createMainAccount()', () => {
    it('should create a main account for a new user', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue(null);
      accountRepository.create.mockResolvedValue(mockAccount);

      const result = await service.createMainAccount('abc-123', 'TrainerAsh');

      expect(result).toEqual(mockAccount);
    });

    it('should throw when main account already exists', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue({
        id: 5,
        balance: 100,
      });

      await expect(
        service.createMainAccount('abc-123', 'TrainerAsh'),
      ).rejects.toThrow('Main account already exists');
    });
  });

  describe('getUserBalance()', () => {
    it('should return the balance for a known user', async () => {
      accountRepository.getUserBalance.mockResolvedValue(1500);

      const result = await service.getUserBalance('abc-123');

      expect(result).toEqual({ balance: 1500 });
    });

    it('should return zero on repository error', async () => {
      accountRepository.getUserBalance.mockRejectedValue(new Error('DB error'));

      const result = await service.getUserBalance('unknown-uuid');

      expect(result).toEqual({ balance: 0 });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllAccounts()', () => {
    it('should return all accounts', async () => {
      accountRepository.findAll.mockResolvedValue([mockAccount]);

      const result = await service.getAllAccounts();

      expect(result).toHaveLength(1);
      expect(accountRepository.findAll).toHaveBeenCalledTimes(1);
    });

    // The route is @Public(), so the treasury, the market escrow and each service's takings
    // must not be in a player-facing directory.
    it('excludes house accounts', async () => {
      accountRepository.findAll.mockResolvedValue([
        mockAccount,
        { ...mockAccount, id: 2, type: AccountType.GOVERNMENT },
        { ...mockAccount, id: 3, type: AccountType.MARKET },
        { ...mockAccount, id: 4, type: AccountType.SYSTEM },
        { ...mockAccount, id: 5, type: AccountType.SERVICE },
      ]);

      const result = await service.getAllAccounts();

      expect(result.map((a) => a.id)).toEqual([1]);
    });
  });

  describe('updateAccount()', () => {
    const SECONDARY = {
      ...mockAccount,
      id: 9,
      type: AccountType.SECONDARY,
      name: 'Ahorros',
    };
    const OWNER = { uuid: 'abc-123', isAdmin: false };

    beforeEach(() => {
      accountRepository.findById.mockResolvedValue(SECONDARY);
      accountRepository.findAccountOwnerUuid.mockResolvedValue('abc-123');
      accountRepository.updateAccountDetails.mockResolvedValue(undefined);
    });

    it('renames a secondary account the caller owns', async () => {
      await service.updateAccount(9, { name: 'Viajes' }, OWNER);

      expect(accountRepository.updateAccountDetails).toHaveBeenCalledWith(9, {
        name: 'Viajes',
        image: undefined,
      });
    });

    it('trims the name and refuses an empty one', async () => {
      await service.updateAccount(9, { name: '  Viajes  ' }, OWNER);
      expect(accountRepository.updateAccountDetails).toHaveBeenCalledWith(9, {
        name: 'Viajes',
        image: undefined,
      });

      await expect(
        service.updateAccount(9, { name: '   ' }, OWNER),
      ).rejects.toThrow(BadRequestException);
    });

    it("refuses to touch another player's account", async () => {
      accountRepository.findAccountOwnerUuid.mockResolvedValue('someone-else');

      await expect(
        service.updateAccount(9, { name: 'Viajes' }, OWNER),
      ).rejects.toThrow(ForbiddenException);
      expect(accountRepository.updateAccountDetails).not.toHaveBeenCalled();
    });

    // So an inappropriate picture can be replaced without the owner.
    it('lets ROTOM_ADMIN edit an account they do not own', async () => {
      accountRepository.findAccountOwnerUuid.mockResolvedValue('someone-else');

      await service.updateAccount(
        9,
        { name: 'Viajes' },
        { uuid: 'admin-uuid', isAdmin: true },
      );

      expect(accountRepository.updateAccountDetails).toHaveBeenCalled();
    });

    it('lets the trusted game server edit any account', async () => {
      await service.updateAccount(9, { name: 'Viajes' }, null);

      expect(accountRepository.findAccountOwnerUuid).not.toHaveBeenCalled();
      expect(accountRepository.updateAccountDetails).toHaveBeenCalled();
    });

    // MAIN is created by the server and represents the player; a house account is nobody's.
    it.each([
      AccountType.MAIN,
      AccountType.GOVERNMENT,
      AccountType.MARKET,
      AccountType.SYSTEM,
      AccountType.SERVICE,
    ])('refuses to edit a %s account', async (type) => {
      accountRepository.findById.mockResolvedValue({ ...SECONDARY, type });

      await expect(
        service.updateAccount(9, { name: 'Viajes' }, OWNER),
      ).rejects.toThrow(ForbiddenException);
      expect(accountRepository.updateAccountDetails).not.toHaveBeenCalled();
    });

    it('refuses an account that does not exist', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateAccount(9, { name: 'Viajes' }, OWNER),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
