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
  updateBalance(accountId: number, newBalance: number): Promise<boolean>;
  getUserBalance(uuid: string): Promise<number>;
  checkAccountExists(accountId: number): Promise<boolean>;
}
