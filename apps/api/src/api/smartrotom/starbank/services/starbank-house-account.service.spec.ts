import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { StarbankHouseAccountService } from './starbank-house-account.service';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { AccountType } from '../enums/account-type.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { MARKET_ACCOUNT, TAXI_ACCOUNT, TREASURY_ACCOUNT } from '../house-accounts';

const PLAYER = 'player-uuid';
const PLAYER_MAIN = { id: 5, balance: 1000 };
const TREASURY_ROW = {
  id: 42,
  name: TREASURY_ACCOUNT.name,
  type: AccountType.GOVERNMENT,
  balance: 7,
};

describe('StarbankHouseAccountService', () => {
  let service: StarbankHouseAccountService;

  const accountRepository = {
    findHouseAccount: jest.fn(),
    findByType: jest.fn(),
    findById: jest.fn(),
    findUserMainAccount: jest.fn(),
  };
  const transactionRepository = { create: jest.fn() };
  const wingull = { updateBalance: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    accountRepository.findHouseAccount.mockResolvedValue(TREASURY_ROW);
    accountRepository.findUserMainAccount.mockResolvedValue(PLAYER_MAIN);
    transactionRepository.create.mockResolvedValue({
      success: true,
      transactionId: 99,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StarbankHouseAccountService,
        { provide: Logger, useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() } },
        {
          provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
          useValue: accountRepository,
        },
        {
          provide: STARBANK_TRANSACTION_REPOSITORY_TOKEN,
          useValue: transactionRepository,
        },
        { provide: WingullFacadeService, useValue: wingull },
      ],
    }).compile();

    service = module.get(StarbankHouseAccountService);
  });

  describe('resolveAccountId', () => {
    it('resolves by (type, name) and caches the result', async () => {
      expect(await service.resolveAccountId(TREASURY_ACCOUNT)).toBe(42);
      expect(await service.resolveAccountId(TREASURY_ACCOUNT)).toBe(42);
      expect(accountRepository.findHouseAccount).toHaveBeenCalledTimes(1);
    });

    // A singleton renamed in the database is still the right account; matching the name too
    // would mint a second treasury.
    it('falls back to type alone for singleton types', async () => {
      accountRepository.findHouseAccount.mockResolvedValue(null);
      accountRepository.findByType.mockResolvedValue([
        { ...TREASURY_ROW, name: 'Hacienda (renamed)' },
      ]);

      expect(await service.resolveAccountId(TREASURY_ACCOUNT)).toBe(42);
      expect(accountRepository.findByType).toHaveBeenCalledWith(
        AccountType.GOVERNMENT,
      );
    });

    // SERVICE is one row per app, so type alone no longer identifies an account.
    it('does not fall back to type alone for SERVICE accounts', async () => {
      accountRepository.findHouseAccount.mockResolvedValue(null);

      await expect(service.resolveAccountId(TAXI_ACCOUNT)).rejects.toThrow(
        NotFoundException,
      );
      expect(accountRepository.findByType).not.toHaveBeenCalled();
    });

    // A missing row means the migration has not run. Creating one on the fly is how the
    // pre-registry code let MARKET quietly not exist.
    it('throws rather than creating a missing house account', async () => {
      accountRepository.findHouseAccount.mockResolvedValue(null);
      accountRepository.findByType.mockResolvedValue([]);

      await expect(service.resolveAccountId(MARKET_ACCOUNT)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('credit', () => {
    it('moves the player main account → house account', async () => {
      const txId = await service.credit(
        TREASURY_ACCOUNT,
        PLAYER,
        250,
        TransactionType.MULTA,
        'Multa de tráfico',
      );

      expect(txId).toBe(99);
      expect(transactionRepository.create).toHaveBeenCalledWith({
        from: PLAYER_MAIN.id,
        to: 42,
        amount: 250,
        reason: 'Multa de tráfico',
        type: TransactionType.MULTA,
      });
    });

    it('mirrors the payer balance to the game, never the house account', async () => {
      await service.credit(
        TREASURY_ACCOUNT,
        PLAYER,
        250,
        TransactionType.MULTA,
        'Multa',
      );

      expect(wingull.updateBalance).toHaveBeenCalledTimes(1);
      expect(wingull.updateBalance).toHaveBeenCalledWith({
        balance: PLAYER_MAIN.balance,
        type: AccountType.MAIN,
        uuid: PLAYER,
      });
    });

    it('rejects a non-positive amount before touching the ledger', async () => {
      await expect(
        service.credit(TREASURY_ACCOUNT, PLAYER, 0, TransactionType.MULTA, 'x'),
      ).rejects.toThrow(BadRequestException);
      expect(transactionRepository.create).not.toHaveBeenCalled();
    });

    it('surfaces a refused transfer as a BadRequest', async () => {
      transactionRepository.create.mockResolvedValue({
        success: false,
        message: 'Insufficient balance',
      });

      await expect(
        service.credit(TREASURY_ACCOUNT, PLAYER, 250, TransactionType.MULTA, 'x'),
      ).rejects.toThrow('Insufficient balance');
    });

    it('does not fail the movement when the in-game mirror throws', async () => {
      wingull.updateBalance.mockRejectedValue(new Error('server offline'));

      await expect(
        service.credit(TREASURY_ACCOUNT, PLAYER, 250, TransactionType.MULTA, 'x'),
      ).resolves.toBe(99);
    });

    it('refuses a player with no main account', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue(null);

      await expect(
        service.credit(TREASURY_ACCOUNT, PLAYER, 250, TransactionType.MULTA, 'x'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('debit', () => {
    it('moves the house account → player main account', async () => {
      const txId = await service.debit(
        MARKET_ACCOUNT,
        PLAYER,
        80,
        TransactionType.VENTA_P2P,
        'Venta',
      );

      expect(txId).toBe(99);
      expect(transactionRepository.create).toHaveBeenCalledWith({
        from: 42,
        to: PLAYER_MAIN.id,
        amount: 80,
        reason: 'Venta',
        type: TransactionType.VENTA_P2P,
      });
    });
  });

  describe('getBalance', () => {
    it('reads the resolved house account', async () => {
      accountRepository.findById.mockResolvedValue({ balance: 12345 });

      expect(await service.getBalance(TREASURY_ACCOUNT)).toBe(12345);
      expect(accountRepository.findById).toHaveBeenCalledWith(42);
    });
  });
});
