import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { StarBankAccount } from '../entities/starbank-account.entity';
import { AccountType } from '../enums/account-type.enum';
import { isHouseAccountType } from '../house-accounts';
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

  /**
   * Renames a secondary account and/or replaces its picture.
   *
   * Only SECONDARY accounts are editable, and that is enforced here rather than in the UI:
   * MAIN is created by the server on first login and represents the player, and a house account
   * (the treasury, the market escrow, the taxi's takings) is nobody's to rename.
   *
   * `actor` is null for the trusted game server, which may act on any account.
   */
  async updateAccount(
    accountId: number,
    details: { name?: string; image?: string },
    actor: { uuid?: string; isAdmin: boolean } | null,
  ): Promise<StarBankAccount> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} does not exist`);
    }
    if (isHouseAccountType(account.type)) {
      throw new ForbiddenException('House accounts cannot be edited');
    }
    if (account.type !== AccountType.SECONDARY) {
      throw new ForbiddenException('Only secondary accounts can be edited');
    }

    if (actor && !actor.isAdmin) {
      const owner = await this.accountRepository.findAccountOwnerUuid(accountId);
      if (!owner || owner !== actor.uuid) {
        throw new ForbiddenException(
          userError(
            ApiErrorCode.ACTOR_NOT_SELF,
            'Actor may only edit their own accounts',
          ),
        );
      }
    }

    const name = details.name?.trim();
    if (details.name !== undefined && !name) {
      throw new BadRequestException('Account name cannot be empty');
    }

    await this.accountRepository.updateAccountDetails(accountId, {
      name,
      image: details.image,
    });

    const updated = await this.accountRepository.findById(accountId);
    if (!updated) {
      throw new NotFoundException(`Account ${accountId} does not exist`);
    }
    return updated;
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

  // House accounts are excluded: `GET /starbank/accounts` is @Public(), and the treasury,
  // the market escrow and each service's takings are not a player-facing list. Read them
  // through the owning domain service (TreasuryService, WigglypopEscrowService, …).
  async getAllAccounts(): Promise<StarBankAccount[]> {
    const accounts = await this.accountRepository.findAll();
    return accounts.filter((account) => !isHouseAccountType(account.type));
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
