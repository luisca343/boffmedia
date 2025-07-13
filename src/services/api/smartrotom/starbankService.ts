import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { CreateAccountDto } from '@/types/dto/create-account-dto';
import { TrainerDefeatMoneyDto } from '@/types/dto/trainer-defeat-money-dto';
import { CreateShopTransactionDto } from '@/types/dto/create-shop-transaction-dto';
import { CreateTransferDto } from '@/types/dto/create-transfer-dto';
import { TransferFromMainDto } from '@/types/dto/transfer-from-main-dto';
import { Balance, FullTransaction } from '@/types/starbank';
import { SuccessResponse } from '@/types';
import { StarBankAccount } from '@/generated/api';

export type Transfer = any; // Replace 'any' with the actual Transfer type

export class StarbankService {
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
    return rotomPOST<SuccessResponse>('/starbank/accounts', data);
  }

  /**
   * Get accounts for a specific user
   */
  static getAccounts(uuid: string) {
    return rotomGET<StarBankAccount[]>(`/starbank/accounts/${uuid}`);
  }

  /**
   * Get balance for a user
   */
  static getBalance(uuid: string) {
    return rotomGET<Balance>(`/starbank/balance/${uuid}`);
  }

  /**
   * Process a shop transaction
   */
  static shop(data: CreateShopTransactionDto) {
    return rotomPOST<SuccessResponse>('/starbank/shop', data);
  }

  /**
   * Process trainer defeat money transaction
   */
  static trainerDefeat(data: TrainerDefeatMoneyDto) {
    return rotomPOST<SuccessResponse>('/starbank/trainerdefeat', data);
  }

  /**
   * Get transactions for an account
   */
  static getTransactions(account: number, limit?: number) {
    return rotomGET<FullTransaction[]>(`/starbank/transactions/${account}${limit ? `?limit=${limit}` : ''}`);
  }

  /**
   * Transfer money between accounts
   */
  static transfer(data: CreateTransferDto) {
    return rotomPOST<SuccessResponse>('/starbank/transfer', data);
  }

  /**
   * Transfer money from main account
   */
  static transferFromMain(data: TransferFromMainDto) {
    return rotomPOST<SuccessResponse>('/starbank/transfer/from-main', data);
  }

  /**
   * Get transfers for an account
   */
  static getTransfers(account: number) {
    return rotomGET<Transfer[]>(`/starbank/transfers/${account}`);
  }
}