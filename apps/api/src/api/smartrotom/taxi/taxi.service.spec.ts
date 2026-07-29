import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { TaxiService } from './taxi.service';
import { StarbankHouseAccountService } from '../starbank/services/starbank-house-account.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { AuditoriaService } from '../gobierno/_shared/auditoria.service';
import { STARBANK_ACCOUNT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { TAXI_ACCOUNT } from '../starbank/house-accounts';
import { TransactionType } from '../starbank/enums/transaction-type.enum';
import { MINIMUM_FARE, PRICE_PER_BLOCK } from './fare';

const UUID = 'player-uuid';
const STOP = {
  id: 'carretera',
  x: 400,
  y: 70,
  z: 0,
  world: 'minecraft:overworld',
};
// 300 blocks away on X, so the fare is deterministic: 100 + 300 * 0.5 = 250.
const ORIGIN = { online: true, x: 100, y: 64, z: 0, dimension: 'minecraft:overworld' };
const EXPECTED_FARE = MINIMUM_FARE + 300 * PRICE_PER_BLOCK;

describe('TaxiService', () => {
  let service: TaxiService;

  const wingull = {
    getTaxiStops: jest.fn(),
    getPlayerPosition: jest.fn(),
    teleportPlayer: jest.fn(),
    sendMessage: jest.fn(),
  };
  const auditoria = { log: jest.fn() };
  const houseAccounts = { credit: jest.fn(), resolveAccountId: jest.fn() };
  const accountRepository = { findUserMainAccount: jest.fn() };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    wingull.getTaxiStops.mockResolvedValue([STOP]);
    wingull.getPlayerPosition.mockResolvedValue(ORIGIN);
    wingull.teleportPlayer.mockResolvedValue({ ok: true });
    accountRepository.findUserMainAccount.mockResolvedValue({
      id: 5,
      balance: 10_000,
    });
    houseAccounts.credit.mockResolvedValue(1842);
    houseAccounts.resolveAccountId.mockResolvedValue(7);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxiService,
        { provide: Logger, useValue: logger },
        { provide: WingullFacadeService, useValue: wingull },
        { provide: StarbankHouseAccountService, useValue: houseAccounts },
        { provide: AuditoriaService, useValue: auditoria },
        {
          provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
          useValue: accountRepository,
        },
      ],
    }).compile();

    service = module.get(TaxiService);
  });

  describe('a trip that works', () => {
    it('teleports before it charges', async () => {
      const order: string[] = [];
      wingull.teleportPlayer.mockImplementation(async () => {
        order.push('teleport');
        return { ok: true };
      });
      houseAccounts.credit.mockImplementation(async () => {
        order.push('charge');
        return 1842;
      });

      await service.takeTrip(STOP.id, UUID);

      expect(order).toEqual(['teleport', 'charge']);
    });

    it('charges the server-computed fare into the taxi account', async () => {
      const result = await service.takeTrip(STOP.id, UUID);

      expect(houseAccounts.credit).toHaveBeenCalledWith(
        TAXI_ACCOUNT,
        UUID,
        EXPECTED_FARE,
        TransactionType.COMPRA,
        'Taxi a carretera',
      );
      expect(result).toMatchObject({
        stopId: STOP.id,
        price: EXPECTED_FARE,
        transactionId: 1842,
        confirmedByPosition: false,
      });
    });

    // The trip history is reconstructed from the concept, so the prefix is a wire contract.
    it("writes the concept the passport reads back ('Taxi a <stop>')", async () => {
      await service.takeTrip(STOP.id, UUID);

      expect(houseAccounts.credit).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        `Taxi a ${STOP.id}`,
      );
    });
  });

  describe('a trip that does not happen', () => {
    it.each([
      ['offline', UnprocessableEntityException],
      ['unknown_stop', NotFoundException],
      ['unsafe_arrival', ConflictException],
      ['in_dungeon_run', ConflictException],
      ['unauthorized', ServiceUnavailableException],
    ])('charges nothing when the mod answers %s', async (reason, expected) => {
      wingull.teleportPlayer.mockResolvedValue({
        ok: false,
        reason,
        status: 400,
        message: 'refused',
      });

      await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
        expected as any,
      );
      expect(houseAccounts.credit).not.toHaveBeenCalled();
    });

    it('never teleports a player who cannot afford the fare', async () => {
      accountRepository.findUserMainAccount.mockResolvedValue({
        id: 5,
        balance: EXPECTED_FARE - 1,
      });

      await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
        BadRequestException,
      );
      expect(wingull.teleportPlayer).not.toHaveBeenCalled();
    });

    it('refuses an offline player before asking the mod', async () => {
      wingull.getPlayerPosition.mockResolvedValue({ online: false });

      await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(wingull.teleportPlayer).not.toHaveBeenCalled();
    });

    it('refuses a stop the mod no longer serves', async () => {
      wingull.getTaxiStops.mockResolvedValue([]);

      await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
        NotFoundException,
      );
      expect(wingull.teleportPlayer).not.toHaveBeenCalled();
    });
  });

  // The one ambiguous answer: the mod may or may not have moved the player, so the only
  // honest way to settle the fare is to look at where they are now.
  describe('an unconfirmed teleport', () => {
    beforeEach(() => {
      wingull.teleportPlayer.mockResolvedValue({
        ok: false,
        reason: 'unresolved',
        status: 503,
        message: 'Server busy',
      });
    });

    it('charges when the player turns out to be standing at the stop', async () => {
      wingull.getPlayerPosition
        .mockResolvedValueOnce(ORIGIN)
        .mockResolvedValueOnce({ ...STOP, online: true, dimension: 'minecraft:overworld' });

      const result = await service.takeTrip(STOP.id, UUID);

      expect(result.confirmedByPosition).toBe(true);
      expect(houseAccounts.credit).toHaveBeenCalledWith(
        TAXI_ACCOUNT,
        UUID,
        EXPECTED_FARE,
        TransactionType.COMPRA,
        'Taxi a carretera',
      );
    });

    it('charges nothing when the player never moved', async () => {
      wingull.getPlayerPosition.mockResolvedValue(ORIGIN);

      await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(houseAccounts.credit).not.toHaveBeenCalled();
    });

    // A position read that fails cannot prove an arrival — the player keeps their money.
    it('charges nothing when the position cannot be read back', async () => {
      wingull.getPlayerPosition
        .mockResolvedValueOnce(ORIGIN)
        .mockRejectedValueOnce(new Error('server unreachable'));

      await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(houseAccounts.credit).not.toHaveBeenCalled();
    });

    it('charges nothing when the player has gone offline', async () => {
      wingull.getPlayerPosition
        .mockResolvedValueOnce(ORIGIN)
        .mockResolvedValueOnce({ online: false });

      await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(houseAccounts.credit).not.toHaveBeenCalled();
    });
  });

  // The residual risk of charging second: the player has already arrived, so this is an
  // unpaid trip and must be loud rather than silent.
  it('logs a debt when the fare cannot be taken after the player arrived', async () => {
    houseAccounts.credit.mockRejectedValue(new Error('ledger refused'));

    await expect(service.takeTrip(STOP.id, UUID)).rejects.toThrow(
      'ledger refused',
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('unpaid trip'),
    );
  });

  describe('adminTeleport', () => {
    const ADMIN = 'admin-uuid';

    // The whole reason it does not reuse takeTrip: a zero-value trip would be a lie in a ledger
    // the passport reads back as travel history.
    it('moves the player without touching the ledger', async () => {
      await service.adminTeleport(STOP.id, UUID, ADMIN);

      expect(wingull.teleportPlayer).toHaveBeenCalledWith(STOP.id, UUID);
      expect(houseAccounts.credit).not.toHaveBeenCalled();
    });

    it('records who moved whom, where', async () => {
      await service.adminTeleport(STOP.id, UUID, ADMIN, 'griefing');

      expect(auditoria.log).toHaveBeenCalledWith({
        actorUuid: ADMIN,
        action: 'teleport',
        target: `jugador ${UUID} → ${STOP.id} (griefing)`,
        dep: 'administracion',
        source: 'actividad',
      });
    });

    it('tells the player they were moved', async () => {
      await service.adminTeleport(STOP.id, UUID, ADMIN);

      expect(wingull.sendMessage).toHaveBeenCalledWith(
        UUID,
        `Has sido trasladado a ${STOP.id} por un administrador`,
      );
    });

    // The player has already been moved; failing to tell them must not fail the action.
    it('succeeds even when the whisper fails', async () => {
      wingull.sendMessage.mockRejectedValue(new Error('offline'));

      await expect(
        service.adminTeleport(STOP.id, UUID, ADMIN),
      ).resolves.toBeUndefined();
      expect(auditoria.log).toHaveBeenCalled();
    });

    it('surfaces an offline player plainly and audits nothing', async () => {
      wingull.teleportPlayer.mockResolvedValue({
        ok: false,
        reason: 'offline',
        status: 422,
        message: 'Player not online',
      });

      await expect(
        service.adminTeleport(STOP.id, UUID, ADMIN),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(auditoria.log).not.toHaveBeenCalled();
      expect(wingull.sendMessage).not.toHaveBeenCalled();
    });

    // No fare is at stake, so an unconfirmed teleport needs no position check — unlike a trip.
    it('does not read the position back on an unconfirmed teleport', async () => {
      wingull.teleportPlayer.mockResolvedValue({
        ok: false,
        reason: 'unresolved',
        status: 503,
        message: 'Server busy',
      });
      wingull.getPlayerPosition.mockClear();

      await expect(
        service.adminTeleport(STOP.id, UUID, ADMIN),
      ).rejects.toThrow(ServiceUnavailableException);
      expect(wingull.getPlayerPosition).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('serves the fare model and the real service account id', async () => {
      await expect(service.getConfig()).resolves.toEqual({
        minimumFare: MINIMUM_FARE,
        pricePerBlock: PRICE_PER_BLOCK,
        serviceAccountId: 7,
        tripConceptPrefix: 'Taxi a ',
      });
    });
  });
});
