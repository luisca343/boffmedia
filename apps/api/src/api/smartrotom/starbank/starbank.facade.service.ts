import { ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { StarbankAccountService } from './services/starbank-account.service';
import { StarbankTransactionService } from './services/starbank-transaction.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction.dto';
import { TransferFromMainDto } from './dto/transfer-from-main.dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money.dto';
import { StarBankAccount } from './entities/starbank-account.entity';
import { StarBankTransaction } from './entities/starbank-transaction.entity';
import { AccountType } from './enums/account-type.enum';
import { ActorContext } from '@api/_utils/auth/actor';
import { Logger } from 'nestjs-pino';

@Injectable()
export class StarbankFacadeService {
  constructor(
    private readonly logger: Logger,

    private readonly accountService: StarbankAccountService,
    private readonly transactionService: StarbankTransactionService,
    private readonly wingullFacadeService: WingullFacadeService,
  ) {}

  // ==================== ACCOUNT OPERATIONS ====================

  async createAccount(
    uuid: string,
    name: string,
    image?: string,
  ): Promise<StarBankAccount> {
    if (!name || name.length === 0) {
      return await this.createMainAccount(uuid, name);
    }

    const createAccountDto: CreateAccountDto = {
      uuid,
      name,
      type: AccountType.SECONDARY,
      image,
    };

    return await this.accountService.createAccount(createAccountDto);
  }

  async createMainAccount(
    uuid: string,
    username: string,
  ): Promise<StarBankAccount> {
    return await this.accountService.createMainAccount(uuid, username);
  }

  async updateAccount(
    accountId: number,
    details: { name?: string; image?: string },
    actor: { uuid?: string; isAdmin: boolean } | null,
  ): Promise<StarBankAccount> {
    return await this.accountService.updateAccount(accountId, details, actor);
  }

  async getAllAccounts(): Promise<StarBankAccount[]> {
    return await this.accountService.getAllAccounts();
  }

  async getAccounts(uuid: string): Promise<StarBankAccount[]> {
    return await this.accountService.getUserAccounts(uuid);
  }

  async getMainAccount(
    uuid: string,
  ): Promise<{ id: number; balance: number } | null> {
    return await this.accountService.getUserMainAccount(uuid);
  }

  async getBalance(uuid: string): Promise<{ balance: number }> {
    return await this.accountService.getUserBalance(uuid);
  }

  async getAccountInfo(accountId: number): Promise<StarBankAccount | null> {
    return await this.accountService.getAccountInfo(accountId);
  }

  // ==================== TRANSACTION OPERATIONS ====================

  async transfer(
    from: number,
    to: number,
    amount: number,
    concept: string,
    actor?: ActorContext,
    idempotencyKey?: string,
  ): Promise<void> {
    const transferDto: CreateTransferDto = {
      from,
      to,
      amount,
      concept,
    };

    await this.transactionService.transfer(transferDto, actor, idempotencyKey);

    // Update balance in game after successful transfer (non-blocking)
    try {
      const fromAccount = await this.getAccountInfo(from);
      const toAccount = await this.getAccountInfo(to);

      const accounts = [fromAccount, toAccount].filter(
        (acc) => acc && acc.type === AccountType.MAIN,
      );

      for (const account of accounts) {
        if (account && account.uuid) {
          await this.updateBalance({
            balance: account.balance,
            type: account.type,
            uuid: account.uuid,
          });
        }
      }
    } catch (error: any) {
      this.logger.warn(
        'Failed to update balance in game after transfer, continuing anyway:',
        error.message,
      );
    }
  }

  async transferFromMain(
    uuid: string,
    to: number,
    amount: number,
    concept: string,
    actor?: ActorContext,
  ): Promise<void> {
    const transferDto: TransferFromMainDto = {
      uuid,
      to,
      amount,
      concept,
    };

    await this.transactionService.transferFromMain(transferDto, actor);

    // Mirror the new balance to the game (non-blocking); both sides, since the receiver
    // can be another player's main account.
    try {
      const mainAccount = await this.getMainAccount(uuid);
      if (mainAccount) {
        await this.updateBalance({
          balance: mainAccount.balance,
          type: AccountType.MAIN,
          uuid,
        });
      }
      const toAccount = await this.getAccountInfo(to);
      if (toAccount && toAccount.type === AccountType.MAIN && toAccount.uuid) {
        await this.updateBalance({
          balance: toAccount.balance,
          type: toAccount.type,
          uuid: toAccount.uuid,
        });
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to update balance in game for user ${uuid}, continuing anyway:`,
        error.message,
      );
    }
  }

  async transferFromSystem(
    accountId: number,
    amount: number,
    concept: string,
  ): Promise<void> {
    await this.transactionService.transferFromSystem(
      accountId,
      amount,
      concept,
    );

    // Update balance in game after successful transfer (non-blocking)
    try {
      const account = await this.getAccountInfo(accountId);
      if (account && account.type === AccountType.MAIN && account.uuid) {
        await this.updateBalance({
          balance: account.balance,
          type: account.type,
          uuid: account.uuid,
        });
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to update balance in game for account ${accountId}, continuing anyway:`,
        error.message,
      );
    }
  }

  async shop(shopData: CreateShopTransactionDto): Promise<void> {
    await this.transactionService.processShopTransaction(shopData);

    // Update balance in game after successful transaction (non-blocking)
    try {
      const mainAccount = await this.getMainAccount(shopData.uuid);
      if (mainAccount) {
        await this.updateBalance({
          balance: mainAccount.balance,
          type: AccountType.MAIN,
          uuid: shopData.uuid,
        });
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to update balance in game after shop transaction for user ${shopData.uuid}, continuing anyway:`,
        error.message,
      );
    }
  }

  async setBalance(
    uuid: string,
    balance: number,
    concept: string,
  ): Promise<{ balance: number; delta: number }> {
    const result = await this.transactionService.setBalance(
      uuid,
      balance,
      concept,
    );

    // Mirror the new balance to the game (non-blocking); a no-op push when the values already agree.
    try {
      const mainAccount = await this.getMainAccount(uuid);
      if (mainAccount) {
        await this.updateBalance({
          balance: mainAccount.balance,
          type: AccountType.MAIN,
          uuid,
        });
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to update balance in game after set for user ${uuid}, continuing anyway:`,
        error.message,
      );
    }

    return result;
  }

  async trainerDefeat(amount: number, uuid: string): Promise<void> {
    const trainerDto: TrainerDefeatMoneyDto = {
      uuid,
      money: amount,
    };

    let currentGameBalance: number;
    try {
      currentGameBalance = await this.wingullFacadeService.getCurrentBalance(
        uuid,
        amount,
      );
    } catch (error: any) {
      // Game economy server unreachable/erroring: fall back to the player's
      // stored main-account balance plus the reward, mirroring what the game
      // would report post-credit, so the reward still lands (diff === amount)
      // instead of 500ing.
      const mainAccount = await this.getMainAccount(uuid);
      if (!mainAccount) {
        throw error;
      }
      this.logger.warn(
        `Game balance lookup failed for ${uuid}, falling back to stored main-account balance + reward: ${error.message}`,
      );
      currentGameBalance = mainAccount.balance + amount;
    }

    await this.transactionService.processTrainerDefeat(
      trainerDto,
      currentGameBalance,
    );
  }

  // ==================== TRANSACTION HISTORY ====================

  /**
   * The caller must own the account they are asking about.
   *
   * These two per-ACCOUNT reads take a numeric id, not a uuid, so the ownership
   * question cannot be answered by scoping the query the way the per-uuid
   * routes do -- somebody has to look up who the account belongs to. The check
   * lives HERE rather than in the controller so a second caller cannot reach
   * the history without it.
   *
   * Until this existed the two routes were reachable by any signed-in player
   * with any account id, and before the class-level `@Public()` came off this
   * controller they were reachable with no credential at all: a numeric id is
   * the easiest thing in the world to enumerate, and what came back was another
   * player's transaction history.
   */
  private async assertOwnsAccount(
    accountId: number,
    callerUuid: string,
  ): Promise<void> {
    const owned = await this.accountService.getUserAccounts(callerUuid);
    if (!owned.some((a) => a.id === accountId)) {
      throw new ForbiddenException('That account does not belong to you.');
    }
  }

  async getTransactions(
    account: number,
    limit: number = 50,
    callerUuid?: string,
  ): Promise<StarBankTransaction[]> {
    // Optional in the signature, required in practice: the parameter is new and
    // making it mandatory would be a compile error in every existing caller,
    // which is the change most likely to be "fixed" by passing undefined. A
    // missing caller is refused instead.
    if (!callerUuid) {
      throw new ForbiddenException('A session is required to read an account.');
    }
    await this.assertOwnsAccount(account, callerUuid);
    return await this.transactionService.getAccountTransactions(account, limit);
  }

  async getTransactionsByUUID(
    uuid: string,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionService.getUserTransactions(uuid, limit);
  }

  async getTransfers(
    account: number,
    callerUuid?: string,
  ): Promise<StarBankTransaction[]> {
    if (!callerUuid) {
      throw new ForbiddenException('A session is required to read an account.');
    }
    await this.assertOwnsAccount(account, callerUuid);
    return await this.transactionService.getAccountTransfers(account, 10);
  }

  async getTransfersByUUID(uuid: string): Promise<StarBankTransaction[]> {
    return await this.transactionService.getUserTransfers(uuid, 10);
  }

  // ==================== BALANCE MANAGEMENT ====================

  private async updateBalance(account: {
    balance: number;
    type: AccountType | string;
    uuid: string;
  }): Promise<void> {
    try {
      await this.wingullFacadeService.updateBalance(account);
    } catch (error: any) {
      this.logger.error('Error updating balance in game:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }
}
