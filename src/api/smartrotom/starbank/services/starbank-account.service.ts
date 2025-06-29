import { Injectable, Inject } from '@nestjs/common';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { StarBankAccount } from '../entities/starbank-account.entity';
import { AccountType } from '../enums/account-type.enum';
import { CreateAccountDto } from '../dto/create-account.dto';
import { IStarbankAccountRepository } from '../repositories/interfaces/starbank-account.repository';
import { AccountsListResponseDto } from '../dto/accounts-list-response.dto';
import { AccountResponseDto } from '../dto/account-response-dto';

@Injectable()
export class StarbankAccountService {
  constructor(
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
  ) {}

  async createAccount(createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    try {
      // Validate inputs
      if (!createAccountDto.uuid || createAccountDto.uuid.trim() === '') {
        return { 
          success: false, 
          message: 'UUID is required' 
        };
      }
      if (!createAccountDto.name || createAccountDto.name.trim() === '') {
        return { 
          success: false, 
          message: 'Account name is required' 
        };
      }

      // For main accounts, check if user already has one
      if (createAccountDto.type === AccountType.MAIN) {
        const existingMain = await this.accountRepository.findUserMainAccount(createAccountDto.uuid);
        if (existingMain) {
          return { 
            success: false, 
            message: 'User already has a main account' 
          };
        }
      }

      const accountData = {
        uuid: createAccountDto.uuid,
        name: createAccountDto.name,
        type: createAccountDto.type || AccountType.SECONDARY,
        initialBalance: createAccountDto.initialBalance || 0
      };

      const account = await this.accountRepository.create(accountData);
      
      return {
        success: true,
        account,
        accountId: account.id,
        message: 'Account created successfully'
      };
    } catch (error) {
      console.error('Failed to create account:', error);
      return { 
        success: false, 
        message: `Account creation failed: ${error.message}` 
      };
    }
  }

  async createMainAccount(uuid: string, username: string): Promise<AccountResponseDto> {
    try {
      // Check if main account already exists
      const existingMain = await this.accountRepository.findUserMainAccount(uuid);
      if (existingMain) {
        return { 
          success: false, 
          message: 'Main account already exists' 
        };
      }

      const createAccountDto: CreateAccountDto = {
        uuid,
        name: username,
        type: AccountType.MAIN,
        initialBalance: 0
      };

      return await this.createAccount(createAccountDto);
    } catch (error) {
      console.error('Failed to create main account:', error);
      return { 
        success: false, 
        message: `Main account creation failed: ${error.message}` 
      };
    }
  }

  async getAllAccounts(): Promise<AccountsListResponseDto> {
    try {
      const accounts = await this.accountRepository.findAll();
      return {
        accounts,
        total: accounts.length
      };
    } catch (error) {
      console.error('Failed to get all accounts:', error);
      throw new Error(`Failed to retrieve all accounts: ${error.message}`);
    }
  }

  async getUserAccounts(uuid: string): Promise<StarBankAccount[]> {
    try {
      const accounts = await this.accountRepository.findByUuid(uuid);
      return accounts;
    } catch (error) {
      console.error(`Failed to get accounts for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve user accounts: ${error.message}`);
    }
  }

  async getUserMainAccount(uuid: string): Promise<{ id: number; balance: number } | null> {
    try {
      return await this.accountRepository.findUserMainAccount(uuid);
    } catch (error) {
      console.error(`Failed to get main account for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve main account: ${error.message}`);
    }
  }

  async getUserBalance(uuid: string): Promise<{ balance: number }> {
    try {
      const balance = await this.accountRepository.getUserBalance(uuid);
      return { balance };
    } catch (error) {
      console.error(`Failed to get balance for user ${uuid}:`, error);
      return { balance: 0 };
    }
  }

  async getAccountInfo(accountId: number): Promise<StarBankAccount | null> {
    try {
      return await this.accountRepository.findById(accountId);
    } catch (error) {
      console.error(`Failed to get account info for ${accountId}:`, error);
      throw new Error(`Failed to retrieve account info: ${error.message}`);
    }
  }

  async getAccountsByType(type: AccountType): Promise<AccountsListResponseDto> {
    try {
      const accounts = await this.accountRepository.findByType(type);
      return {
        accounts,
        total: accounts.length
      };
    } catch (error) {
      console.error(`Failed to get accounts by type ${type}:`, error);
      throw new Error(`Failed to retrieve accounts by type: ${error.message}`);
    }
  }

  async checkAccountExists(accountId: number): Promise<boolean> {
    try {
      return await this.accountRepository.checkAccountExists(accountId);
    } catch (error) {
      console.error(`Failed to check if account ${accountId} exists:`, error);
      return false;
    }
  }

  async updateAccountBalance(accountId: number, newBalance: number): Promise<boolean> {
    try {
      return await this.accountRepository.updateBalance(accountId, newBalance);
    } catch (error) {
      console.error(`Failed to update balance for account ${accountId}:`, error);
      throw new Error(`Failed to update account balance: ${error.message}`);
    }
  }
}