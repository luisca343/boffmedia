import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Logger } from 'nestjs-pino';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { starBankAccounts } from '@/_db/schema/SmartRotomStarBank';
import { IStarbankAccountRepository } from '../../starbank/repositories/interfaces/starbank-account.repository';
import { IStarbankTransactionRepository } from '../../starbank/repositories/interfaces/starbank-transaction.repository';
import { AccountType } from '../../starbank/enums/account-type.enum';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';

const ESCROW_NAME = 'Wigglypop Escrow';

// The market's single escrow account. A buyer's money sits here between "paid" and
// "delivered", so its balance is money in flight plus whatever fee the house has kept.
//
// Every movement is a REAL StarBank transaction, never a bookkeeping row — which is what makes
// a refund an actual refund. Reuses the StarBank account/transaction repositories directly
// (fresh instances, same DB), exactly as gobierno's TreasuryService does.
@Injectable()
export class WigglypopEscrowService {
  private escrowAccountId: number | null = null;

  constructor(
    private readonly logger: Logger,
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
  ) {}

  /**
   * Resolves the single MARKET account, lazily seeding it once. Bypasses
   * StarbankAccountRepository.create(), which always links a new account to a player uuid in
   * rotom_bank_users_accounts — the escrow has no owner.
   */
  async getEscrowAccountId(): Promise<number> {
    if (this.escrowAccountId) return this.escrowAccountId;

    const existing = await this.accountRepository.findByType(AccountType.MARKET);
    if (existing.length > 0) {
      this.escrowAccountId = existing[0].id;
      return this.escrowAccountId;
    }

    const result = await this.db
      .insert(starBankAccounts)
      .values({ name: ESCROW_NAME, balance: 0, type: AccountType.MARKET })
      .execute();
    this.escrowAccountId = result[0].insertId;
    this.logger.log(
      `Seeded Wigglypop escrow account #${this.escrowAccountId} (${ESCROW_NAME})`,
    );
    return this.escrowAccountId;
  }

  async getBalance(): Promise<number> {
    const id = await this.getEscrowAccountId();
    const account = await this.accountRepository.findById(id);
    return account?.balance ?? 0;
  }

  /** Buyer → escrow. This is the leg that actually takes the buyer's money. */
  async hold(
    buyerUuid: string,
    amount: number,
    reason: string,
  ): Promise<number> {
    return this.move(buyerUuid, null, amount, TransactionType.MERCADO, reason);
  }

  /** Escrow → seller. The payout, at confirmation. */
  async release(
    sellerUuid: string,
    amount: number,
    reason: string,
  ): Promise<number> {
    return this.move(null, sellerUuid, amount, TransactionType.VENTA_P2P, reason);
  }

  /** Escrow → buyer. The refund, on cancel or on a rolled-back atomic order. */
  async refund(
    buyerUuid: string,
    amount: number,
    reason: string,
  ): Promise<number> {
    return this.move(null, buyerUuid, amount, TransactionType.MERCADO, reason);
  }

  private async move(
    fromUuid: string | null,
    toUuid: string | null,
    amount: number,
    type: TransactionType,
    reason: string,
  ): Promise<number> {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const escrowId = await this.getEscrowAccountId();
    const from = fromUuid ? await this.mainAccountId(fromUuid) : escrowId;
    const to = toUuid ? await this.mainAccountId(toUuid) : escrowId;

    const result = await this.transactionRepository.create({
      from,
      to,
      amount,
      reason,
      type,
    });

    if (!result.success || !result.transactionId) {
      // The most common cause is the buyer simply not having the money — StarBank refuses the
      // transfer rather than letting an account go negative.
      throw new BadRequestException(
        result.message || 'The StarBank transfer was refused',
      );
    }
    return result.transactionId;
  }

  private async mainAccountId(uuid: string): Promise<number> {
    const account = await this.accountRepository.findUserMainAccount(uuid);
    if (!account) {
      throw new NotFoundException(
        `Player ${uuid} has no main StarBank account`,
      );
    }
    return account.id;
  }
}
