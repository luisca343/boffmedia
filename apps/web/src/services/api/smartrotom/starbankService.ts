import { rotomGET, rotomPOST, ApiResponse, rotomMultipartPOST } from '@/services/boffAPI';
import { CreateAccountDto } from '@/types/dto/create-account-dto';
import { StarBankAccount, StarBankTransaction, TrainerDefeatMoneyDto, CreateShopTransactionDto, CreateTransferDto, TransferFromMainDto } from '@boffmedia/shared';

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
  static createAccount(data: CreateAccountDto, images: Record<string, File | Blob> = {}): Promise<ApiResponse<StarBankAccount>> {
    return rotomMultipartPOST<StarBankAccount>('/starbank/accounts', data, images);
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
    return rotomGET<StarBankTransaction[]>(`/starbank/transactions/${account}${limit ? `?limit=${limit}` : ''}`);
  }

  /**
   * Get transaction history for a user
   */
  static getUserTransactions(uuid: string, limit?: number) {
    return rotomGET<StarBankTransaction[]>(`/starbank/transactions/user/${uuid}${limit ? `?limit=${limit}` : ''}`);
  }

  /**
   * Get transfer history for an account
   */
  static getAccountTransfers(account: number) {
    return rotomGET<StarBankTransaction[]>(`/starbank/transfers/${account}`);
  }

  /**
   * Get transfer history for a user
   */
  static getUserTransfers(uuid: string) {
    return rotomGET<StarBankTransaction[]>(`/starbank/transfers/user/${uuid}`);
  }
}