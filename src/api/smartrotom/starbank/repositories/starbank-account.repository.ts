import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { RowDataPacket } from 'mysql2';
import { 
  StarBankAccount as DbStarBankAccount, 
  starBankAccounts, 
  starBankUsersAccounts 
} from '@/_db/schema/SmartRotomStarBank';
import { BaseRepositoryImpl } from '@api/_utils/repositories/base-repository';
import { StarBankAccount } from '../entities/starbank-account.entity';
import { AccountType } from '../enums/account-type.enum';
import { CreateAccountData, IStarbankAccountRepository } from './interfaces/starbank-account.repository';

@Injectable()
export class StarbankAccountRepository 
  extends BaseRepositoryImpl<StarBankAccount, CreateAccountData, Partial<CreateAccountData>>
  implements IStarbankAccountRepository {

  constructor(
    @Inject(DRIZZLE) db: MySql2Database<Record<string, never>>
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

  async update(id: number, updateData: Partial<CreateAccountData>): Promise<StarBankAccount> {
    await this.db.update(starBankAccounts)
      .set({
        ...updateData
      } as DbStarBankAccount)
      .where(eq(starBankAccounts.id, id));
    
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.delete(starBankAccounts)
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
    } catch (error) {
      console.error(`Failed to find accounts by type ${type}:`, error);
      throw new Error(`Failed to find accounts by type: ${error.message}`);
    }
  }

  async findUserMainAccount(uuid: string): Promise<{ id: number; balance: number } | null> {
    try {
      const result = await this.db
        .select({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance
        })
        .from(starBankAccounts)
        .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
        .where(eq(starBankUsersAccounts.uuid, uuid))
        .execute();

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Failed to find main account for ${uuid}:`, error);
      throw new Error(`Failed to find main account: ${error.message}`);
    }
  }

  async updateBalance(accountId: number, newBalance: number): Promise<boolean> {
    try {
      if (accountId === 0) return true; // System account

      await this.db
        .update(starBankAccounts)
        .set({ balance: newBalance } as DbStarBankAccount)
        .where(eq(starBankAccounts.id, accountId))
        .execute();

      return true;
    } catch (error) {
      console.error(`Failed to update balance for account ${accountId}:`, error);
      throw new Error(`Failed to update account balance: ${error.message}`);
    }
  }

  async getUserBalance(uuid: string): Promise<number> {
    try {
      const accounts = await this.findUserAccounts(uuid);
      if (accounts.length === 0) return 0;
      
      // Return main account balance or first account balance
      const mainAccount = accounts.find(acc => acc.type === AccountType.MAIN);
      return mainAccount ? mainAccount.balance : accounts[0].balance;
    } catch (error) {
      console.error(`Failed to get balance for user ${uuid}:`, error);
      return 0;
    }
  }

  async checkAccountExists(accountId: number): Promise<boolean> {
    try {
      const account = await this.findAccountById(accountId);
      return !!account;
    } catch (error) {
      console.error(`Failed to check if account ${accountId} exists:`, error);
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
      image: dbResult.image
    };
  }

  private async createAccount(accountData: CreateAccountData): Promise<{ success: boolean; accountId?: number; message?: string }> {
    try {
      const result = await this.db.insert(starBankAccounts).values({
        name: accountData.name,
        balance: accountData.initialBalance || 0,
        type: accountData.type || AccountType.SECONDARY,
        image: accountData.image
      } as DbStarBankAccount).execute() as RowDataPacket[];

      const accountId = result[0].insertId;

      // Link account to user
      await this.db.insert(starBankUsersAccounts).values({
        uuid: accountData.uuid,
        accountId: accountId
      }).execute();

      return { success: true, accountId };
    } catch (error) {
      console.error('Failed to create account:', error);
      return { success: false, message: `Account creation failed: ${error.message}` };
    }
  }

  private async findAccountById(accountId: number): Promise<StarBankAccount | null> {
    try {
      const result = await this.db
        .select({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
          uuid: starBankUsersAccounts.uuid
        })
        .from(starBankAccounts)
        .leftJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
        .where(eq(starBankAccounts.id, accountId))
        .execute();

      return result.length > 0 ? this.mapToEntity(result[0]) : null;
    } catch (error) {
      console.error(`Failed to find account ${accountId}:`, error);
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
          image: starBankAccounts.image
        })
        .from(starBankAccounts)
        .innerJoin(starBankUsersAccounts, eq(starBankAccounts.id, starBankUsersAccounts.accountId))
        .where(eq(starBankUsersAccounts.uuid, uuid))
        .execute();

      return result.map(this.mapToEntity);
    } catch (error) {
      console.error(`Failed to find accounts for ${uuid}:`, error);
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
          type: starBankAccounts.type
        })
        .from(starBankAccounts)
        .execute();

      return result.map(this.mapToEntity);
    } catch (error) {
      console.error('Failed to find all accounts:', error);
      throw new Error(`Failed to find all accounts: ${error.message}`);
    }
  }
}