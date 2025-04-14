import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { CreateAccountDto } from '@/types/dto/create-account-dto';
import { TrainerDefeatMoneyDto } from '@/types/dto/trainer-defeat-money-dto';
import { CreateShopTransactionDto } from '@/types/dto/create-shop-transaction-dto';
import { CreateTransferDto } from '@/types/dto/create-transfer-dto';
import { TransferFromMainDto } from '@/types/dto/transfer-from-main-dto';
import { Balance, FullTransaction, StarBankAccount } from '@/types/starbank';
import { SuccessResponse } from '@/types';

export type Transfer = any; // Replace 'any' with the actual Transfer type

export const starbankService = {
  getAllAccounts: () => rotomGET<StarBankAccount[]>('/starbank/accounts'),
  createAccount: (data: CreateAccountDto) => rotomPOST<SuccessResponse>('/starbank/accounts', data),
  getAccounts: (uuid: string) => rotomGET<StarBankAccount[]>(`/starbank/accounts/${uuid}`),
  getBalance: (uuid: string) => rotomGET<Balance>(`/starbank/balance/${uuid}`),
  shop: (data: CreateShopTransactionDto) => rotomPOST<SuccessResponse>('/starbank/shop', data),
  trainerDefeat: (data: TrainerDefeatMoneyDto) => rotomPOST<SuccessResponse>('/starbank/trainerdefeat', data),
  getTransactions: (account: number, limit?: number) => rotomGET<FullTransaction[]>(`/starbank/transactions/${account}${limit ? `?limit=${limit}` : ''}`),
  transfer: (data: CreateTransferDto) => rotomPOST<SuccessResponse>('/starbank/transfer', data),
  transferFromMain: (data: TransferFromMainDto) => rotomPOST<SuccessResponse>('/starbank/transfer/from-main', data),
  getTransfers: (account: number) => rotomGET<Transfer[]>(`/starbank/transfers/${account}`),
};