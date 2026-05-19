import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { StarbankTransactionService } from './starbank-transaction.service';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { TransactionType } from '../enums/transaction-type.enum';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { CreateShopTransactionDto } from '../dto/create-shop-transaction.dto';

const mockAccount = (id: number, balance: number) => ({
  id,
  uuid: 'test-uuid',
  name: 'Test Account',
  balance,
  type: 'MAIN',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('StarbankTransactionService', () => {
  let service: StarbankTransactionService;
  let accountRepository: {
    findById: jest.Mock;
    findUserMainAccount: jest.Mock;
    findAll: jest.Mock;
    findByUuid: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
    findByType: jest.Mock;
    updateBalance: jest.Mock;
    getUserBalance: jest.Mock;
    checkAccountExists: jest.Mock;
  };
  let transactionRepository: {
    create: jest.Mock;
    findByAccountId: jest.Mock;
    findByUserUuid: jest.Mock;
    findTransfersByAccount: jest.Mock;
    findTransfersByUser: jest.Mock;
    findByType: jest.Mock;
  };

  beforeEach(async () => {
    accountRepository = {
      findById: jest.fn(),
      findUserMainAccount: jest.fn(),
      findAll: jest.fn(),
      findByUuid: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByType: jest.fn(),
      updateBalance: jest.fn(),
      getUserBalance: jest.fn(),
      checkAccountExists: jest.fn(),
    };

    transactionRepository = {
      create: jest.fn(),
      findByAccountId: jest.fn(),
      findByUserUuid: jest.fn(),
      findTransfersByAccount: jest.fn(),
      findTransfersByUser: jest.fn(),
      findByType: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarbankTransactionService,
        {
          provide: Logger,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
        {
          provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
          useValue: accountRepository,
        },
        {
          provide: STARBANK_TRANSACTION_REPOSITORY_TOKEN,
          useValue: transactionRepository,
        },
      ],
    }).compile();

    service = module.get<StarbankTransactionService>(
      StarbankTransactionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transfer()', () => {
    const transferDto: CreateTransferDto = {
      from: 1,
      to: 2,
      amount: 100,
      concept: 'Test transfer',
    };

    it('should complete a valid transfer', async () => {
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100));
      transactionRepository.create.mockResolvedValue({ success: true });

      await expect(service.transfer(transferDto)).resolves.toBeUndefined();
      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ from: 1, to: 2, amount: 100 }),
      );
    });

    it('should reject zero amount', async () => {
      await expect(
        service.transfer({ ...transferDto, amount: 0 }),
      ).rejects.toThrow('Transfer amount must be positive');
      expect(accountRepository.findById).not.toHaveBeenCalled();
    });

    it('should reject negative amount', async () => {
      await expect(
        service.transfer({ ...transferDto, amount: -50 }),
      ).rejects.toThrow('Transfer amount must be positive');
    });

    it('should reject transfer to same account', async () => {
      await expect(
        service.transfer({ ...transferDto, from: 1, to: 1 }),
      ).rejects.toThrow('Source and destination accounts must be different');
    });

    it('should throw when source account not found', async () => {
      accountRepository.findById.mockResolvedValueOnce(null);

      await expect(service.transfer(transferDto)).rejects.toThrow(
        'Source account not found',
      );
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw when destination account not found', async () => {
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(null);

      await expect(service.transfer(transferDto)).rejects.toThrow(
        'Destination account not found',
      );
    });

    it('should throw on insufficient balance', async () => {
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 50))
        .mockResolvedValueOnce(mockAccount(2, 100));

      await expect(service.transfer(transferDto)).rejects.toThrow(
        'Insufficient balance',
      );
    });

    it('should throw when transaction creation fails', async () => {
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100));
      transactionRepository.create.mockResolvedValue({
        success: false,
        message: 'DB error',
      });

      await expect(service.transfer(transferDto)).rejects.toThrow('DB error');
    });
  });

  describe('processShopTransaction()', () => {
    const mainAccount = { id: 10, balance: 1000 };
    const buyDto: CreateShopTransactionDto = {
      uuid: 'player-uuid',
      itemName: 'Potion',
      npcName: 'Shop',
      unitPrice: 100,
      count: 2,
      operation: TransactionType.COMPRA,
    };

    it('should process a purchase successfully', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue(mainAccount);
      transactionRepository.create.mockResolvedValue({ success: true });

      await expect(
        service.processShopTransaction(buyDto),
      ).resolves.toBeUndefined();
      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ from: 10, to: 0, amount: 200 }),
      );
    });

    it('should reject purchase with insufficient balance', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue({
        id: 10,
        balance: 100,
      });

      await expect(service.processShopTransaction(buyDto)).rejects.toThrow(
        'Insufficient balance for purchase',
      );
    });

    it('should process a sale successfully', async () => {
      const sellDto: CreateShopTransactionDto = {
        ...buyDto,
        operation: TransactionType.VENTA,
      };
      accountRepository.findUserMainAccount.mockResolvedValue(mainAccount);
      transactionRepository.create.mockResolvedValue({ success: true });

      await expect(
        service.processShopTransaction(sellDto),
      ).resolves.toBeUndefined();
      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ from: 0, to: 10, amount: 200 }),
      );
    });

    it('should throw when main account not found', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue(null);

      await expect(service.processShopTransaction(buyDto)).rejects.toThrow(
        'Main account not found',
      );
    });
  });

  describe('getAccountTransactions()', () => {
    it('should return transactions for an account', async () => {
      const mockTxns = [
        { id: 1, amount: 100 },
        { id: 2, amount: 50 },
      ];
      transactionRepository.findByAccountId.mockResolvedValue(mockTxns);

      const result = await service.getAccountTransactions(1, 10);

      expect(result).toEqual(mockTxns);
      expect(transactionRepository.findByAccountId).toHaveBeenCalledWith(1, 10);
    });

    it('should use default limit of 50', async () => {
      transactionRepository.findByAccountId.mockResolvedValue([]);

      await service.getAccountTransactions(1);

      expect(transactionRepository.findByAccountId).toHaveBeenCalledWith(1, 50);
    });
  });
});
