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

const TREASURY_NAME = 'Tesorería de Teras';

// The single civic bank account. Fines, taxes, auction settlements and bounty payouts are
// real StarBank transactions against this account — never bookkeeping rows. Reuses the
// StarBank account/transaction repositories directly (fresh instances, same DB) so balances
// and the ledger stay consistent with the rest of the bank.
@Injectable()
export class TreasuryService {
  private treasuryAccountId: number | null = null;

  constructor(
    private readonly logger: Logger,
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
  ) {}

  /**
   * Resolves the single GOVERNMENT account, lazily seeding it once if the `pnpm seed` script
   * hasn't run yet. Bypasses `StarbankAccountRepository.create()`, which always links the new
   * account to a player uuid in `rotom_bank_users_accounts` — the treasury has no owner.
   */
  async getTreasuryAccountId(): Promise<number> {
    if (this.treasuryAccountId) return this.treasuryAccountId;

    const existing = await this.accountRepository.findByType(
      AccountType.GOVERNMENT,
    );
    if (existing.length > 0) {
      this.treasuryAccountId = existing[0].id;
      return this.treasuryAccountId;
    }

    const result = await this.db
      .insert(starBankAccounts)
      .values({ name: TREASURY_NAME, balance: 0, type: AccountType.GOVERNMENT })
      .execute();
    this.treasuryAccountId = result[0].insertId;
    this.logger.log(
      `Seeded treasury account #${this.treasuryAccountId} (${TREASURY_NAME})`,
    );
    return this.treasuryAccountId;
  }

  async getBalance(): Promise<number> {
    const id = await this.getTreasuryAccountId();
    const account = await this.accountRepository.findById(id);
    return account?.balance ?? 0;
  }

  /** Pays money FROM a player's main account INTO the treasury. Returns the ledger tx id. */
  async credit(
    fromUuid: string,
    amount: number,
    type: TransactionType,
    reason: string,
  ): Promise<number> {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const payer = await this.accountRepository.findUserMainAccount(fromUuid);
    if (!payer) {
      throw new NotFoundException(
        `Player ${fromUuid} has no main StarBank account`,
      );
    }

    const treasuryId = await this.getTreasuryAccountId();
    const result = await this.transactionRepository.create({
      from: payer.id,
      to: treasuryId,
      amount,
      reason,
      type,
    });

    if (!result.success || !result.transactionId) {
      throw new BadRequestException(
        result.message || 'Payment to the treasury failed',
      );
    }
    return result.transactionId;
  }

  /** Pays money FROM the treasury TO a player's main account. Returns the ledger tx id. */
  async debit(
    toUuid: string,
    amount: number,
    type: TransactionType,
    reason: string,
  ): Promise<number> {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const payee = await this.accountRepository.findUserMainAccount(toUuid);
    if (!payee) {
      throw new NotFoundException(
        `Player ${toUuid} has no main StarBank account`,
      );
    }

    const treasuryId = await this.getTreasuryAccountId();
    const result = await this.transactionRepository.create({
      from: treasuryId,
      to: payee.id,
      amount,
      reason,
      type,
    });

    if (!result.success || !result.transactionId) {
      throw new BadRequestException(
        result.message || 'Payment from the treasury failed',
      );
    }
    return result.transactionId;
  }
}
