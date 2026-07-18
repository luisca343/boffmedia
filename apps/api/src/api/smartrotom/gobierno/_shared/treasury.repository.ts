import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { starBankAccounts } from '@/_db/schema/SmartRotomStarBank';
import { AccountType } from '../../starbank/enums/account-type.enum';

@Injectable()
export class TreasuryRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // Not StarbankAccountRepository.create(): that always links the new account to a player uuid
  // in rotom_bank_users_accounts, and the treasury has no owner.
  async createOwnerlessAccount(
    name: string,
    type: AccountType,
  ): Promise<number> {
    const result = await this.db
      .insert(starBankAccounts)
      .values({ name, balance: 0, type })
      .execute();
    return result[0].insertId;
  }
}
