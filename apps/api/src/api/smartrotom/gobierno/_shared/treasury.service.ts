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
import { TreasuryRepository } from './treasury.repository';
import { IStarbankAccountRepository } from '../../starbank/repositories/interfaces/starbank-account.repository';
import { IStarbankTransactionRepository } from '../../starbank/repositories/interfaces/starbank-transaction.repository';
import { AccountType } from '../../starbank/enums/account-type.enum';
import { TransactionType } from '../../starbank/enums/transaction-type.enum';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';

const TREASURY_NAME = 'Tesorería de Teras';

// Every civic movement is a real StarBank transaction against this account, never a
// bookkeeping row — that is what keeps balances and the ledger consistent with the bank.
@Injectable()
export class TreasuryService {
  private treasuryAccountId: number | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly treasuryRepository: TreasuryRepository,
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
    private readonly wingullFacadeService: WingullFacadeService,
  ) {}

  /** Resolves the single GOVERNMENT account, lazily seeding it once if `pnpm seed` hasn't run. */
  async getTreasuryAccountId(): Promise<number> {
    if (this.treasuryAccountId) return this.treasuryAccountId;

    const existing = await this.accountRepository.findByType(
      AccountType.GOVERNMENT,
    );
    if (existing.length > 0) {
      this.treasuryAccountId = existing[0].id;
      return this.treasuryAccountId;
    }

    this.treasuryAccountId = await this.treasuryRepository.createOwnerlessAccount(
      TREASURY_NAME,
      AccountType.GOVERNMENT,
    );
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
    await this.pushGameBalance(fromUuid);
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
    await this.pushGameBalance(toUuid);
    return result.transactionId;
  }

  // Mirrors the player's new balance to the game server so the in-game counter updates without a
  // relogin. The transaction is already committed, so a push failure only logs.
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
}
