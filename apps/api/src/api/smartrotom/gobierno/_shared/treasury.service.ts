import { Injectable } from '@nestjs/common';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';
import { TREASURY_ACCOUNT } from '../../starbank/house-accounts';
import { StarbankHouseAccountService } from '../../starbank/services/starbank-house-account.service';

// The state's money. Every civic movement is a real StarBank transaction against the treasury
// account, never a bookkeeping row — that is what keeps balances and the ledger consistent with
// the bank. The mechanics live in StarbankHouseAccountService; what is here is the vocabulary
// gobierno thinks in.
@Injectable()
export class TreasuryService {
  constructor(private readonly houseAccounts: StarbankHouseAccountService) {}

  /** Resolves the single GOVERNMENT account. Seeded by migration 0040. */
  async getTreasuryAccountId(): Promise<number> {
    return this.houseAccounts.resolveAccountId(TREASURY_ACCOUNT);
  }

  async getBalance(): Promise<number> {
    return this.houseAccounts.getBalance(TREASURY_ACCOUNT);
  }

  /** Pays money FROM a player's main account INTO the treasury. Returns the ledger tx id. */
  async credit(
    fromUuid: string,
    amount: number,
    type: TransactionType,
    reason: string,
  ): Promise<number> {
    return this.houseAccounts.credit(
      TREASURY_ACCOUNT,
      fromUuid,
      amount,
      type,
      reason,
    );
  }

  /** Pays money FROM the treasury TO a player's main account. Returns the ledger tx id. */
  async debit(
    toUuid: string,
    amount: number,
    type: TransactionType,
    reason: string,
  ): Promise<number> {
    return this.houseAccounts.debit(
      TREASURY_ACCOUNT,
      toUuid,
      amount,
      type,
      reason,
    );
  }
}
