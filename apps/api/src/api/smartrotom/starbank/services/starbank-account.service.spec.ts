import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { StarbankAccountService } from './starbank-account.service';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { AccountType } from '../enums/account-type.enum';
import { CreateAccountDto } from '../dto/create-account.dto';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockAccountRepository = {
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
};

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarbankAccountService,
        { provide: Logger, useValue: mockLogger },
        { provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN, useValue: mockAccountRepository },
      ],
    }).compile();

    service = module.get<StarbankAccountService>(StarbankAccountService);
  });

  afterEach(() => jest.clearAllMocks());

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
      mockAccountRepository.create.mockResolvedValue(mockAccount);

      const result = await service.createAccount(dto);

      expect(result).toEqual(mockAccount);
      expect(mockAccountRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'abc-123', name: 'TrainerAsh' }),
      );
    });

    it('should throw when uuid is empty', async () => {
      await expect(service.createAccount({ ...dto, uuid: '' })).rejects.toThrow(
        'UUID is required',
      );
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when name is empty', async () => {
      await expect(service.createAccount({ ...dto, name: '' })).rejects.toThrow(
        'Account name is required',
      );
    });

    it('should throw when main account already exists', async () => {
      mockAccountRepository.findUserMainAccount.mockResolvedValue({ id: 5, balance: 0 });

      await expect(
        service.createAccount({ ...dto, type: AccountType.MAIN }),
      ).rejects.toThrow('User already has a main account');
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('should allow creating a main account when none exists', async () => {
      mockAccountRepository.findUserMainAccount.mockResolvedValue(null);
      mockAccountRepository.create.mockResolvedValue({ ...mockAccount, type: AccountType.MAIN });

      const result = await service.createAccount({ ...dto, type: AccountType.MAIN });

      expect(result.type).toBe(AccountType.MAIN);
    });
  });

  describe('createMainAccount()', () => {
    it('should create a main account for a new user', async () => {
      mockAccountRepository.findUserMainAccount.mockResolvedValue(null);
      mockAccountRepository.create.mockResolvedValue(mockAccount);

      const result = await service.createMainAccount('abc-123', 'TrainerAsh');

      expect(result).toEqual(mockAccount);
    });

    it('should throw when main account already exists', async () => {
      mockAccountRepository.findUserMainAccount.mockResolvedValue({ id: 5, balance: 100 });

      await expect(service.createMainAccount('abc-123', 'TrainerAsh')).rejects.toThrow(
        'Main account already exists',
      );
    });
  });

  describe('getUserBalance()', () => {
    it('should return the balance for a known user', async () => {
      mockAccountRepository.getUserBalance.mockResolvedValue(1500);

      const result = await service.getUserBalance('abc-123');

      expect(result).toEqual({ balance: 1500 });
    });

    it('should return zero on repository error', async () => {
      mockAccountRepository.getUserBalance.mockRejectedValue(new Error('DB error'));

      const result = await service.getUserBalance('unknown-uuid');

      expect(result).toEqual({ balance: 0 });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getAllAccounts()', () => {
    it('should return all accounts', async () => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);

      const result = await service.getAllAccounts();

      expect(result).toHaveLength(1);
      expect(mockAccountRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
