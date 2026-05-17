import { Injectable, Inject } from '@nestjs/common';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { StarBankAccount } from '../entities/starbank-account.entity';
import { AccountType } from '../enums/account-type.enum';
import { CreateAccountDto } from '../dto/create-account.dto';
import { IStarbankAccountRepository } from '../repositories/interfaces/starbank-account.repository';
import { Logger } from 'nestjs-pino';

@Injectable()
export class StarbankAccountService {
  constructor(
    private readonly logger: Logger,

    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
  ) {}

  async createAccount(
    createAccountDto: CreateAccountDto,
  ): Promise<StarBankAccount> {
    // Validate inputs
    if (!createAccountDto.uuid || createAccountDto.uuid.trim() === '') {
      throw new Error('UUID is required');
    }
    if (!createAccountDto.name || createAccountDto.name.trim() === '') {
      throw new Error('Account name is required');
    }

    // For main accounts, check if user already has one
    if (createAccountDto.type === AccountType.MAIN) {
      const existingMain = await this.accountRepository.findUserMainAccount(
        createAccountDto.uuid,
      );
      if (existingMain) {
        throw new Error('User already has a main account');
      }
    }

    const accountData = {
      uuid: createAccountDto.uuid,
      name: createAccountDto.name,
      type: createAccountDto.type || AccountType.SECONDARY,
      initialBalance: createAccountDto.initialBalance || 0,
      image: createAccountDto.image,
    };

    this.logger.log('Creating account with data:', accountData);

    return await this.accountRepository.create(accountData);
  }

  async createMainAccount(
    uuid: string,
    username: string,
  ): Promise<StarBankAccount> {
    // Check if main account already exists
    const existingMain = await this.accountRepository.findUserMainAccount(uuid);
    if (existingMain) {
      throw new Error('Main account already exists');
    }

    const createAccountDto: CreateAccountDto = {
      uuid,
      name: username,
      type: AccountType.MAIN,
      initialBalance: 0,
    };

    return await this.createAccount(createAccountDto);
  }

  async getAllAccounts(): Promise<StarBankAccount[]> {
    return await this.accountRepository.findAll();
  }

  async getUserAccounts(uuid: string): Promise<StarBankAccount[]> {
    return await this.accountRepository.findByUuid(uuid);
  }

  async getUserMainAccount(
    uuid: string,
  ): Promise<{ id: number; balance: number } | null> {
    return await this.accountRepository.findUserMainAccount(uuid);
  }

  async getUserBalance(uuid: string): Promise<{ balance: number }> {
    try {
      const balance = await this.accountRepository.getUserBalance(uuid);
      return { balance };
    } catch (error: any) {
      this.logger.error(`Failed to get balance for user ${uuid}:`, error);
      return { balance: 0 };
    }
  }

  async getAccountInfo(accountId: number): Promise<StarBankAccount | null> {
    return await this.accountRepository.findById(accountId);
  }

  async getAccountsByType(type: AccountType): Promise<StarBankAccount[]> {
    return await this.accountRepository.findByType(type);
  }

  async checkAccountExists(accountId: number): Promise<boolean> {
    try {
      return await this.accountRepository.checkAccountExists(accountId);
    } catch (error: any) {
      this.logger.error(
        `Failed to check if account ${accountId} exists:`,
        error,
      );
      return false;
    }
  }

  async updateAccountBalance(
    accountId: number,
    newBalance: number,
  ): Promise<boolean> {
    return await this.accountRepository.updateBalance(accountId, newBalance);
  }
}
