import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';
import { StarBankAccount } from '../../entities/starbank-account.entity';
import { AccountType } from '../../enums/account-type.enum';

export interface CreateAccountData {
  uuid: string;
  name: string;
  type?: AccountType;
  initialBalance?: number;
  image?: string;
}

export interface IStarbankAccountRepository extends BaseRepository<
  StarBankAccount,
  CreateAccountData,
  Partial<CreateAccountData>
> {
  findByUuid(uuid: string): Promise<StarBankAccount[]>;
  findUserMainAccount(
    uuid: string,
  ): Promise<{ id: number; balance: number } | null>;
  findByType(type: AccountType): Promise<StarBankAccount[]>;
  findAccountOwnerUuid(accountId: number): Promise<string | null>;
  updateAccountDetails(
    accountId: number,
    details: { name?: string; image?: string },
  ): Promise<void>;
  // House accounts are resolved by (type, name): SERVICE has one row per app, so type
  // alone stops identifying a single account. See starbank/house-accounts.ts.
  findHouseAccount(
    type: AccountType,
    name: string,
  ): Promise<StarBankAccount | null>;
  createOwnerlessAccount(name: string, type: AccountType): Promise<number>;
  updateBalance(accountId: number, newBalance: number): Promise<boolean>;
  getUserBalance(uuid: string): Promise<number>;
  checkAccountExists(accountId: number): Promise<boolean>;
}
