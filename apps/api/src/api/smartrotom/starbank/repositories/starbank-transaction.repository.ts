import { HttpException, Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, inArray, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import {
  starBankAccounts,
  starBankTransactions,
  starBankUserAccounts,
} from '@/_db/schema/SmartRotomStarBank';
import { StarBankTransaction } from '../entities/starbank-transaction.entity';
import { AccountType } from '../enums/account-type.enum';
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

  private cachedSystemAccountId: number | null = null;

  /**
   * The SYSTEM account's id, resolved inside the caller's transaction so a mint and the lock it
   * takes stay in one atomic unit. Seeded by migration 0040; a missing row is a failed
   * migration, and failing is better than writing an FK-violating ledger row.
   */
  private async systemAccountId(
    tx: Pick<MySql2Database<Record<string, never>>, 'select'>,
  ): Promise<number> {
    if (this.cachedSystemAccountId) return this.cachedSystemAccountId;
    const rows = await tx
      .select({ id: starBankAccounts.id })
      .from(starBankAccounts)
      .where(eq(starBankAccounts.type, AccountType.SYSTEM));
    if (!rows[0]) {
      throw new Error(
        'The SYSTEM StarBank account does not exist. Run the pending migrations.',
      );
    }
    this.cachedSystemAccountId = rows[0].id;
    return this.cachedSystemAccountId;
  }

  // ==================== TRANSACTION REPOSITORY IMPLEMENTATION ====================

  async create(
    transactionData: CreateTransactionData,
  ): Promise<{ success: boolean; message?: string; transactionId?: number }> {
    const { from: fromId, to: toId, amount } = transactionData;
    try {
      // The debit, credit and ledger insert must be one atomic unit, and the
      // balance read must hold a row lock until the write commits — otherwise
      // two concurrent transfers both read the same balance and the second
      // overwrite silently loses money. Everything runs on `tx`; `SELECT … FOR
      // UPDATE` serialises transfers touching the same account.
      return await this.db.transaction(async (tx) => {
        const lockAccount = async (id: number) => {
          const rows = await tx
            .select({
              id: starBankAccounts.id,
              balance: starBankAccounts.balance,
              type: starBankAccounts.type,
            })
            .from(starBankAccounts)
            .where(eq(starBankAccounts.id, id))
            .for('update');
          return rows[0] ?? null;
        };

        const fromAccount = await lockAccount(fromId);
        const toAccount = await lockAccount(toId);

        if (!fromAccount) {
          return { success: false, message: 'Source account not found' };
        }
        if (!toAccount) {
          return { success: false, message: 'Destination account not found' };
        }
        // SYSTEM is where money is minted from, so it is the one account that may go
        // negative: its balance is the negative of all money in circulation.
        if (
          fromAccount.type !== AccountType.SYSTEM &&
          (fromAccount.balance ?? 0) < amount
        ) {
          return { success: false, message: 'Insufficient balance' };
        }

        const fromBalance = (fromAccount.balance ?? 0) - amount;
        const toBalance = (toAccount.balance ?? 0) + amount;

        await tx
          .update(starBankAccounts)
          .set({ balance: fromBalance })
          .where(eq(starBankAccounts.id, fromId));
        await tx
          .update(starBankAccounts)
          .set({ balance: toBalance })
          .where(eq(starBankAccounts.id, toId));

        const inserted = await tx
          .insert(starBankTransactions)
          .values({
            fromAccountId: fromId,
            toAccountId: toId,
            amount,
            fromBalance,
            toBalance,
            reason: transactionData.reason,
            type: transactionData.type,
            date: new Date(),
          })
          .execute();

        return { success: true, transactionId: inserted[0].insertId };
      });
    } catch (error: any) {
      // The transaction has rolled back — no partial balance change persisted.
      this.logger.error('Failed to create transaction:', error);
      return {
        success: false,
        message: `Transaction failed: ${error.message}`,
      };
    }
  }

  async setBalance(
    accountId: number,
    targetBalance: number,
    reason: string,
  ): Promise<{
    success: boolean;
    message?: string;
    delta?: number;
    newBalance?: number;
  }> {
    if (targetBalance < 0) {
      return { success: false, message: 'Target balance must be non-negative' };
    }
    try {
      // FOR UPDATE holds the row lock until commit, so a concurrent transfer cannot
      // land between the read and the set and leave the balance off target. Mirrors `create`.
      return await this.db.transaction(async (tx) => {
        const systemId = await this.systemAccountId(tx);
        if (accountId === systemId) {
          return {
            success: false,
            message: 'Cannot set the system account balance',
          };
        }
        const rows = await tx
          .select({
            id: starBankAccounts.id,
            balance: starBankAccounts.balance,
          })
          .from(starBankAccounts)
          .where(eq(starBankAccounts.id, accountId))
          .for('update');
        const account = rows[0];
        if (!account) {
          return { success: false, message: 'Account not found' };
        }

        const current = account.balance ?? 0;
        const delta = targetBalance - current;
        if (delta === 0) {
          // Nothing to correct — no ledger noise for a no-op set.
          return { success: true, delta: 0, newBalance: current };
        }

        await tx
          .update(starBankAccounts)
          .set({ balance: targetBalance })
          .where(eq(starBankAccounts.id, accountId));

        // Ledger the correction as a mint/burn against the SYSTEM account: delta>0 credits
        // the account, delta<0 debits it. Both sides record their post-set balance, and the
        // SYSTEM side moves the opposite way — it is the counterparty, not a placeholder.
        // (It was the literal id 0 until migration 0040, which no row could ever have: both
        // FKs point at rotom_starbank_accounts.id, so every AJUSTE insert failed.)
        const isMint = delta > 0;
        const systemRows = await tx
          .select({ balance: starBankAccounts.balance })
          .from(starBankAccounts)
          .where(eq(starBankAccounts.id, systemId))
          .for('update');
        const systemBalance = (systemRows[0]?.balance ?? 0) - delta;
        await tx
          .update(starBankAccounts)
          .set({ balance: systemBalance })
          .where(eq(starBankAccounts.id, systemId));

        await tx
          .insert(starBankTransactions)
          .values({
            fromAccountId: isMint ? systemId : accountId,
            toAccountId: isMint ? accountId : systemId,
            amount: Math.abs(delta),
            fromBalance: isMint ? systemBalance : targetBalance,
            toBalance: isMint ? targetBalance : systemBalance,
            reason,
            type: TransactionType.AJUSTE,
            date: new Date(),
          })
          .execute();

        return { success: true, delta, newBalance: targetBalance };
      });
    } catch (error: any) {
      // Rolled back — no partial change persisted.
      this.logger.error('Failed to set balance:', error);
      return {
        success: false,
        message: `Set balance failed: ${error.message}`,
      };
    }
  }

  // Accounts owned by a user, as a subquery for IN (…) filters — the previous
  // implementations "filtered" by user with non-filtering joins, so the per-user
  // listings returned the whole bank's rows.
  private ownedAccountIds(uuid: string) {
    return this.db
      .select({ accountId: starBankUserAccounts.accountId })
      .from(starBankUserAccounts)
      .where(eq(starBankUserAccounts.uuid, uuid));
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
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          isPayer: eq(starBankTransactions.fromAccountId, accountId),
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
        .innerJoin(
          fromJoin,
          eq(starBankTransactions.fromAccountId, fromJoin.id),
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

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(
        `Failed to find transactions for account ${accountId}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          isPayer: inArray(starBankTransactions.fromAccountId, owned),
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
        .innerJoin(
          fromJoin,
          eq(starBankTransactions.fromAccountId, fromJoin.id),
        )
        .where(
          or(
            inArray(starBankTransactions.fromAccountId, owned),
            inArray(starBankTransactions.toAccountId, owned),
          ),
        )
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find transactions for user ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          isPayer: eq(starBankTransactions.fromAccountId, accountId),
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
        .innerJoin(
          fromJoin,
          eq(starBankTransactions.fromAccountId, fromJoin.id),
        )
        .where(
          and(
            eq(starBankTransactions.type, TransactionType.TRANSFERENCIA),
            or(
              eq(starBankTransactions.fromAccountId, accountId),
              eq(starBankTransactions.toAccountId, accountId),
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
          from: starBankTransactions.fromAccountId,
          to: starBankTransactions.toAccountId,
          isPayer: inArray(starBankTransactions.fromAccountId, owned),
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
        .innerJoin(
          fromJoin,
          eq(starBankTransactions.fromAccountId, fromJoin.id),
        )
        .where(
          and(
            eq(starBankTransactions.type, TransactionType.TRANSFERENCIA),
            or(
              inArray(starBankTransactions.fromAccountId, owned),
              inArray(starBankTransactions.toAccountId, owned),
            ),
          ),
        )
        .limit(limit)
        .orderBy(desc(starBankTransactions.date))
        .execute();

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find transfers for user ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
        .innerJoin(
          fromJoin,
          eq(starBankTransactions.fromAccountId, fromJoin.id),
        )
        .where(eq(starBankTransactions.type, type))
        .limit(limit)
        .orderBy(desc(starBankTransactions.date));

      return result.map(this.mapToEntity);
    } catch (error: any) {
      this.logger.error(`Failed to find transactions by type ${type}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
