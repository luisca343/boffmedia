import { Injectable } from '@nestjs/common';
import { StarbankAccountService, ShopTransactionData } from './services/starbank-account.service';
import { StarbankTransactionService } from './services/starbank-transaction.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { AccountInfo } from '@api/smartrotom/starbank/repositories/starbank.repository';

export interface BalanceUpdateResult {
  success: boolean;
  message?: string;
}

@Injectable()
export class StarbankFacadeService {
  constructor(
    private readonly starbankAccountService: StarbankAccountService,
    private readonly starbankTransactionService: StarbankTransactionService,
    private readonly wingullFacadeService: WingullFacadeService,
  ) {}

  // ==================== ACCOUNT OPERATIONS ====================

  async createAccount(uuid: string, name: string): Promise<{ success: boolean; accountId?: number; message?: string }> {
    try {
      if (!name || name.length === 0) {
        return await this.createMainAccount(uuid, name);
      }
      
      return await this.starbankAccountService.createAccount(uuid, name, 'SECONDARY');
    } catch (error) {
      console.error('Error creating account:', error);
      return { success: false, message: `Failed to create account: ${error.message}` };
    }
  }

  async createMainAccount(uuid: string, username: string): Promise<{ success: boolean; message?: string }> {
    try {
      return await this.starbankAccountService.createMainAccount(uuid, username);
    } catch (error) {
      console.error('Error creating main account:', error);
      return { success: false, message: `Failed to create main account: ${error.message}` };
    }
  }

  async getAllAccounts(): Promise<AccountInfo[]> {
    try {
      return await this.starbankAccountService.getAllAccounts();
    } catch (error) {
      console.error('Error getting all accounts:', error);
      throw new Error(`Failed to retrieve all accounts: ${error.message}`);
    }
  }

  async getAccounts(uuid: string): Promise<AccountInfo[]> {
    try {
      return await this.starbankAccountService.getUserAccounts(uuid);
    } catch (error) {
      console.error(`Error getting accounts for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user accounts: ${error.message}`);
    }
  }

  async getMainAccount(uuid: string): Promise<{ id: number; balance: number } | null> {
    try {
      return await this.starbankAccountService.getUserMainAccount(uuid);
    } catch (error) {
      console.error(`Error getting main account for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve main account: ${error.message}`);
    }
  }

  async getBalance(uuid: string): Promise<{ balance: number }> {
    try {
      return await this.starbankAccountService.getUserBalance(uuid);
    } catch (error) {
      console.error(`Error getting balance for user ${uuid}:`, error);
      return { balance: 0 };
    }
  }

  async getAccountInfo(accountId: number): Promise<AccountInfo | null> {
    try {
      return await this.starbankAccountService.getAccountInfo(accountId);
    } catch (error) {
      console.error(`Error getting account info for ${accountId}:`, error);
      throw new Error(`Failed to retrieve account info: ${error.message}`);
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================

  async transfer(from: number, to: number, amount: number, concept: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.starbankTransactionService.transfer({
        from,
        to,
        amount,
        concept
      });

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

  async transferFromMain(uuid: string, to: number, amount: number, concept: string): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.starbankTransactionService.transferFromMain(uuid, to, amount, concept);

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

  async shop(shopData: ShopTransactionData): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.starbankTransactionService.processShopTransaction(shopData);

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

  async trainerDefeat(amount: number, uuid: string): Promise<{ success: boolean; message?: string }> {
    try {
      const currentGameBalance = await this.wingullFacadeService.getCurrentBalance(uuid, amount);
      
      return await this.starbankTransactionService.processTrainerDefeat(
        uuid,
        amount,
        currentGameBalance
      );
    } catch (error) {
      console.error('Error processing trainer defeat:', error);
      return { success: false, message: `Trainer defeat processing failed: ${error.message}` };
    }
  }

  // ==================== TRANSACTION HISTORY ====================

  async getTransactions(account: number, limit: number = 50) {
    try {
      return await this.starbankTransactionService.getAccountTransactions(account, limit);
    } catch (error) {
      console.error(`Error getting transactions for account ${account}:`, error);
      throw new Error(`Failed to retrieve transactions: ${error.message}`);
    }
  }

  async getTransactionsByUUID(uuid: string, limit: number = 50) {
    try {
      return await this.starbankTransactionService.getUserTransactions(uuid, limit);
    } catch (error) {
      console.error(`Error getting transactions for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user transactions: ${error.message}`);
    }
  }

  async getTransfers(account: number) {
    try {
      return await this.starbankTransactionService.getAccountTransfers(account, 10);
    } catch (error) {
      console.error(`Error getting transfers for account ${account}:`, error);
      throw new Error(`Failed to retrieve transfers: ${error.message}`);
    }
  }

  async getTransfersByUUID(uuid: string) {
    try {
      return await this.starbankTransactionService.getUserTransfers(uuid, 10);
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