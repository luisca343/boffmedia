import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { RowDataPacket } from 'mysql2';
import {
  StarBankAccount,
  starBankAccounts,
  starBankTransactions,
  starBankUserAccounts,
} from '@/_db/schema/SmartRotomStarBank';
import { rotomUsers } from '@/_db/schema/SmartRotom';
import { Logger } from 'nestjs-pino';

export interface CreateAccountData {
  uuid: string;
  name: string;
  type?: 'MAIN' | 'SECONDARY';
  initialBalance?: number;
  image?: string;
}

export interface CreateTransactionData {
  from: number;
  to: number;
  amount: number;
  reason: string;
  type: string;
}

export interface AccountInfo {
  id: number;
  balance: number;
  name: string;
  type: string;
  uuid?: string;
  image?: string;
}

export interface TransactionDetails {
  from: number;
  to: number;
  amount: number;
  reason: string;
  fromBalance: number;
  toBalance: number;
  type: string;
  // Was `string`: the column held an ISO string. It is a real timestamp since
  // migration 0036. The serialized JSON is byte-identical either way, so this is
  // not a wire change — JSON.stringify(Date) emits the same ISO-8601 it did.
  date: Date;
  fromName?: string;
  toName?: string;
  fromType?: string;
  toType?: string;
}

@Injectable()
export class StarbankRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== ACCOUNT OPERATIONS ====================

  async createAccount(
    accountData: CreateAccountData,
  ): Promise<{ success: boolean; accountId?: number; message?: string }> {
    try {
      const result = (await this.db
        .insert(starBankAccounts)
        .values({
          name: accountData.name,
          balance: accountData.initialBalance || 0,
          type: accountData.type || 'SECONDARY',
          image: accountData.image,
        } as StarBankAccount)
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

  async findAccountById(accountId: number): Promise<AccountInfo | null> {
    try {
      const result = await this.db
        .select({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
          uuid: starBankUserAccounts.uuid,
          image: starBankAccounts.image,
        })
        .from(starBankAccounts)
        .leftJoin(
          starBankUserAccounts,
          eq(starBankAccounts.id, starBankUserAccounts.accountId),
        )
        .where(eq(starBankAccounts.id, accountId))
        .execute();

      return result.length > 0 ? (result[0] as unknown as AccountInfo) : null;
    } catch (error: any) {
      this.logger.error(`Failed to find account ${accountId}:`, error);
      throw new Error(`Failed to find account: ${error.message}`);
    }
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
        ? (result[0] as unknown as { id: number; balance: number })
        : null;
    } catch (error: any) {
      this.logger.error(`Failed to find main account for ${uuid}:`, error);
      throw new Error(`Failed to find main account: ${error.message}`);
    }
  }

  async findUserAccounts(uuid: string): Promise<AccountInfo[]> {
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

      return result as unknown as AccountInfo[];
    } catch (error: any) {
      this.logger.error(`Failed to find accounts for ${uuid}:`, error);
      throw new Error(`Failed to find user accounts: ${error.message}`);
    }
  }

  async findAllAccounts(): Promise<AccountInfo[]> {
    try {
      return (await this.db
        .selectDistinct({
          id: starBankAccounts.id,
          balance: starBankAccounts.balance,
          name: starBankAccounts.name,
          type: starBankAccounts.type,
          image: starBankAccounts.image,
        })
        .from(starBankAccounts)
        .execute()) as unknown as AccountInfo[];
    } catch (error: any) {
      this.logger.error('Failed to find all accounts:', error);
      throw new Error(`Failed to find all accounts: ${error.message}`);
    }
  }

  async updateAccountBalance(
    accountId: number,
    newBalance: number,
  ): Promise<boolean> {
    try {
      if (accountId === 0) return true; // System account

      await this.db
        .update(starBankAccounts)
        .set({ balance: newBalance } as StarBankAccount)
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

  // ==================== TRANSACTION OPERATIONS ====================

  async createTransaction(
    transactionData: CreateTransactionData,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Get current balances
      const fromAccount =
        transactionData.from === 0
          ? null
          : await this.findAccountById(transactionData.from);
      const toAccount =
        transactionData.to === 0
          ? null
          : await this.findAccountById(transactionData.to);

      // Validate accounts exist (except system account 0)
      if (transactionData.from !== 0 && !fromAccount) {
        return { success: false, message: 'Source account not found' };
      }
      if (transactionData.to !== 0 && !toAccount) {
        return { success: false, message: 'Destination account not found' };
      }

      // Check sufficient balance
      if (fromAccount && fromAccount.balance < transactionData.amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      // Calculate new balances
      const fromBalance = fromAccount
        ? fromAccount.balance - transactionData.amount
        : 0;
      const toBalance = toAccount
        ? toAccount.balance + transactionData.amount
        : 0;

      // Update balances
      if (fromAccount) {
        await this.updateAccountBalance(transactionData.from, fromBalance);
      }
      if (toAccount) {
        await this.updateAccountBalance(transactionData.to, toBalance);
      }

      // Record transaction
      await this.db
        .insert(starBankTransactions)
        .values({
          fromAccountId: transactionData.from,
          toAccountId: transactionData.to,
          amount: transactionData.amount,
          fromBalance,
          toBalance,
          reason: transactionData.reason,
          type: transactionData.type,
          date: new Date(),
        })
        .execute();

      return { success: true };
    } catch (error: any) {
      this.logger.error('Failed to create transaction:', error);
      return {
        success: false,
        message: `Transaction failed: ${error.message}`,
      };
    }
  }

  async findAccountTransactions(
    accountId: number,
    limit: number = 50,
  ): Promise<TransactionDetails[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');

      const result = await this.db
        .selectDistinct({
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          amount: starBankTransactions.amount,
          reason: starBankTransactions.reason,
          fromBalance: starBankTransactions.fromBalance,
          toBalance: starBankTransactions.toBalance,
          type: starBankTransactions.type,
          toName: toJoin.name,
          fromName: fromJoin.name,
          toType: toJoin.type,
          fromType: fromJoin.type,
          date: starBankTransactions.date,
        })
        .from(starBankTransactions)
        .innerJoin(toJoin, eq(starBankTransactions.toAccountId, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.fromAccountId, fromJoin.id))
        .leftJoin(
          starBankUserAccounts,
          or(
            eq(toJoin.id, starBankUserAccounts.accountId),
            eq(fromJoin.id, starBankUserAccounts.accountId),
          ),
        )
        .where(
          or(
            eq(starBankTransactions.fromAccountId, accountId),
            eq(starBankTransactions.toAccountId, accountId),
          ),
        )
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result;
    } catch (error: any) {
      this.logger.error(
        `Failed to find transactions for account ${accountId}:`,
        error,
      );
      throw new Error(`Failed to find account transactions: ${error.message}`);
    }
  }

  async findUserTransactions(
    uuid: string,
    limit: number = 50,
  ): Promise<TransactionDetails[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');

      const result = await this.db
        .selectDistinct({
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          amount: starBankTransactions.amount,
          reason: starBankTransactions.reason,
          fromBalance: starBankTransactions.fromBalance,
          toBalance: starBankTransactions.toBalance,
          type: starBankTransactions.type,
          toName: toJoin.name,
          fromName: fromJoin.name,
          toType: toJoin.type,
          fromType: fromJoin.type,
          date: starBankTransactions.date,
        })
        .from(starBankTransactions)
        .innerJoin(toJoin, eq(starBankTransactions.toAccountId, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.fromAccountId, fromJoin.id))
        .leftJoin(
          starBankUserAccounts,
          or(
            eq(toJoin.id, starBankUserAccounts.accountId),
            eq(fromJoin.id, starBankUserAccounts.accountId),
          ),
        )
        .leftJoin(rotomUsers, eq(starBankUserAccounts.uuid, uuid))
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to find transactions for user ${uuid}:`, error);
      throw new Error(`Failed to find user transactions: ${error.message}`);
    }
  }

  async findTransfersByAccount(
    accountId: number,
    limit: number = 10,
  ): Promise<TransactionDetails[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');

      const result = await this.db
        .selectDistinct({
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          amount: starBankTransactions.amount,
          reason: starBankTransactions.reason,
          fromBalance: starBankTransactions.fromBalance,
          toBalance: starBankTransactions.toBalance,
          type: starBankTransactions.type,
          toName: toJoin.name,
          fromName: fromJoin.name,
          toType: toJoin.type,
          fromType: fromJoin.type,
          date: starBankTransactions.date,
        })
        .from(starBankTransactions)
        .innerJoin(toJoin, eq(starBankTransactions.toAccountId, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.fromAccountId, fromJoin.id))
        .innerJoin(
          starBankUserAccounts,
          or(
            eq(toJoin.id, starBankUserAccounts.accountId),
            eq(fromJoin.id, starBankUserAccounts.accountId),
          ),
        )
        .where(eq(starBankTransactions.type, 'TRANSFERENCIA'))
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result;
    } catch (error: any) {
      this.logger.error(
        `Failed to find transfers for account ${accountId}:`,
        error,
      );
      throw new Error(`Failed to find account transfers: ${error.message}`);
    }
  }

  async findTransfersByUser(
    uuid: string,
    limit: number = 10,
  ): Promise<TransactionDetails[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');

      const result = await this.db
        .select({
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          amount: starBankTransactions.amount,
          reason: starBankTransactions.reason,
          fromBalance: starBankTransactions.fromBalance,
          toBalance: starBankTransactions.toBalance,
          type: starBankTransactions.type,
          toName: toJoin.name,
          fromName: fromJoin.name,
          toType: toJoin.type,
          fromType: fromJoin.type,
          date: starBankTransactions.date,
        })
        .from(starBankTransactions)
        .innerJoin(toJoin, eq(starBankTransactions.toAccountId, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.fromAccountId, fromJoin.id))
        .innerJoin(
          starBankUserAccounts,
          or(
            eq(toJoin.id, starBankUserAccounts.accountId),
            eq(fromJoin.id, starBankUserAccounts.accountId),
          ),
        )
        .innerJoin(rotomUsers, eq(starBankUserAccounts.uuid, uuid))
        .where(eq(starBankTransactions.type, 'TRANSFERENCIA'))
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to find transfers for user ${uuid}:`, error);
      throw new Error(`Failed to find user transfers: ${error.message}`);
    }
  }

  // ==================== UTILITY OPERATIONS ====================

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

  async getUserBalance(uuid: string): Promise<number> {
    try {
      const accounts = await this.findUserAccounts(uuid);
      if (accounts.length === 0) return 0;

      // Return main account balance or first account balance
      const mainAccount = accounts.find((acc) => acc.type === 'MAIN');
      return mainAccount ? mainAccount.balance : accounts[0].balance;
    } catch (error: any) {
      this.logger.error(`Failed to get balance for user ${uuid}:`, error);
      return 0;
    }
  }
}
