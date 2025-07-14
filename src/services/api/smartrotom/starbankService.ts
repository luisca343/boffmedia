import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { CreateAccountDto } from '@/types/dto/create-account-dto';
import { TrainerDefeatMoneyDto } from '@/types/dto/trainer-defeat-money-dto';
import { CreateShopTransactionDto } from '@/types/dto/create-shop-transaction-dto';
import { CreateTransferDto } from '@/types/dto/create-transfer-dto';
import { TransferFromMainDto } from '@/types/dto/transfer-from-main-dto';
import { FullTransaction } from '@/types/starbank';
import { StarBankAccount } from '@/generated/api';

export class StarbankService {
  // ==================== ACCOUNT OPERATIONS ====================

  /**
   * Get all StarBank accounts
   */
  static getAllAccounts() {
    return rotomGET<StarBankAccount[]>('/starbank/accounts');
  }

  /**
   * Create a new StarBank account
   */
  static createAccount(data: CreateAccountDto) {
    return rotomPOST<StarBankAccount>('/starbank/accounts', data);
  }

  /**
   * Create a main account for a user
   */
  static createMainAccount(uuid: string, username: string) {
    return rotomPOST<StarBankAccount>('/starbank/accounts/main', { uuid, username });
  }

  /**
   * Get accounts for a specific user
   */
  static getUserAccounts(uuid: string) {
    return rotomGET<StarBankAccount[]>(`/starbank/accounts/${uuid}`);
  }

  /**
   * Get balance for a user
   */
  static getUserBalance(uuid: string) {
    return rotomGET<{ balance: number }>(`/starbank/balance/${uuid}`);
  }

  // ==================== TRANSACTION OPERATIONS ====================

  /**
   * Transfer money between accounts
   */
  static transfer(data: CreateTransferDto) {
    return rotomPOST<void>('/starbank/transfer', data);
  }

  /**
   * Transfer money from main account
   */
  static transferFromMain(data: TransferFromMainDto) {
    return rotomPOST<void>('/starbank/transfer/from-main', data);
  }

  /**
   * Process a shop transaction
   */
  static shopTransaction(data: CreateShopTransactionDto) {
    return rotomPOST<void>('/starbank/shop', data);
  }

  /**
   * Process trainer defeat money transaction
   */
  static trainerDefeat(data: TrainerDefeatMoneyDto) {
    return rotomPOST<void>('/starbank/trainerdefeat', data);
  }

  // ==================== TRANSACTION HISTORY ====================

  /**
   * Get transaction history for an account
   */
  static getAccountTransactions(account: number, limit?: number) {
    return rotomGET<FullTransaction[]>(`/starbank/transactions/${account}${limit ? `?limit=${limit}` : ''}`);
  }

  /**
   * Get transaction history for a user
   */
  static getUserTransactions(uuid: string, limit?: number) {
    return rotomGET<FullTransaction[]>(`/starbank/transactions/user/${uuid}${limit ? `?limit=${limit}` : ''}`);
  }

  /**
   * Get transfer history for an account
   */
  static getAccountTransfers(account: number) {
    return rotomGET<FullTransaction[]>(`/starbank/transfers/${account}`);
  }

  /**
   * Get transfer history for a user
   */
  static getUserTransfers(uuid: string) {
    return rotomGET<FullTransaction[]>(`/starbank/transfers/user/${uuid}`);
  }
}