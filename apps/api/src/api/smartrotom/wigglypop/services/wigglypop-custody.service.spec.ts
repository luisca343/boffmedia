import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { WigglypopCustodyService, computeFee } from './wigglypop-custody.service';
import { WigglypopEscrowService } from './wigglypop-escrow.service';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { WigglypopOrdersRepository } from '../repositories/wigglypop-orders.repository';
import { WigglypopListingsRepository } from '../repositories/wigglypop-listings.repository';

// The env module is read at call time by isAtomic(), so the flag is swapped per-test here.
jest.mock('@/config/env', () => ({
  env: { WIGGLYPOP_ATOMIC_CUSTODY: false },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { env } = require('@/config/env');

const BUYER = 'buyer-uuid';
const SELLER = 'seller-uuid';

const makeOrder = (overrides: Record<string, any> = {}): any => ({
  id: 1,
  code: 'ORD-TEST',
  buyerUuid: BUYER,
  subtotal: 10000,
  fee: 250,
  total: 10250,
  status: 'escrow',
  escrowTxId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lines: [
    {
      id: 11,
      orderId: 1,
      listingId: 101,
      sellerUuid: SELLER,
      kind: 'mon',
      qty: 1,
      unitPrice: 10000,
      lineTotal: 10000,
      deliveryStatus: 'pendiente',
      settleTxId: null,
      takenPayload: null,
      confirmedAt: null,
    },
  ],
  ...overrides,
});

const makeListing = (overrides: Record<string, any> = {}): any => ({
  id: 101,
  code: 'LST-TEST',
  sellerUuid: SELLER,
  kind: 'mon',
  status: 'reservado',
  title: 'Garchomp',
  mons: [
    {
      id: 1,
      listingId: 101,
      pokemonKey: 'abc123',
      sourceBox: 2,
      sourceIndex: 7,
      dex: 445,
    },
  ],
  items: [],
  ...overrides,
});

describe('WigglypopCustodyService', () => {
  let service: WigglypopCustodyService;

  const escrow = {
    hold: jest.fn(),
    release: jest.fn(),
    refund: jest.fn(),
  };
  const wingull = {
    takePokemon: jest.fn(),
    takeItems: jest.fn(),
    givePokemon: jest.fn(),
    giveItems: jest.fn(),
  };
  const ordersRepository = {
    findById: jest.fn(),
    setEscrowTx: jest.fn(),
    setStatus: jest.fn(),
    setLineDelivery: jest.fn(),
    setAllLinesDelivery: jest.fn(),
  };
  const listingsRepository = {
    findManyByIds: jest.fn(),
    findById: jest.fn(),
    markSold: jest.fn(),
    setStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    env.WIGGLYPOP_ATOMIC_CUSTODY = false;

    escrow.hold.mockResolvedValue(9001);
    escrow.release.mockResolvedValue(9002);
    escrow.refund.mockResolvedValue(9003);
    ordersRepository.findById.mockImplementation(async () => makeOrder());
    listingsRepository.findManyByIds.mockResolvedValue([makeListing()]);
    listingsRepository.findById.mockResolvedValue(makeListing());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WigglypopCustodyService,
        { provide: Logger, useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() } },
        { provide: WigglypopEscrowService, useValue: escrow },
        { provide: WingullFacadeService, useValue: wingull },
        { provide: WigglypopOrdersRepository, useValue: ordersRepository },
        { provide: WigglypopListingsRepository, useValue: listingsRepository },
      ],
    }).compile();

    service = module.get(WigglypopCustodyService);
  });

  it('takes a 2.5% house fee, rounded', () => {
    expect(computeFee(10000)).toBe(250);
    expect(computeFee(999)).toBe(25);
    expect(computeFee(0)).toBe(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('MANUAL custody (the flag is off — today’s default)', () => {
    it('is the default: an unset flag never runs the atomic path', () => {
      expect(service.isAtomic()).toBe(false);
    });

    it('moves the buyer’s money into escrow and parks the order there', async () => {
      const order = makeOrder();
      await service.settleNewOrder(order);

      expect(escrow.hold).toHaveBeenCalledTimes(1);
      expect(escrow.hold).toHaveBeenCalledWith(
        BUYER,
        10250,
        expect.stringContaining('ORD-TEST'),
      );
      expect(ordersRepository.setEscrowTx).toHaveBeenCalledWith(1, 9001);
      // Nothing is paid out to the seller yet.
      expect(escrow.release).not.toHaveBeenCalled();
    });

    // THE bug the whole flag exists to prevent. The game server can give a Pokémon but cannot
    // take one, so a give with no matching take would hand the buyer a COPY and leave the
    // seller holding the original — the market would print Pokémon.
    it('NEVER calls givePokemon or giveItems — that would duplicate the Pokémon', async () => {
      const order = makeOrder();

      await service.settleNewOrder(order);
      await service.markTransferred(makeOrder({ status: 'escrow' }));
      await service.confirmOrder(makeOrder({ status: 'transferido', escrowTxId: 9001 }));

      expect(wingull.givePokemon).not.toHaveBeenCalled();
      expect(wingull.giveItems).not.toHaveBeenCalled();
      // It must not TAKE either — the routes do not exist yet.
      expect(wingull.takePokemon).not.toHaveBeenCalled();
      expect(wingull.takeItems).not.toHaveBeenCalled();
    });

    it('does not move money when the seller marks the hand-off done', async () => {
      await service.markTransferred(makeOrder({ status: 'escrow' }));

      expect(escrow.hold).not.toHaveBeenCalled();
      expect(escrow.release).not.toHaveBeenCalled();
      expect(escrow.refund).not.toHaveBeenCalled();
      expect(ordersRepository.setStatus).toHaveBeenCalledWith(1, 'transferido');
    });

    it('pays the seller only when the BUYER confirms', async () => {
      await service.confirmOrder(
        makeOrder({ status: 'transferido', escrowTxId: 9001 }),
      );

      expect(escrow.release).toHaveBeenCalledTimes(1);
      expect(escrow.release).toHaveBeenCalledWith(
        SELLER,
        10000, // the line total — the fee stays in the escrow account
        expect.stringContaining('ORD-TEST'),
      );
      expect(ordersRepository.setStatus).toHaveBeenCalledWith(1, 'completado');
      expect(listingsRepository.markSold).toHaveBeenCalledWith(101, 1, 10000);
    });

    it('refuses to release escrow that was never taken', async () => {
      await expect(
        service.confirmOrder(makeOrder({ status: 'transferido', escrowTxId: null })),
      ).rejects.toThrow(BadRequestException);

      expect(escrow.release).not.toHaveBeenCalled();
    });

    it('refunds the buyer on cancel and puts the listing back on the shelf', async () => {
      await service.cancelOrder(makeOrder({ status: 'escrow', escrowTxId: 9001 }));

      expect(escrow.refund).toHaveBeenCalledWith(
        BUYER,
        10250,
        expect.stringContaining('ORD-TEST'),
      );
      expect(ordersRepository.setStatus).toHaveBeenCalledWith(1, 'cancelado');
      expect(listingsRepository.setStatus).toHaveBeenCalledWith(101, 'activo');
    });

    it('does not refund an order that never took any money — that would MINT it', async () => {
      await service.cancelOrder(makeOrder({ status: 'escrow', escrowTxId: null }));

      expect(escrow.refund).not.toHaveBeenCalled();
      expect(ordersRepository.setStatus).toHaveBeenCalledWith(1, 'cancelado');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('idempotency (never double-charge, never double-pay)', () => {
    it('does not charge twice when the order already holds escrow', async () => {
      await service.settleNewOrder(makeOrder({ escrowTxId: 9001 }));

      expect(escrow.hold).not.toHaveBeenCalled();
    });

    it('does not pay a seller twice when /confirm is replayed', async () => {
      // The line already carries a settleTxId — it has been paid out.
      const alreadyPaid = makeOrder({
        status: 'transferido',
        escrowTxId: 9001,
        lines: [
          {
            ...makeOrder().lines[0],
            deliveryStatus: 'confirmado',
            settleTxId: 9002,
          },
        ],
      });

      await service.confirmOrder(alreadyPaid);

      expect(escrow.release).not.toHaveBeenCalled();
    });

    it('is a no-op when /confirm hits an already-completed order', async () => {
      await service.confirmOrder(makeOrder({ status: 'completado', escrowTxId: 9001 }));

      expect(escrow.release).not.toHaveBeenCalled();
    });

    it('does not refund twice when /cancel is replayed', async () => {
      await service.cancelOrder(makeOrder({ status: 'cancelado', escrowTxId: 9001 }));

      expect(escrow.refund).not.toHaveBeenCalled();
    });

    it('refuses to cancel an order that already completed', async () => {
      await expect(
        service.cancelOrder(makeOrder({ status: 'completado', escrowTxId: 9001 })),
      ).rejects.toThrow(BadRequestException);

      expect(escrow.refund).not.toHaveBeenCalled();
    });

    it('is a no-op when /transferred is replayed', async () => {
      await service.markTransferred(makeOrder({ status: 'transferido' }));

      expect(ordersRepository.setStatus).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('ATOMIC custody (the flag is on — once the plugin ships take)', () => {
    beforeEach(() => {
      env.WIGGLYPOP_ATOMIC_CUSTODY = true;
      wingull.takePokemon.mockResolvedValue({ pokespec: 'garchomp lvl:100' });
      wingull.givePokemon.mockResolvedValue({ success: true });
    });

    it('reports itself as atomic', () => {
      expect(service.isAtomic()).toBe(true);
    });

    it('takes from the seller, charges the buyer, gives to the buyer, pays the seller', async () => {
      ordersRepository.findById.mockResolvedValue(
        makeOrder({
          lines: [{ ...makeOrder().lines[0], deliveryStatus: 'confirmado' }],
        }),
      );

      await service.settleNewOrder(makeOrder());

      // Took the exact mon that was listed, at the slot it was listed from, against its hash.
      expect(wingull.takePokemon).toHaveBeenCalledWith(SELLER, 2, 7, 'abc123');
      expect(escrow.hold).toHaveBeenCalledWith(BUYER, 10250, expect.any(String));
      expect(wingull.givePokemon).toHaveBeenCalledWith(
        BUYER,
        'garchomp lvl:100',
        true,
      );
      expect(escrow.release).toHaveBeenCalledWith(SELLER, 10000, expect.any(String));
      expect(ordersRepository.setStatus).toHaveBeenLastCalledWith(1, 'completado');
    });

    it('takes BEFORE it charges — the ordering is the whole safety property', async () => {
      const calls: string[] = [];
      wingull.takePokemon.mockImplementation(async () => {
        calls.push('take');
        return { pokespec: 'garchomp lvl:100' };
      });
      escrow.hold.mockImplementation(async () => {
        calls.push('hold');
        return 9001;
      });

      await service.settleNewOrder(makeOrder());

      expect(calls).toEqual(['take', 'hold']);
    });

    // The headline guarantee: a failed take must cost the buyer NOTHING.
    it('charges NOTHING when the take fails, and cancels the order', async () => {
      wingull.takePokemon.mockRejectedValue(
        new Error('takepokemon 404 — plugin route does not exist'),
      );

      await expect(service.settleNewOrder(makeOrder())).rejects.toThrow(
        BadRequestException,
      );

      expect(escrow.hold).not.toHaveBeenCalled();
      expect(escrow.release).not.toHaveBeenCalled();
      expect(escrow.refund).not.toHaveBeenCalled();
      expect(wingull.givePokemon).not.toHaveBeenCalled();
      expect(ordersRepository.setStatus).toHaveBeenCalledWith(1, 'cancelado');
    });

    it('rolls back: a take that fails midway hands the already-taken mons back to their sellers', async () => {
      const twoLines = makeOrder({
        subtotal: 20000,
        total: 20500,
        lines: [
          { ...makeOrder().lines[0], id: 11, listingId: 101, sellerUuid: 'seller-a' },
          { ...makeOrder().lines[0], id: 12, listingId: 102, sellerUuid: 'seller-b' },
        ],
      });
      listingsRepository.findManyByIds.mockResolvedValue([
        makeListing({ id: 101, sellerUuid: 'seller-a' }),
        makeListing({ id: 102, sellerUuid: 'seller-b' }),
      ]);

      // The first take succeeds; the second blows up.
      wingull.takePokemon
        .mockResolvedValueOnce({ pokespec: 'garchomp lvl:100' })
        .mockRejectedValueOnce(new Error('slot no longer matches expectedKey'));

      await expect(service.settleNewOrder(twoLines)).rejects.toThrow(
        BadRequestException,
      );

      // seller-a's Pokémon is handed straight back to seller-a — NOT to the buyer.
      expect(wingull.givePokemon).toHaveBeenCalledTimes(1);
      expect(wingull.givePokemon).toHaveBeenCalledWith(
        'seller-a',
        'garchomp lvl:100',
        true,
      );
      // And nobody was charged a thing.
      expect(escrow.hold).not.toHaveBeenCalled();
      expect(escrow.refund).not.toHaveBeenCalled();
    });

    it('gives the goods back to the sellers when the BUYER cannot pay', async () => {
      escrow.hold.mockRejectedValue(new Error('insufficient funds'));

      await expect(service.settleNewOrder(makeOrder())).rejects.toThrow(
        BadRequestException,
      );

      // Taken, then returned to the seller — the seller must not lose the mon over it.
      expect(wingull.takePokemon).toHaveBeenCalledTimes(1);
      expect(wingull.givePokemon).toHaveBeenCalledWith(
        SELLER,
        'garchomp lvl:100',
        true,
      );
      expect(escrow.release).not.toHaveBeenCalled();
      expect(ordersRepository.setStatus).toHaveBeenCalledWith(1, 'cancelado');
    });

    it('settles an items line against what was ACTUALLY taken, not what was asked for', async () => {
      listingsRepository.findManyByIds.mockResolvedValue([
        makeListing({
          kind: 'items',
          mons: [],
          items: [{ id: 1, listingId: 101, itemId: 'pixelmon:rare_candy', qty: 10 }],
        }),
      ]);
      // The player only actually had 6 of them.
      wingull.takeItems.mockResolvedValue({
        taken: [{ id: 'pixelmon:rare_candy', amount: 6 }],
      });
      const itemsOrder = makeOrder({
        lines: [{ ...makeOrder().lines[0], kind: 'items' }],
      });

      await service.settleNewOrder(itemsOrder);

      expect(wingull.takeItems).toHaveBeenCalledWith(SELLER, [
        { id: 'pixelmon:rare_candy', amount: 10 },
      ]);
      // The buyer gets the 6 that really existed, not the 10 the listing claimed.
      expect(wingull.giveItems).toHaveBeenCalledWith(BUYER, [
        { id: 'pixelmon:rare_candy', amount: 6 },
      ]);
    });

    it('does not re-take or re-charge a line that already completed', async () => {
      const replayed = makeOrder({
        escrowTxId: 9001,
        lines: [
          {
            ...makeOrder().lines[0],
            deliveryStatus: 'confirmado',
            settleTxId: 9002,
          },
        ],
      });

      await service.settleNewOrder(replayed);

      expect(wingull.takePokemon).not.toHaveBeenCalled();
      expect(escrow.hold).not.toHaveBeenCalled();
      expect(escrow.release).not.toHaveBeenCalled();
    });
  });
});
