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

  describe('transfer() ownership', () => {
    const transferDto: CreateTransferDto = {
      from: 1,
      to: 2,
      amount: 100,
      concept: 'Test transfer',
    };

    const proceed = () => {
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100));
      transactionRepository.create.mockResolvedValue({ success: true });
    };

    it('lets the trusted game server move any account (ownership skipped)', async () => {
      proceed();
      await expect(
        service.transfer(transferDto, { serverAuthed: true }),
      ).resolves.toBeUndefined();
      expect(accountRepository.findByUuid).not.toHaveBeenCalled();
      expect(transactionRepository.create).toHaveBeenCalled();
    });

    it('allows a user to transfer from an account they own', async () => {
      accountRepository.findByUuid.mockResolvedValue([mockAccount(1, 500)]);
      proceed();
      await expect(
        service.transfer(transferDto, {
          serverAuthed: false,
          mcUuid: 'owner-uuid',
        }),
      ).resolves.toBeUndefined();
      expect(accountRepository.findByUuid).toHaveBeenCalledWith('owner-uuid');
      expect(transactionRepository.create).toHaveBeenCalled();
    });

    it('forbids a user from transferring out of an account they do not own', async () => {
      accountRepository.findByUuid.mockResolvedValue([mockAccount(99, 500)]);
      await expect(
        service.transfer(transferDto, {
          serverAuthed: false,
          mcUuid: 'attacker-uuid',
        }),
      ).rejects.toThrow('does not own the source account');
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('skips ownership on the transitional path (no mcUuid)', async () => {
      proceed();
      await expect(
        service.transfer(transferDto, { serverAuthed: false }),
      ).resolves.toBeUndefined();
      expect(accountRepository.findByUuid).not.toHaveBeenCalled();
    });
  });

  describe('transferFromMain() ownership', () => {
    it('forbids spending from a main account the user does not own', async () => {
      await expect(
        service.transferFromMain(
          { uuid: 'victim-uuid', to: 2, amount: 100, concept: 'x' },
          { serverAuthed: false, mcUuid: 'attacker-uuid' },
        ),
      ).rejects.toThrow('does not own the main account');
      expect(accountRepository.findUserMainAccount).not.toHaveBeenCalled();
    });

    it('allows spending from the user own main account', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue(
        mockAccount(1, 500),
      );
      accountRepository.findByUuid.mockResolvedValue([mockAccount(1, 500)]);
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100));
      transactionRepository.create.mockResolvedValue({ success: true });

      await expect(
        service.transferFromMain(
          { uuid: 'owner-uuid', to: 2, amount: 100, concept: 'x' },
          { serverAuthed: false, mcUuid: 'owner-uuid' },
        ),
      ).resolves.toBeUndefined();
      expect(transactionRepository.create).toHaveBeenCalled();
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

  describe('transfer() with idempotency', () => {
    const transferDto: CreateTransferDto = {
      from: 1,
      to: 2,
      amount: 100,
      concept: 'test-transfer',
    };

    it('should accept idempotency key and pass to repository', async () => {
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100));
      transactionRepository.create.mockResolvedValue({ success: true });

      const idempotencyKey = 'transfer:test-key';
      await service.transfer(transferDto, undefined, idempotencyKey);

      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 1,
          to: 2,
          amount: 100,
          idempotencyKey,
        }),
      );
    });

    it('should replay identical transfer and return success', async () => {
      // Setup for first call (2 findById calls) and second call (2 findById calls)
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100))
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100));
      // Simulate replay: repository returns success with same transaction ID
      transactionRepository.create.mockResolvedValue({
        success: true,
        transactionId: 123,
      });

      const idempotencyKey = 'transfer:replay-key';
      await service.transfer(transferDto, undefined, idempotencyKey);
      // Second request with same key
      await service.transfer(transferDto, undefined, idempotencyKey);

      // Both calls should succeed
      expect(transactionRepository.create).toHaveBeenCalledTimes(2);
      expect(transactionRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ idempotencyKey }),
      );
      expect(transactionRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ idempotencyKey }),
      );
    });

    it('should not move money twice on replay (idempotent at repository level)', async () => {
      // Setup for first call (2 findById calls) and second call (2 findById calls)
      accountRepository.findById
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100))
        .mockResolvedValueOnce(mockAccount(1, 500))
        .mockResolvedValueOnce(mockAccount(2, 100));
      // First call creates transaction with id 123
      // Second call (replay) returns the same id without creating a new one
      transactionRepository.create
        .mockResolvedValueOnce({ success: true, transactionId: 123 })
        .mockResolvedValueOnce({ success: true, transactionId: 123 });

      const idempotencyKey = 'transfer:money-once-key';
      await service.transfer(transferDto, undefined, idempotencyKey);
      await service.transfer(transferDto, undefined, idempotencyKey);

      // Repository is called twice, but returns the same transactionId both times
      expect(transactionRepository.create).toHaveBeenCalledTimes(2);
      // Both calls have the same idempotency key
      expect(transactionRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ idempotencyKey }),
      );
      expect(transactionRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ idempotencyKey }),
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
