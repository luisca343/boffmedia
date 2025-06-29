import { Injectable } from '@nestjs/common';
import { StarbankAccountService } from './services/starbank-account.service';
import { StarbankTransactionService } from './services/starbank-transaction.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction.dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money.dto';
import { AccountsListResponseDto } from './dto/accounts-list-response.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsListResponseDto } from './dto/transactions-list-response.dto';
import { StarBankAccount } from './entities/starbank-account.entity';
import { AccountType } from './enums/account-type.enum';
import { TransferFromMainDto } from './dto/transfer-from-main.dto';
import { StarBankTransaction } from './entities/starbank-transaction.entity';
import { AccountResponseDto } from './dto/account-response-dto';

export interface BalanceUpdateResult {
  success: boolean;
  message?: string;
}

@Injectable()
export class StarbankFacadeService {
  constructor(
    private readonly accountService: StarbankAccountService,
    private readonly transactionService: StarbankTransactionService,
    private readonly wingullFacadeService: WingullFacadeService,
  ) {}

  // ==================== ACCOUNT OPERATIONS ====================

  async createAccount(uuid: string, name: string): Promise<AccountResponseDto> {
    try {
      if (!name || name.length === 0) {
        return await this.createMainAccount(uuid, name);
      }
      
      const createAccountDto: CreateAccountDto = {
        uuid,
        name,
        type: AccountType.SECONDARY
      };
      
      return await this.accountService.createAccount(createAccountDto);
    } catch (error) {
      console.error('Error creating account:', error);
      return { success: false, message: `Failed to create account: ${error.message}` };
    }
  }

  async createMainAccount(uuid: string, username: string): Promise<AccountResponseDto> {
    try {
      return await this.accountService.createMainAccount(uuid, username);
    } catch (error) {
      console.error('Error creating main account:', error);
      return { success: false, message: `Failed to create main account: ${error.message}` };
    }
  }

  async getAllAccounts(): Promise<AccountsListResponseDto> {
    try {
      return await this.accountService.getAllAccounts();
    } catch (error) {
      console.error('Error getting all accounts:', error);
      throw new Error(`Failed to retrieve all accounts: ${error.message}`);
    }
  }

  async getAccounts(uuid: string): Promise<StarBankAccount[]> {
    try {
      return await this.accountService.getUserAccounts(uuid);
    } catch (error) {
      console.error(`Error getting accounts for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user accounts: ${error.message}`);
    }
  }

  async getMainAccount(uuid: string): Promise<{ id: number; balance: number } | null> {
    try {
      return await this.accountService.getUserMainAccount(uuid);
    } catch (error) {
      console.error(`Error getting main account for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve main account: ${error.message}`);
    }
  }

  async getBalance(uuid: string): Promise<{ balance: number }> {
    try {
      return await this.accountService.getUserBalance(uuid);
    } catch (error) {
      console.error(`Error getting balance for user ${uuid}:`, error);
      return { balance: 0 };
    }
  }

  async getAccountInfo(accountId: number): Promise<StarBankAccount | null> {
    try {
      return await this.accountService.getAccountInfo(accountId);
    } catch (error) {
      console.error(`Error getting account info for ${accountId}:`, error);
      throw new Error(`Failed to retrieve account info: ${error.message}`);
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================

  async transfer(from: number, to: number, amount: number, concept: string): Promise<TransactionResponseDto> {
    try {
      const transferDto: CreateTransferDto = {
        from,
        to,
        amount,
        concept
      };

      const result = await this.transactionService.transfer(transferDto);

      // Update balance in game if successful
      if (result.success) {
        const fromAccount = await this.getAccountInfo(from);
        const toAccount = await this.getAccountInfo(to);

        const accounts = [fromAccount, toAccount].filter(acc => acc && acc.type === 'MAIN');

        for (const account of accounts) {
          if (account && account.uuid) {
            await this.updateBalance({
              balance: account.balance,
              type: account.type,
              uuid: account.uuid
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing transfer:', error);
      return { success: false, message: `Transfer failed: ${error.message}` };
    }
  }

  async transferFromMain(uuid: string, to: number, amount: number, concept: string): Promise<TransactionResponseDto> {
    try {
      const transferDto: TransferFromMainDto = {
        uuid,
        to,
        amount,
        concept
      };

      const result = await this.transactionService.transferFromMain(transferDto);

      // Update balance in game if successful
      if (result.success) {
        const mainAccount = await this.getMainAccount(uuid);
        if (mainAccount) {
          await this.updateBalance({
            balance: mainAccount.balance,
            type: 'MAIN',
            uuid
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing transfer from main:', error);
      return { success: false, message: `Transfer from main failed: ${error.message}` };
    }
  }

  async shop(shopData: CreateShopTransactionDto): Promise<TransactionResponseDto> {
    try {
      const result = await this.transactionService.processShopTransaction(shopData);

      // Update balance in game if successful
      if (result.success) {
        const mainAccount = await this.getMainAccount(shopData.uuid);
        if (mainAccount) {
          await this.updateBalance({
            balance: mainAccount.balance,
            type: 'MAIN',
            uuid: shopData.uuid
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing shop transaction:', error);
      return { success: false, message: `Shop transaction failed: ${error.message}` };
    }
  }

  async trainerDefeat(amount: number, uuid: string): Promise<TransactionResponseDto> {
    try {
      const trainerDto: TrainerDefeatMoneyDto = {
        uuid,
        money: amount
      };

      const currentGameBalance = await this.wingullFacadeService.getCurrentBalance(uuid, amount);
      
      return await this.transactionService.processTrainerDefeat(trainerDto, currentGameBalance);
    } catch (error) {
      console.error('Error processing trainer defeat:', error);
      return { success: false, message: `Trainer defeat processing failed: ${error.message}` };
    }
  }

  // ==================== TRANSACTION HISTORY ====================

  async getTransactions(account: number, limit: number = 50): Promise<StarBankTransaction[]> {
    try {
      return await this.transactionService.getAccountTransactions(account, limit);
    } catch (error) {
      console.error(`Error getting transactions for account ${account}:`, error);
      throw new Error(`Failed to retrieve transactions: ${error.message}`);
    }
  }

  async getTransactionsByUUID(uuid: string, limit: number = 50): Promise<StarBankTransaction[]> {
    try {
      return await this.transactionService.getUserTransactions(uuid, limit);
    } catch (error) {
      console.error(`Error getting transactions for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user transactions: ${error.message}`);
    }
  }

  async getTransfers(account: number): Promise<TransactionsListResponseDto> {
    try {
      return await this.transactionService.getAccountTransfers(account, 10);
    } catch (error) {
      console.error(`Error getting transfers for account ${account}:`, error);
      throw new Error(`Failed to retrieve transfers: ${error.message}`);
    }
  }

  async getTransfersByUUID(uuid: string): Promise<TransactionsListResponseDto> {
    try {
      return await this.transactionService.getUserTransfers(uuid, 10);
    } catch (error) {
      console.error(`Error getting transfers for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user transfers: ${error.message}`);
    }
  }

  // ==================== BALANCE MANAGEMENT ====================

  private async updateBalance(account: { balance: number; type: string; uuid: string }): Promise<BalanceUpdateResult> {
    try {
      const result = await this.wingullFacadeService.updateBalance(account);
      return { success: !!result };
    } catch (error) {
      console.error('Error updating balance in game:', error);
      return { success: false, message: `Balance update failed: ${error.message}` };
    }
  }
}