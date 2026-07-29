import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IStarbankAccountRepository } from '../starbank/repositories/interfaces/starbank-account.repository';
import { StarbankHouseAccountService } from '../starbank/services/starbank-house-account.service';
import { TransactionType } from '../starbank/enums/transaction-type.enum';
import { TAXI_ACCOUNT } from '../starbank/house-accounts';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { AuditoriaService } from '../gobierno/_shared/auditoria.service';
import { TaxiStop } from '../wingull/entities/taxi-stop.entity';
import { TeleportOutcome } from '../wingull/entities/teleport-outcome.entity';
import { TaxiConfig, TripResult } from './entities/taxi.entity';
import {
  ARRIVAL_TOLERANCE_BLOCKS,
  MINIMUM_FARE,
  PRICE_PER_BLOCK,
  TRIP_CONCEPT_PREFIX,
  distanceBetween,
  priceFor,
} from './fare';

/**
 * Riding the taxi.
 *
 * **The player travels first and pays second.** The old flow transferred the fare from the
 * browser and then asked the mod to move the player, so every ordinary failure — logged out,
 * stop deleted, no safe arrival — left somebody charged and standing where they were, with no
 * refund path (StarBank has no reversal, only a compensating transfer).
 *
 * Charging afterwards removes the hole instead of compensating for it: a trip that did not
 * happen writes no ledger row at all, which is exactly what `_utils/trips.ts` needs, since a
 * trip IS its transfer and the passport is derived from those rows.
 *
 * The residual risk moved, it did not vanish: a teleport that succeeds and a charge that then
 * fails is a free ride. That window is one local DB write after every validation has already
 * passed, and it is logged as a debt rather than swallowed.
 */
@Injectable()
export class TaxiService {
  constructor(
    private readonly logger: Logger,
    private readonly wingull: WingullFacadeService,
    private readonly houseAccounts: StarbankHouseAccountService,
    private readonly auditoria: AuditoriaService,
    @Inject(STARBANK_ACCOUNT_REPOSITORY_TOKEN)
    private readonly accountRepository: IStarbankAccountRepository,
  ) {}

  async getConfig(): Promise<TaxiConfig> {
    return {
      minimumFare: MINIMUM_FARE,
      pricePerBlock: PRICE_PER_BLOCK,
      serviceAccountId: await this.houseAccounts.resolveAccountId(TAXI_ACCOUNT),
      tripConceptPrefix: TRIP_CONCEPT_PREFIX,
    };
  }

  async takeTrip(stopId: string, uuid: string): Promise<TripResult> {
    const stop = await this.findStop(stopId);

    // Priced from where the player actually is, read from the game server — not from a
    // position the browser reports. This is also the online check: an offline player has no
    // position, and the mod would refuse the teleport anyway.
    const origin = await this.wingull.getPlayerPosition(uuid);
    if (!origin?.online) {
      throw new UnprocessableEntityException(
        userError(
          ApiErrorCode.TAXI_PLAYER_OFFLINE,
          `Player ${uuid} is not online`,
        ),
      );
    }

    const distance = distanceBetween(origin, stop);
    const price = priceFor(distance);
    await this.assertCanAfford(uuid, price);

    const outcome = await this.wingull.teleportPlayer(stopId, uuid);
    const confirmedByPosition = outcome.ok
      ? false
      : await this.resolveOrThrow(outcome, uuid, stop);

    return {
      stopId,
      price,
      distance,
      confirmedByPosition,
      transactionId: await this.charge(uuid, stop, price),
    };
  }

  /**
   * Moves a player because an admin said so. **Not a trip.**
   *
   * No fare, so no ledger row — which is the point: `tripsFromTransactions` reconstructs the
   * travel history from transfers into the taxi account, and an admin moving somebody is not
   * something that belongs in their passport. It deliberately does not reuse `takeTrip`; a
   * zero-value trip would be a lie in the ledger.
   *
   * Being moved with no explanation is alarming, so the player is told in the same flow.
   */
  async adminTeleport(
    stopId: string,
    uuid: string,
    actorUuid: string,
    reason?: string,
  ): Promise<void> {
    const stop = await this.findStop(stopId);
    const outcome = await this.wingull.teleportPlayer(stopId, uuid);

    if (!outcome.ok) {
      // An offline player is an ordinary "can't, they're not here" here rather than a lost
      // fare, and `unresolved` needs no position check either: nothing was going to be charged.
      await this.rejectAdminTeleport(outcome);
    }

    await this.auditoria.log({
      actorUuid,
      action: 'teleport',
      target: reason
        ? `jugador ${uuid} → ${stopId} (${reason})`
        : `jugador ${uuid} → ${stopId}`,
      dep: 'administracion',
      source: 'actividad',
    });

    await this.notifyMoved(uuid, stopId, reason);
  }

  private async rejectAdminTeleport(
    outcome: Extract<TeleportOutcome, { ok: false }>,
  ): Promise<never> {
    switch (outcome.reason) {
      case 'offline':
        throw new UnprocessableEntityException(
          userError(ApiErrorCode.TAXI_PLAYER_OFFLINE, outcome.message),
        );
      case 'unknown_stop':
        throw new NotFoundException(
          userError(ApiErrorCode.TAXI_STOP_NOT_FOUND, outcome.message),
        );
      case 'unsafe_arrival':
        throw new ConflictException(
          userError(ApiErrorCode.TAXI_UNSAFE_ARRIVAL, outcome.message),
        );
      case 'in_dungeon_run':
        throw new ConflictException(
          userError(ApiErrorCode.TAXI_IN_DUNGEON_RUN, outcome.message),
        );
      default:
        throw new ServiceUnavailableException(
          userError(ApiErrorCode.TAXI_SERVER_BUSY, outcome.message),
        );
    }
  }

  // The whisper is courtesy, not correctness: the player has already been moved, so failing to
  // tell them must not fail the action an admin already carried out.
  private async notifyMoved(
    uuid: string,
    stopId: string,
    reason?: string,
  ): Promise<void> {
    const text = reason
      ? `Has sido trasladado a ${stopId} por un administrador: ${reason}`
      : `Has sido trasladado a ${stopId} por un administrador`;
    try {
      await this.wingull.sendMessage(uuid, text);
    } catch (error: any) {
      this.logger.warn(
        `Taxi: could not tell ${uuid} they were moved to '${stopId}': ${error.message}`,
      );
    }
  }

  /**
   * The mod refused, or never answered. Decides whether the player still travelled.
   *
   * Everything except `unresolved` means the mod changed nothing in-game — it validates the
   * stop, the player and the arrival before it moves anyone — so those all end the trip with
   * no charge. `unresolved` is the one case where the teleport may have happened anyway
   * (a busy server thread, a timeout, an unreachable host), and the only honest way to find
   * out is to look at where the player is now.
   *
   * @returns true when the trip is settled on a position read rather than the mod's word
   */
  private async resolveOrThrow(
    outcome: Extract<TeleportOutcome, { ok: false }>,
    uuid: string,
    stop: TaxiStop,
  ): Promise<boolean> {
    switch (outcome.reason) {
      case 'offline':
        throw new UnprocessableEntityException(
          userError(ApiErrorCode.TAXI_PLAYER_OFFLINE, outcome.message),
        );
      case 'unknown_stop':
        throw new NotFoundException(
          userError(ApiErrorCode.TAXI_STOP_NOT_FOUND, outcome.message),
        );
      case 'unsafe_arrival':
        throw new ConflictException(
          userError(ApiErrorCode.TAXI_UNSAFE_ARRIVAL, outcome.message),
        );
      case 'in_dungeon_run':
        throw new ConflictException(
          userError(ApiErrorCode.TAXI_IN_DUNGEON_RUN, outcome.message),
        );
      case 'unauthorized':
        // Not the player's fault, and not something they can act on — but it must be loud,
        // because every trip on the server is failing until somebody fixes the token.
        this.logger.error(
          `Taxi: the game server rejected our credentials (${outcome.message}). No trips can run.`,
        );
        throw new ServiceUnavailableException(
          userError(ApiErrorCode.TAXI_SERVER_BUSY, outcome.message),
        );
      case 'unresolved':
        break;
    }

    if (await this.isStandingAt(uuid, stop)) {
      this.logger.warn(
        `Taxi: teleport of ${uuid} to '${stop.id}' was unconfirmed (${outcome.status}) but they ` +
          'are standing at the stop; charging the fare.',
      );
      return true;
    }

    this.logger.warn(
      `Taxi: teleport of ${uuid} to '${stop.id}' was unconfirmed (${outcome.status}) and they are ` +
        'not at the stop; charging nothing.',
    );
    throw new ServiceUnavailableException(
      userError(ApiErrorCode.TAXI_SERVER_BUSY, outcome.message),
    );
  }

  // A position read that itself fails cannot prove an arrival, so it settles as "did not
  // travel" — the player keeps their money and can try again.
  private async isStandingAt(uuid: string, stop: TaxiStop): Promise<boolean> {
    try {
      const now = await this.wingull.getPlayerPosition(uuid);
      if (!now?.online) return false;
      return distanceBetween(now, stop) <= ARRIVAL_TOLERANCE_BLOCKS;
    } catch (error: any) {
      this.logger.warn(
        `Taxi: could not read back the position of ${uuid} to confirm the trip: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Takes the fare. The player has already arrived, so a failure here is a debt, not a refusal:
   * it is logged with everything needed to settle it by hand before the exception surfaces.
   */
  private async charge(
    uuid: string,
    stop: TaxiStop,
    price: number,
  ): Promise<number> {
    try {
      return await this.houseAccounts.credit(
        TAXI_ACCOUNT,
        uuid,
        price,
        TransactionType.COMPRA,
        `${TRIP_CONCEPT_PREFIX}${stop.id}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Taxi: ${uuid} travelled to '${stop.id}' but the ${price} fare could not be charged ` +
          `(${error.message}). This is an unpaid trip.`,
      );
      throw error;
    }
  }

  private async findStop(stopId: string): Promise<TaxiStop> {
    const stops = await this.wingull.getTaxiStops();
    const stop = stops?.find((candidate) => candidate.id === stopId);
    if (!stop) {
      throw new NotFoundException(
        userError(
          ApiErrorCode.TAXI_STOP_NOT_FOUND,
          `Unknown taxi stop '${stopId}'`,
        ),
      );
    }
    return stop;
  }

  // Checked up front so a player is not teleported into a trip they cannot pay for — the
  // ledger would refuse the transfer afterwards and the ride would be free.
  private async assertCanAfford(uuid: string, price: number): Promise<void> {
    const account = await this.accountRepository.findUserMainAccount(uuid);
    if (!account) {
      throw new NotFoundException(
        userError(
          ApiErrorCode.TAXI_INSUFFICIENT_FUNDS,
          `Player ${uuid} has no main StarBank account`,
        ),
      );
    }
    if ((account.balance ?? 0) < price) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.TAXI_INSUFFICIENT_FUNDS,
          `Fare is ${price}, balance is ${account.balance ?? 0}`,
        ),
      );
    }
  }
}
