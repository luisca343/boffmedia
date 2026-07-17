import { StarBankTransaction } from '../../entities/starbank-transaction.entity';
import { TransactionType } from '../../enums/transaction-type.enum';

export interface CreateTransactionData {
  from: number;
  to: number;
  amount: number;
  reason: string;
  type: TransactionType;
}

export interface IStarbankTransactionRepository {
  create(
    transactionData: CreateTransactionData,
  ): Promise<{ success: boolean; message?: string; transactionId?: number }>;
  /**
   * Atomically set an account's balance to an absolute target, ledgering the
   * signed delta as an AJUSTE against the virtual system account 0. Reads the
   * balance under a row lock in the same transaction as the write, so there is
   * no read-modify-write race. `delta`/`newBalance` are populated on success.
   */
  setBalance(
    accountId: number,
    targetBalance: number,
    reason: string,
  ): Promise<{
    success: boolean;
    message?: string;
    delta?: number;
    newBalance?: number;
  }>;
  findByAccountId(
    accountId: number,
    limit?: number,
  ): Promise<StarBankTransaction[]>;
  findByUserUuid(uuid: string, limit?: number): Promise<StarBankTransaction[]>;
  findTransfersByAccount(
    accountId: number,
    limit?: number,
  ): Promise<StarBankTransaction[]>;
  findTransfersByUser(
    uuid: string,
    limit?: number,
  ): Promise<StarBankTransaction[]>;
  findByType(
    type: TransactionType,
    limit?: number,
  ): Promise<StarBankTransaction[]>;
}
