import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ActorContext } from '@api/_utils/auth/actor';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { TransactionType } from '../enums/transaction-type.enum';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { CreateShopTransactionDto } from '../dto/create-shop-transaction.dto';
import { TransferFromMainDto } from '../dto/transfer-from-main.dto';
import { TrainerDefeatMoneyDto } from '../dto/trainer-defeat-money.dto';
import { StarBankTransaction } from '../entities/starbank-transaction.entity';
import { IStarbankAccountRepository } from '../repositories/interfaces/starbank-account.repository';
import { IStarbankTransactionRepository } from '../repositories/interfaces/starbank-transaction.repository';
import { Logger } from 'nestjs-pino';
import { StarbankHouseAccountService } from './starbank-house-account.service';
import { SYSTEM_ACCOUNT } from '../house-accounts';
import { ApiErrorCode } from '@/common/errors/error-codes.generated';

@Injectable()
export class StarbankTransactionService {
  constructor(
    private readonly logger: Logger,

    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
    @Inject(STARBANK_TRANSACTION_REPOSITORY_TOKEN)
    private readonly transactionRepository: IStarbankTransactionRepository,
    private readonly houseAccounts: StarbankHouseAccountService,
  ) {}

  /**
   * The SYSTEM account's id — the mint/burn counterparty every flow below settles against.
   *
   * These four flows used to pass a literal `0` here, from before the house accounts were
   * real rows. `0` is not an account: ids are AUTO_INCREMENT so none is ever 0, and
   * `from_account_id` is an FK, so every one of them failed at the lookup with
   * "Source account not found" rather than minting anything. Resolution is by type, which is
   * also what makes a rename of the account harmless.
   */
  private systemAccountId(): Promise<number> {
    return this.houseAccounts.resolveAccountId(SYSTEM_ACCOUNT);
  }

  /**
   * A user (non-server actor with a known mcUuid) may only move money out of an
   * account they own. Skipped for the trusted game server, and skipped on the
   * transitional tripwire path where no user identity is available yet.
   */
  private async assertOwnsAccount(
    accountId: number,
    actor?: ActorContext,
  ): Promise<void> {
    if (!actor || actor.serverAuthed || !actor.mcUuid) return;
    const owned = await this.accountRepository.findByUuid(actor.mcUuid);
    if (!owned.some((account) => account.id === accountId)) {
      throw new ForbiddenException({
        message: 'Actor does not own the source account',
        code: ApiErrorCode.BANK_ACCOUNT_NOT_OWNED,
        userMessage: 'No puedes transferir desde una cuenta que no es tuya.',
      });
    }
  }

  async transfer(
    transferDto: CreateTransferDto,
    actor?: ActorContext,
    idempotencyKey?: string,
  ): Promise<void> {
    await this.assertOwnsAccount(transferDto.from, actor);

    // Validate transfer data
    if (transferDto.amount <= 0) {
      throw new BadRequestException({
        message: 'Transfer amount must be positive',
        code: ApiErrorCode.BANK_AMOUNT_NOT_POSITIVE,
        userMessage: 'El importe debe ser mayor que cero.',
      });
    }
    if (transferDto.from === transferDto.to) {
      throw new BadRequestException({
        message: 'Source and destination accounts must be different',
        code: ApiErrorCode.BANK_SAME_ACCOUNT,
        userMessage: 'No puedes transferir a la misma cuenta.',
      });
    }

    // Validate accounts exist
    const fromAccount = await this.accountRepository.findById(transferDto.from);
    const toAccount = await this.accountRepository.findById(transferDto.to);

    if (!fromAccount) {
      throw new NotFoundException({
        message: 'Source account not found',
        code: ApiErrorCode.BANK_SOURCE_ACCOUNT_NOT_FOUND,
        userMessage: 'La cuenta de origen no existe.',
      });
    }
    if (!toAccount) {
      throw new NotFoundException({
        message: 'Destination account not found',
        code: ApiErrorCode.BANK_TARGET_ACCOUNT_NOT_FOUND,
        userMessage: 'La cuenta de destino no existe.',
      });
    }

    // Check sufficient balance
    if (fromAccount.balance < transferDto.amount) {
      throw new ConflictException({
        message: 'Insufficient balance',
        code: ApiErrorCode.BANK_INSUFFICIENT_FUNDS,
        userMessage: 'Saldo insuficiente.',
      });
    }

    const transactionData = {
      from: transferDto.from,
      to: transferDto.to,
      amount: transferDto.amount,
      reason: transferDto.concept,
      type: TransactionType.TRANSFERENCIA,
      idempotencyKey,
    };

    const result = await this.transactionRepository.create(transactionData);

    if (!result.success) {
      // The repository re-checks under a row lock (authoritative against races);
      // surface its business message rather than a generic 500.
      throw new ConflictException({
        message: result.message || 'Transfer failed',
        code: ApiErrorCode.BANK_TRANSFER_FAILED,
        userMessage: 'No se pudo completar la transferencia.',
      });
    }
  }

  async transferFromMain(
    transferDto: TransferFromMainDto,
    actor?: ActorContext,
  ): Promise<void> {
    // A user may only spend from their own main account.
    if (actor && !actor.serverAuthed && actor.mcUuid) {
      if (actor.mcUuid !== transferDto.uuid) {
        throw new ForbiddenException({
          message: 'Actor does not own the main account',
          code: ApiErrorCode.BANK_ACCOUNT_NOT_OWNED,
          userMessage: 'No puedes transferir desde una cuenta que no es tuya.',
        });
      }
    }

    const mainAccount = await this.accountRepository.findUserMainAccount(
      transferDto.uuid,
    );
    if (!mainAccount) {
      throw new NotFoundException('Main account not found');
    }

    const createTransferDto: CreateTransferDto = {
      from: mainAccount.id,
      to: transferDto.to,
      amount: transferDto.amount,
      concept: transferDto.concept,
    };

    return await this.transfer(createTransferDto, actor);
  }

  async transferFromSystem(
    accountId: number,
    amount: number,
    concept: string,
  ): Promise<void> {
    // Validate transfer data
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }

    // Validate account exists
    const toAccount = await this.accountRepository.findById(accountId);
    if (!toAccount) {
      throw new NotFoundException('Destination account not found');
    }

    const transactionData = {
      from: await this.systemAccountId(),
      to: accountId,
      amount: amount,
      reason: concept,
      type: TransactionType.TRANSFERENCIA,
    };

    const result = await this.transactionRepository.create(transactionData);

    if (!result.success) {
      throw new ConflictException(result.message || 'System transfer failed');
    }
  }

  /**
   * Set a user's main-account balance to an absolute target, ledgering the delta as an
   * AJUSTE. Server-only (the mod's `setBalance`); atomicity lives in the repository.
   * Throws NotFound if there is no main account, Conflict if the locked write fails.
   */
  async setBalance(
    uuid: string,
    balance: number,
    concept: string,
  ): Promise<{ balance: number; delta: number }> {
    if (balance < 0) {
      throw new BadRequestException({
        message: 'Target balance must be non-negative',
        code: ApiErrorCode.BANK_NEGATIVE_BALANCE,
        userMessage: 'El saldo no puede ser negativo.',
      });
    }

    const mainAccount = await this.accountRepository.findUserMainAccount(uuid);
    if (!mainAccount) {
      throw new NotFoundException('Main account not found');
    }

    const result = await this.transactionRepository.setBalance(
      mainAccount.id,
      balance,
      concept,
    );
    if (!result.success) {
      throw new ConflictException({
        message: result.message || 'Set balance failed',
        code: ApiErrorCode.BANK_BALANCE_ADJUST_FAILED,
        userMessage: 'No se pudo ajustar el saldo.',
      });
    }

    return { balance: result.newBalance ?? balance, delta: result.delta ?? 0 };
  }

  async processShopTransaction(
    shopDto: CreateShopTransactionDto,
  ): Promise<void> {
    const mainAccount = await this.accountRepository.findUserMainAccount(
      shopDto.uuid,
    );
    if (!mainAccount) {
      throw new NotFoundException('Main account not found');
    }

    const total = shopDto.unitPrice * shopDto.count;

    if (shopDto.operation === TransactionType.COMPRA) {
      // Check sufficient balance for purchase
      if (mainAccount.balance < total) {
        throw new ConflictException({
          message: 'Insufficient balance for purchase',
          code: ApiErrorCode.BANK_INSUFFICIENT_FUNDS_PURCHASE,
          userMessage: 'Saldo insuficiente para la compra.',
        });
      }

      this.logger.log(
        `Compra de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName} por ${total}`,
      );

      const transactionData = {
        from: mainAccount.id,
        to: await this.systemAccountId(),
        amount: total,
        reason: `Compra de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName}`,
        type: TransactionType.COMPRA,
      };

      const result = await this.transactionRepository.create(transactionData);
      if (!result.success) {
        throw new ConflictException(result.message || 'Purchase failed');
      }
    } else if (shopDto.operation === TransactionType.VENTA) {
      this.logger.log(
        `Venta de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName} por ${total}`,
      );

      const transactionData = {
        from: await this.systemAccountId(),
        to: mainAccount.id,
        amount: total,
        reason: `Venta de ${shopDto.count} ${shopDto.itemName} a ${shopDto.npcName}`,
        type: TransactionType.VENTA,
      };

      const result = await this.transactionRepository.create(transactionData);
      if (!result.success) {
        throw new ConflictException(result.message || 'Sale failed');
      }
    } else {
      // The DTO already restricts `operation` to COMPRA|VENTA; this guards the
      // service independently so an unknown value can never fall through to a
      // payout — reject it instead of guessing the money direction.
      throw new BadRequestException(
        `Unknown shop operation: ${shopDto.operation}`,
      );
    }
  }

  async processTrainerDefeat(
    trainerDto: TrainerDefeatMoneyDto,
    currentGameBalance: number,
  ): Promise<void> {
    const mainAccount = await this.accountRepository.findUserMainAccount(
      trainerDto.uuid,
    );
    if (!mainAccount) {
      throw new NotFoundException('Main account not found');
    }

    const prevBalance = mainAccount.balance;
    const diff = currentGameBalance - prevBalance;

    if (diff === 0) {
      return; // No balance difference, no transaction needed
    }

    const transactionData = {
      from: await this.systemAccountId(),
      to: mainAccount.id,
      amount: diff,
      reason: 'Derrota de entrenador',
      type: TransactionType.DERROTA_ENTRENADOR,
    };

    const result = await this.transactionRepository.create(transactionData);
    if (!result.success) {
      throw new ConflictException(
        result.message || 'Trainer defeat processing failed',
      );
    }
  }

  async getAccountTransactions(
    accountId: number,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findByAccountId(accountId, limit);
  }

  async getUserTransactions(
    uuid: string,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findByUserUuid(uuid, limit);
  }

  async getAccountTransfers(
    accountId: number,
    limit: number = 10,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findTransfersByAccount(
      accountId,
      limit,
    );
  }

  async getUserTransfers(
    uuid: string,
    limit: number = 10,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findTransfersByUser(uuid, limit);
  }

  async getTransactionsByType(
    type: TransactionType,
    limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.transactionRepository.findByType(type, limit);
  }
}
