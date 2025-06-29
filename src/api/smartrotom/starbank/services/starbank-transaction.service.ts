import { Injectable, Inject } from '@nestjs/common';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN, STARBANK_TRANSACTION_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { TransactionType } from '../enums/transaction-type.enum';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { CreateShopTransactionDto } from '../dto/create-shop-transaction.dto';
import { TransferFromMainDto } from '../dto/transfer-from-main.dto';
import { TrainerDefeatMoneyDto } from '../dto/trainer-defeat-money.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { TransactionsListResponseDto } from '../dto/transactions-list-response.dto';
import { IStarbankAccountRepository } from '../repositories/interfaces/starbank-account.repository';
import { IStarbankTransactionRepository } from '../repositories/interfaces/starbank-transaction.repository';
import { StarBankTransaction } from '../entities/starbank-transaction.entity';

@Injectable()
export class StarbankTransactionService {
  constructor(
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
  ) {}

  async transfer(transferDto: CreateTransferDto): Promise<TransactionResponseDto> {
    try {
      // Validate transfer data
      if (transferDto.amount <= 0) {
        return { success: false, message: 'Transfer amount must be positive' };
      }
      if (transferDto.from === transferDto.to) {
        return { success: false, message: 'Source and destination accounts must be different' };
      }

      // Validate accounts exist
      const fromAccount = await this.accountRepository.findById(transferDto.from);
      const toAccount = await this.accountRepository.findById(transferDto.to);

      if (!fromAccount) {
        return { success: false, message: 'Source account not found' };
      }
      if (!toAccount) {
        return { success: false, message: 'Destination account not found' };
      }

      // Check sufficient balance
      if (fromAccount.balance < transferDto.amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      const transactionData = {
        from: transferDto.from,
        to: transferDto.to,
        amount: transferDto.amount,
        reason: transferDto.concept,
        type: TransactionType.TRANSFERENCIA
      };

      const result = await this.transactionRepository.create(transactionData);
      
      if (result.success) {
        return {
          success: true,
          message: 'Transfer completed successfully'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Transfer failed'
        };
      }
    } catch (error) {
      console.error('Failed to process transfer:', error);
      return { success: false, message: `Transfer failed: ${error.message}` };
    }
  }

  async transferFromMain(transferDto: TransferFromMainDto): Promise<TransactionResponseDto> {
    try {
      const mainAccount = await this.accountRepository.findUserMainAccount(transferDto.uuid);
      if (!mainAccount) {
        return { success: false, message: 'Main account not found' };
      }

      const createTransferDto: CreateTransferDto = {
        from: mainAccount.id,
        to: transferDto.to,
        amount: transferDto.amount,
        concept: transferDto.concept
      };

      return await this.transfer(createTransferDto);
    } catch (error) {
      console.error('Failed to transfer from main:', error);
      return { success: false, message: `Transfer from main failed: ${error.message}` };
    }
  }

  async processShopTransaction(shopDto: CreateShopTransactionDto): Promise<TransactionResponseDto> {
    try {
      const mainAccount = await this.accountRepository.findUserMainAccount(shopDto.uuid);
      if (!mainAccount) {
        return { success: false, message: 'Main account not found' };
      }

      const total = shopDto.unitPrice * shopDto.count;
      
      if (shopDto.operation === TransactionType.COMPRA) {
        // Check sufficient balance for purchase
        if (mainAccount.balance < total) {
          return { success: false, message: 'Insufficient balance for purchase' };
        }

        console.log(`Compra de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName} por ${total}`);
        
        const transactionData = {
          from: mainAccount.id,
          to: 0, // System account
          amount: total,
          reason: `Compra de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName}`,
          type: TransactionType.COMPRA
        };

        const result = await this.transactionRepository.create(transactionData);
        return {
          success: result.success,
          message: result.message || 'Purchase completed successfully'
        };
      } else {
        // VENTA
        console.log(`Venta de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName} por ${total}`);
        
        const transactionData = {
          from: 0, // System account
          to: mainAccount.id,
          amount: total,
          reason: `Venta de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName}`,
          type: TransactionType.VENTA
        };

        const result = await this.transactionRepository.create(transactionData);
        return {
          success: result.success,
          message: result.message || 'Sale completed successfully'
        };
      }
    } catch (error) {
      console.error('Failed to process shop transaction:', error);
      return { success: false, message: `Shop transaction failed: ${error.message}` };
    }
  }

  async processTrainerDefeat(trainerDto: TrainerDefeatMoneyDto, currentGameBalance: number): Promise<TransactionResponseDto> {
    try {
      const mainAccount = await this.accountRepository.findUserMainAccount(trainerDto.uuid);
      if (!mainAccount) {
        return { success: false, message: 'Main account not found' };
      }

      const prevBalance = mainAccount.balance;
      const diff = currentGameBalance - prevBalance;

      if (diff === 0) {
        return { 
          success: true, 
          message: 'No balance difference, no transaction needed' 
        };
      }

      const transactionData = {
        from: 0, // System account
        to: mainAccount.id,
        amount: diff,
        reason: 'Derrota de entrenador',
        type: TransactionType.DERROTA_ENTRENADOR
      };

      const result = await this.transactionRepository.create(transactionData);
      return {
        success: result.success,
        message: result.message || 'Trainer defeat reward processed successfully'
      };
    } catch (error) {
      console.error('Failed to process trainer defeat:', error);
      return { success: false, message: `Trainer defeat processing failed: ${error.message}` };
    }
  }

  async getAccountTransactions(accountId: number, limit: number = 50): Promise<StarBankTransaction[]> {
    try {
      const transactions = await this.transactionRepository.findByAccountId(accountId, limit);
      return transactions;
    } catch (error) {
      console.error(`Failed to get transactions for account ${accountId}:`, error);
      throw new Error(`Failed to retrieve account transactions: ${error.message}`);
    }
  }

  async getUserTransactions(uuid: string, limit: number = 50): Promise<StarBankTransaction[]> {
    try {
      const transactions = await this.transactionRepository.findByUserUuid(uuid, limit);
      return transactions;
    } catch (error) {
      console.error(`Failed to get transactions for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user transactions: ${error.message}`);
    }
  }

  async getAccountTransfers(accountId: number, limit: number = 10): Promise<TransactionsListResponseDto> {
    try {
      const transactions = await this.transactionRepository.findTransfersByAccount(accountId, limit);
      return {
        transactions,
        total: transactions.length,
        limit
      };
    } catch (error) {
      console.error(`Failed to get transfers for account ${accountId}:`, error);
      throw new Error(`Failed to retrieve account transfers: ${error.message}`);
    }
  }

  async getUserTransfers(uuid: string, limit: number = 10): Promise<TransactionsListResponseDto> {
    try {
      const transactions = await this.transactionRepository.findTransfersByUser(uuid, limit);
      return {
        transactions,
        total: transactions.length,
        limit
      };
    } catch (error) {
      console.error(`Failed to get transfers for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user transfers: ${error.message}`);
    }
  }

  async getTransactionsByType(type: TransactionType, limit: number = 50): Promise<TransactionsListResponseDto> {
    try {
      const transactions = await this.transactionRepository.findByType(type, limit);
      return {
        transactions,
        total: transactions.length,
        limit
      };
    } catch (error) {
      console.error(`Failed to get transactions by type ${type}:`, error);
      throw new Error(`Failed to retrieve transactions by type: ${error.message}`);
    }
  }
}