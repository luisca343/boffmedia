import { Test, TestingModule } from '@nestjs/testing';
import { StarbankFacadeService } from './starbank.facade.service';
import { StarbankAccountService } from './services/starbank-account.service';
import { StarbankTransactionService } from './services/starbank-transaction.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { AccountType } from './enums/account-type.enum';
import { Logger } from 'nestjs-pino';

const mockMainAccount = {
  id: 1,
  uuid: 'test-uuid-1234',
  name: 'Main',
  type: AccountType.MAIN,
  balance: 500,
};

const mockSecondaryAccount = {
  id: 2,
  uuid: 'test-uuid-1234',
  name: 'Savings',
  type: AccountType.SECONDARY,
  balance: 100,
};

const mockTransaction = {
  id: 1,
  from: 1,
  to: 2,
  amount: 100,
  concept: 'test',
  createdAt: new Date(),
};

describe('StarbankFacadeService', () => {
  let service: StarbankFacadeService;
  let accountService: jest.Mocked<
    Pick<
      StarbankAccountService,
      | 'createAccount'
      | 'createMainAccount'
      | 'getAllAccounts'
      | 'getUserAccounts'
      | 'getUserMainAccount'
      | 'getUserBalance'
      | 'getAccountInfo'
    >
  >;
  let transactionService: jest.Mocked<
    Pick<
      StarbankTransactionService,
      | 'transfer'
      | 'transferFromMain'
      | 'transferFromSystem'
      | 'processShopTransaction'
      | 'processTrainerDefeat'
      | 'getAccountTransactions'
      | 'getUserTransactions'
      | 'getAccountTransfers'
      | 'getUserTransfers'
    >
  >;
  let wingullFacadeService: jest.Mocked<
    Pick<WingullFacadeService, 'updateBalance' | 'getCurrentBalance'>
  >;
  let logger: jest.Mocked<Pick<Logger, 'log' | 'warn' | 'error'>>;

  beforeEach(async () => {
    const mockAccountService = {
      createAccount: jest.fn(),
      createMainAccount: jest.fn(),
      getAllAccounts: jest.fn(),
      getUserAccounts: jest.fn(),
      getUserMainAccount: jest.fn(),
      getUserBalance: jest.fn(),
      getAccountInfo: jest.fn(),
    };

    const mockTransactionService = {
      transfer: jest.fn(),
      transferFromMain: jest.fn(),
      transferFromSystem: jest.fn(),
      processShopTransaction: jest.fn(),
      processTrainerDefeat: jest.fn(),
      getAccountTransactions: jest.fn(),
      getUserTransactions: jest.fn(),
      getAccountTransfers: jest.fn(),
      getUserTransfers: jest.fn(),
    };

    const mockWingullFacadeService = {
      updateBalance: jest.fn(),
      getCurrentBalance: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarbankFacadeService,
        { provide: StarbankAccountService, useValue: mockAccountService },
        {
          provide: StarbankTransactionService,
          useValue: mockTransactionService,
        },
        { provide: WingullFacadeService, useValue: mockWingullFacadeService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<StarbankFacadeService>(StarbankFacadeService);
    accountService = module.get(StarbankAccountService);
    transactionService = module.get(StarbankTransactionService);
    wingullFacadeService = module.get(WingullFacadeService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create a MAIN account when name is empty', async () => {
      accountService.createMainAccount.mockResolvedValue(
        mockMainAccount as any,
      );

      const result = await service.createAccount('test-uuid-1234', '');

      expect(accountService.createMainAccount).toHaveBeenCalledWith(
        'test-uuid-1234',
        '',
      );
      expect(result).toEqual(mockMainAccount);
    });

    it('should create a SECONDARY account when name is provided', async () => {
      accountService.createAccount.mockResolvedValue(
        mockSecondaryAccount as any,
      );

      const result = await service.createAccount('test-uuid-1234', 'Savings');

      expect(accountService.createAccount).toHaveBeenCalledWith({
        uuid: 'test-uuid-1234',
        name: 'Savings',
        type: AccountType.SECONDARY,
        image: undefined,
      });
      expect(result).toEqual(mockSecondaryAccount);
    });
  });

  describe('createMainAccount', () => {
    it('should delegate to accountService.createMainAccount', async () => {
      accountService.createMainAccount.mockResolvedValue(
        mockMainAccount as any,
      );

      const result = await service.createMainAccount(
        'test-uuid-1234',
        'TestUser',
      );

      expect(accountService.createMainAccount).toHaveBeenCalledWith(
        'test-uuid-1234',
        'TestUser',
      );
      expect(result).toEqual(mockMainAccount);
    });
  });

  describe('getAllAccounts', () => {
    it('should return all accounts', async () => {
      accountService.getAllAccounts.mockResolvedValue([mockMainAccount] as any);

      const result = await service.getAllAccounts();

      expect(accountService.getAllAccounts).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockMainAccount]);
    });
  });

  describe('getAccounts', () => {
    it('should return accounts for a player', async () => {
      accountService.getUserAccounts.mockResolvedValue([
        mockMainAccount,
      ] as any);

      const result = await service.getAccounts('test-uuid-1234');

      expect(accountService.getUserAccounts).toHaveBeenCalledWith(
        'test-uuid-1234',
      );
      expect(result).toEqual([mockMainAccount]);
    });
  });

  describe('getMainAccount', () => {
    it('should return main account for a player', async () => {
      accountService.getUserMainAccount.mockResolvedValue({
        id: 1,
        balance: 500,
      });

      const result = await service.getMainAccount('test-uuid-1234');

      expect(accountService.getUserMainAccount).toHaveBeenCalledWith(
        'test-uuid-1234',
      );
      expect(result).toEqual({ id: 1, balance: 500 });
    });

    it('should return null when no main account', async () => {
      accountService.getUserMainAccount.mockResolvedValue(null);

      const result = await service.getMainAccount('no-account-uuid');

      expect(result).toBeNull();
    });
  });

  describe('getBalance', () => {
    it('should return balance for a player', async () => {
      accountService.getUserBalance.mockResolvedValue({ balance: 500 });

      const result = await service.getBalance('test-uuid-1234');

      expect(accountService.getUserBalance).toHaveBeenCalledWith(
        'test-uuid-1234',
      );
      expect(result).toEqual({ balance: 500 });
    });
  });

  describe('getAccountInfo', () => {
    it('should return account info', async () => {
      accountService.getAccountInfo.mockResolvedValue(mockMainAccount as any);

      const result = await service.getAccountInfo(1);

      expect(accountService.getAccountInfo).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMainAccount);
    });

    it('should return null when account not found', async () => {
      accountService.getAccountInfo.mockResolvedValue(null);

      const result = await service.getAccountInfo(999);

      expect(result).toBeNull();
    });
  });

  describe('transfer', () => {
    it('should transfer and attempt to sync in-game balance for MAIN accounts', async () => {
      transactionService.transfer.mockResolvedValue(undefined);
      accountService.getAccountInfo
        .mockResolvedValueOnce(mockMainAccount as any)
        .mockResolvedValueOnce(mockSecondaryAccount as any);
      wingullFacadeService.updateBalance.mockResolvedValue(undefined);

      await service.transfer(1, 2, 100, 'test transfer');

      expect(transactionService.transfer).toHaveBeenCalledWith(
        {
          from: 1,
          to: 2,
          amount: 100,
          concept: 'test transfer',
        },
        undefined,
      );
      // Only MAIN account should trigger balance sync
      expect(wingullFacadeService.updateBalance).toHaveBeenCalledTimes(1);
    });

    it('should not throw if in-game balance sync fails after transfer', async () => {
      transactionService.transfer.mockResolvedValue(undefined);
      accountService.getAccountInfo.mockRejectedValue(
        new Error('wingull down'),
      );

      await expect(service.transfer(1, 2, 50, 'test')).resolves.not.toThrow();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('transferFromMain', () => {
    it('should transfer from main and sync in-game balance', async () => {
      transactionService.transferFromMain.mockResolvedValue(undefined);
      accountService.getUserMainAccount.mockResolvedValue({
        id: 1,
        balance: 400,
      });
      wingullFacadeService.updateBalance.mockResolvedValue(undefined);

      await service.transferFromMain('test-uuid-1234', 2, 100, 'rent');

      expect(transactionService.transferFromMain).toHaveBeenCalledWith(
        {
          uuid: 'test-uuid-1234',
          to: 2,
          amount: 100,
          concept: 'rent',
        },
        undefined,
      );
      expect(wingullFacadeService.updateBalance).toHaveBeenCalled();
    });

    it('should not throw if in-game balance sync fails', async () => {
      transactionService.transferFromMain.mockResolvedValue(undefined);
      accountService.getUserMainAccount.mockRejectedValue(new Error('timeout'));

      await expect(
        service.transferFromMain('test-uuid-1234', 2, 50, 'test'),
      ).resolves.not.toThrow();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('transferFromSystem', () => {
    it('should transfer from system and sync balance for MAIN accounts', async () => {
      transactionService.transferFromSystem.mockResolvedValue(undefined);
      accountService.getAccountInfo.mockResolvedValue(mockMainAccount as any);
      wingullFacadeService.updateBalance.mockResolvedValue(undefined);

      await service.transferFromSystem(1, 100, 'welcome bonus');

      expect(transactionService.transferFromSystem).toHaveBeenCalledWith(
        1,
        100,
        'welcome bonus',
      );
      expect(wingullFacadeService.updateBalance).toHaveBeenCalled();
    });

    it('should not sync balance for SECONDARY accounts', async () => {
      transactionService.transferFromSystem.mockResolvedValue(undefined);
      accountService.getAccountInfo.mockResolvedValue(
        mockSecondaryAccount as any,
      );

      await service.transferFromSystem(2, 50, 'reward');

      expect(wingullFacadeService.updateBalance).not.toHaveBeenCalled();
    });
  });

  describe('shop', () => {
    it('should process shop transaction and sync balance', async () => {
      const shopData = { uuid: 'test-uuid-1234', items: [], total: 100 };
      transactionService.processShopTransaction.mockResolvedValue(undefined);
      accountService.getUserMainAccount.mockResolvedValue({
        id: 1,
        balance: 400,
      });
      wingullFacadeService.updateBalance.mockResolvedValue(undefined);

      await service.shop(shopData as any);

      expect(transactionService.processShopTransaction).toHaveBeenCalledWith(
        shopData,
      );
      expect(wingullFacadeService.updateBalance).toHaveBeenCalled();
    });
  });

  describe('trainerDefeat', () => {
    it('should get current balance and process trainer defeat', async () => {
      wingullFacadeService.getCurrentBalance.mockResolvedValue(1000);
      transactionService.processTrainerDefeat.mockResolvedValue(undefined);

      await service.trainerDefeat(200, 'test-uuid-1234');

      expect(wingullFacadeService.getCurrentBalance).toHaveBeenCalledWith(
        'test-uuid-1234',
        200,
      );
      expect(transactionService.processTrainerDefeat).toHaveBeenCalledWith(
        { uuid: 'test-uuid-1234', money: 200 },
        1000,
      );
    });
  });

  describe('getTransactions', () => {
    it('should return transactions with default limit', async () => {
      transactionService.getAccountTransactions.mockResolvedValue([
        mockTransaction,
      ] as any);

      const result = await service.getTransactions(1);

      expect(transactionService.getAccountTransactions).toHaveBeenCalledWith(
        1,
        50,
      );
      expect(result).toEqual([mockTransaction]);
    });

    it('should pass custom limit', async () => {
      transactionService.getAccountTransactions.mockResolvedValue([]);

      await service.getTransactions(1, 10);

      expect(transactionService.getAccountTransactions).toHaveBeenCalledWith(
        1,
        10,
      );
    });
  });

  describe('getTransactionsByUUID', () => {
    it('should return transactions for user by UUID with default limit', async () => {
      transactionService.getUserTransactions.mockResolvedValue([
        mockTransaction,
      ] as any);

      const result = await service.getTransactionsByUUID('test-uuid-1234');

      expect(transactionService.getUserTransactions).toHaveBeenCalledWith(
        'test-uuid-1234',
        50,
      );
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('getTransfers', () => {
    it('should return last 10 transfers for account', async () => {
      transactionService.getAccountTransfers.mockResolvedValue([
        mockTransaction,
      ] as any);

      const result = await service.getTransfers(1);

      expect(transactionService.getAccountTransfers).toHaveBeenCalledWith(
        1,
        10,
      );
      expect(result).toEqual([mockTransaction]);
    });
  });

  describe('getTransfersByUUID', () => {
    it('should return last 10 transfers for player by UUID', async () => {
      transactionService.getUserTransfers.mockResolvedValue([
        mockTransaction,
      ] as any);

      const result = await service.getTransfersByUUID('test-uuid-1234');

      expect(transactionService.getUserTransfers).toHaveBeenCalledWith(
        'test-uuid-1234',
        10,
      );
      expect(result).toEqual([mockTransaction]);
    });
  });
});
