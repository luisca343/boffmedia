import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import { WigglypopSagaService } from './wigglypop-saga.service';
import { WigglypopCustodyService } from './wigglypop-custody.service';
import { WigglypopOrdersRepository } from '../repositories/wigglypop-orders.repository';

jest.mock('@/config/env', () => ({
  env: { WIGGLYPOP_ATOMIC_CUSTODY: true, WIGGLYPOP_SAGA_STALE_MINUTES: 120 },
}));

const BUYER = 'buyer-uuid';
const SELLER = 'seller-uuid';

const makeLine = (overrides: Record<string, unknown> = {}) => ({
  id: 11,
  orderId: 1,
  listingId: 101,
  sellerUuid: SELLER,
  kind: 'mon',
  qty: 1,
  unitPrice: 10000,
  lineTotal: 10000,
  deliveryStatus: 'tomado',
  settleTxId: null,
  takenPayload: { specs: ['garchomp lvl:100'] },
  confirmedAt: null,
  ...overrides,
});

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  code: 'ORD-1',
  buyerUuid: BUYER,
  subtotal: 10000,
  fee: 250,
  total: 10250,
  status: 'transferido',
  escrowTxId: 9001,
  idempotencyKey: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lines: [makeLine()],
  ...overrides,
});

describe('WigglypopSagaService', () => {
  let service: WigglypopSagaService;

  const ordersRepository = {
    findById: jest.fn(),
    touch: jest.fn(),
    findStalled: jest.fn(),
  };
  const custody = {
    isAtomic: jest.fn(),
    takenFromLine: jest.fn(),
    deliverLine: jest.fn(),
    payOutTakenLine: jest.fn(),
    restoreLine: jest.fn(),
    escalate: jest.fn(),
    finalizeAtomicOrder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    custody.isAtomic.mockReturnValue(true);
    custody.takenFromLine.mockImplementation((line: any) =>
      line.takenPayload
        ? {
            lineId: line.id,
            sellerUuid: line.sellerUuid,
            kind: line.kind,
            pokespec: 'garchomp lvl:100',
          }
        : null,
    );
    custody.deliverLine.mockResolvedValue(true);
    custody.payOutTakenLine.mockResolvedValue(true);
    // By default the order lands cleanly, so `deliverOrder` resolves.
    custody.finalizeAtomicOrder.mockResolvedValue(
      makeOrder({
        status: 'completado',
        lines: [makeLine({ deliveryStatus: 'confirmado' })],
      }),
    );
    ordersRepository.findById.mockResolvedValue(makeOrder());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WigglypopSagaService,
        {
          provide: Logger,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        { provide: WigglypopOrdersRepository, useValue: ordersRepository },
        { provide: WigglypopCustodyService, useValue: custody },
      ],
    }).compile();

    service = module.get(WigglypopSagaService);
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('deliverOrder', () => {
    it('gives the taken goods to the buyer and then pays the seller', async () => {
      await service.deliverOrder(1);

      expect(custody.deliverLine).toHaveBeenCalledWith(
        BUYER,
        expect.objectContaining({ id: 11 }),
        expect.objectContaining({ pokespec: 'garchomp lvl:100' }),
      );
      expect(custody.payOutTakenLine).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ deliveryStatus: 'entregado' }),
      );
    });

    // The single most important test in this file. Manual custody parks orders at
    // `escrow` waiting on two humans, which is indistinguishable from a stalled
    // atomic order — and delivering one would call givePokemon with no matching
    // take, which is exactly how the market prints Pokémon.
    it('does NOTHING under manual custody, however stalled the order looks', async () => {
      custody.isAtomic.mockReturnValue(false);

      await service.deliverOrder(1);

      expect(custody.deliverLine).not.toHaveBeenCalled();
      expect(custody.payOutTakenLine).not.toHaveBeenCalled();
      expect(custody.finalizeAtomicOrder).not.toHaveBeenCalled();
    });

    it('pays without re-giving a line the buyer already received', async () => {
      ordersRepository.findById.mockResolvedValue(
        makeOrder({ lines: [makeLine({ deliveryStatus: 'entregado' })] }),
      );

      await service.deliverOrder(1);

      expect(custody.deliverLine).not.toHaveBeenCalled();
      expect(custody.payOutTakenLine).toHaveBeenCalledTimes(1);
    });

    // Interrupted states belong to whoever wrote them. Resuming one here would
    // re-issue a call whose outcome is unknown.
    it.each(['tomando', 'entregando', 'pagando', 'restaurando'])(
      'refuses to resume a line interrupted in %s',
      async (state) => {
        ordersRepository.findById.mockResolvedValue(
          makeOrder({ lines: [makeLine({ deliveryStatus: state })] }),
        );
        custody.finalizeAtomicOrder.mockResolvedValue(
          makeOrder({ lines: [makeLine({ deliveryStatus: state })] }),
        );

        await expect(service.deliverOrder(1)).rejects.toThrow(/undelivered/);

        expect(custody.deliverLine).not.toHaveBeenCalled();
        expect(custody.payOutTakenLine).not.toHaveBeenCalled();
      },
    );

    it('leaves terminal lines alone', async () => {
      ordersRepository.findById.mockResolvedValue(
        makeOrder({
          lines: [
            makeLine({ id: 11, deliveryStatus: 'confirmado' }),
            makeLine({ id: 12, deliveryStatus: 'cancelado' }),
            makeLine({ id: 13, deliveryStatus: 'revision' }),
          ],
        }),
      );

      await service.deliverOrder(1);

      expect(custody.deliverLine).not.toHaveBeenCalled();
    });

    it('escalates a line that claims goods were taken but recorded no payload', async () => {
      ordersRepository.findById.mockResolvedValue(
        makeOrder({ lines: [makeLine({ takenPayload: null })] }),
      );
      custody.takenFromLine.mockReturnValue(null);

      await service.deliverOrder(1);

      expect(custody.escalate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 11 }),
        expect.stringContaining('no takenPayload'),
      );
      expect(custody.deliverLine).not.toHaveBeenCalled();
    });

    it('does not pay when another attempt won the give', async () => {
      custody.deliverLine.mockResolvedValue(false);

      await service.deliverOrder(1);

      expect(custody.payOutTakenLine).not.toHaveBeenCalled();
    });

    // The outbox contract: a resolved handler marks the row delivered. Returning
    // quietly on an incomplete order would strand it forever.
    it('throws while any line is still owed, so the outbox retries', async () => {
      custody.finalizeAtomicOrder.mockResolvedValue(
        makeOrder({ lines: [makeLine({ deliveryStatus: 'tomado' })] }),
      );

      await expect(service.deliverOrder(1)).rejects.toThrow(/undelivered/);
    });

    it('resolves once every line is terminal, even when one went to review', async () => {
      custody.finalizeAtomicOrder.mockResolvedValue(
        makeOrder({
          status: 'revision',
          lines: [makeLine({ deliveryStatus: 'revision' })],
        }),
      );

      await expect(service.deliverOrder(1)).resolves.toBeUndefined();
    });

    it('is a no-op on an order that already reached a terminal status', async () => {
      ordersRepository.findById.mockResolvedValue(
        makeOrder({ status: 'completado' }),
      );

      await service.deliverOrder(1);

      expect(custody.finalizeAtomicOrder).not.toHaveBeenCalled();
    });

    it('touches the order so the sweeper does not treat live work as crashed', async () => {
      await service.deliverOrder(1);

      expect(ordersRepository.touch).toHaveBeenCalledWith(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('sweep', () => {
    it('does not run at all under manual custody', async () => {
      custody.isAtomic.mockReturnValue(false);

      await service.sweep();

      expect(ordersRepository.findStalled).not.toHaveBeenCalled();
    });

    it('looks back by the configured window, not a hardcoded one', async () => {
      ordersRepository.findStalled.mockResolvedValue([]);

      await service.sweep();

      expect(ordersRepository.findStalled).toHaveBeenCalledWith(
        env.WIGGLYPOP_SAGA_STALE_MINUTES * 60_000,
      );
    });

    it('escalates lines interrupted mid-call rather than replaying them', async () => {
      const stalled = makeOrder({
        lines: [makeLine({ deliveryStatus: 'entregando' })],
      });
      ordersRepository.findStalled.mockResolvedValue([stalled]);
      ordersRepository.findById.mockResolvedValue(stalled);
      custody.finalizeAtomicOrder.mockResolvedValue(
        makeOrder({ lines: [makeLine({ deliveryStatus: 'revision' })] }),
      );

      await service.sweep();

      expect(custody.escalate).toHaveBeenCalledWith(
        expect.objectContaining({ deliveryStatus: 'entregando' }),
        expect.stringContaining('interrupted mid-call'),
        expect.any(String),
      );
      // Never re-given. A second give would mint a Pokémon.
      expect(custody.deliverLine).not.toHaveBeenCalled();
    });

    it('resumes a stalled order whose lines are in a safe, resumable state', async () => {
      const stalled = makeOrder();
      ordersRepository.findStalled.mockResolvedValue([stalled]);

      await service.sweep();

      expect(custody.deliverLine).toHaveBeenCalled();
    });

    it('survives a repository failure — a sweep must never crash the scheduler', async () => {
      ordersRepository.findStalled.mockRejectedValue(new Error('db is gone'));

      await expect(service.sweep()).resolves.toBeUndefined();
    });
  });
});
