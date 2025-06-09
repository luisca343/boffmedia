import { Injectable } from '@nestjs/common';
import { StarbankRepository, CreateTransactionData } from '@repositories/smartrotom/starbank.repository';
import { StarbankAccountService, ShopTransactionData, TransferData } from './starbank-account.service';

@Injectable()
export class StarbankTransactionService {
  constructor(
    private readonly starbankRepository: StarbankRepository,
    private readonly starbankAccountService: StarbankAccountService,
  ) {}

  async transfer(transferData: TransferData): Promise<{ success: boolean; message?: string }> {
    try {
      // Validate transfer data
      if (transferData.amount <= 0) {
        return { success: false, message: 'Transfer amount must be positive' };
      }
      if (transferData.from === transferData.to) {
        return { success: false, message: 'Source and destination accounts must be different' };
      }

      // Validate accounts exist
      const fromAccount = await this.starbankAccountService.getAccountInfo(transferData.from);
      const toAccount = await this.starbankAccountService.getAccountInfo(transferData.to);

      if (!fromAccount) {
        return { success: false, message: 'Source account not found' };
      }
      if (!toAccount) {
        return { success: false, message: 'Destination account not found' };
      }

      // Check sufficient balance
      if (fromAccount.balance < transferData.amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      const transactionData: CreateTransactionData = {
        from: transferData.from,
        to: transferData.to,
        amount: transferData.amount,
        reason: transferData.concept,
        type: 'TRANSFERENCIA'
      };

      return await this.starbankRepository.createTransaction(transactionData);
    } catch (error) {
      console.error('Failed to process transfer:', error);
      return { success: false, message: `Transfer failed: ${error.message}` };
    }
  }

  async transferFromMain(uuid: string, to: number, amount: number, concept: string): Promise<{ success: boolean; message?: string }> {
    try {
      const mainAccount = await this.starbankAccountService.getUserMainAccount(uuid);
      if (!mainAccount) {
        return { success: false, message: 'Main account not found' };
      }

      return await this.transfer({
        from: mainAccount.id,
        to,
        amount,
        concept
      });
    } catch (error) {
      console.error('Failed to transfer from main:', error);
      return { success: false, message: `Transfer from main failed: ${error.message}` };
    }
  }

  async processShopTransaction(shopData: ShopTransactionData): Promise<{ success: boolean; message?: string }> {
    try {
      const mainAccount = await this.starbankAccountService.getUserMainAccount(shopData.uuid);
      if (!mainAccount) {
        return { success: false, message: 'Main account not found' };
      }

      const total = shopData.unitPrice * shopData.count;
      
      if (shopData.operation === 'COMPRA') {
        // Check sufficient balance for purchase
        if (mainAccount.balance < total) {
          return { success: false, message: 'Insufficient balance for purchase' };
        }

        console.log(`Compra de ${shopData.count} ${shopData.itemName} a ${shopData.npcName} por ${total}`);
        
        const transactionData: CreateTransactionData = {
          from: mainAccount.id,
          to: 0, // System account
          amount: total,
          reason: `Compra de ${shopData.count} ${shopData.itemName} a ${shopData.npcName}`,
          type: 'COMPRA'
        };

        return await this.starbankRepository.createTransaction(transactionData);
      } else {
        // VENTA
        console.log(`Venta de ${shopData.count} ${shopData.itemName} a ${shopData.npcName} por ${total}`);
        
        const transactionData: CreateTransactionData = {
          from: 0, // System account
          to: mainAccount.id,
          amount: total,
          reason: `Venta de ${shopData.count} ${shopData.itemName} a ${shopData.npcName}`,
          type: 'VENTA'
        };

        return await this.starbankRepository.createTransaction(transactionData);
      }
    } catch (error) {
      console.error('Failed to process shop transaction:', error);
      return { success: false, message: `Shop transaction failed: ${error.message}` };
    }
  }

  async processTrainerDefeat(uuid: string, amount: number, currentGameBalance: number): Promise<{ success: boolean; message?: string }> {
    try {
      const mainAccount = await this.starbankAccountService.getUserMainAccount(uuid);
      if (!mainAccount) {
        return { success: false, message: 'Main account not found' };
      }

      const prevBalance = mainAccount.balance;
      const diff = currentGameBalance - prevBalance;

      if (diff === 0) {
        return { success: true, message: 'No balance difference, no transaction needed' };
      }

      const transactionData: CreateTransactionData = {
        from: 0, // System account
        to: mainAccount.id,
        amount: diff,
        reason: 'Derrota de entrenador',
        type: 'ENTRENADOR'
      };

      return await this.starbankRepository.createTransaction(transactionData);
    } catch (error) {
      console.error('Failed to process trainer defeat:', error);
      return { success: false, message: `Trainer defeat processing failed: ${error.message}` };
    }
  }

  async getAccountTransactions(accountId: number, limit: number = 50) {
    try {
      return await this.starbankRepository.findAccountTransactions(accountId, limit);
    } catch (error) {
      console.error(`Failed to get transactions for account ${accountId}:`, error);
      throw new Error(`Failed to retrieve account transactions: ${error.message}`);
    }
  }

  async getUserTransactions(uuid: string, limit: number = 50) {
    try {
      return await this.starbankRepository.findUserTransactions(uuid, limit);
    } catch (error) {
      console.error(`Failed to get transactions for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user transactions: ${error.message}`);
    }
  }

  async getAccountTransfers(accountId: number, limit: number = 10) {
    try {
      return await this.starbankRepository.findTransfersByAccount(accountId, limit);
    } catch (error) {
      console.error(`Failed to get transfers for account ${accountId}:`, error);
      throw new Error(`Failed to retrieve account transfers: ${error.message}`);
    }
  }

  async getUserTransfers(uuid: string, limit: number = 10) {
    try {
      return await this.starbankRepository.findTransfersByUser(uuid, limit);
    } catch (error) {
      console.error(`Failed to get transfers for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user transfers: ${error.message}`);
    }
  }
}