import { Injectable, Inject } from '@nestjs/common';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { TransactionType } from '../enums/transaction-type.enum';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { CreateShopTransactionDto } from '../dto/create-shop-transaction.dto';
import { TransferFromMainDto } from '../dto/transfer-from-main.dto';
import { TrainerDefeatMoneyDto } from '../dto/trainer-defeat-money.dto';
import { StarBankTransaction } from '../entities/starbank-transaction.entity';
import { IStarbankAccountRepository } from '../repositories/interfaces/starbank-account.repository';
import { IStarbankTransactionRepository } from '../repositories/interfaces/starbank-transaction.repository';
import { Logger } from 'nestjs-pino';

@Injectable()
export class StarbankTransactionService {
  constructor(
    private readonly logger: Logger,

    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
  ) {}

  async transfer(transferDto: CreateTransferDto): Promise<void> {
    // Validate transfer data
    if (transferDto.amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }
    if (transferDto.from === transferDto.to) {
      throw new Error('Source and destination accounts must be different');
    }

    // Validate accounts exist
    const fromAccount = await this.accountRepository.findById(transferDto.from);
    const toAccount = await this.accountRepository.findById(transferDto.to);

    if (!fromAccount) {
      throw new Error('Source account not found');
    }
    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    // Check sufficient balance
    if (fromAccount.balance < transferDto.amount) {
      throw new Error('Insufficient balance');
    }

    const transactionData = {
      from: transferDto.from,
      to: transferDto.to,
      amount: transferDto.amount,
      reason: transferDto.concept,
      type: TransactionType.TRANSFERENCIA,
    };

    const result = await this.transactionRepository.create(transactionData);

    if (!result.success) {
      throw new Error(result.message || 'Transfer failed');
    }
  }

  async transferFromMain(transferDto: TransferFromMainDto): Promise<void> {
    const mainAccount = await this.accountRepository.findUserMainAccount(
      transferDto.uuid,
    );
    if (!mainAccount) {
      throw new Error('Main account not found');
    }

    const createTransferDto: CreateTransferDto = {
      from: mainAccount.id,
      to: transferDto.to,
      amount: transferDto.amount,
      concept: transferDto.concept,
    };

    return await this.transfer(createTransferDto);
  }

  async transferFromSystem(
    accountId: number,
    amount: number,
    concept: string,
  ): Promise<void> {
    // Validate transfer data
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    // Validate account exists
    const toAccount = await this.accountRepository.findById(accountId);
    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    const transactionData = {
      from: 0, // System account
      to: accountId,
      amount: amount,
      reason: concept,
      type: TransactionType.TRANSFERENCIA,
    };

    const result = await this.transactionRepository.create(transactionData);

    if (!result.success) {
      throw new Error(result.message || 'System transfer failed');
    }
  }

  async processShopTransaction(
    shopDto: CreateShopTransactionDto,
  ): Promise<void> {
    const mainAccount = await this.accountRepository.findUserMainAccount(
      shopDto.uuid,
    );
    if (!mainAccount) {
      throw new Error('Main account not found');
    }

    const total = shopDto.unitPrice * shopDto.count;

    if (shopDto.operation === TransactionType.COMPRA) {
      // Check sufficient balance for purchase
      if (mainAccount.balance < total) {
        throw new Error('Insufficient balance for purchase');
      }

      this.logger.log(
        `Compra de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName} por ${total}`,
      );

      const transactionData = {
        from: mainAccount.id,
        to: 0, // System account
        amount: total,
        reason: `Compra de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName}`,
        type: TransactionType.COMPRA,
      };

      const result = await this.transactionRepository.create(transactionData);
      if (!result.success) {
        throw new Error(result.message || 'Purchase failed');
      }
    } else {
      // VENTA
      this.logger.log(
        `Venta de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName} por ${total}`,
      );

      const transactionData = {
        from: 0, // System account
        to: mainAccount.id,
        amount: total,
        reason: `Venta de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName}`,
        type: TransactionType.VENTA,
      };

      const result = await this.transactionRepository.create(transactionData);
      if (!result.success) {
        throw new Error(result.message || 'Sale failed');
      }
    }
  }

  async processTrainerDefeat(
    trainerDto: TrainerDefeatMoneyDto,
    currentGameBalance: number,
  ): Promise<void> {
    const mainAccount = await this.accountRepository.findUserMainAccount(
      trainerDto.uuid,
    );
    if (!mainAccount) {
      throw new Error('Main account not found');
    }

    const prevBalance = mainAccount.balance;
    const diff = currentGameBalance - prevBalance;

    if (diff === 0) {
      return; // No balance difference, no transaction needed
    }

    const transactionData = {
      from: 0, // System account
      to: mainAccount.id,
      amount: diff,
      reason: 'Derrota de entrenador',
      type: TransactionType.DERROTA_ENTRENADOR,
    };

    const result = await this.transactionRepository.create(transactionData);
    if (!result.success) {
      throw new Error(result.message || 'Trainer defeat processing failed');
    }
  }

  async getAccountTransactions(
    accountId: number,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findByAccountId(accountId, limit);
  }

  async getUserTransactions(
    uuid: string,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findByUserUuid(uuid, limit);
  }

  async getAccountTransfers(
    accountId: number,
    limit: number = 10,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findTransfersByAccount(
      accountId,
      limit,
    );
  }

  async getUserTransfers(
    uuid: string,
    limit: number = 10,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findTransfersByUser(uuid, limit);
  }

  async getTransactionsByType(
    type: TransactionType,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findByType(type, limit);
  }
}
