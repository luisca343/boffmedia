import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, inArray, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import {
  starBankAccounts,
  starBankTransactions,
  starBankUsersAccounts,
} from '@/_db/schema/SmartRotomStarBank';
import { StarBankTransaction } from '../entities/starbank-transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IStarbankAccountRepository } from './interfaces/starbank-account.repository';
import { Logger } from 'nestjs-pino';
import {
  CreateTransactionData,
  IStarbankTransactionRepository,
} from './interfaces/starbank-transaction.repository';

@Injectable()
export class StarbankTransactionRepository implements IStarbankTransactionRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
  ) {}

  // ==================== TRANSACTION REPOSITORY IMPLEMENTATION ====================

  async create(
    transactionData: CreateTransactionData,
  ): Promise<{ success: boolean; message?: string; transactionId?: number }> {
    try {
      // Get current balances
      const fromAccount =
        transactionData.from === 0
          ? null
          : await this.accountRepository.findById(transactionData.from);
      const toAccount =
        transactionData.to === 0
          ? null
          : await this.accountRepository.findById(transactionData.to);

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
        await this.accountRepository.updateBalance(
          transactionData.from,
          fromBalance,
        );
      }
      if (toAccount) {
        await this.accountRepository.updateBalance(
          transactionData.to,
          toBalance,
        );
      }

      // Record transaction
      const inserted = await this.db
        .insert(starBankTransactions)
        .values({
          from: transactionData.from,
          to: transactionData.to,
          amount: transactionData.amount,
          fromBalance,
          toBalance,
          reason: transactionData.reason,
          type: transactionData.type,
          date: new Date().toISOString(),
        })
        .execute();

      return { success: true, transactionId: inserted[0].insertId };
    } catch (error: any) {
      this.logger.error('Failed to create transaction:', error);
      return {
        success: false,
        message: `Transaction failed: ${error.message}`,
      };
    }
  }

  // Accounts owned by a user, as a subquery for IN (…) filters — the previous
  // implementations "filtered" by user with non-filtering joins, so the per-user
  // listings returned the whole bank's rows.
  private ownedAccountIds(uuid: string) {
    return this.db
      .select({ accountId: starBankUsersAccounts.accountId })
      .from(starBankUsersAccounts)
      .where(eq(starBankUsersAccounts.uuid, uuid));
  }

  async findByAccountId(
    accountId: number,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');

      const result = await this.db
        .select({
          from: starBankTransactions.from,
          to: starBankTransactions.to,
          isPayer: eq(starBankTransactions.from, accountId),
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
        .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
        .where(
          or(
            eq(starBankTransactions.from, accountId),
            eq(starBankTransactions.to, accountId),
          ),
        )
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(
        `Failed to find transactions for account ${accountId}:`,
        error,
      );
      throw new Error(`Failed to find account transactions: ${error.message}`);
    }
  }

  async findByUserUuid(
    uuid: string,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');
      const owned = this.ownedAccountIds(uuid);

      const result = await this.db
        .select({
          from: starBankTransactions.from,
          to: starBankTransactions.to,
          isPayer: inArray(starBankTransactions.from, owned),
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
        .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
        .where(
          or(
            inArray(starBankTransactions.from, owned),
            inArray(starBankTransactions.to, owned),
          ),
        )
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find transactions for user ${uuid}:`, error);
      throw new Error(`Failed to find user transactions: ${error.message}`);
    }
  }

  async findTransfersByAccount(
    accountId: number,
    limit: number = 10,
  ): Promise<StarBankTransaction[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');

      const result = await this.db
        .select({
          from: starBankTransactions.from,
          to: starBankTransactions.to,
          isPayer: eq(starBankTransactions.from, accountId),
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
        .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
        .where(
          and(
            eq(starBankTransactions.type, TransactionType.TRANSFERENCIA),
            or(
              eq(starBankTransactions.from, accountId),
              eq(starBankTransactions.to, accountId),
            ),
          ),
        )
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result.map(this.mapToEntity);
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
  ): Promise<StarBankTransaction[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');
      const owned = this.ownedAccountIds(uuid);

      const result = await this.db
        .select({
          from: starBankTransactions.from,
          to: starBankTransactions.to,
          isPayer: inArray(starBankTransactions.from, owned),
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
        .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
        .where(
          and(
            eq(starBankTransactions.type, TransactionType.TRANSFERENCIA),
            or(
              inArray(starBankTransactions.from, owned),
              inArray(starBankTransactions.to, owned),
            ),
          ),
        )
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find transfers for user ${uuid}:`, error);
      throw new Error(`Failed to find user transfers: ${error.message}`);
    }
  }

  async findByType(
    type: TransactionType,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    try {
      const toJoin = alias(starBankAccounts, 'to');
      const fromJoin = alias(starBankAccounts, 'from');

      const result = await this.db
        .select({
          from: starBankTransactions.from,
          to: starBankTransactions.to,
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
        .innerJoin(toJoin, eq(starBankTransactions.to, toJoin.id))
        .innerJoin(fromJoin, eq(starBankTransactions.from, fromJoin.id))
        .where(eq(starBankTransactions.type, type))
        .limit(limit)
        .orderBy(desc(starBankTransactions.date));

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find transactions by type ${type}:`, error);
      throw new Error(`Failed to find transactions by type: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private mapToEntity(dbResult: any): StarBankTransaction {
    return {
      from: dbResult.from,
      to: dbResult.to,
      // MySQL returns 1/0 for boolean select expressions
      isPayer: !!dbResult.isPayer,
      amount: dbResult.amount,
      reason: dbResult.reason,
      fromBalance: dbResult.fromBalance,
      toBalance: dbResult.toBalance,
      type: dbResult.type as TransactionType,
      date: dbResult.date,
      fromName: dbResult.fromName,
      toName: dbResult.toName,
      fromType: dbResult.fromType,
      toType: dbResult.toType,
      displayName: dbResult.isPayer ? dbResult.toName : dbResult.fromName,
      displayAccountType: dbResult.isPayer
        ? dbResult.toType
        : dbResult.fromType,
    };
  }
}
