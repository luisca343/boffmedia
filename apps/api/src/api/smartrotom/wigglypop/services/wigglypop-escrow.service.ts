import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { WigglypopEscrowRepository } from '../repositories/wigglypop-escrow.repository';
import { IStarbankAccountRepository } from '../../starbank/repositories/interfaces/starbank-account.repository';
import { IStarbankTransactionRepository } from '../../starbank/repositories/interfaces/starbank-transaction.repository';
import { AccountType } from '../../starbank/enums/account-type.enum';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';

const ESCROW_NAME = 'Wigglypop Escrow';

// A buyer's money sits here between "paid" and "delivered", so this balance is money in
// flight plus the house's kept fees. Every movement is a real StarBank transaction, never a
// bookkeeping row — which is what makes a refund an actual refund.
@Injectable()
export class WigglypopEscrowService {
  private escrowAccountId: number | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly escrowRepository: WigglypopEscrowRepository,
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
    private readonly wingullFacadeService: WingullFacadeService,
  ) {}

  /** Resolves the single MARKET account, lazily seeding it once. */
  async getEscrowAccountId(): Promise<number> {
    if (this.escrowAccountId) return this.escrowAccountId;

    const existing = await this.accountRepository.findByType(
      AccountType.MARKET,
    );
    if (existing.length > 0) {
      this.escrowAccountId = existing[0].id;
      return this.escrowAccountId;
    }

    this.escrowAccountId = await this.escrowRepository.createOwnerlessAccount(
      ESCROW_NAME,
      AccountType.MARKET,
    );
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
    return this.move(
      null,
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
    if (fromUuid) await this.pushGameBalance(fromUuid);
    if (toUuid) await this.pushGameBalance(toUuid);
    return result.transactionId;
  }

  // Mirror the new balance to the game so the in-game counter updates without a relogin.
  // The transaction is already committed, so a push failure only logs.
  private async pushGameBalance(uuid: string): Promise<void> {
    try {
      const account = await this.accountRepository.findUserMainAccount(uuid);
      if (account) {
        await this.wingullFacadeService.updateBalance({
          balance: account.balance,
          type: AccountType.MAIN,
          uuid,
        });
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to update balance in game for ${uuid}, continuing anyway: ${error.message}`,
      );
    }
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
