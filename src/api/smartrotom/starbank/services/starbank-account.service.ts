import { Injectable } from '@nestjs/common';
import { StarbankRepository, CreateAccountData, CreateTransactionData, AccountInfo } from '@repositories/smartrotom/starbank.repository';

export interface ShopTransactionData {
  uuid: string;
  npcName: string;
  itemName: string;
  operation: 'COMPRA' | 'VENTA';
  unitPrice: number;
  count: number;
}

export interface TransferData {
  from: number;
  to: number;
  amount: number;
  concept: string;
}

@Injectable()
export class StarbankAccountService {
  constructor(
    private readonly starbankRepository: StarbankRepository,
  ) {}

  async createAccount(uuid: string, name: string, type: 'MAIN' | 'SECONDARY' = 'SECONDARY'): Promise<{ success: boolean; accountId?: number; message?: string }> {
    try {
      // Validate inputs
      if (!uuid || uuid.trim() === '') {
        return { success: false, message: 'UUID is required' };
      }
      if (!name || name.trim() === '') {
        return { success: false, message: 'Account name is required' };
      }

      // For main accounts, check if user already has one
      if (type === 'MAIN') {
        const existingMain = await this.starbankRepository.findUserMainAccount(uuid);
        if (existingMain) {
          return { success: false, message: 'User already has a main account' };
        }
      }

      const accountData: CreateAccountData = {
        uuid,
        name,
        type,
        initialBalance: 0
      };

      return await this.starbankRepository.createAccount(accountData);
    } catch (error) {
      console.error('Failed to create account:', error);
      return { success: false, message: `Account creation failed: ${error.message}` };
    }
  }

  async createMainAccount(uuid: string, username: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if main account already exists
      const existingMain = await this.starbankRepository.findUserMainAccount(uuid);
      if (existingMain) {
        return { success: false, message: 'Main account already exists' };
      }

      const result = await this.createAccount(uuid, username, 'MAIN');
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error('Failed to create main account:', error);
      return { success: false, message: `Main account creation failed: ${error.message}` };
    }
  }

  async getAllAccounts(): Promise<AccountInfo[]> {
    try {
      return await this.starbankRepository.findAllAccounts();
    } catch (error) {
      console.error('Failed to get all accounts:', error);
      throw new Error(`Failed to retrieve all accounts: ${error.message}`);
    }
  }

  async getUserAccounts(uuid: string): Promise<AccountInfo[]> {
    try {
      return await this.starbankRepository.findUserAccounts(uuid);
    } catch (error) {
      console.error(`Failed to get accounts for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user accounts: ${error.message}`);
    }
  }

  async getUserMainAccount(uuid: string): Promise<{ id: number; balance: number } | null> {
    try {
      return await this.starbankRepository.findUserMainAccount(uuid);
    } catch (error) {
      console.error(`Failed to get main account for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve main account: ${error.message}`);
    }
  }

  async getUserBalance(uuid: string): Promise<{ balance: number }> {
    try {
      const balance = await this.starbankRepository.getUserBalance(uuid);
      return { balance };
    } catch (error) {
      console.error(`Failed to get balance for user ${uuid}:`, error);
      return { balance: 0 };
    }
  }

  async getAccountInfo(accountId: number): Promise<AccountInfo | null> {
    try {
      return await this.starbankRepository.findAccountById(accountId);
    } catch (error) {
      console.error(`Failed to get account info for ${accountId}:`, error);
      throw new Error(`Failed to retrieve account info: ${error.message}`);
    }
  }
}