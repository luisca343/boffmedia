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
import { IStarbankAccountRepository } from '../repositories/interfaces/starbank-account.repository';
import { IStarbankTransactionRepository } from '../repositories/interfaces/starbank-transaction.repository';
import { AccountType } from '../enums/account-type.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { HouseAccount } from '../house-accounts';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';

/**
 * Moving money into and out of the ownerless accounts (`house-accounts.ts`).
 *
 * Every movement is a real StarBank transaction, never a bookkeeping row — which is what makes
 * a refund an actual refund, and what keeps balances and the ledger consistent with the bank.
 * The domain services (treasury, Wigglypop escrow) wrap this with their own vocabulary; this
 * class deliberately has none of its own.
 */
@Injectable()
export class StarbankHouseAccountService {
  private readonly resolved = new Map<string, number>();

  constructor(
    private readonly logger: Logger,
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
    private readonly wingullFacadeService: WingullFacadeService,
  ) {}

  /**
   * The account's id. `pnpm run seed:house-accounts` inserts every house account, so this is a
   * lookup and not a create-if-missing: a missing row means that seed has not run, and failing loudly
   * beats silently minting a second treasury.
   */
  async resolveAccountId(account: HouseAccount): Promise<number> {
    const key = `${account.type}/${account.name}`;
    const cached = this.resolved.get(key);
    if (cached) return cached;

    let existing = await this.accountRepository.findHouseAccount(
      account.type,
      account.name,
    );
    // Singleton types are identified by type alone, so an account seeded under an older name
    // is still the right one — matching on the name too would mint a duplicate treasury.
    if (!existing && account.type !== AccountType.SERVICE) {
      existing =
        (await this.accountRepository.findByType(account.type))[0] ?? null;
    }
    if (!existing) {
      throw new NotFoundException(
        `House account "${account.name}" (${account.type}) does not exist. ` +
          'Run `pnpm run seed:house-accounts`.',
      );
    }
    this.resolved.set(key, existing.id);
    return existing.id;
  }

  async getBalance(account: HouseAccount): Promise<number> {
    const id = await this.resolveAccountId(account);
    return (await this.accountRepository.findById(id))?.balance ?? 0;
  }

  /** Player → house account. */
  async credit(
    account: HouseAccount,
    fromUuid: string,
    amount: number,
    type: TransactionType,
    reason: string,
  ): Promise<number> {
    const to = await this.resolveAccountId(account);
    return this.move(
      await this.mainAccountId(fromUuid),
      to,
      amount,
      type,
      reason,
      [fromUuid],
    );
  }

  /** House account → player. */
  async debit(
    account: HouseAccount,
    toUuid: string,
    amount: number,
    type: TransactionType,
    reason: string,
  ): Promise<number> {
    const from = await this.resolveAccountId(account);
    return this.move(
      from,
      await this.mainAccountId(toUuid),
      amount,
      type,
      reason,
      [toUuid],
    );
  }

  /**
   * The raw ledger write. `mirrorTo` is the uuids whose in-game counter should be refreshed —
   * a house account has no player behind it, so it is never in that list.
   */
  private async move(
    from: number,
    to: number,
    amount: number,
    type: TransactionType,
    reason: string,
    mirrorTo: string[],
  ): Promise<number> {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const result = await this.transactionRepository.create({
      from,
      to,
      amount,
      reason,
      type,
    });

    if (!result.success || !result.transactionId) {
      // The most common cause is the payer simply not having the money — StarBank refuses the
      // transfer rather than letting an account go negative.
      throw new BadRequestException(
        result.message || 'The StarBank transfer was refused',
      );
    }

    for (const uuid of mirrorTo) await this.pushGameBalance(uuid);
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
