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
  create(transactionData: CreateTransactionData): Promise<{ success: boolean; message?: string }>;
  findByAccountId(accountId: number, limit?: number): Promise<StarBankTransaction[]>;
  findByUserUuid(uuid: string, limit?: number): Promise<StarBankTransaction[]>;
  findTransfersByAccount(accountId: number, limit?: number): Promise<StarBankTransaction[]>;
  findTransfersByUser(uuid: string, limit?: number): Promise<StarBankTransaction[]>;
  findByType(type: TransactionType, limit?: number): Promise<StarBankTransaction[]>;
}