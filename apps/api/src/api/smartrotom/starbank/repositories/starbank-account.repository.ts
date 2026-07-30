import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { RowDataPacket } from 'mysql2';
import {
  StarBankAccount as DbStarBankAccount,
  starBankAccounts,
  starBankUserAccounts,
} from '@/_db/schema/SmartRotomStarBank';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { StarBankAccount } from '../entities/starbank-account.entity';
import { AccountType } from '../enums/account-type.enum';
import { Logger } from 'nestjs-pino';
import {
  CreateAccountData,
  IStarbankAccountRepository,
} from './interfaces/starbank-account.repository';

@Injectable()
export class StarbankAccountRepository
  extends BaseRepositoryImpl<
    StarBankAccount,
    CreateAccountData,
    Partial<CreateAccountData>
  >
  implements IStarbankAccountRepository
{
  constructor(
    private readonly logger: Logger,
    @Inject(DRIZZLE) db: MySql2Database<Record<string, never>>,
  ) {
    super(db, starBankAccounts);
  }

  // ==================== BASE REPOSITORY IMPLEMENTATION ====================

  async create(accountData: CreateAccountData): Promise<StarBankAccount> {
    const result = await this.createAccount(accountData);
    if (!result.success || !result.accountId) {
      throw new Error(result.message || 'Failed to create account');
    }

    const account = await this.findById(result.accountId);
    if (!account) {
      throw new Error('Account created but not found');
    }

    return account;
  }

  async update(
    id: number,
    updateData: Partial<CreateAccountData>,
  ): Promise<StarBankAccount> {
    await this.db
      .update(starBankAccounts)
      .set({
        ...updateData,
      } as DbStarBankAccount)
      .where(eq(starBankAccounts.id, id));

    return this.findById(id) as Promise<StarBankAccount>;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(starBankAccounts)
      .where(eq(starBankAccounts.id, id));
    return result[0].affectedRows > 0;
  }

  async findById(id: number): Promise<StarBankAccount | null> {
    return this.findAccountById(id);
  }

  async findAll(): Promise<StarBankAccount[]> {
    return this.findAllAccounts();
  }

  async exists(id: number): Promise<boolean> {
    return this.checkAccountExists(id);
  }

  // ==================== ACCOUNT REPOSITORY IMPLEMENTATION ====================

  async findByUuid(uuid: string): Promise<StarBankAccount[]> {
    return this.findUserAccounts(uuid);
  }

  async findByType(type: AccountType): Promise<StarBankAccount[]> {
    try {
      const result = await this.db
        .select({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
          image: starBankAccounts.image,
        })
        .from(starBankAccounts)
        .where(eq(starBankAccounts.type, type));

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find accounts by type ${type}:`, error);
      throw new Error(`Failed to find accounts by type: ${error.message}`);
    }
  }

  /** Who owns an account, or null for a house account — those have no owner by design. */
  async findAccountOwnerUuid(accountId: number): Promise<string | null> {
    try {
      const result = await this.db
        .select({ uuid: starBankUserAccounts.uuid })
        .from(starBankUserAccounts)
        .where(eq(starBankUserAccounts.accountId, accountId));

      return result.length > 0 ? result[0].uuid : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to find the owner of account ${accountId}:`,
        error,
      );
      throw new Error(`Failed to find account owner: ${error.message}`);
    }
  }

  // Deliberately narrow: name and image only. Balance moves through the ledger and nowhere
  // else, and `type` is not something an edit form gets to change.
  async updateAccountDetails(
    accountId: number,
    details: { name?: string; image?: string },
  ): Promise<void> {
    const changes: Partial<DbStarBankAccount> = {};
    if (details.name !== undefined) changes.name = details.name;
    if (details.image !== undefined) changes.image = details.image;
    if (Object.keys(changes).length === 0) return;

    try {
      await this.db
        .update(starBankAccounts)
        .set(changes as DbStarBankAccount)
        .where(eq(starBankAccounts.id, accountId))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to update account ${accountId}:`, error);
      throw new Error(`Failed to update account: ${error.message}`);
    }
  }

  async findHouseAccount(
    type: AccountType,
    name: string,
  ): Promise<StarBankAccount | null> {
    try {
      const result = await this.db
        .select({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
          image: starBankAccounts.image,
        })
        .from(starBankAccounts)
        .where(
          and(eq(starBankAccounts.type, type), eq(starBankAccounts.name, name)),
        );

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error: any) {
      this.logger.error(`Failed to find house account ${type}/${name}:`, error);
      throw new Error(`Failed to find house account: ${error.message}`);
    }
  }

  // Not `create()`: that always links the new account to a player uuid in
  // rotom_starbank_user_accounts, and a house account has no owner.
  async createOwnerlessAccount(
    name: string,
    type: AccountType,
  ): Promise<number> {
    const result = await this.db
      .insert(starBankAccounts)
      .values({ name, balance: 0, type })
      .execute();
    return result[0].insertId;
  }

  async findUserMainAccount(
    uuid: string,
  ): Promise<{ id: number; balance: number } | null> {
    try {
      const result = await this.db
        .select({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
        })
        .from(starBankAccounts)
        .innerJoin(
          starBankUserAccounts,
          eq(starBankAccounts.id, starBankUserAccounts.accountId),
        )
        .where(eq(starBankUserAccounts.uuid, uuid))
        .execute();

      return result.length > 0
        ? (result[0] as { id: number; balance: number })
        : null;
    } catch (error: any) {
      this.logger.error(`Failed to find main account for ${uuid}:`, error);
      throw new Error(`Failed to find main account: ${error.message}`);
    }
  }

  async updateBalance(accountId: number, newBalance: number): Promise<boolean> {
    try {
      await this.db
        .update(starBankAccounts)
        .set({ balance: newBalance } as DbStarBankAccount)
        .where(eq(starBankAccounts.id, accountId))
        .execute();

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to update balance for account ${accountId}:`,
        error,
      );
      throw new Error(`Failed to update account balance: ${error.message}`);
    }
  }

  async getUserBalance(uuid: string): Promise<number> {
    try {
      const accounts = await this.findUserAccounts(uuid);
      if (accounts.length === 0) return 0;

      // Return main account balance or first account balance
      const mainAccount = accounts.find((acc) => acc.type === AccountType.MAIN);
      return mainAccount ? mainAccount.balance : accounts[0].balance;
    } catch (error: any) {
      this.logger.error(`Failed to get balance for user ${uuid}:`, error);
      return 0;
    }
  }

  async checkAccountExists(accountId: number): Promise<boolean> {
    try {
      const account = await this.findAccountById(accountId);
      return !!account;
    } catch (error: any) {
      this.logger.error(
        `Failed to check if account ${accountId} exists:`,
        error,
      );
      return false;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private mapToEntity(dbResult: any): StarBankAccount {
    return {
      id: dbResult.id,
      name: dbResult.name,
      balance: dbResult.balance,
      type: dbResult.type as AccountType,
      uuid: dbResult.uuid,
      image: dbResult.image,
    };
  }

  private async createAccount(
    accountData: CreateAccountData,
  ): Promise<{ success: boolean; accountId?: number; message?: string }> {
    try {
      const result = (await this.db
        .insert(starBankAccounts)
        .values({
          name: accountData.name,
          balance: accountData.initialBalance || 0,
          type: accountData.type || AccountType.SECONDARY,
          image: accountData.image,
        } as DbStarBankAccount)
        .execute()) as RowDataPacket[];

      const accountId = result[0].insertId;

      // Link account to user
      await this.db
        .insert(starBankUserAccounts)
        .values({
          uuid: accountData.uuid,
          accountId: accountId,
        })
        .execute();

      return { success: true, accountId };
    } catch (error: any) {
      this.logger.error('Failed to create account:', error);
      return {
        success: false,
        message: `Account creation failed: ${error.message}`,
      };
    }
  }

  private async findAccountById(
    accountId: number,
  ): Promise<StarBankAccount | null> {
    try {
      const result = await this.db
        .select({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
          uuid: starBankUserAccounts.uuid,
        })
        .from(starBankAccounts)
        .leftJoin(
          starBankUserAccounts,
          eq(starBankAccounts.id, starBankUserAccounts.accountId),
        )
        .where(eq(starBankAccounts.id, accountId))
        .execute();

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error: any) {
      this.logger.error(`Failed to find account ${accountId}:`, error);
      throw new Error(`Failed to find account: ${error.message}`);
    }
  }

  private async findUserAccounts(uuid: string): Promise<StarBankAccount[]> {
    try {
      const result = await this.db
        .selectDistinct({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
          image: starBankAccounts.image,
        })
        .from(starBankAccounts)
        .innerJoin(
          starBankUserAccounts,
          eq(starBankAccounts.id, starBankUserAccounts.accountId),
        )
        .where(eq(starBankUserAccounts.uuid, uuid))
        .execute();

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find accounts for ${uuid}:`, error);
      throw new Error(`Failed to find user accounts: ${error.message}`);
    }
  }

  private async findAllAccounts(): Promise<StarBankAccount[]> {
    try {
      const result = await this.db
        .selectDistinct({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
        })
        .from(starBankAccounts)
        .execute();

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error('Failed to find all accounts:', error);
      throw new Error(`Failed to find all accounts: ${error.message}`);
    }
  }
}
