import { Injectable } from '@nestjs/common';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';
import { MARKET_ACCOUNT } from '../../starbank/house-accounts';
import { StarbankHouseAccountService } from '../../starbank/services/starbank-house-account.service';

// A buyer's money sits here between "paid" and "delivered", so this balance is money in
// flight plus the house's kept fees. Every movement is a real StarBank transaction, never a
// bookkeeping row — which is what makes a refund an actual refund. The mechanics live in
// StarbankHouseAccountService; what is here is the vocabulary the market thinks in.
@Injectable()
export class WigglypopEscrowService {
  constructor(private readonly houseAccounts: StarbankHouseAccountService) {}

  /** Resolves the single MARKET account. Seeded by migration 0040. */
  async getEscrowAccountId(): Promise<number> {
    return this.houseAccounts.resolveAccountId(MARKET_ACCOUNT);
  }

  async getBalance(): Promise<number> {
    return this.houseAccounts.getBalance(MARKET_ACCOUNT);
  }

  /** Buyer → escrow. This is the leg that actually takes the buyer's money. */
  async hold(
    buyerUuid: string,
    amount: number,
    reason: string,
  ): Promise<number> {
    return this.houseAccounts.credit(
      MARKET_ACCOUNT,
      buyerUuid,
      amount,
      TransactionType.MERCADO,
      reason,
    );
  }

  /** Escrow → seller. The payout, at confirmation. */
  async release(
    sellerUuid: string,
    amount: number,
    reason: string,
  ): Promise<number> {
    return this.houseAccounts.debit(
      MARKET_ACCOUNT,
      sellerUuid,
      amount,
      TransactionType.VENTA_P2P,
      reason,
    );
  }

  /** Escrow → buyer. The refund, on cancel or on a rolled-back atomic order. */
  async refund(
    buyerUuid: string,
    amount: number,
    reason: string,
  ): Promise<number> {
    return this.houseAccounts.debit(
      MARKET_ACCOUNT,
      buyerUuid,
      amount,
      TransactionType.MERCADO,
      reason,
    );
  }
}
