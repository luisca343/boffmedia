import { Injectable } from '@nestjs/common';
import { StarbankAccountService } from './services/starbank-account.service';
import { StarbankTransactionService } from './services/starbank-transaction.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction.dto';
import { TransferFromMainDto } from './dto/transfer-from-main.dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money.dto';
import { StarBankAccount } from './entities/starbank-account.entity';
import { StarBankTransaction } from './entities/starbank-transaction.entity';
import { AccountType } from './enums/account-type.enum';

@Injectable()
export class StarbankFacadeService {
  constructor(
    private readonly accountService: StarbankAccountService,
    private readonly transactionService: StarbankTransactionService,
    private readonly wingullFacadeService: WingullFacadeService,
  ) {}

  // ==================== ACCOUNT OPERATIONS ====================

  async createAccount(uuid: string, name: string): Promise<StarBankAccount> {
    if (!name || name.length === 0) {
      return await this.createMainAccount(uuid, name);
    }
    
    const createAccountDto: CreateAccountDto = {
      uuid,
      name,
      type: AccountType.SECONDARY
    };
    
    return await this.accountService.createAccount(createAccountDto);
  }

  async createMainAccount(uuid: string, username: string): Promise<StarBankAccount> {
    return await this.accountService.createMainAccount(uuid, username);
  }

  async getAllAccounts(): Promise<StarBankAccount[]> {
    return await this.accountService.getAllAccounts();
  }

  async getAccounts(uuid: string): Promise<StarBankAccount[]> {
    return await this.accountService.getUserAccounts(uuid);
  }

  async getMainAccount(uuid: string): Promise<{ id: number; balance: number } | null> {
    return await this.accountService.getUserMainAccount(uuid);
  }

  async getBalance(uuid: string): Promise<{ balance: number }> {
    return await this.accountService.getUserBalance(uuid);
  }

  async getAccountInfo(accountId: number): Promise<StarBankAccount | null> {
    return await this.accountService.getAccountInfo(accountId);
  }

  // ==================== TRANSACTION OPERATIONS ====================

  async transfer(from: number, to: number, amount: number, concept: string): Promise<void> {
    const transferDto: CreateTransferDto = {
      from,
      to,
      amount,
      concept
    };

    await this.transactionService.transfer(transferDto);

    // Update balance in game after successful transfer
    const fromAccount = await this.getAccountInfo(from);
    const toAccount = await this.getAccountInfo(to);

    const accounts = [fromAccount, toAccount].filter(acc => acc && acc.type === AccountType.MAIN);

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

  async transferFromMain(uuid: string, to: number, amount: number, concept: string): Promise<void> {
    const transferDto: TransferFromMainDto = {
      uuid,
      to,
      amount,
      concept
    };

    await this.transactionService.transferFromMain(transferDto);

    // Update balance in game after successful transfer
    const mainAccount = await this.getMainAccount(uuid);
    if (mainAccount) {
      await this.updateBalance({
        balance: mainAccount.balance,
        type: AccountType.MAIN,
        uuid
      });
    }
  }

  async shop(shopData: CreateShopTransactionDto): Promise<void> {
    await this.transactionService.processShopTransaction(shopData);

    // Update balance in game after successful transaction
    const mainAccount = await this.getMainAccount(shopData.uuid);
    if (mainAccount) {
      await this.updateBalance({
        balance: mainAccount.balance,
        type: AccountType.MAIN,
        uuid: shopData.uuid
      });
    }
  }

  async trainerDefeat(amount: number, uuid: string): Promise<void> {
    const trainerDto: TrainerDefeatMoneyDto = {
      uuid,
      money: amount
    };

    const currentGameBalance = await this.wingullFacadeService.getCurrentBalance(uuid, amount);
    
    await this.transactionService.processTrainerDefeat(trainerDto, currentGameBalance);
  }

  // ==================== TRANSACTION HISTORY ====================

  async getTransactions(account: number, limit: number = 50): Promise<StarBankTransaction[]> {
    return await this.transactionService.getAccountTransactions(account, limit);
  }

  async getTransactionsByUUID(uuid: string, limit: number = 50): Promise<StarBankTransaction[]> {
    return await this.transactionService.getUserTransactions(uuid, limit);
  }

  async getTransfers(account: number): Promise<StarBankTransaction[]> {
    return await this.transactionService.getAccountTransfers(account, 10);
  }

  async getTransfersByUUID(uuid: string): Promise<StarBankTransaction[]> {
    return await this.transactionService.getUserTransfers(uuid, 10);
  }

  // ==================== BALANCE MANAGEMENT ====================

  private async updateBalance(account: { balance: number; type: AccountType | string; uuid: string }): Promise<void> {
    try {
      await this.wingullFacadeService.updateBalance(account);
    } catch (error) {
      console.error('Error updating balance in game:', error);
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }
}